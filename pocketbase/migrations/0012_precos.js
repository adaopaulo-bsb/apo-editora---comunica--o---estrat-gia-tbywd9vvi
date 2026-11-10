// Módulo: precos — estrutura de serviços por camada e itens de preço.
// REGRA PERMANENTE: preços e prazos NUNCA ficam no código — só aqui,
// editáveis por admin. A IA nunca calcula preço nem prazo.
// Camada 0 (Raio-X) é gratuita por definição do produto.
migrate(
  (app) => {
    const collection = new Collection({
      name: 'servicos',
      type: 'base',
      // Leitura pública (a página de serviços mostra preços); escrita só admin.
      listRule: '',
      viewRule: '',
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        // Camada: 1 parecer, 2 preparacao, 3 projeto_grafico, 4 producao, 5 posicionamento
        { name: 'camada', type: 'number', required: true, onlyInt: true, min: 1, max: 5 },
        { name: 'nome', type: 'text', required: true, min: 2, max: 200 },
        { name: 'descricao', type: 'text', max: 2000 },
        // Unidade de cobrança (ex.: "lauda_1800", "obra", "hora")
        {
          name: 'unidade',
          type: 'select',
          required: true,
          values: ['obra', 'lauda_1800', 'pagina', 'hora', 'pacote'],
          maxSelect: 1,
        },
        // Preço em centavos (R$ com vírgula é formatação do front)
        { name: 'preco_centavos', type: 'number', onlyInt: true, min: 0 },
        // Prazo estimado em dias úteis
        { name: 'prazo_dias_uteis', type: 'number', onlyInt: true, min: 0 },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_servicos_camada_ativo ON servicos (camada, ativo)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('servicos')
    app.delete(collection)
  },
)
