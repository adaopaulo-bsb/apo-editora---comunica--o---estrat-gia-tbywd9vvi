// Módulo: questionario — respostas do questionário do autor sobre a obra.
migrate(
  (app) => {
    const obras = app.findCollectionByNameOrId('obras')

    const collection = new Collection({
      name: 'questionarios',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (obra.autor = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      viewRule:
        "@request.auth.id != '' && (obra.autor = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      createRule: "@request.auth.id != '' && obra.autor = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && (obra.autor = @request.auth.id || @request.auth.role = 'editor' || @request.auth.role = 'admin')",
      deleteRule:
        "@request.auth.id != '' && (obra.autor = @request.auth.id || @request.auth.role = 'admin')",
      fields: [
        {
          name: 'obra',
          type: 'relation',
          required: true,
          collectionId: obras.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        // Respostas do questionário (estrutura definida em fase futura)
        { name: 'respostas', type: 'json', maxSize: 200000 },
        // Versão do questionário aplicado
        { name: 'versao', type: 'text', max: 20 },
        { name: 'concluido', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_questionarios_obra ON questionarios (obra)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('questionarios')
    app.delete(collection)
  },
)
