// Módulo: tabela_precos e tabela_prazos — histórico por vigência.
// REGRA PERMANENTE: preços e prazos NUNCA ficam no código — só aqui,
// editáveis por admin. A IA nunca calcula preço nem prazo.
// vigente_ate vazio = vigência aberta. Leitura/escrita só admin.
migrate(
  (app) => {
    const collection = new Collection({
      name: 'tabela_precos',
      type: 'base',
      // Acesso exclusivo de admin (nenhum acesso anônimo ou de autor/editor).
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        // Código do serviço (mesmo código da coleção servicos)
        { name: 'servico_codigo', type: 'text', required: true, min: 1, max: 100 },
        // Unidade de cobrança
        {
          name: 'unidade',
          type: 'select',
          required: true,
          values: ['lauda', 'pagina', 'fixo', 'exemplar'],
          maxSelect: 1,
        },
        // Preço em centavos (R$ com vírgula é formatação do front)
        { name: 'preco_min_centavos', type: 'number', required: false, onlyInt: true, min: 0 },
        { name: 'preco_max_centavos', type: 'number', required: false, onlyInt: true, min: 0 },
        // Vigência: vigente_ate vazio = vigência aberta
        { name: 'vigente_de', type: 'date', required: true },
        { name: 'vigente_ate', type: 'date' },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_tabela_precos_servico_vigencia ON tabela_precos (servico_codigo, vigente_de)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('tabela_precos')
    app.delete(collection)
  },
)
