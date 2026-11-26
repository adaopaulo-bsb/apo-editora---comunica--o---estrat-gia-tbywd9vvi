//
// pocketbase/hooks/arquivos_raio_x.js — módulo raio-x, gatilho.
// Ao criar um registro em "arquivos" com tipo "manuscrito", cria
// automaticamente um job raio_x pendente para a obra. O processamento em
// etapas é do cron apoJobsProcessar (jobs_processor.js).
//
// Idempotente: se já existe job raio_x pendente/executando para a mesma
// obra, não duplica (o arquivo novo só é logado como não vinculado).
//
// IMPORTANTE (Skip Cloud): callbacks do JSVM executam em outra VM — toda
// função auxiliar é declarada DENTRO do callback.
//

onRecordAfterCreateSuccess(function (e) {
  // Log padrão do projeto: só ids, ação e resultado. PROIBIDO registrar
  // conteúdo de manuscrito ou texto extraído.
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

  try {
    var tipo = ''
    try {
      tipo = e.record.getString('tipo')
    } catch (_) {}

    if (tipo === 'manuscrito') {
      var obraId = e.record.getString('obra')

      if (!obraId) {
        logAcao(e.app, null, 'raio_x_job_gatilho', 'erro', 'arquivo sem obra; job não criado')
      } else {
        // Idempotência: já há job raio_x em aberto (pendente/executando)
        // para esta obra? Então não duplica.
        var abertos = e.app.findRecordsByFilter(
          'jobs',
          "obra = '" +
            obraId +
            "' && tipo = 'raio_x' && (estado = 'pendente' || estado = 'executando')",
          '-created',
          1,
          0,
        )
        if (abertos.length > 0) {
          logAcao(
            e.app,
            null,
            'raio_x_job_gatilho',
            'ok',
            'job raio_x já em aberto; não duplicado job=' + abertos[0].id + ' obra=' + obraId,
          )
        } else {
          var job = new Record(e.app.findCollectionByNameOrId('jobs'))
          job.set('obra', obraId)
          job.set('tipo', 'raio_x')
          job.set('estado', 'pendente')
          job.set('tentativas', 0)
          job.set('etapa_indice', 0)
          e.app.save(job)
          logAcao(
            e.app,
            null,
            'raio_x_job_criado',
            'ok',
            'job=' + job.id + ' obra=' + obraId + ' arquivo=' + e.record.id,
          )
        }
      }
    }
  } catch (err) {
    // Falha do gatilho NÃO derruba o create do arquivo: registra e segue.
    console.log(
      'APO_JOB erro_no_gatilho ' + String(err && err.message ? err.message : err).slice(0, 300),
    )
    try {
      logAcao(
        e.app,
        null,
        'raio_x_job_gatilho',
        'erro',
        'falha ao criar job raio_x para o arquivo=' + e.record.id,
      )
    } catch (_) {}
  }

  // Hook "afterCreateSuccess": pós-commit — a gravação já ocorreu; chamado
  // para encadear a resposta normalmente.
  e.next()
}, 'arquivos')
