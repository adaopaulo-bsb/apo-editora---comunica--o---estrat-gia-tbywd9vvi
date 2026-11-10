//
// pocketbase/hooks/auth_guard.js — módulo auth, defesa em profundidade.
// Complementa a createRule da migração 0015_users_create_rule.js: mesmo que a
// regra um dia mude, TODO create público na coleção `users` sai com
// role = "autor". Qualquer outro papel (admin, editor) é recusado com 403.
// Creates feitos por superusuário (painel/servidor, seed) não passam por
// createRule e mantêm a liberdade de definir o papel — é assim que
// administradores legítimos são criados.
//
// IMPORTANTE (Skip Cloud): callbacks do JSVM executam em outra VM — toda
// função auxiliar é declarada DENTRO do callback.
//

onRecordCreateRequest(function (e) {
  function papelPedido() {
    try {
      return String(e.record.get('role') || '')
    } catch (_) {
      return ''
    }
  }

  function logAcao(app, usuarioId, acao, resultado, detalhe) {
    // Log estruturado padrão do projeto: nunca e-mail, nunca conteúdo sensível.
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

  // Superusuário (painel/admin) pode definir qualquer papel — não é create público.
  // No PocketBase, superusuários são registros da coleção interna _superusers.
  var isSuperuser = false
  try {
    isSuperuser = !!(e.auth && e.auth.id && e.auth.collection().name === '_superusers')
  } catch (_) {}

  var papel = papelPedido()

  if (isSuperuser) {
    // Defesa não se aplica: quem cria é o próprio administrador da instância.
    logAcao(
      e.app,
      e.auth.id,
      'users_create_guard',
      'ok',
      'create por superusuário; papel=' + (papel || 'ausente'),
    )
    e.next()
    return
  }

  if (papel !== 'autor') {
    // Rejeita sem vazar detalhes: nenhum e-mail ou conteúdo no log.
    logAcao(
      e.app,
      null,
      'users_create_guard',
      'erro',
      'cadastro público recusado: papel inválido (' + (papel || 'ausente') + ')',
    )
    throw new BadRequestError(
      'Cadastro público aceita somente o papel "autor". Fale com a APO se precisar de outro acesso.',
    )
  }

  // Mesmo com role = "autor", garante o valor exato (defesa contra variações).
  e.record.set('role', 'autor')
  logAcao(e.app, null, 'users_create_guard', 'ok', 'cadastro público aceito (papel autor)')
  // Hook "served": sem e.next() o PocketBase NÃO grava o registro.
  e.next()
}, '_pb_users_auth_')
