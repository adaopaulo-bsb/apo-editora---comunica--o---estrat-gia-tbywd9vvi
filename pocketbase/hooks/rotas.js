//
// pocketbase/hooks/rotas.js — módulos raiz/console/auditoria.
// Rotas técnicas da Fase 1 da APO Editora:
//   GET  /backend/v1/saude       — versão, ambiente, banco e armazenamento (sem auth)
//   GET  /backend/v1/erro-teste  — valida o padrão único de erro (só em teste)
//   POST /backend/v1/demo/seed   — dados de demonstração (só teste, só admin)
//   POST /backend/v1/demo/reset  — limpa dados demo (só teste, só admin)
//
// IMPORTANTE (Skip Cloud): callbacks do JSVM executam em outra VM — toda
// função auxiliar é declarada DENTRO de cada callback.
//

// ---------- /saude ----------

routerAdd('GET', '/backend/v1/saude', function (e) {
  function ambiente() {
    var v = 'teste'
    try {
      v = $os.getenv('APP_ENV') || 'teste'
    } catch (_) {}
    return v === 'producao' ? 'producao' : 'teste'
  }

  var banco = 'ok'
  var armazenamento = 'ok'

  // Conexão com o banco: consulta simples em coleção.
  try {
    var col = e.app.findCollectionByNameOrId('users')
    if (!col || !col.id) throw new Error('coleção users não encontrada')
  } catch (err) {
    banco = 'erro'
  }

  // Armazenamento: valida o caminho de gravação/leitura usado pelo
  // PocketBase (armazenamento gerenciado da instância Skip Cloud).
  try {
    var marcador = 'saude_' + Date.now()
    var config = null
    try {
      config = e.app.findFirstRecordByFilter('config', "chave = '_saude_marcador'")
    } catch (_) {}
    if (config) {
      config.set('valor', marcador)
      e.app.save(config)
    } else {
      var novo = new Record(e.app.findCollectionByNameOrId('config'))
      novo.set('chave', '_saude_marcador')
      novo.set('valor', marcador)
      e.app.save(novo)
    }
    var conferido = e.app.findFirstRecordByFilter('config', "chave = '_saude_marcador'")
    if (conferido.getString('valor') !== marcador) throw new Error('marcador não conferiu')
  } catch (err) {
    armazenamento = 'erro'
  }

  var ok = banco === 'ok' && armazenamento === 'ok'
  return e.json(ok ? 200 : 503, {
    servico: 'APO Editora',
    versao: '0.1.0-fase1',
    ambiente: ambiente(),
    status: ok ? 'ok' : 'degradado',
    banco: banco,
    armazenamento: armazenamento,
    verificado_em: new Date().toISOString(),
  })
})

// ---------- /erro-teste (valida o padrão de erro) ----------

routerAdd('GET', '/backend/v1/erro-teste', function (e) {
  function ambiente() {
    var v = 'teste'
    try {
      v = $os.getenv('APP_ENV') || 'teste'
    } catch (_) {}
    return v === 'producao' ? 'producao' : 'teste'
  }
  function novoRastreio() {
    try {
      return 'trc_' + $security.randomString(12).toLowerCase()
    } catch (_) {
      return 'trc_' + Date.now().toString(36)
    }
  }
  function erroPadronizado(status, codigo, mensagem, err) {
    var rastreio = novoRastreio()
    if (err) {
      console.log(
        JSON.stringify({
          nivel: 'erro',
          rastreio: rastreio,
          codigo: codigo,
          detalhe_tecnico: String(err && err.message ? err.message : err).slice(0, 500),
        }),
      )
    }
    return e.json(status, {
      erro: {
        codigo: codigo,
        mensagem: mensagem,
        rastreio: rastreio,
        status: status,
      },
    })
  }

  if (ambiente() !== 'teste') {
    return erroPadronizado(404, 'nao_encontrado', 'Rota não encontrada neste ambiente.')
  }
  return erroPadronizado(
    400,
    'validacao',
    'Esta é uma resposta de erro de teste do padrão único da APO.',
    new Error('exemplo de detalhe técnico (não vai ao cliente)'),
  )
})

