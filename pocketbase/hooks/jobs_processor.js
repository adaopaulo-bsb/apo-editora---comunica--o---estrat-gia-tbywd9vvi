//
// pocketbase/hooks/jobs_processor.js — módulo jobs.
// Agendador nativo (cronAdd) que processa jobs em ETAPAS CURTAS, retomando
// de onde parou (máquina de estados por estado/tentativas). Este padrão
// será usado nas Fases 4 e 5 (Raio-X, parecer, preparação etc.).
//
// IMPORTANTE (Skip Cloud): callbacks do JSVM executam em outra VM — toda
// função auxiliar é declarada DENTRO do callback do cron.
//
// Fase 5 (Raio-X com IA real, APROVADO PELO USUÁRIO): a etapa "analisar" do
// job tipo "raio_x" usa uma CADEIA DE RESERVA, sem quebrar o job quando uma
// origem falha:
//   1ª) API da Anthropic DIRETA (modelo claude-sonnet-5-5) — chave lida APENAS
//       via $os.getenv("ANTHROPIC_API_KEY"); se a chave não existir no
//       ambiente, a chamada falha e a cadeia cai para a 2ª (é o esperado hoje).
//   2ª) Gateway nativo do Skip ($ai.chat — segredos SKIP_AI_* gerenciados
//       pela plataforma).
//   3ª) Análise simulada (a antiga, origem "simulado").
// Com ia_simulada=true (config) ou teto diário de IA estourado, vai direto
// à 3ª. Qualquer sucesso de análise real grava origem "ia"; a simulated é
// sempre o último recurso — o job NUNCA fica em erro por falha de IA.
// A chave ANTHROPIC_API_KEY não é gravada em arquivo, migração, log ou front.
//
// Texto do manuscrito: lido com $documents.toMarkdown (servidor) e limitado
// a 200.000 caracteres por obra, cortando preferencialmente em limite de
// capítulo (cabeçalho Markdown do documento convertido). Nunca se envia o
// arquivo inteiro sem limite.
//
// LOGS: apenas ids, estados, origem e CONTAGEM DE TOKENS. PROIBIDO registrar
// trecho do manuscrito, o prompt enviado, a chave ou o conteúdo do resultado.
//
// Cada rodada do cron pega no máximo 1 job "pendente" (ou preso em
// "executando", de uma queda anterior) e executa UMA etapa curta, gravando
// o novo estado antes e depois. Se o servidor cair no meio, o job fica
// "executando" e é retomado pela contagem de tentativas.
//

