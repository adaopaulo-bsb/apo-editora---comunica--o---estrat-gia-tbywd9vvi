// Módulo: modelo de dados (Fase 2) — novas coleções.
// Coleções criadas:
// 1. metricas_obra (obra_id relation obras, arquivo_id relation arquivos, palavras, caracteres_com_espacos, laudas, paginas_estimadas, capitulos json, tem_imagens, tem_tabelas, tem_notas_rodape)
//    Nenhum campo de texto do manuscrito.
// 2. parametros_orcamento (chave unique, valor text, descricao text)
// 3. pedido_itens (pedido_id relation pedidos, servico_codigo text, quantidade number, preco_unitario_centavos number, subtotal_centavos number, prazo_min_dias_uteis number, prazo_max_dias_uteis number, nivel_servico text)
// 4. etapas (pedido_item_id relation pedido_itens, status select, iniciada_em date, prazo_prometido_em date, entregue_em date, editor_id relation users)
// 5. entregas (etapa_id relation etapas, arquivo_id relation arquivos, versao number, aprovada_pelo_autor_em date)
// 6. revisoes_humanas (raiox_id relation raio_x, etapa_id relation etapas, editor_id relation users, decisao select, nota text)
// 7. contatos_comerciais (obra_id relation obras, usuario_id relation users, tipo select, mensagem text, status select)

