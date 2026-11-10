// Módulo: arquivos — arquivos enviados (manuscrito, anexos).
// O arquivo em si é privado: acesso só pelo autor da obra e editores/admin.
migrate(
  (app) => {
    const obras = app.findCollectionByNameOrId('obras')

    const collection = new Collection({
      name: 'arquivos',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (obra.autor = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      viewRule:
        "@request.auth.id != '' && (obra.autor = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      createRule: "@request.auth.id != '' && obra.autor = @request.auth.id",
      updateRule:
        "@request.auth.id != '' && (obra.autor = @request.auth.id || @request.auth.role = 'admin')",
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
        // Tipo de arquivo (manuscrito, anexo, capa...)
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['manuscrito', 'anexo', 'capa', 'outro'],
          maxSelect: 1,
        },
        {
          name: 'arquivo',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 26214400,
          mimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/rtf',
            'text/plain',
            'application/epub+zip',
          ],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_arquivos_obra ON arquivos (obra, tipo)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('arquivos')
    app.delete(collection)
  },
)
