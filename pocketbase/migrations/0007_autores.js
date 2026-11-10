// Módulo: autores — perfil de autor (1:1 com usuário).
migrate(
  (app) => {
    const collection = new Collection({
      name: 'autores',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      viewRule:
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      createRule:
        "@request.auth.id != '' && usuario = @request.auth.id && @request.auth.role != 'admin'",
      updateRule:
        "@request.auth.id != '' && (usuario = @request.auth.id || @request.auth.role = 'admin')",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'usuario',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'nome_completo', type: 'text', required: true, min: 2, max: 200 },
        { name: 'nome_social', type: 'text', max: 200 },
        { name: 'telefone', type: 'text', max: 30 },
        { name: 'cidade', type: 'text', max: 100 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_autores_usuario ON autores (usuario)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('autores')
    app.delete(collection)
  },
)
