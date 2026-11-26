//
// pocketbase/hooks/jobs_processor.js — módulo jobs.
// Agendador nativo (cronAdd) que processa jobs em ETAPAS CURTAS, retomando
// de onde parou (máquina de estados por estado/tentativas). Este padrão
// será usado nas Fases 4 e 5 (Raio-X, parecer, preparação etc.).
//
// IMPORTANTE (Skip Cloud): callbacks do JSVM executam em outra VM — toda
// função auxiliar é declarada DENTRO do callback do cron.
//
// Fase 5 (Raio-X com IA real): a etapa "analisar" do job tipo "raio_x" tenta
// uma CADEIA de origens, sem marcar o job como erro quando uma delas falha:
//   1ª) API da Anthropic DIRETA (modelo claude-sonnet-5-5) — APROVADO PELO
//       USUÁRIO: recurso não-nativo do Skip, escolhido pela qualidade da
//       análise editorial, com o gateway nativo mantido como reserva.
//   2ª) Gateway nativo do Skip ($ai.chat, segredos SKIP_AI_*).
//   3ª) Análise simulada (a antiga, origem "simulado").
// Com ia_simulada=true (config) ou teto diário de IA estourado, vai direto
// à 3ª. A chave ANTHROPIC_API_KEY só via $os.getenv (nunca em arquivo, log
// ou front). Ao concluir, a obra passa ao estado "raio_x". Falha não avança
// etapa_indice, só incrementa tentativas.
//
// Cada rodada do cron pega no máximo 1 job "pendente" (ou preso em
// "executando", de uma queda anterior) e executa UMA etapa curta, gravando
// o novo estado antes e depois. Se o servidor cair no meio, o job fica
// "executando" e é retomado pela contagem de tentativas.
//
// pocketbase/hooks/jobs_processor.js — módulo jobs.
// Agendador nativo (cronAdd) que processa jobs em ETAPAS CURTAS, retomando
// de onde parou (máquina de estados por estado/tentativas). Este padrão
// será usado nas Fases 4 e 5 (Raio-X, parecer, preparação etc.).
//
// IMPORTANTE (Skip Cloud): callbacks do JSVM executam em outra VM — toda
// função auxiliar é declarada DENTRO do callback do cron.
//
// Fase 5 (Raio-X com IA real): a etapa "analisar" do job tipo "raio_x" tenta
// uma CADEIA de origens, sem marcar o job como erro quando uma delas falha:
//   1ª) API da Anthropic DIRETA (modelo claude-sonnet-5-5) — APROVADO PELO
//       USUÁRIO: recurso não-nativo do Skip, escolhido pela qualidade da
//       análise editorial, com o gateway nativo mantido como reserva.
//   2ª) Gateway nativo do Skip ($ai.chat, segredos SKIP_AI_*).
//   3ª) Análise simulada (a antiga, origem "simulado").
// Com ia_simulada=true (config) ou teto diário de IA estourado, vai direto
// à 3ª. A chave ANTHROPIC_API_KEY só via $os.getenv (nunca em arquivo, log
// ou front). Ao concluir, a obra passa ao estado "raio_x". Falha não avança
// etapa_indice, só incrementa tentativas.
//
// Cada rodada do cron pega no máximo 1 job "pendente" (ou preso em
// "executando", de uma queda anterior) e executa UMA etapa curta, gravando
// o novo estado antes e depois. Se o servidor cair no meio, o job fica
// "executando" e é retomado pela contagem de tentativas.
//
=======
//
// Cada rodada do cron pega no máximo 1 job "pendente" (ou preso em
// "executando", de uma queda anterior) e executa UMA etapa curta, gravando
// o novo estado antes e depois. Se o servidor cair no meio, o job fica
// "executando" e é retomado pela contagem de tentativas.
//

cronAdd('apoJobsProcessar', '*/1 * * * *', function () {
  var JOBS_MAX_TENTATIVAS = 3

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
  // conteúdo de manuscrito, texto extraído ou o resultado do raio-x.
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

  // Modo de simulação da IA vem da coleção config (chave ia_simulada;
  // "true" = simulado). Ausente ou inválida = simulado (padrão seguro).
  function modoSimulado(app) {
    try {
      var cfg = app.findFirstRecordByFilter('config', "chave = 'ia_simulada'")
      return String(cfg.getString('valor') || 'true') !== 'false'
    } catch (_) {
      return true
    }
  }

  // Resultado SIMULADO do Raio-X (a IA real entra em fase posterior e, quando
  // entrar, seguirá lendo ia_simulada aqui). Formato exigido: resumo,
  // nota (0 a 10), pontos_fortes [3], ajustes [3].
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

  // Grava (ou atualiza) o registro raio_x da obra, no formato exigido.
  // Reaproveita um registro falhou/gerando anterior da mesma origem.
  function gravarRaioX(app, job, obra, resultado) {
    var existentes = app.findRecordsByFilter(
      'raio_x',
      "obra = '" + obra.id + "' && origem = 'simulado' && status != 'pronto'",
      '-created',
      1,
      0,
    )
    var rx = null
    if (existentes.length > 0) {
      rx = existentes[0] // filtro já exclui 'pronto' — não sobrescreve pronto
    }
    if (!rx) {
      rx = new Record(app.findCollectionByNameOrId('raio_x'))
      rx.set('obra', obra.id)
      rx.set('versao', 'v1')
      var arquivoId = ''
      try {
        arquivoId = job.getString('arquivo')
      } catch (_) {}
      if (arquivoId) rx.set('arquivo', arquivoId)
    }
    rx.set('origem', 'simulado')
    rx.set('resultado', JSON.stringify(resultado))
    rx.set('status', 'pronto')
    app.save(rx)
    return rx
  }

  // Executa UMA etapa curta. Raio-X: ler_obra valida, analisar gera o
  // resultado simulado + grava, salvar_resultado muda a obra p/ "raio_x".
  // Nunca registra conteúdo de obra nem do resultado — só ids/estados.
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
      if (modoSimulado(app)) {
        var alvo2 = app.findRecordById('obras', obraId)
        var resultado = resultadoSimulado(app, alvo2)
        gravarRaioX(app, job, alvo2, resultado)
        logAcao(
          app,
          null,
          'raio_x_gerado',
          'ok',
          'job=' + job.id + ' obra=' + obraId + ' origem=simulado status=pronto',
        )
      } else {
        // IA real só em fase posterior, com limite de gasto (config). Hoje a
        // etapa não falha: mantém o job retomável sem avanço indevido.
        logAcao(app, null, 'raio_x_ia_nao_disponivel', 'erro', 'job=' + job.id + ' obra=' + obraId)
        throw new Error('IA real ainda não habilitada nesta fase (ia_simulada=false)')
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