cronAdd('apoJobsProcessar', '*/1 * * * *', function () {
  var JOBS_MAX_TENTATIVAS = 3
  var LIMITE_CARACTERES_TEXTO = 200000
  var MODELO_ANTHROPIC = 'claude-sonnet-5-5'

  var PROMPT_SISTEMA =
    'Você é um editor sênior da APO Editora, casa brasileira de publicação para autores independentes. ' +
    'Faça a pré-avaliação editorial (Raio-X) do manuscrito fornecido. Regras: ' +
    'escreva em português do Brasil, com tom de editor; baseie-se EXCLUSIVAMENTE no texto recebido — ' +
    'não invente temas, personagens, enredos ou citações que não estejam nele; ' +
    'se o texto estiver truncado, analise apenas a parte enviada e não afirme que leu o restante. ' +
    'Responda SOMENTE com um JSON válido, sem nenhum texto antes ou depois, neste formato exato: ' +
    '{"resumo": "2 a 4 frases sobre o texto", "nota": número de 0 a 10 de prontidão editorial, ' +
    '"pontos_fortes": [exatamente 3 itens curtos], "ajustes": [exatamente 3 itens curtos]}'

  // Etapas por tipo de job (máquina de estados, na ordem).
  function etapasDoTipo(tipo) {
    switch (tipo) {
      case 'teste':
        return ['validar', 'processar', 'finalizar']
      case 'raio_x':
        return ['ler_obra', 'analisar', 'salvar_resultado']
      case 'parecer':
        return ['ler_obra', 'redigir', 'revisar', 'salvar']
      default:
        return ['validar', 'processar', 'finalizar']
    }
  }

  // Log padrão do projeto: só ids, ação e resultado. PROIBIDO registrar
  // conteúdo de manuscrito, texto extraído, prompt, chave ou resultado.
  function logAcao(app, usuarioId, acao, resultado, detalhe) {
    console.log(
      'APO_LOG ' +
        JSON.stringify({
          data: new Date().toISOString(),
          usuario: usuarioId || null,
          acao: acao,
          resultado: resultado,
          detalhe: detalhe || '',
        }),
    )
    try {
      var record = new Record(app.findCollectionByNameOrId('auditoria'))
      if (usuarioId) record.set('usuario', usuarioId)
      record.set('acao', String(acao).slice(0, 100))
      record.set('resultado', resultado === 'erro' ? 'erro' : 'ok')
      record.set('detalhe', String(detalhe || '').slice(0, 500))
      app.save(record)
    } catch (err) {
      console.log(
        'APO_LOG_FALHA_AUDITORIA ' + String(err && err.message ? err.message : err).slice(0, 200),
      )
    }
  }

  function resumoErro(err) {
    var m = err && err.message ? err.message : String(err)
    return String(m).split('\n')[0].slice(0, 120)
  }

  function configValor(app, chave, padrao) {
    try {
      var cfg = app.findFirstRecordByFilter('config', "chave = '" + chave + "'")
      var v = String(cfg.getString('valor') || '')
      return v === '' ? padrao : v
    } catch (_) {
      return padrao
    }
  }

  // Modo de simulação da IA vem da coleção config (chave ia_simulada;
  // "true" = simulado). Ausente ou inválida = simulado (padrão seguro).
  function modoSimulado(app) {
    return configValor(app, 'ia_simulada', 'true') !== 'false'
  }

  // Resultado SIMULADO do Raio-X (último recurso da cadeia). Formato exigido:
  // resumo, nota (0 a 10), pontos_fortes [3], ajustes [3].
  function resultadoSimulado(app, obra) {
    var genero = 'a obra'
    try {
      var g = obra.getString('genero')
      if (g) genero = g.toLowerCase()
    } catch (_) {}
    var palavras = 0
    try {
      palavras = obra.getInt('palavras') || 0
    } catch (_) {}
    var porte =
      palavras >= 70000
        ? 'extenso'
        : palavras >= 40000
          ? 'de porte médio'
          : 'ainda curto para um volume comercial'
    return {
      resumo:
        'Análise automática prévia (simulada) de ' +
        genero +
        ': texto ' +
        porte +
        ', com estrutura narrativa identificável e progressão de trama regular.',
      nota: 6.5,
      pontos_fortes: [
        'Voz narrativa consistente ao longo dos capítulos.',
        'Premissa clara e potencial de gancho comercial.',
        'Estrutura em três atos reconhecível.',
      ],
      ajustes: [
        'Aprofundar os diálogos do segundo ato.',
        'Reduzir repetições de descrições em cenas consecutivas.',
        'Reforçar a motivação dos personagens secundários no desfecho.',
      ],
    }
  }

  // ---------------------------------------------------------------------------
  // Leitura do manuscrito (texto limitado por obra)
  // ---------------------------------------------------------------------------

  // Corta no último limite de capítulo ANTES do teto: no Markdown convertido,
  // capítulos aparecem como cabeçalhos no início de linha ("\n# ..."). Cortar
  // logo antes do próximo cabeçalho preserva capítulos inteiros. Sem cabeçalho
  // no trecho, cai para o fim de parágrafo; na pior hipótese, corte bruto.
  function cortarPorCapitulo(texto, limite) {
    if (texto.length <= limite) return texto
    var cortado = texto.slice(0, limite)
    var pos = cortado.lastIndexOf('\n# ')
    if (pos < 0) pos = cortado.lastIndexOf('\n\n')
    if (pos > 0) cortado = cortado.slice(0, pos)
    return cortado
  }

  // Extrai o texto do manuscrito vinculado ao job (via jobs.arquivo; reserva:
  // último manuscrito da obra). Nunca devolve erro que quebre o job: devolve
  // {texto, truncado, erro}.
  function carregarTexto(app, job, obraId) {
    var info = { texto: '', truncado: false, erro: '' }
    var arquivoRec = null
    var arquivoId = ''
    try {
      arquivoId = job.getString('arquivo')
    } catch (_) {}
    if (arquivoId) {
      try {
        arquivoRec = app.findRecordById('arquivos', arquivoId)
      } catch (_) {}
    }
    if (!arquivoRec) {
      try {
        var lista = app.findRecordsByFilter(
          'arquivos',
          "obra = '" + obraId + "' && tipo = 'manuscrito'",
          '-created',
          1,
          0,
        )
        if (lista.length > 0) arquivoRec = lista[0]
      } catch (_) {}
    }
    if (!arquivoRec) {
      info.erro = 'manuscrito_nao_encontrado'
      return info
    }
    try {
      var conv = $documents.toMarkdown({ record: arquivoRec, field: 'arquivo' })
      var md = String(conv && conv.markdown ? conv.markdown : '')
      if (md.length > LIMITE_CARACTERES_TEXTO) {
        md = cortarPorCapitulo(md, LIMITE_CARACTERES_TEXTO)
        info.truncado = true
      }
      info.texto = md
    } catch (err) {
      info.erro = 'conversao_falhou (' + resumoErro(err) + ')'
    }
    return info
  }

  // ---------------------------------------------------------------------------
  // Interpretação da resposta da IA
  // ---------------------------------------------------------------------------

  // Valida e normaliza o JSON esperado. Null se inválido (cai para a próxima
  // origem da cadeia).
  function interpretarJSON(conteudo) {
    try {
      var t = String(conteudo || '').trim()
      t = t
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/, '')
        .trim()
      var ini = t.indexOf('{')
      var fim = t.lastIndexOf('}')
      if (ini < 0 || fim <= ini) return null
      var obj = JSON.parse(t.slice(ini, fim + 1))
      var nota = Number(obj.nota)
      if (isNaN(nota)) nota = 0
      if (nota < 0) nota = 0
      if (nota > 10) nota = 10
      if (typeof obj.resumo !== 'string' || !obj.resumo) return null
      function itens(v) {
        if (!Array.isArray(v)) return []
        var saida = []
        for (var i = 0; i < v.length && saida.length < 3; i++) {
          if (typeof v[i] === 'string' && v[i]) saida.push(v[i].slice(0, 300))
        }
        return saida
      }
      var pf = itens(obj.pontos_fortes)
      var aj = itens(obj.ajustes)
      if (pf.length === 0 || aj.length === 0) return null
      return {
        resumo: obj.resumo.slice(0, 2000),
        nota: nota,
        pontos_fortes: pf,
        ajustes: aj,
      }
    } catch (_) {
      return null
    }
  }

  // ---------------------------------------------------------------------------
  // Cadeia de reserva: (1) Anthropic direto → (2) gateway nativo → (3) simulado
  // ---------------------------------------------------------------------------

  // 1ª origem: API da Anthropic diretamente. Chave SOMENTE via $os.getenv —
  // nunca em arquivo, migração, log ou front. Chave ausente ⇒ falha limpa
  // (motivo "chave_ausente") e a cadeia segue.
  function chamarAnthropic(texto) {
    var chave = ''
    try {
      chave = $os.getenv('ANTHROPIC_API_KEY') || ''
    } catch (_) {}
    if (!chave) {
      return { ok: false, motivo: 'chave_ausente', tokensIn: 0, tokensOut: 0 }
    }
    try {
      var resp = $http.send({
        url: 'https://api.anthropic.com/v1/messages',
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': chave,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODELO_ANTHROPIC,
          max_tokens: 1200,
          system: PROMPT_SISTEMA,
          messages: [{ role: 'user', content: texto }],
        }),
      })
      var status = resp && resp.statusCode ? Number(resp.statusCode) : 0
      var dados = null
      try {
        dados = resp.json && typeof resp.json === 'object' ? resp.json : JSON.parse(resp.body)
      } catch (_) {}
      if (status < 200 || status >= 300 || !dados) {
        return { ok: false, motivo: 'http_' + status, tokensIn: 0, tokensOut: 0 }
      }
      var conteudo = ''
      if (dados.content && dados.content.length) {
        for (var i = 0; i < dados.content.length; i++) {
          if (dados.content[i] && dados.content[i].type === 'text') {
            conteudo += String(dados.content[i].text || '')
          }
        }
      }
      var tIn = 0
      var tOut = 0
      try {
        tIn = Number((dados.usage && dados.usage.input_tokens) || 0)
        tOut = Number((dados.usage && dados.usage.output_tokens) || 0)
      } catch (_) {}
      var r = interpretarJSON(conteudo)
      if (!r) {
        return { ok: false, motivo: 'resposta_invalida', tokensIn: tIn, tokensOut: tOut }
      }
      return { ok: true, resultado: r, motivo: 'ok', tokensIn: tIn, tokensOut: tOut }
    } catch (err) {
      return { ok: false, motivo: 'excecao', tokensIn: 0, tokensOut: 0 }
    }
  }

  // 2ª origem: gateway nativo do Skip ($ai.chat; segredos SKIP_AI_* são da
  // plataforma). Mesmo contrato de saída da 1ª origem.
  function chamarGateway(texto) {
    try {
      var resposta = $ai.chat({
        messages: [
          { role: 'system', content: PROMPT_SISTEMA },
          { role: 'user', content: texto },
        ],
      })
      var conteudo = ''
      try {
        conteudo = String(resposta.choices[0].message.content || '')
      } catch (_) {}
      var tIn = 0
      var tOut = 0
      try {
        tIn = Number(resposta.usage.prompt_tokens || 0)
        tOut = Number(resposta.usage.completion_tokens || 0)
      } catch (_) {}
      var r = interpretarJSON(conteudo)
      if (!r) {
        return { ok: false, motivo: 'resposta_invalida', tokensIn: tIn, tokensOut: tOut }
      }
      return { ok: true, resultado: r, motivo: 'ok', tokensIn: tIn, tokensOut: tOut }
    } catch (err) {
      return { ok: false, motivo: 'excecao', tokensIn: 0, tokensOut: 0 }
    }
  }

  // ---------------------------------------------------------------------------
  // Teto de gasto diário de IA (contador diário na coleção config)
  // ---------------------------------------------------------------------------
  // Limite: config gasto_maximo_diario_ia (reais, ex. "20.00" ⇒ 2000 centavos).
  // Custo por mil tokens: config ia_custo_1k_entrada_centavos /
  // ia_custo_1k_saida_centavos. Enquanto o admin não definir esses preços, o
  // contador registra TOKENS mas o teto não bloqueia (custo desconhecido —
  // pendência registrada no relatório). Nada de preço fixo no código.
  // Contadores: config ia_gasto_dia (YYYY-MM-DD), ia_gasto_dia_centavos,
  // ia_gasto_dia_tokens.

  function hojeISO() {
    return new Date().toISOString().slice(0, 10)
  }

  function lerGastoHoje(app) {
    var data = configValor(app, 'ia_gasto_dia', '')
    if (data !== hojeISO()) {
      return { centavos: 0, tokens: 0 }
    }
    var c = parseInt(configValor(app, 'ia_gasto_dia_centavos', '0'), 10)
    var t = parseInt(configValor(app, 'ia_gasto_dia_tokens', '0'), 10)
    return { centavos: isNaN(c) ? 0 : c, tokens: isNaN(t) ? 0 : t }
  }

  function gravarContador(app, chave, valorStr) {
    try {
      var rec = null
      try {
        rec = app.findFirstRecordByFilter('config', "chave = '" + chave + "'")
      } catch (_) {}
      if (!rec) rec = new Record(app.findCollectionByNameOrId('config'))
      rec.set('chave', chave)
      rec.set('valor', valorStr)
      rec.set('descricao', 'Contador interno diário de IA (gerado pelo processador de jobs).')
      app.save(rec)
    } catch (_) {}
  }

  function gastoDiarioPermitido(app) {
    // Teto da coleção config. A tarefa cita gasto_max_diario_ia em CENTAVOS
    // (ex. "2000" = R$ 20,00); o banco de teste tem gasto_maximo_diario_ia em
    // REAIS ("10.00"). Lê os dois; usa o menor teto definido.
    var tetoCentavos = parseInt(configValor(app, 'gasto_max_diario_ia', ''), 10)
    var limiteReais = parseFloat(configValor(app, 'gasto_maximo_diario_ia', '0'))
    var limiteCentavos = 0
    if (!isNaN(tetoCentavos) && tetoCentavos > 0) limiteCentavos = tetoCentavos
    if (!isNaN(limiteReais) && limiteReais > 0) {
      var emCentavos = Math.round(limiteReais * 100)
      if (limiteCentavos === 0 || emCentavos < limiteCentavos) limiteCentavos = emCentavos
    }
    if (limiteCentavos <= 0) return { permitido: true, motivo: 'sem_teto_configurado' }
    var precoIn = parseFloat(configValor(app, 'ia_custo_1k_entrada_centavos', '0')) || 0
    var precoOut = parseFloat(configValor(app, 'ia_custo_1k_saida_centavos', '0')) || 0
    if (precoIn <= 0 && precoOut <= 0) {
      return { permitido: true, motivo: 'custo_por_token_nao_configurado' }
    }
    var gasto = lerGastoHoje(app)
    if (gasto.centavos >= limiteCentavos) {
      return { permitido: false, motivo: 'teto_diario_atingido' }
    }
    return { permitido: true, motivo: 'ok' }
  }

  function registrarGastoIA(app, tokensIn, tokensOut) {
    var tIn = Number(tokensIn || 0)
    var tOut = Number(tokensOut || 0)
    if (!tIn && !tOut) return
    try {
      var gasto = lerGastoHoje(app)
      var tokens = gasto.tokens + tIn + tOut
      var precoIn = parseFloat(configValor(app, 'ia_custo_1k_entrada_centavos', '0')) || 0
      var precoOut = parseFloat(configValor(app, 'ia_custo_1k_saida_centavos', '0')) || 0
      var custo = Math.round((tIn / 1000) * precoIn + (tOut / 1000) * precoOut)
      gravarContador(app, 'ia_gasto_dia', hojeISO())
      gravarContador(app, 'ia_gasto_dia_centavos', String(gasto.centavos + custo))
      gravarContador(app, 'ia_gasto_dia_tokens', String(tokens))
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // Gravação do resultado
  // ---------------------------------------------------------------------------

  // Grava (ou atualiza) o registro raio_x da obra, no formato exigido.
  // Reaproveita um registro falhou/gerando anterior da mesma obra (qualquer
  // origem) — nunca sobrescreve um registro 'pronto'.
  function gravarRaioX(app, job, obra, resultado, origem) {
    var existentes = app.findRecordsByFilter(
      'raio_x',
      "obra = '" + obra.id + "' && status != 'pronto'",
      '-created',
      1,
      0,
    )
    var rx = null
    if (existentes.length > 0) {
      rx = existentes[0]
    }
    if (!rx) {
      rx = new Record(app.findCollectionByNameOrId('raio_x'))
      rx.set('obra', obra.id)
      rx.set('versao', 'v1')
    }
    rx.set('origem', origem === 'ia' ? 'ia' : 'simulado')
    rx.set('resultado', JSON.stringify(resultado))
    rx.set('status', 'pronto')
    app.save(rx)
    return rx
  }

  // ---------------------------------------------------------------------------
  // Execução de UMA etapa
  // ---------------------------------------------------------------------------

  // Raio-X: ler_obra valida, analisar gera o resultado (cadeia de origens) e
  // grava, salvar_resultado muda a obra p/ "raio_x". Nunca registra conteúdo
  // de obra nem do resultado — só ids/estados/origem/tokens.
  function executarEtapa(app, job, etapa, numeroEtapa, total) {
    console.log(
      'APO_JOB etapa=' +
        etapa +
        ' (' +
        numeroEtapa +
        '/' +
        total +
        ') job=' +
        job.id +
        ' tipo=' +
        job.getString('tipo'),
    )
    var tipo = job.getString('tipo')
    if (tipo !== 'raio_x') return true // demais tipos: simulados (Fases 5+)

    var obraId = job.getString('obra')

    if (etapa === 'ler_obra') {
      // Apenas valida que a obra existe e está num estado anterior ao raio_x;
      // nenhum conteúdo é lido ou registrado neste ponto.
      try {
        var alvo = app.findRecordById('obras', obraId)
        var est = alvo.getString('estado')
        if (
          est !== 'rascunho' &&
          est !== 'questionario' &&
          est !== 'raio_x' &&
          est !== '' &&
          est !== 'parecer'
        ) {
          throw new Error(
            'obra em estado incompatível (' + est + ') para o Raio-X; fluxo fora de ordem',
          )
        }
        return true
      } catch (err) {
        if (String(err && err.message ? err.message : err).indexOf('obra em estado') !== -1) {
          throw err
        }
        throw new Error('obra do job não encontrada para o Raio-X')
      }
    }

    if (etapa === 'analisar') {
      var alvo2 = app.findRecordById('obras', obraId)

      // Atalho: modo simulado ligado na config ⇒ direto ao simulado.
      if (modoSimulado(app)) {
        var resSim = resultadoSimulado(app, alvo2)
        gravarRaioX(app, job, alvo2, resSim, 'simulado')
        logAcao(
          app,
          null,
          'raio_x_gerado',
          'ok',
          'job=' + job.id + ' obra=' + obraId + ' origem=simulado motivo=ia_simulada_config',
        )
        return true
      }

      // Cadeia: Anthropic direto → gateway nativo → simulado.
      var textoInfo = carregarTexto(app, job, obraId)
      var tentativa = null

      if (textoInfo.erro || !textoInfo.texto) {
        logAcao(
          app,
          null,
          'raio_x_leitura_falhou',
          'aviso',
          'job=' + job.id + ' obra=' + obraId + ' motivo=' + textoInfo.erro,
        )
      } else {
        logAcao(
          app,
          null,
          'raio_x_texto_carregado',
          'ok',
          'job=' +
            job.id +
            ' obra=' +
            obraId +
            ' caracteres=' +
            textoInfo.texto.length +
            ' truncado=' +
            (textoInfo.truncado ? 'sim' : 'nao'),
        )
        var gasto = gastoDiarioPermitido(app)
        if (!gasto.permitido) {
          logAcao(
            app,
            null,
            'raio_x_teto_diario',
            'aviso',
            'job=' + job.id + ' obra=' + obraId + ' motivo=' + gasto.motivo,
          )
        } else {
          // 1ª origem: Anthropic direto.
          tentativa = chamarAnthropic(textoInfo.texto)
          registrarGastoIA(app, tentativa.tokensIn, tentativa.tokensOut)
          logAcao(
            app,
            null,
            'raio_x_origem_tentada',
            tentativa.ok ? 'ok' : 'aviso',
            'job=' +
              job.id +
              ' obra=' +
              obraId +
              ' origem=anthropic motivo=' +
              tentativa.motivo +
              ' tokens_in=' +
              tentativa.tokensIn +
              ' tokens_out=' +
              tentativa.tokensOut,
          )
          // 2ª origem: gateway nativo do Skip.
          if (!tentativa.ok) {
            tentativa = chamarGateway(textoInfo.texto)
            registrarGastoIA(app, tentativa.tokensIn, tentativa.tokensOut)
            logAcao(
              app,
              null,
              'raio_x_origem_tentada',
              tentativa.ok ? 'ok' : 'aviso',
              'job=' +
                job.id +
                ' obra=' +
                obraId +
                ' origem=gateway motivo=' +
                tentativa.motivo +
                ' tokens_in=' +
                tentativa.tokensIn +
                ' tokens_out=' +
                tentativa.tokensOut,
            )
          }
        }
      }

      if (tentativa && tentativa.ok) {
        gravarRaioX(app, job, alvo2, tentativa.resultado, 'ia')
        logAcao(
          app,
          null,
          'raio_x_gerado',
          'ok',
          'job=' +
            job.id +
            ' obra=' +
            obraId +
            ' origem=ia tokens_in=' +
            tentativa.tokensIn +
            ' tokens_out=' +
            tentativa.tokensOut,
        )
      } else {
        // 3ª origem (último recurso): simulado. O job NUNCA quebra por falha de IA.
        var motivo = tentativa ? tentativa.motivo : textoInfo.erro || 'sem_texto'
        var resSim2 = resultadoSimulado(app, alvo2)
        gravarRaioX(app, job, alvo2, resSim2, 'simulado')
        logAcao(
          app,
          null,
          'raio_x_gerado',
          'ok',
          'job=' + job.id + ' obra=' + obraId + ' origem=simulado motivo=' + motivo,
        )
      }
      return true
    }

    if (etapa === 'salvar_resultado') {
      // Idempotente: só muda a obra se ela ainda não está em "raio_x".
      var alvo3 = app.findRecordById('obras', obraId)
      if (alvo3.getString('estado') !== 'raio_x') {
        alvo3.set('estado', 'raio_x')
        app.save(alvo3)
        logAcao(app, null, 'obra_estado_raio_x', 'ok', 'obra=' + obraId + ' estado=raio_x')
      }
      return true
    }

    return true
  }

  function processarJob(app, job) {
    var etapas = etapasDoTipo(job.getString('tipo'))
    var estado = job.getString('estado') || 'pendente'

    var indice = 0
    try {
      indice = job.getInt('etapa_indice') || 0
    } catch (_) {}
    if (indice < 0 || indice > etapas.length) indice = 0

    if (indice >= etapas.length) {
      // já executou todas as etapas — conclui (idempotente)
      job.set('estado', 'concluido')
      job.set('finalizado_em', new Date().toISOString())
      app.save(job)
      return
    }

    if (estado !== 'executando') {
      job.set('estado', 'executando')
      if (!job.getString('iniciado_em')) {
        job.set('iniciado_em', new Date().toISOString())
      }
      app.save(job) // grava ANTES de executar: se cair, retoma daqui
    }

    var ok = false
    try {
      ok = executarEtapa(app, job, etapas[indice], indice + 1, etapas.length)
    } catch (err) {
      ok = false
      job.set('erro', String(err && err.message ? err.message : err).slice(0, 2000))
    }

    if (!ok) {
      // Falha: etapa NÃO avança (etapa_indice fica onde está). A obra NÃO é
      // tocada. Com tentativas esgotadas, marca erro definitivo.
      var tentativas = (job.getInt('tentativas') || 0) + 1
      if (tentativas >= JOBS_MAX_TENTATIVAS) {
        job.set('estado', 'erro')
        job.set('tentativas', tentativas)
        job.set('finalizado_em', new Date().toISOString())
        app.save(job)
        logAcao(
          app,
          null,
          'job_falhou_definitivamente',
          'erro',
          'job=' + job.id + ' tipo=' + job.getString('tipo') + ' etapa=' + etapas[indice],
        )
        return
      }
      job.set('estado', 'pendente') // tenta de novo na próxima rodada
      job.set('tentativas', tentativas)
      app.save(job)
      return
    }

    // etapa concluída com sucesso: avança o PONTEIRO (etapa_indice) e
    // zera o contador de tentativas desta etapa (e o erro anterior).
    var proximo = indice + 1
    job.set('tentativas', 0)
    job.set('erro', '')
    if (proximo >= etapas.length) {
      job.set('etapa_indice', proximo)
      job.set('estado', 'concluido')
      job.set('finalizado_em', new Date().toISOString())
      job.set('erro', '')
      app.save(job)
      logAcao(app, null, 'job_concluido', 'ok', 'job=' + job.id + ' tipo=' + job.getString('tipo'))
    } else {
      job.set('etapa_indice', proximo)
      job.set('estado', 'pendente')
      app.save(job)
    }
  }

  try {
    // retoma primeiro job preso em "executando" (queda/cron anterior)
    var presos = $app.findRecordsByFilter('jobs', "estado = 'executando'", '-created', 1, 0)
    if (presos.length > 0) {
      processarJob($app, presos[0])
      return // uma etapa curta por rodada
    }
    // depois um job pendente
    var pendentes = $app.findRecordsByFilter('jobs', "estado = 'pendente'", '-created', 1, 0)
    if (pendentes.length > 0) {
      processarJob($app, pendentes[0])
      return
    }
    // por fim, jobs em erro com tentativas abaixo do máximo (retentativa)
    var emErro = $app.findRecordsByFilter(
      'jobs',
      "estado = 'erro' && tentativas < " + JOBS_MAX_TENTATIVAS,
      '-created',
      1,
      0,
    )
    if (emErro.length > 0) {
      emErro[0].set('estado', 'pendente')
      $app.save(emErro[0])
    }
  } catch (err) {
    console.log(
      'APO_JOB erro_no_cron ' + String(err && err.message ? err.message : err).slice(0, 300),
    )
  }
})
