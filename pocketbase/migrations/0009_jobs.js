// Módulo: pedidos/jobs — fila de trabalhos assíncronos processados por etapas
// curtas pelo agendador (cron nativo). Usado nas Fases 4 e 5.
// Criada DEPOIS de "obras" (0008), pois referencia a coleção.
migrate(
  (app) => {
    const obras = app.findCollectionByNameOrId('obras')

    const collection = new Collection({
      name: 'jobs',
      type: 'base',
      // O processamento é feito server-side (superuser). Autores/editores só
      // consultam os jobs das próprias obras.
      listRule: "@request.auth.id != '' && obra.autor = @request.auth.id",
      viewRule: "@request.auth.id != '' && obra.autor = @request.auth.id",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'obra', type: 'relation', required: true, collectionId: obras.id, maxSelect: 1 },
        // Tipo do trabalho (ex.: teste, raio_x, parecer)
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: [
            'teste',
            'raio_x',
            'parecer',
            'preparacao',
            'projeto_grafico',
            'producao',
            'posicionamento',
          ],
          maxSelect: 1,
        },
        // Estado da máquina de estados
        {
          name: 'estado',
          type: 'select',
          required: false,
          values: ['pendente', 'executando', 'concluido', 'erro'],
          maxSelect: 1,
        },
        { name: 'tentativas', type: 'number', onlyInt: true, min: 0 },
        { name: 'erro', type: 'text', max: 2000 },
        { name: 'iniciado_em', type: 'date' },
        { name: 'finalizado_em', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_jobs_obra_estado ON jobs (obra, estado)',
        'CREATE INDEX idx_jobs_estado_tentativas ON jobs (estado, tentativas)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('jobs')
    app.delete(collection)
  },
)