// ---------- dados de demonstração (só ambiente de teste) ----------

routerAdd(
  'POST',
  '/backend/v1/demo/seed',
  function (e) {
    function ambiente() {
      var v = 'teste'
      try {
        v = $os.getenv('APP_ENV') || 'teste'
      } catch (_) {}
      return v === 'producao' ? 'producao' : 'teste'
    }
    function novoRastreio() {
      try {
        return 'trc_' + $security.randomString(12).toLowerCase()
      } catch (_) {
        return 'trc_' + Date.now().toString(36)
      }
    }
    function erroPadronizado(status, codigo, mensagem, err) {
      var rastreio = novoRastreio()
      if (err) {
        console.log(
          JSON.stringify({
            nivel: 'erro',
            rastreio: rastreio,
            codigo: codigo,
            detalhe_tecnico: String(err && err.message ? err.message : err).slice(0, 500),
          }),
        )
      }
      return e.json(status, {
        erro: {
          codigo: codigo,
          mensagem: mensagem,
          rastreio: rastreio,
          status: status,
        },
      })
    }
    // Log estruturado: data, usuário apenas id (nunca e-mail), ação e resultado.
    // PROIBIDO registrar conteúdo de manuscrito, senhas ou chaves.
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
    function exigirAdmin() {
      var auth = e.auth
      if (!auth || !auth.id) {
        return {
          erro: true,
          resposta: erroPadronizado(
            401,
            'acesso_negado',
            'Você precisa estar autenticado para fazer isso.',
          ),
        }
      }
      var role = ''
      try {
        role = auth.getString('role') || ''
      } catch (_) {}
      if (role !== 'admin') {
        return {
          erro: true,
          resposta: erroPadronizado(
            403,
            'acesso_negado',
            'Você não tem permissão para fazer isso. Fale com um administrador da APO.',
          ),
        }
      }
      return { erro: false }
    }

    var guarda = exigirAdmin()
    if (guarda.erro) return guarda.resposta

    if (ambiente() !== 'teste') {
      // Produção: rotina NÃO faz nada, responde de forma explícita.
      logAcao(e.app, e.auth.id, 'demo_seed', 'erro', 'bloqueado: ambiente de produção')
      return erroPadronizado(
        403,
        'acesso_negado',
        'Dados de demonstração só podem ser criados no ambiente de teste.',
      )
    }

    var criados = { usuarios: 0, autores: 0, obras: 0, questionarios: 0, raio_x: 0, jobs: 0 }

    try {
      // 1) usuários fictícios (autor, autor 2, editor demo)
      var emails = ['autor.demo@apo.exemplo', 'autor2.demo@apo.exemplo', 'editor.demo@apo.exemplo']
      var usuarios = []
      for (var i = 0; i < emails.length; i++) {
        var u = null
        try {
          u = e.app.findAuthRecordByEmail('_pb_users_auth_', emails[i])
        } catch (_) {}
        if (!u) {
          var nu = new Record(e.app.findCollectionByNameOrId('_pb_users_auth_'))
          nu.setEmail(emails[i])
          nu.setPassword('Demo@Apo1')
          nu.setVerified(true)
          nu.set('name', i === 2 ? 'Editor Demo APO' : 'Autor Demo ' + (i + 1))
          nu.set('role', i === 2 ? 'editor' : 'autor')
          e.app.save(nu)
          u = nu
          criados.usuarios++
        }
        usuarios.push(u)
      }

      // 2) autor + obra fictícia
      var autorRec = null
      try {
        autorRec = e.app.findFirstRecordByFilter('autores', "usuario = '" + usuarios[0].id + "'")
      } catch (_) {}
      if (!autorRec) {
        autorRec = new Record(e.app.findCollectionByNameOrId('autores'))
        autorRec.set('usuario', usuarios[0].id)
        autorRec.set('nome_completo', 'Autora Demo da APO')
        autorRec.set('cidade', 'São Paulo')
        e.app.save(autorRec)
        criados.autores++
      }

      var obra = null
      var obrasExistentes = e.app.findRecordsByFilter(
        'obras',
        "autor = '" + autorRec.id + "'",
        '',
        1,
        0,
      )
      if (obrasExistentes.length === 0) {
        obra = new Record(e.app.findCollectionByNameOrId('obras'))
        obra.set('autor', autorRec.id)
        obra.set('titulo', 'O Jardim das Horas Invisíveis')
        obra.set('subtitulo', 'romance')
        obra.set('genero', 'Ficção literária')
        obra.set(
          'sinopse',
          'Uma relojoeira descobre que os relógios da cidade marcam horas que ainda não aconteceram.',
        )
        obra.set('palavras', 62000)
        obra.set('estado', 'rascunho')
        e.app.save(obra)
        criados.obras++
      } else {
        obra = obrasExistentes[0]
      }

      // 3) questionário fictício
      var questionarios = e.app.findRecordsByFilter(
        'questionarios',
        "obra = '" + obra.id + "'",
        '',
        1,
        0,
      )
      if (questionarios.length === 0) {
        var q = new Record(e.app.findCollectionByNameOrId('questionarios'))
        q.set('obra', obra.id)
        q.set('versao', 'v1')
        q.set('concluido', true)
        q.set(
          'respostas',
          JSON.stringify({
            publico_alvo: 'leitores de ficção contemporânea',
            objetivo: 'publicar em 2027',
            diferencial: 'voz narrativa lúdica',
          }),
        )
        e.app.save(q)
        criados.questionarios++
      }

      // 4) raio-x fictício (análise automática prévia, simulada)
      var raioExistentes = e.app.findRecordsByFilter('raio_x', "obra = '" + obra.id + "'", '', 1, 0)
      if (raioExistentes.length === 0) {
        var rx = new Record(e.app.findCollectionByNameOrId('raio_x'))
        rx.set('obra', obra.id)
        rx.set('versao', 'v1')
        rx.set('origem', 'simulado')
        rx.set(
          'resultado',
          JSON.stringify({
            rotulo: 'análise automática prévia',
            resumo:
              'A obra tem boa progressão de trama e ganharía com mais profundidade nos diálogos do segundo ato.',
            pontos_fortes: ['voz narrativa', 'estrutura em três atos'],
            pontos_atencao: ['diálogos longos', 'descrições repetidas'],
          }),
        )
        e.app.save(rx)
        criados.raio_x++
      }

      // 5) job de teste (o cron o processa em etapas)
      var jobsExistentes = e.app.findRecordsByFilter(
        'jobs',
        "obra = '" + obra.id + "' && tipo = 'teste'",
        '',
        1,
        0,
      )
      if (jobsExistentes.length === 0) {
        var job = new Record(e.app.findCollectionByNameOrId('jobs'))
        job.set('obra', obra.id)
        job.set('tipo', 'teste')
        job.set('estado', 'pendente')
        job.set('tentativas', 0)
        e.app.save(job)
        criados.jobs++
      }

      logAcao(e.app, e.auth.id, 'demo_seed', 'ok', 'criados: ' + JSON.stringify(criados))
      return e.json(200, { ok: true, ambiente: ambiente(), criados: criados })
    } catch (err) {
      logAcao(e.app, e.auth.id, 'demo_seed', 'erro', 'falha ao criar dados demo')
      return erroPadronizado(
        500,
        'erro_interno',
        'Não foi possível criar os dados de demonstração. Tente novamente.',
        err,
      )
    }
  },
  $apis.requireAuth(),
)

