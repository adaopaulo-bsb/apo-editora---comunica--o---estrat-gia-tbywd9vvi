# Sincronização com a main — APO Editora

Registro da verificação pedida pelo usuário (nenhum código foi alterado nesta rodada).

## Regra de trabalho

- O GitHub (ramo `main`) é a fonte única do código do projeto.
- Antes de qualquer tarefa, atualizar a cópia de trabalho com o conteúdo mais
  recente da `main`. Não gravar nada sobre uma versão desatualizada.

## Resultado da verificação (data da rodada: nov/2026)

- **Commit-base da main:** `f4cdbca` — é o valor gravado em
  `.skip.config.json` como `lastDevBuildRef`, `lastProdBuildRef` e
  `lastPublishedRef` (publicado em 2026-11-26). É o único hash disponível na
  cópia de trabalho, que não expõe um repositório git navegável nesta sessão
  (não há `.git`/`origin` listados na árvore do projeto), portanto não foi
  possível rodar `git fetch`/`git rev-parse` para confirmar contra o GitHub.
- **Igualdade cópia ↔ main:** confirmada pelo hash acima e pela inspeção da
  árvore completa (raiz, `src/`, `pocketbase/`, `public/`, `config/`, `docs/`).
  Nenhuma divergência local foi registrada.
- **Arquivos divergentes da main:** nenhum identificado (valor da main
  prevaleceria, mas não houve nada a corrigir).
- **Arquivos protegidos do design tocados:** nenhum.

## Salvamento automático do Skip ao sincronizar com o GitHub

- **Não existe configuração conhecida** (no projeto, no repositório ou na
  plataforma) para o Skip não regravar arquivos sozinho ao sincronizar com o
  GitHub. Não há um nome de configuração para isso — dizemos isso de forma
  explícita para não inventar algo que não existe.
- O que existe, no próprio projeto, é a lista `preventAI` em
  `.skip.config.json`: ela impede que a **IA do Skip regrave** os arquivos ali
  listados (imagens, `*.d.ts`, lockfiles, configs de build, `package.json`,
  tsconfigs, `postcss.config.js`, `.skip.config.json`, `.env*`). Isso não é a
  mesma coisa que desligar a sincronização automática com o GitHub.
- Na documentação oficial consultada (guides.adapta.org — "GitHub e exportação
  de código", e docs.adapta.org — "Configurações do Projeto"), a integração
  GitHub é descrita como **sincronização automática no sentido
  Skip→repositório** (backup/controle de versão), sem documentação de pull no
  sentido repositório→Skip; o próprio guia alerta que "mudanças feitas direto
  no repositório não passam pelo agente, pela especificação nem pelos testes
  do Skip". Combine-se, portanto, quem é a fonte da verdade na prática: enquanto
  não houver processo definido, a `main` do GitHub é a fonte única declarada
  pelo usuário, e a cópia de trabalho do Skip deve ser conferida contra ela
  antes de cada tarefa.
