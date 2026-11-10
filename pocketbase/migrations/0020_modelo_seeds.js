// Módulo: modelo de dados (Fase 2) — Seeds de catálogo de serviços, tabela de preços, prazos e parâmetros de orçamento.
// Idempotente: atualiza se já existir ou insere se faltar.
// Campo 'ativo' SEMPRE explicitamente true (a coluna ativo quando ausente vale false).
// Valores monetários sempre em centavos inteiros.
// vigente_de preenchido com a data de hoje (YYYY-MM-DD), vigente_ate vazio.

migrate(
  (app) => {
    const hoje = new Date().toISOString().split('T')[0] // 'YYYY-MM-DD'

    // 1. Catálogo servicos (11 itens)
    // Códigos e mapeamentos de camada e unidade:
    // camada 1 = parecer (fixo)
    // camada 2 = preparação (lauda)
    // camada 3 = diagramação (pagina) / capa (fixo)
    // camada 4 = isbn/impressão (isbn: fixo; impressao: exemplar)
    // camada 5 = posicionamento (fixo)
    const servicosCatalogo = [
      {
        codigo: 'parecer_ate_60k',
        nome: 'Parecer Editorial (até 60 mil palavras)',
        camada: 1,
        unidade: 'fixo',
        descricao:
          'hipótese inicial: avaliação diagnóstica de prontidão editorial para originais de até 60.000 palavras.',
        preco_centavos: 37000,
        prazo_dias_uteis: 5,
        ativo: true,
      },
      {
        codigo: 'parecer_60k_120k',
        nome: 'Parecer Editorial (60 mil a 120 mil palavras)',
        camada: 1,
        unidade: 'fixo',
        descricao:
          'hipótese inicial: avaliação diagnóstica de prontidão editorial para obras médias de 60.000 a 120.000 palavras.',
        preco_centavos: 57000,
        prazo_dias_uteis: 5,
        ativo: true,
      },
      {
        codigo: 'parecer_acima_120k',
        nome: 'Parecer Editorial (acima de 120 mil palavras)',
        camada: 1,
        unidade: 'fixo',
        descricao:
          'hipótese inicial: avaliação diagnóstica de prontidão editorial para obras extensas com mais de 120.000 palavras.',
        preco_centavos: 79000,
        prazo_dias_uteis: 5,
        ativo: true,
      },
      {
        codigo: 'preparacao_nivel_1',
        nome: 'Preparação de Texto - Nível 1 (Leve)',
        camada: 2,
        unidade: 'lauda',
        descricao:
          'hipótese inicial: revisão gramatical e ortográfica em texto já consistente e pronto.',
        preco_centavos: 1250,
        prazo_dias_uteis: 10,
        ativo: true,
      },
      {
        codigo: 'preparacao_nivel_2',
        nome: 'Preparação de Texto - Nível 2 (Média)',
        camada: 2,
        unidade: 'lauda',
        descricao:
          'hipótese inicial: padronização de estilo, clareza, coesão textual e ajuste sintático moderado.',
        preco_centavos: 1850,
        prazo_dias_uteis: 12,
        ativo: true,
      },
      {
        codigo: 'preparacao_nivel_3',
        nome: 'Preparação de Texto - Nível 3 (Intensa)',
        camada: 2,
        unidade: 'lauda',
        descricao:
          'hipótese inicial: intervenção profunda na estrutura dos períodos, voz e vocabulário.',
        preco_centavos: 3250,
        prazo_dias_uteis: 15,
        ativo: true,
      },
      {
        codigo: 'diagramacao',
        nome: 'Projeto Gráfico e Diagramação',
        camada: 3,
        unidade: 'pagina',
        descricao:
          'hipótese inicial: composição tipográfica de miolo para livro impresso e versão digital.',
        preco_centavos: 900,
        prazo_dias_uteis: 15,
        ativo: true,
      },
      {
        codigo: 'capa',
        nome: 'Design de Capa',
        camada: 3,
        unidade: 'fixo',
        descricao:
          'hipótese inicial: criação conceitual de capa completa (frente, lombada, quarta capa e orelhas).',
        preco_centavos: 120000,
        prazo_dias_uteis: 15,
        ativo: true,
      },
      {
        codigo: 'isbn_ficha',
        nome: 'ISBN e Ficha Catalográfica',
        camada: 4,
        unidade: 'fixo',
        descricao:
          'hipótese inicial: registro na Câmara Brasileira do Livro (CBL), código de barras e catalogação oficial.',
        preco_centavos: 10500,
        prazo_dias_uteis: 5,
        ativo: true,
      },
      {
        codigo: 'impressao',
        nome: 'Gestão de Impressão (Gráfica)',
        camada: 4,
        unidade: 'exemplar',
        descricao:
          'hipótese inicial: repasse com margem 15–25%, os percentuais ficam em parametros_orcamento.',
        preco_centavos: 0,
        prazo_dias_uteis: 15,
        ativo: true,
      },
      {
        codigo: 'posicionamento_lancamento',
        nome: 'Posicionamento e Estratégia de Lançamento',
        camada: 5,
        unidade: 'fixo',
        descricao:
          'hipótese inicial: pacote a definir com planejamento de lançamento e distribuição.',
        preco_centavos: 0,
        prazo_dias_uteis: 8,
        ativo: true,
      },
    ]

    const servicosCol = app.findCollectionByNameOrId('servicos')
    servicosCatalogo.forEach((item) => {
      let rec = null
      try {
        rec = app.findFirstRecordByFilter('servicos', "codigo = '" + item.codigo + "'")
      } catch (_) {}
      if (!rec) {
        rec = new Record(servicosCol)
      }
      rec.set('codigo', item.codigo)
      rec.set('nome', item.nome)
      rec.set('camada', item.camada)
      rec.set('unidade', item.unidade)
      rec.set('descricao', item.descricao)
      rec.set('preco_centavos', item.preco_centavos)
      rec.set('prazo_dias_uteis', item.prazo_dias_uteis)
      rec.set('ativo', true)
      app.save(rec)
    })

    // 2. tabela_precos (em CENTAVOS inteiros, vigente_de = hoje, ativo = true)
    // parecer_ate_60k: 29000–45000 (fixo)
    // parecer_60k_120k: 45000–69000 (fixo)
    // parecer_acima_120k: 69000–89000 (fixo)
    // preparacao_nivel_1: 900–1600 (lauda)
    // preparacao_nivel_2: 1200–2500 (lauda)
    // preparacao_nivel_3: 2500–4000 (lauda)
    // diagramacao: 600–1200 (pagina)
    // capa: 60000–180000 (fixo)
    // isbn_ficha: 6000–15000 (fixo)
    // impressao: 0–0 (exemplar)
    // posicionamento_lancamento: 0–0 (fixo)
    const faixasPrecos = [
      {
        servico_codigo: 'parecer_ate_60k',
        unidade: 'fixo',
        preco_min_centavos: 29000,
        preco_max_centavos: 45000,
      },
      {
        servico_codigo: 'parecer_60k_120k',
        unidade: 'fixo',
        preco_min_centavos: 45000,
        preco_max_centavos: 69000,
      },
      {
        servico_codigo: 'parecer_acima_120k',
        unidade: 'fixo',
        preco_min_centavos: 69000,
        preco_max_centavos: 89000,
      },
      {
        servico_codigo: 'preparacao_nivel_1',
        unidade: 'lauda',
        preco_min_centavos: 900,
        preco_max_centavos: 1600,
      },
      {
        servico_codigo: 'preparacao_nivel_2',
        unidade: 'lauda',
        preco_min_centavos: 1200,
        preco_max_centavos: 2500,
      },
      {
        servico_codigo: 'preparacao_nivel_3',
        unidade: 'lauda',
        preco_min_centavos: 2500,
        preco_max_centavos: 4000,
      },
      {
        servico_codigo: 'diagramacao',
        unidade: 'pagina',
        preco_min_centavos: 600,
        preco_max_centavos: 1200,
      },
      {
        servico_codigo: 'capa',
        unidade: 'fixo',
        preco_min_centavos: 60000,
        preco_max_centavos: 180000,
      },
      {
        servico_codigo: 'isbn_ficha',
        unidade: 'fixo',
        preco_min_centavos: 6000,
        preco_max_centavos: 15000,
      },
      {
        servico_codigo: 'impressao',
        unidade: 'exemplar',
        preco_min_centavos: 0,
        preco_max_centavos: 0,
      },
      {
        servico_codigo: 'posicionamento_lancamento',
        unidade: 'fixo',
        preco_min_centavos: 0,
        preco_max_centavos: 0,
      },
    ]

    const tabelaPrecosCol = app.findCollectionByNameOrId('tabela_precos')
    faixasPrecos.forEach((item) => {
      let rec = null
      try {
        rec = app.findFirstRecordByFilter(
          'tabela_precos',
          "servico_codigo = '" + item.servico_codigo + "' && ativo = true",
        )
      } catch (_) {}
      if (!rec) {
        rec = new Record(tabelaPrecosCol)
      }
      rec.set('servico_codigo', item.servico_codigo)
      rec.set('unidade', item.unidade)
      rec.set('preco_min_centavos', item.preco_min_centavos)
      rec.set('preco_max_centavos', item.preco_max_centavos)
      rec.set('vigente_de', hoje)
      rec.set('vigente_ate', '')
      rec.set('ativo', true)
      app.save(rec)
    })

    // 3. tabela_prazos (vigente_de = hoje, ativo = true)
    // parecer (os 3 códigos): 3–5 dias úteis
    // preparacao_niveis_1_2_3: 8–15 dias úteis
    // diagramacao: 10–20 dias úteis
    // capa: 10–20 dias úteis
    // isbn_ficha: 3–7 dias úteis
    // impressao: 10–20 dias úteis
    // posicionamento_lancamento: 5–10 dias úteis
    const faixasPrazos = [
      { servico_codigo: 'parecer_ate_60k', prazo_min_dias_uteis: 3, prazo_max_dias_uteis: 5 },
      { servico_codigo: 'parecer_60k_120k', prazo_min_dias_uteis: 3, prazo_max_dias_uteis: 5 },
      { servico_codigo: 'parecer_acima_120k', prazo_min_dias_uteis: 3, prazo_max_dias_uteis: 5 },
      { servico_codigo: 'preparacao_nivel_1', prazo_min_dias_uteis: 8, prazo_max_dias_uteis: 15 },
      { servico_codigo: 'preparacao_nivel_2', prazo_min_dias_uteis: 8, prazo_max_dias_uteis: 15 },
      { servico_codigo: 'preparacao_nivel_3', prazo_min_dias_uteis: 8, prazo_max_dias_uteis: 15 },
      { servico_codigo: 'diagramacao', prazo_min_dias_uteis: 10, prazo_max_dias_uteis: 20 },
      { servico_codigo: 'capa', prazo_min_dias_uteis: 10, prazo_max_dias_uteis: 20 },
      { servico_codigo: 'isbn_ficha', prazo_min_dias_uteis: 3, prazo_max_dias_uteis: 7 },
      { servico_codigo: 'impressao', prazo_min_dias_uteis: 10, prazo_max_dias_uteis: 20 },
      {
        servico_codigo: 'posicionamento_lancamento',
        prazo_min_dias_uteis: 5,
        prazo_max_dias_uteis: 10,
      },
    ]

    const tabelaPrazosCol = app.findCollectionByNameOrId('tabela_prazos')
    faixasPrazos.forEach((item) => {
      let rec = null
      try {
        rec = app.findFirstRecordByFilter(
          'tabela_prazos',
          "servico_codigo = '" + item.servico_codigo + "' && ativo = true",
        )
      } catch (_) {}
      if (!rec) {
        rec = new Record(tabelaPrazosCol)
      }
      rec.set('servico_codigo', item.servico_codigo)
      rec.set('prazo_min_dias_uteis', item.prazo_min_dias_uteis)
      rec.set('prazo_max_dias_uteis', item.prazo_max_dias_uteis)
      rec.set('vigente_de', hoje)
      rec.set('vigente_ate', '')
      rec.set('ativo', true)
      app.save(rec)
    })

    // 4. parametros_orcamento:
    // margem_impressao_min=0.15, margem_impressao_max=0.25, tributos,
    // margem_minima_contribuicao, validade_orcamento_dias=15, prazo_abatimento_dias=15
    const parametrosIniciais = [
      {
        chave: 'margem_impressao_min',
        valor: '0.15',
        descricao: 'Margem percentual mínima sobre custo gráfico de impressão (15%)',
      },
      {
        chave: 'margem_impressao_max',
        valor: '0.25',
        descricao: 'Margem percentual máxima sobre custo gráfico de impressão (25%)',
      },
      {
        chave: 'tributos',
        valor: '0.06',
        descricao: 'Alíquota média estimada de tributos sobre serviços editoriais (6%)',
      },
      {
        chave: 'margem_minima_contribuicao',
        valor: '0.20',
        descricao: 'Margem mínima de contribuição desejada nos orçamentos (20%)',
      },
      {
        chave: 'validade_orcamento_dias',
        valor: '15',
        descricao: 'Prazo padrão em dias de validade das propostas orçamentárias',
      },
      {
        chave: 'prazo_abatimento_dias',
        valor: '15',
        descricao: 'Prazo em dias corridos para abater o valor do parecer na contratação do pacote',
      },
    ]

    const parametrosCol = app.findCollectionByNameOrId('parametros_orcamento')
    parametrosIniciais.forEach((item) => {
      let rec = null
      try {
        rec = app.findFirstRecordByFilter('parametros_orcamento', "chave = '" + item.chave + "'")
      } catch (_) {}
      if (!rec) {
        rec = new Record(parametrosCol)
      }
      rec.set('chave', item.chave)
      rec.set('valor', item.valor)
      rec.set('descricao', item.descricao)
      app.save(rec)
    })
  },
  (app) => {
    // Reversão de seeds opcionais se necessário
  },
)
