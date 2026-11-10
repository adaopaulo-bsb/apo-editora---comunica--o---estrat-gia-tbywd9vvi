// Módulo: auditoria — log estruturado de ações (data, usuário como id,
// ação e resultado). Proibido registrar conteúdo de manuscrito, senhas ou chaves.
migrate(
  (app) => {
    const collection = new Collection({
      name: 'auditoria',
      type: 'base',
      // Escrita apenas server-side (superuser). Leitura: admin vê tudo;
      // usuário comum vê os próprios registros.
      listRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || usuario = @request.auth.id)",
      viewRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || usuario = @request.auth.id)",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        // Id do usuário (nunca e-mail)
        { name: 'usuario', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'acao', type: 'text', required: true, min: 1, max: 100 },
        // "ok" | "erro"
        { name: 'resultado', type: 'select', required: true, values: ['ok', 'erro'], maxSelect: 1 },
        // Contexto curto e seguro (sem conteúdo de manuscrito/senhas/chaves)
        { name: 'detalhe', type: 'text', max: 500 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_auditoria_usuario_created ON auditoria (usuario, created DESC)',
        'CREATE INDEX idx_auditoria_acao ON auditoria (acao)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('auditoria')
    app.delete(collection)
  },
)
