// Módulo: config — configurações centrais do app (editáveis só por admin).
// Valores de preço/prazo NÃO ficam aqui nem no código: virão de tabelas
// editáveis em fases futuras.
migrate(
  (app) => {
    const collection = new Collection({
      name: 'config',
      type: 'base',
      // Somente superusuários/admin acessam pela API pública:
      // listRule/viewRule liberam leitura para autenticados (o front precisa ler
      // limites), escrita apenas para usuários com role admin.
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        // Chave única de configuração (ex.: "limite_arquivo_mb")
        { name: 'chave', type: 'text', required: true, min: 2, max: 100 },
        // Valor em texto (números/datas são convertidos por quem consome)
        { name: 'valor', type: 'text', required: true, max: 2000 },
        // Descrição legível em pt-BR
        { name: 'descricao', type: 'text', max: 500 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_config_chave ON config (chave)'],
    })
    app.save(collection)

    // Seed idempotente dos valores iniciais pedidos nesta fase.
    const seeds = [
      {
        chave: 'limite_tamanho_arquivo_mb',
        valor: '25',
        descricao: 'Tamanho máximo de arquivo enviado (MB).',
      },
      {
        chave: 'limite_palavras_por_obra',
        valor: '200000',
        descricao: 'Número máximo de palavras por obra.',
      },
      {
        chave: 'retencao_arquivos_dias',
        valor: '90',
        descricao: 'Dias de retenção de arquivos após a última atividade.',
      },
      {
        chave: 'gasto_maximo_diario_ia',
        valor: '10.00',
        descricao: 'Gasto máximo diário com IA (R$), usado quando a IA real for ativada.',
      },
      {
        chave: 'ia_simulada',
        valor: 'true',
        descricao: 'Modo de simulação da IA (true = simulado). Padrão true no ambiente de teste.',
      },
    ]
    for (const item of seeds) {
      const existentes = app.findRecordsByFilter('config', "chave = '" + item.chave + "'", '', 1, 0)
      if (existentes.length > 0) continue
      const record = new Record(collection)
      record.set('chave', item.chave)
      record.set('valor', item.valor)
      record.set('descricao', item.descricao)
      app.save(record)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('config')
    app.delete(collection)
  },
)
