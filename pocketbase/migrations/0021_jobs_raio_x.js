// Fase 4 (Raio-X simulado) — ajustes no modelo de jobs, sem recriar coleções:
// 1. jobs.arquivo (relation → arquivos): vínculo do manuscrito que gerou o
//    job (o gatilho de arquivos preenche; a etapa analisar usa para gravar
//    raio_x vinculado à obra e ao arquivo).
// 2. jobs.etapa_indice (number): ponteiro da máquina de estados, separado das
//    TENTATIVAS — antes, tentativas fazia os dois papéis e uma falha avançava
//    a etapa (pulando "analisar"). Com etapa_indice, a etapa só avança em
//    sucesso e a contagem de tentativas fica livre para retentativas.
// 3. Índice único parcial de idempotência: só um job raio_x em aberto
//    (pendente/executando) por obra.
migrate(
  (app) => {
    const jobs = app.findCollectionByNameOrId('jobs')
    const arquivos = app.findCollectionByNameOrId('arquivos')

    if (!jobs.fields.getByName('arquivo')) {
      jobs.fields.add(
        new RelationField({
          name: 'arquivo',
          collectionId: arquivos.id,
          cascadeDelete: false, // job sobrevive à exclusão do arquivo
          maxSelect: 1,
        }),
      )
    }
    if (!jobs.fields.getByName('etapa_indice')) {
      jobs.fields.add(new NumberField({ name: 'etapa_indice', onlyInt: true, min: 0 }))
    }
    jobs.addIndex('idx_jobs_raiox_obra_aberto', true, 'obra', "tipo = 'raio_x'")
    app.save(jobs)
  },
  (app) => {
    const jobs = app.findCollectionByNameOrId('jobs')
    jobs.removeIndex('idx_jobs_raiox_obra_aberto')
    app.save(jobs)
    // Campos arquivo/etapa_indice ficam no rollback (não há dados que dependam
    // da remoção; campos opcionais são inofensivos).
  },
)
