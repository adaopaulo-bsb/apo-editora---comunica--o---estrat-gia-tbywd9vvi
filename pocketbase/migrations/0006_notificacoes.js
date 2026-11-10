// Módulo: notificacoes — mensagens enviadas ao usuário dentro do app
// (e-mail/lembretes entram em fase futura).
migrate(
  (app) => {
    const collection = new Collection({
      name: 'notificacoes',
      type: 'base',
      listRule: "@request.auth.id != '' && destinatario = @request.auth.id",
      viewRule: "@request.auth.id != '' && destinatario = @request.auth.id",
      createRule: null,
      updateRule: "@request.auth.id != '' && destinatario = @request.auth.id",
      deleteRule: null,
      fields: [
        {
          name: 'destinatario',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true, max: 200 },
        { name: 'conteudo', type: 'text', max: 4000 },
        // lida = false por padrão; NÃO marcar como required (bool required exige true)
        { name: 'lida', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_notificacoes_destinatario_created ON notificacoes (destinatario, created DESC)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('notificacoes')
    app.delete(collection)
  },
)
