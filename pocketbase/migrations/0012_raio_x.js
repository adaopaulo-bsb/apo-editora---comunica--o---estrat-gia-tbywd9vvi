// Módulo: raiox — resultado do "Raio-X da obra" (análise automática prévia).
// O rótulo obrigatório "análise automática prévia" é apresentado pelo front;
// aqui guardamos a análise gerada (simulada na fase de teste).
migrate(
  (app) => {
    const obras = app.findCollectionByNameOrId('obras')

    const collection = new Collection({
      name: 'raio_x',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (obra.autor = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      viewRule:
        "@request.auth.id != '' && (obra.autor = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      createRule: null, // criado apenas pelo backend (job de análise)
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'obra',
          type: 'relation',
          required: true,
          collectionId: obras.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'versao', type: 'text', max: 20 },
        // Resultado estruturado da análise (seções, resumo etc.)
        { name: 'resultado', type: 'json', maxSize: 500000 },
        // "simulado" | "ia" — origem da análise
        {
          name: 'origem',
          type: 'select',
          required: false,
          values: ['simulado', 'ia'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_raio_x_obra ON raio_x (obra, created DESC)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('raio_x')
    app.delete(collection)
  },
)
