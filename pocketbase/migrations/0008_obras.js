// Módulo: obras — manuscrito e metadados da obra.
// REGRA: manuscrito é privado; só o autor e editores designados acessam.
// Conteúdo de manuscrito NUNCA vai para logs.
migrate(
  (app) => {
    const collection = new Collection({
      name: 'obras',
      type: 'base',
      // Autor vê as próprias; editor/admin veem todas (designação de editor
      // específico por obra entra em fase futura).
      listRule:
        "@request.auth.id != '' && (autor = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      viewRule:
        "@request.auth.id != '' && (autor = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      createRule:
        "@request.auth.id != '' && autor = @request.auth.id && @request.auth.role != 'admin' && @request.auth.role != 'editor'",
      updateRule:
        "@request.auth.id != '' && (autor = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      deleteRule:
        "@request.auth.id != '' && (autor = @request.auth.id || @request.auth.role = 'admin')",
      fields: [
        {
          name: 'autor',
          type: 'relation',
          required: true,
          collectionId: app.findCollectionByNameOrId('autores').id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'titulo', type: 'text', required: true, min: 1, max: 300 },
        { name: 'subtitulo', type: 'text', max: 300 },
        // Genero: campo aberto de preenchimento livre nesta fase
        { name: 'genero', type: 'text', max: 100 },
        { name: 'sinopse', type: 'text', max: 4000 },
        { name: 'palavras', type: 'number', onlyInt: true, min: 0 },
        // Estado do fluxo da obra
        {
          name: 'estado',
          type: 'select',
          required: false,
          values: [
            'rascunho',
            'questionario',
            'raio_x',
            'parecer',
            'preparacao',
            'projeto_grafico',
            'producao',
            'posicionamento',
            'concluida',
          ],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_obras_autor_created ON obras (autor, created DESC)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('obras')
    app.delete(collection)
  },
)