// ---------- limpeza dos dados de demonstração (só ambiente de teste) ----------

routerAdd(
  'POST',
  '/backend/v1/demo/reset',
  function (e) {
    function ambiente() {
      var v = 'teste'
      try {
        v = $os.getenv('APP_ENV') || 'teste'
      } catch (_) {}
      return v === 'producao' ? 'producao' : 'teste'
    }
    function novoRastreio() {
      try {
        return 'trc_' + $security.randomString(12).toLowerCase()
      } catch (_) {
        return 'trc_' + Date.now().toString(36)
      }
    }
    function erroPadronizado(status, codigo, mensagem, err) {
      var rastreio = novoRastreio()
      if (err) {
        console.log(
          JSON.stringify({
            nivel: 'erro',
            rastreio: rastreio,
            codigo: codigo,
            detalhe_tecnico: String(err && err.message ? err.message : err).slice(0, 500),
          }),
        )
      }
      return e.json(status, {
        erro: {
          codigo: codigo,
          mensagem: mensagem,
          rastreio: rastreio,
          status: status,
        },
      })
    }
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
    function exigirAdmin() {
      var auth = e.auth
      if (!auth || !auth.id) {
        return {
          erro: true,
          resposta: erroPadronizado(
            401,
            'acesso_negado',
            'Você precisa estar autenticado para fazer isso.',
          ),
        }
      }
      var role = ''
      try {
        role = auth.getString('role') || ''
      } catch (_) {}
      if (role !== 'admin') {
        return {
          erro: true,
          resposta: erroPadronizado(
            403,
            'acesso_negado',
            'Você não tem permissão para fazer isso. Fale com um administrador da APO.',
          ),
        }
      }
      return { erro: false }
    }

    var guarda = exigirAdmin()
    if (guarda.erro) return guarda.resposta

    if (ambiente() !== 'teste') {
      logAcao(e.app, e.auth.id, 'demo_reset', 'erro', 'bloqueado: ambiente de produção')
      return erroPadronizado(
        403,
        'acesso_negado',
        'A limpeza de dados de demonstração só pode rodar no ambiente de teste.',
      )
    }

    var removidos = { jobs: 0, raio_x: 0, questionarios: 0, obras: 0, autores: 0, usuarios: 0 }

    try {
      // remove somente registros marcados como demonstração (prefixo demo_*
      // nos usuários fictícios criados pelo seed), nunca dados reais.
      var emails = ['autor.demo@apo.exemplo', 'autor2.demo@apo.exemplo', 'editor.demo@apo.exemplo']

      var jobsDemo = e.app.findRecordsByFilter('jobs', "tipo = 'teste'", '', 200, 0)
      for (var j = 0; j < jobsDemo.length; j++) {
        e.app.delete(jobsDemo[j])
        removidos.jobs++
      }

      var raiosDemo = e.app.findRecordsByFilter('raio_x', "origem = 'simulado'", '', 200, 0)
      for (var r = 0; r < raiosDemo.length; r++) {
        e.app.delete(raiosDemo[r])
        removidos.raio_x++
      }

      var usuariosDemo = []
      for (var i = 0; i < emails.length; i++) {
        var u = null
        try {
          u = e.app.findAuthRecordByEmail('_pb_users_auth_', emails[i])
        } catch (_) {}
        if (u) usuariosDemo.push(u)
      }

      for (var a = 0; a < usuariosDemo.length; a++) {
        var autorRec = null
        try {
          autorRec = e.app.findFirstRecordByFilter(
            'autores',
            "usuario = '" + usuariosDemo[a].id + "'",
          )
        } catch (_) {}
        if (autorRec) {
          var obras = e.app.findRecordsByFilter(
            'obras',
            "autor = '" + autorRec.id + "'",
            '',
            200,
            0,
          )
          for (var o = 0; o < obras.length; o++) {
            var qs = e.app.findRecordsByFilter(
              'questionarios',
              "obra = '" + obras[o].id + "'",
              '',
              10,
              0,
            )
            for (var qi = 0; qi < qs.length; qi++) {
              e.app.delete(qs[qi])
              removidos.questionarios++
            }
            e.app.delete(obras[o])
            removidos.obras++
          }
          e.app.delete(autorRec)
          removidos.autores++
        }
        e.app.delete(usuariosDemo[a])
        removidos.usuarios++
      }

      logAcao(e.app, e.auth.id, 'demo_reset', 'ok', 'removidos: ' + JSON.stringify(removidos))
      return e.json(200, { ok: true, ambiente: ambiente(), removidos: removidos })
    } catch (err) {
      logAcao(e.app, e.auth.id, 'demo_reset', 'erro', 'falha ao limpar dados demo')
      return erroPadronizado(
        500,
        'erro_interno',
        'Não foi possível limpar os dados de demonstração. Tente novamente.',
        err,
      )
    }
  },
  $apis.requireAuth(),
)
