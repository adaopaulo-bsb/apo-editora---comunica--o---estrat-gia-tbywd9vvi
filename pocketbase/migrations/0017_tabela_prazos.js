// Módulo: tabela_prazos — histórico por vigência de prazos fora do catálogo.
// REGRA PERMANENTE: preços e prazos NUNCA ficam no código — só aqui,
// editáveis por admin. A IA nunca calcula preço nem prazo.
// vigente_ate vazio = vigência aberta. Leitura/escrita só admin.
migrate(
  (app) => {
    const collection = new Collection({
      name: 'tabela_prazos',
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
        // Prazo em dias úteis
        { name: 'prazo_min_dias_uteis', type: 'number', required: false, onlyInt: true, min: 0 },
        { name: 'prazo_max_dias_uteis', type: 'number', required: false, onlyInt: true, min: 0 },
        // Vigência: vigente_ate vazio = vigência aberta
        { name: 'vigente_de', type: 'date', required: true },
        { name: 'vigente_ate', type: 'date' },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_tabela_prazos_servico_vigencia ON tabela_prazos (servico_codigo, vigente_de)',
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('tabela_prazos')
    app.delete(collection)
  },
)