migrate(
  (app) => {
    const usersCol = app.findCollectionByNameOrId('_pb_users_auth_')
    const obrasCol = app.findCollectionByNameOrId('obras')
    const arquivosCol = app.findCollectionByNameOrId('arquivos')
    const pedidosCol = app.findCollectionByNameOrId('pedidos')
    const raioCol = app.findCollectionByNameOrId('raio_x')

    // 1. metricas_obra
    // Regras: autor vê/edita só as suas; editores e admin leem; create só backend (createRule nula).
    const metricas = new Collection({
      name: 'metricas_obra',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (obra_id.autor_id = @request.auth.id || obra_id.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      viewRule:
        "@request.auth.id != '' && (obra_id.autor_id = @request.auth.id || obra_id.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      createRule: null,
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'obra_id',
          type: 'relation',
          required: true,
          collectionId: obrasCol.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'arquivo_id',
          type: 'relation',
          collectionId: arquivosCol.id,
          maxSelect: 1,
        },
        { name: 'palavras', type: 'number', onlyInt: true, min: 0 },
        { name: 'caracteres_com_espacos', type: 'number', onlyInt: true, min: 0 },
        { name: 'laudas', type: 'number', min: 0 },
        { name: 'paginas_estimadas', type: 'number', onlyInt: true, min: 0 },
        { name: 'capitulos', type: 'json', maxSize: 200000 },
        { name: 'tem_imagens', type: 'bool' },
        { name: 'tem_tabelas', type: 'bool' },
        { name: 'tem_notas_rodape', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_metricas_obra_obra ON metricas_obra (obra_id)',
        'CREATE INDEX idx_metricas_obra_arquivo ON metricas_obra (arquivo_id)',
      ],
    })
    app.save(metricas)

    // 2. parametros_orcamento
    // Regras: só admin nas 5 operações
    const parametros = new Collection({
      name: 'parametros_orcamento',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        { name: 'chave', type: 'text', required: true, max: 100 },
        { name: 'valor', type: 'text', required: true, max: 255 },
        { name: 'descricao', type: 'text', max: 500 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_parametros_orcamento_chave ON parametros_orcamento (chave)',
      ],
    })
    app.save(parametros)

    // 3. pedido_itens
    // Regras: create só backend/admin; leitura do autor dono + editor/admin.
    const pedidoItens = new Collection({
      name: 'pedido_itens',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (pedido_id.obra.autor_id = @request.auth.id || pedido_id.obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      viewRule:
        "@request.auth.id != '' && (pedido_id.obra.autor_id = @request.auth.id || pedido_id.obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'pedido_id',
          type: 'relation',
          required: true,
          collectionId: pedidosCol.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        { name: 'servico_codigo', type: 'text', required: true, max: 100 },
        { name: 'quantidade', type: 'number', min: 0 },
        { name: 'preco_unitario_centavos', type: 'number', onlyInt: true, min: 0 },
        { name: 'subtotal_centavos', type: 'number', onlyInt: true, min: 0 },
        { name: 'prazo_min_dias_uteis', type: 'number', onlyInt: true, min: 0 },
        { name: 'prazo_max_dias_uteis', type: 'number', onlyInt: true, min: 0 },
        { name: 'nivel_servico', type: 'text', max: 50 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_pedido_itens_pedido ON pedido_itens (pedido_id)',
        'CREATE INDEX idx_pedido_itens_servico ON pedido_itens (servico_codigo)',
      ],
    })
    app.save(pedidoItens)

    // 4. etapas
    // Referencia pedido_itens (já criado).
    // Regras: create só backend/admin; leitura do autor dono + editor/admin.
    const etapas = new Collection({
      name: 'etapas',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (pedido_item_id.pedido_id.obra.autor_id = @request.auth.id || pedido_item_id.pedido_id.obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      viewRule:
        "@request.auth.id != '' && (pedido_item_id.pedido_id.obra.autor_id = @request.auth.id || pedido_item_id.pedido_id.obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'pedido_item_id',
          type: 'relation',
          required: true,
          collectionId: pedidoItens.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'em_andamento', 'revisao', 'concluida', 'bloqueada'],
          maxSelect: 1,
        },
        { name: 'iniciada_em', type: 'date' },
        { name: 'prazo_prometido_em', type: 'date' },
        { name: 'entregue_em', type: 'date' },
        {
          name: 'editor_id',
          type: 'relation',
          collectionId: usersCol.id,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_etapas_pedido_item ON etapas (pedido_item_id)',
        'CREATE INDEX idx_etapas_editor ON etapas (editor_id)',
      ],
    })
    app.save(etapas)

    // 5. entregas
    // Referencia etapas e arquivos.
    // Regras: create só backend/admin; leitura do autor dono + editor/admin.
    const entregas = new Collection({
      name: 'entregas',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (etapa_id.pedido_item_id.pedido_id.obra.autor_id = @request.auth.id || etapa_id.pedido_item_id.pedido_id.obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      viewRule:
        "@request.auth.id != '' && (etapa_id.pedido_item_id.pedido_id.obra.autor_id = @request.auth.id || etapa_id.pedido_item_id.pedido_id.obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      createRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
      updateRule:
        "@request.auth.id != '' && (etapa_id.pedido_item_id.pedido_id.obra.autor_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'etapa_id',
          type: 'relation',
          required: true,
          collectionId: etapas.id,
          maxSelect: 1,
          cascadeDelete: true,
        },
        {
          name: 'arquivo_id',
          type: 'relation',
          collectionId: arquivosCol.id,
          maxSelect: 1,
        },
        { name: 'versao', type: 'number', onlyInt: true, min: 1 },
        { name: 'aprovada_pelo_autor_em', type: 'date' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_entregas_etapa ON entregas (etapa_id)',
        'CREATE INDEX idx_entregas_arquivo ON entregas (arquivo_id)',
      ],
    })
    app.save(entregas)

    // 6. revisoes_humanas
    // raiox_id (opcional), etapa_id (opcional), editor_id, decisao (aprovado|ajustado|rejeitado), nota.
    // Regras: editor/admin leem e escrevem.
    const revisoes = new Collection({
      name: 'revisoes_humanas',
      type: 'base',
      listRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
      viewRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
      createRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'raiox_id',
          type: 'relation',
          collectionId: raioCol.id,
          maxSelect: 1,
        },
        {
          name: 'etapa_id',
          type: 'relation',
          collectionId: etapas.id,
          maxSelect: 1,
        },
        {
          name: 'editor_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          maxSelect: 1,
        },
        {
          name: 'decisao',
          type: 'select',
          required: true,
          values: ['aprovado', 'ajustado', 'rejeitado'],
          maxSelect: 1,
        },
        { name: 'nota', type: 'text', max: 5000 },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_revisoes_raiox ON revisoes_humanas (raiox_id)',
        'CREATE INDEX idx_revisoes_etapa ON revisoes_humanas (etapa_id)',
        'CREATE INDEX idx_revisoes_editor ON revisoes_humanas (editor_id)',
      ],
    })
    app.save(revisoes)

    // 7. contatos_comerciais
    // obra_id, usuario_id, tipo (parecer|falar_com_editor), mensagem, status.
    // Regras: editor/admin leem todos; autor cria seus próprios contatos_comerciais e lê os seus.
    const contatos = new Collection({
      name: 'contatos_comerciais',
      type: 'base',
      listRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      viewRule:
        "@request.auth.id != '' && (usuario_id = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')",
      createRule: "@request.auth.id != '' && usuario_id = @request.auth.id",
      updateRule: "@request.auth.role = 'admin' || @request.auth.role = 'editor'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'obra_id',
          type: 'relation',
          collectionId: obrasCol.id,
          maxSelect: 1,
        },
        {
          name: 'usuario_id',
          type: 'relation',
          required: true,
          collectionId: usersCol.id,
          maxSelect: 1,
        },
        {
          name: 'tipo',
          type: 'select',
          required: true,
          values: ['parecer', 'falar_com_editor', 'outro'],
          maxSelect: 1,
        },
        { name: 'mensagem', type: 'text', required: true, max: 4000 },
        {
          name: 'status',
          type: 'select',
          values: ['novo', 'em_atendimento', 'respondido', 'fechado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_contatos_obra ON contatos_comerciais (obra_id)',
        'CREATE INDEX idx_contatos_usuario ON contatos_comerciais (usuario_id)',
        'CREATE INDEX idx_contatos_status ON contatos_comerciais (status)',
      ],
    })
    app.save(contatos)
  },
  (app) => {
    ;[
      'contatos_comerciais',
      'revisoes_humanas',
      'entregas',
      'etapas',
      'pedido_itens',
      'parametros_orcamento',
      'metricas_obra',
    ].forEach((nome) => {
      try {
        const col = app.findCollectionByNameOrId(nome)
        app.delete(col)
      } catch (_) {}
    })
  },
)
