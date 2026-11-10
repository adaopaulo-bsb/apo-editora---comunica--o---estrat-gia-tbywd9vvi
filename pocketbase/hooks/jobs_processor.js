//
// pocketbase/hooks/jobs_processor.js — módulo jobs.
// Agendador nativo (cronAdd) que processa jobs em ETAPAS CURTAS, retomando
// de onde parou (máquina de estados por estado/tentativas). Este padrão
// será usado nas Fases 4 e 5 (Raio-X, parecer, preparação etc.).
//
// IMPORTANTE (Skip Cloud): callbacks do JSVM executam em outra VM — toda
// função auxiliar é declarada DENTRO do callback do cron.
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

  // Executa UMA etapa curta. Nesta fase é simulação de teste: apenas
  // registra. Fases futuras substituem este corpo por trabalho real.
  // Nunca registra conteúdo de obra — só ids/estados/contagens.
  function executarEtapa(job, etapa, numeroEtapa, total) {
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
    return true
  }

  function processarJob(app, job) {
    var etapas = etapasDoTipo(job.getString('tipo'))
    var numero = 0
    try {
      numero = job.getInt('tentativas') || 0
    } catch (_) {}
    var estado = job.getString('estado') || 'pendente'

    if (numero >= etapas.length) {
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
      job.set('tentativas', numero + 1)
      app.save(job) // grava ANTES de executar: se cair, retoma daqui
    }

    var ok = false
    try {
      ok = executarEtapa(job, etapas[numero], numero + 1, etapas.length)
    } catch (err) {
      ok = false
      job.set('erro', String(err && err.message ? err.message : err).slice(0, 2000))
    }

    if (!ok) {
      var tentativas = numero + 1
      if (tentativas >= JOBS_MAX_TENTATIVAS) {
        job.set('estado', 'erro')
        job.set('finalizado_em', new Date().toISOString())
        app.save(job)
        console.log('APO_JOB falhou_definitivamente job=' + job.id + ' tentativas=' + tentativas)
        return
      }
      job.set('estado', 'pendente') // tenta de novo na próxima rodada
      job.set('tentativas', tentativas)
      app.save(job)
      return
    }

    // etapa concluída: avança; se era a última, conclui.
    var proximo = numero + 1
    if (proximo >= etapas.length) {
      job.set('estado', 'concluido')
      job.set('finalizado_em', new Date().toISOString())
      job.set('erro', '')
      app.save(job)
      console.log(
        'APO_LOG ' +
          JSON.stringify({
            data: new Date().toISOString(),
            usuario: null,
            acao: 'job_concluido',
            resultado: 'ok',
            detalhe: 'job=' + job.id + ' tipo=' + job.getString('tipo'),
          }),
      )
    } else {
      job.set('tentativas', proximo)
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
