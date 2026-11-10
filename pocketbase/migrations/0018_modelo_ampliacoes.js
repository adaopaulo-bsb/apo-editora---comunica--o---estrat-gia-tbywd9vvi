// Módulo: modelo de dados (Fase 2) — ampliações de coleções existentes.
// users: telefone, aceite_termos_versao, aceite_termos_em, ativo (bool opcional).
// obras: autor_id (relação direta com users), preferencia_atendimento, objetivo, formato, exclusao_logica.
// arquivos: hash, versao, enviado_em, excluir_em, tamanho_bytes, caminho_privado, nome_original.
// raio_x: campos próprios nota_prontidao, faixa_prontidao, faixa_preco_min, faixa_preco_max,
//         faixa_prazo_min_dias, faixa_prazo_max_dias, status.
// pedidos: status, total_min_centavos, total_max_centavos, total_firme_centavos,
//          abatimento_parecer_centavos, validade_ate (além de compatibilidade com total_min etc.).
// servicos: codigo (text), ajuste nas unidades permitidas se necessário.
// auditoria: entidade, entidade_id, antes (json), depois (json), ip.
// NENHUM campo de CPF. NENHUM campo guarda texto de manuscrito.

migrate(
  (app) => {
    const garantir = (col, nome, fabrica) => {
      if (!col.fields.getByName(nome)) col.fields.add(fabrica())
    }

    // 1. users: telefone, aceite_termos_versao, aceite_termos_em, ativo
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    garantir(users, 'telefone', () => new TextField({ name: 'telefone', max: 30 }))
    garantir(
      users,
      'aceite_termos_versao',
      () => new TextField({ name: 'aceite_termos_versao', max: 20 }),
    )
    garantir(users, 'aceite_termos_em', () => new DateField({ name: 'aceite_termos_em' }))
    // 'ativo' é bool opcional (nunca required pois false seria rejeitado)
    garantir(users, 'ativo', () => new BoolField({ name: 'ativo' }))
    app.save(users)

    // 2. obras: autor_id relation users, preferencia_atendimento, objetivo, formato, exclusao_logica
    const obras = app.findCollectionByNameOrId('obras')
    const perfil = obras.fields.getByName('autor')
    if (perfil) perfil.required = false
    garantir(
      obras,
      'autor_id',
      () =>
        new RelationField({
          name: 'autor_id',
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        }),
    )
    garantir(obras, 'exclusao_logica', () => new BoolField({ name: 'exclusao_logica' }))
    garantir(
      obras,
      'objetivo',
      () =>
        new SelectField({
          name: 'objetivo',
          values: ['publicar_vender', 'familia_amigos', 'submeter_editora'],
          maxSelect: 1,
        }),
    )
    garantir(
      obras,
      'formato',
      () =>
        new SelectField({
          name: 'formato',
          values: ['impresso_ebook', 'so_impresso', 'so_ebook'],
          maxSelect: 1,
        }),
    )
    garantir(
      obras,
      'preferencia_atendimento',
      () =>
        new SelectField({
          name: 'preferencia_atendimento',
          values: ['humano_ia', 'so_humano'],
          maxSelect: 1,
        }),
    )
    garantir(
      obras,
      'status',
      () =>
        new SelectField({
          name: 'status',
          values: ['rascunho', 'em_andamento', 'concluida', 'arquivada'],
          maxSelect: 1,
        }),
    )
    // Atualizar regras de obras para usar autor_id ou autor
    obras.listRule =
      "@request.auth.id != '' && (autor_id = @request.auth.id || autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    obras.viewRule =
      "@request.auth.id != '' && (autor_id = @request.auth.id || autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    obras.createRule = "@request.auth.id != ''"
    obras.updateRule =
      "@request.auth.id != '' && (autor_id = @request.auth.id || autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    obras.deleteRule =
      "@request.auth.id != '' && (autor_id = @request.auth.id || autor.usuario = @request.auth.id || @request.auth.role = 'admin')"
    app.save(obras)

    // Backfill autor_id a partir de autores caso haja registros existentes
    app
      .db()
      .newQuery(
        "UPDATE obras SET autor_id = (SELECT a.usuario FROM autores a WHERE a.id = obras.autor) WHERE (autor_id IS NULL OR autor_id = '') AND autor IS NOT NULL AND autor != ''",
      )
      .execute()

    // 3. arquivos: hash, versao, enviado_em, excluir_em, caminho_privado, tamanho_bytes, nome_original
    const arquivos = app.findCollectionByNameOrId('arquivos')
    garantir(arquivos, 'nome_original', () => new TextField({ name: 'nome_original', max: 255 }))
    garantir(
      arquivos,
      'tamanho_bytes',
      () => new NumberField({ name: 'tamanho_bytes', onlyInt: true, min: 0 }),
    )
    garantir(
      arquivos,
      'caminho_privado',
      () => new TextField({ name: 'caminho_privado', max: 500 }),
    )
    garantir(arquivos, 'hash', () => new TextField({ name: 'hash', max: 128 }))
    garantir(arquivos, 'versao', () => new NumberField({ name: 'versao', onlyInt: true, min: 1 }))
    garantir(arquivos, 'enviado_em', () => new DateField({ name: 'enviado_em' }))
    garantir(arquivos, 'excluir_em', () => new DateField({ name: 'excluir_em' }))
    const arquivoBinario = arquivos.fields.getByName('arquivo')
    if (arquivoBinario) arquivoBinario.protected = true
    // Regras de arquivos
    arquivos.listRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    arquivos.viewRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    arquivos.createRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    arquivos.updateRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin')"
    arquivos.deleteRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin')"
    app.save(arquivos)

    // 4. questionarios (já é questionario_respostas do modelo)
    const questionarios = app.findCollectionByNameOrId('questionarios')
    questionarios.listRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    questionarios.viewRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    questionarios.createRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin')"
    questionarios.updateRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    questionarios.deleteRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin')"
    app.save(questionarios)

    // 5. raio_x: nota_prontidao, faixa_prontidao, faixa_preco_min, faixa_preco_max,
    //           faixa_prazo_min_dias, faixa_prazo_max_dias, status
    const raio = app.findCollectionByNameOrId('raio_x')
    garantir(
      raio,
      'nota_prontidao',
      () => new NumberField({ name: 'nota_prontidao', min: 0, max: 100 }),
    )
    garantir(raio, 'faixa_prontidao', () => new TextField({ name: 'faixa_prontidao', max: 50 }))
    garantir(
      raio,
      'faixa_preco_min',
      () => new NumberField({ name: 'faixa_preco_min', onlyInt: true, min: 0 }),
    )
    garantir(
      raio,
      'faixa_preco_max',
      () => new NumberField({ name: 'faixa_preco_max', onlyInt: true, min: 0 }),
    )
    garantir(
      raio,
      'faixa_prazo_min_dias',
      () => new NumberField({ name: 'faixa_prazo_min_dias', onlyInt: true, min: 0 }),
    )
    garantir(
      raio,
      'faixa_prazo_max_dias',
      () => new NumberField({ name: 'faixa_prazo_max_dias', onlyInt: true, min: 0 }),
    )
    garantir(
      raio,
      'status',
      () =>
        new SelectField({
          name: 'status',
          values: ['gerando', 'pronto', 'falhou'],
          maxSelect: 1,
        }),
    )
    // createRule nula (só backend/superusuário gera raio-x)
    raio.createRule = null
    raio.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'editor'"
    raio.deleteRule = "@request.auth.role = 'admin'"
    raio.listRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    raio.viewRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    app.save(raio)

    // 6. pedidos: status, total_min_centavos, total_max_centavos, total_firme_centavos,
    //            abatimento_parecer_centavos, validade_ate
    const pedidos = app.findCollectionByNameOrId('pedidos')
    garantir(
      pedidos,
      'status',
      () =>
        new SelectField({
          name: 'status',
          values: [
            'rascunho',
            'orcamento_enviado',
            'aceito',
            'pago',
            'em_execucao',
            'entregue',
            'cancelado',
          ],
          maxSelect: 1,
        }),
    )
    garantir(
      pedidos,
      'total_min_centavos',
      () => new NumberField({ name: 'total_min_centavos', onlyInt: true, min: 0 }),
    )
    garantir(
      pedidos,
      'total_max_centavos',
      () => new NumberField({ name: 'total_max_centavos', onlyInt: true, min: 0 }),
    )
    garantir(
      pedidos,
      'total_firme_centavos',
      () => new NumberField({ name: 'total_firme_centavos', onlyInt: true, min: 0 }),
    )
    garantir(
      pedidos,
      'abatimento_parecer_centavos',
      () => new NumberField({ name: 'abatimento_parecer_centavos', onlyInt: true, min: 0 }),
    )
    garantir(pedidos, 'validade_ate', () => new DateField({ name: 'validade_ate' }))
    // create só backend/admin
    pedidos.createRule = "@request.auth.role = 'admin'"
    pedidos.updateRule = "@request.auth.role = 'admin' || @request.auth.role = 'editor'"
    pedidos.listRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    pedidos.viewRule =
      "@request.auth.id != '' && (obra.autor_id = @request.auth.id || obra.autor.usuario = @request.auth.id || @request.auth.role = 'admin' || @request.auth.role = 'editor')"
    app.save(pedidos)

    // 7. servicos: codigo text e ampliação de unidade se necessário
    const servicos = app.findCollectionByNameOrId('servicos')
    garantir(servicos, 'codigo', () => new TextField({ name: 'codigo', max: 100 }))
    const unidade = servicos.fields.getByName('unidade')
    if (unidade) {
      unidade.values = [
        'obra',
        'lauda_1800',
        'lauda',
        'pagina',
        'hora',
        'pacote',
        'fixo',
        'exemplar',
      ]
    }
    servicos.addIndex('idx_servicos_codigo', true, 'codigo', "codigo != ''")
    // Leitura pública dos ativos, edição só admin
    servicos.listRule = 'ativo = true || @request.auth.role = "admin"'
    servicos.viewRule = 'ativo = true || @request.auth.role = "admin"'
    servicos.createRule = "@request.auth.role = 'admin'"
    servicos.updateRule = "@request.auth.role = 'admin'"
    servicos.deleteRule = "@request.auth.role = 'admin'"
    app.save(servicos)

    // 8. auditoria: entidade, entidade_id, antes (json), depois (json), ip
    const auditoria = app.findCollectionByNameOrId('auditoria')
    garantir(auditoria, 'entidade', () => new TextField({ name: 'entidade', max: 100 }))
    garantir(auditoria, 'entidade_id', () => new TextField({ name: 'entidade_id', max: 50 }))
    garantir(auditoria, 'antes', () => new JSONField({ name: 'antes', maxSize: 200000 }))
    garantir(auditoria, 'depois', () => new JSONField({ name: 'depois', maxSize: 200000 }))
    garantir(auditoria, 'ip', () => new TextField({ name: 'ip', max: 64 }))
    app.save(auditoria)
  },
  (app) => {
    const remover = (col, nome) => {
      if (col.fields.getByName(nome)) col.fields.removeByName(nome)
    }

    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    ;['telefone', 'aceite_termos_versao', 'aceite_termos_em', 'ativo'].forEach((n) =>
      remover(users, n),
    )
    app.save(users)

    const raio = app.findCollectionByNameOrId('raio_x')
    ;[
      'nota_prontidao',
      'faixa_prontidao',
      'faixa_preco_min',
      'faixa_preco_max',
      'faixa_prazo_min_dias',
      'faixa_prazo_max_dias',
      'status',
    ].forEach((n) => remover(raio, n))
    app.save(raio)

    const obras = app.findCollectionByNameOrId('obras')
    ;[
      'autor_id',
      'exclusao_logica',
      'objetivo',
      'formato',
      'preferencia_atendimento',
      'status',
    ].forEach((n) => remover(obras, n))
    app.save(obras)

    const arquivos = app.findCollectionByNameOrId('arquivos')
    ;[
      'nome_original',
      'tamanho_bytes',
      'caminho_privado',
      'hash',
      'versao',
      'enviado_em',
      'excluir_em',
    ].forEach((n) => remover(arquivos, n))
    app.save(arquivos)

    const pedidos = app.findCollectionByNameOrId('pedidos')
    ;[
      'status',
      'total_min_centavos',
      'total_max_centavos',
      'total_firme_centavos',
      'abatimento_parecer_centavos',
      'validade_ate',
    ].forEach((n) => remover(pedidos, n))
    app.save(pedidos)

    const servicos = app.findCollectionByNameOrId('servicos')
    remover(servicos, 'codigo')
    servicos.removeIndex('idx_servicos_codigo')
    app.save(servicos)

    const auditoria = app.findCollectionByNameOrId('auditoria')
    ;['entidade', 'entidade_id', 'antes', 'depois', 'ip'].forEach((n) => remover(auditoria, n))
    app.save(auditoria)
  },
)
