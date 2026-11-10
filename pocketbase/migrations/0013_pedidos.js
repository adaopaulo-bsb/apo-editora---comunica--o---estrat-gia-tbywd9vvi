// Módulo: pedidos — pedidos de serviços por obra (camadas 1 a 5; camada 0,
// Raio-X, é gratuita e não gera pedido). Preços são copiados do serviço no
// momento do pedido (histórico não muda quando a tabela de preços muda).
migrate(
  (app) => {
    const obras = app.findCollectionByNameOrId('obras')
    const servicos = app.findCollectionByNameOrId('servicos')

    const collection = new Collection({
      name: 'pedidos',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (obra.autor = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      viewRule:
        "@request.auth.id != '' && (obra.autor = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      createRule:
        "@request.auth.id != '' && obra.autor = @request.auth.id && @request.auth.role != 'admin' && @request.auth.role != 'editor'",
      updateRule:
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.role = 'editor')",
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
        {
          name: 'servico',
          type: 'relation',
          required: true,
          collectionId: servicos.id,
          maxSelect: 1,
        },
        // Estado do pedido (pagamento real entra em fase futura)
        {
          name: 'estado',
          type: 'select',
          required: false,
          values: ['orcado', 'aprovado', 'em_andamento', 'concluido', 'cancelado'],
          maxSelect: 1,
        },
        // Copia do preço no momento do pedido (centavos)
        { name: 'preco_centavos', type: 'number', onlyInt: true, min: 0 },
        { name: 'prazo_dias_uteis', type: 'number', onlyInt: true, min: 0 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_pedidos_obra_created ON pedidos (obra, created DESC)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('pedidos')
    app.delete(collection)
  },
)
