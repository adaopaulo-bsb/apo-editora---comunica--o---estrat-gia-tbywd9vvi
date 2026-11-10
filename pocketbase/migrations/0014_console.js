// Módulo: console — designação de editores a obras e equipe da APO.
// O "console" do editor/admin é uma tela do front (fase futura); aqui ficam
// os dados que ela consome.
migrate(
  (app) => {
    const obras = app.findCollectionByNameOrId('obras')

    const collection = new Collection({
      name: 'designacoes',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (editor = @request.auth.id || obra.autor = @request.auth.id || @request.auth.role = 'admin')",
      viewRule:
        "@request.auth.id != '' && (editor = @request.auth.id || obra.autor = @request.auth.id || @request.auth.role = 'admin')",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'obra',
          type: 'relation',
          required: true,
          collectionId: obras.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'editor',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        // Papel do membro nesta obra (ex.: "editor_principal", "revisor")
        { name: 'papel', type: 'text', required: true, min: 2, max: 100 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_designacoes_obra_editor_papel ON designacoes (obra, editor, papel)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('designacoes')
    app.delete(collection)
  },
)
