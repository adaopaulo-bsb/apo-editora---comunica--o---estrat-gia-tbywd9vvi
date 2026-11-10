# Criando o ambiente de PRODUÇÃO — APO Editora

Este projeto Skip é o ambiente de **TESTE** (`APP_ENV=teste`). Quando o
produto estiver pronto para publicar, crie um **segundo projeto Skip** com
os mesmos esquemas e migrações, seguindo os passos abaixo.

## 1. Criar o projeto

1. Crie um novo projeto Skip e conecte-o ao mesmo repositório (ou importe
   o repositório atual).
2. O backend (PocketBase) do novo projeto cria as coleções aplicando as
   mesmas migrações em `pocketbase/migrations/` — na ordem do prefixo
   numérico. Nenhuma migração é específica de teste: elas são idempotentes.

## 2. Variáveis e segredos (com `set_env` no painel do projeto)

| Variável                     | Teste (este projeto)                         | Produção                                                    |
| ---------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `APP_ENV`                    | `teste`                                      | `producao`                                                  |
| `VITE_POCKETBASE_URL`        | URL do backend de teste (definida pelo Skip) | URL do backend de produção                                  |
| Chaves de IA (fases futuras) | não usadas (modo simulado)                   | via `set_env`, com limite de gasto lido da coleção `config` |

Nunca escrever `.env` — só `set_env` (regra permanente do projeto).

## 3. O que muda automaticamente com `APP_ENV=producao`

- **Rota `/backend/v1/saude`** passa a reportar `ambiente: "producao"`.
- **Dados de demonstração**: `POST /backend/v1/demo/seed` e
  `POST /backend/v1/demo/reset` recusam a execução (erro `acesso_negado`,
  mensagem clara em pt-BL) — a rotina não faz nada em produção.
- **Rota `/backend/v1/erro-teste`** desaparece (404 padronizada).
- **Interruptor de IA simulada**: a migração semeia
  `ia_modo_simulado=true`; antes de habilitar IA real (fases indicadas),
  um admin desliga o interruptor na coleção `config` e o limite diário de
  gasto (`gasto_maximo_diario_ia_brl`) passa a valer.

## 4. Checklist de publicação

- [ ] Segundo projeto Skip criado e migrações aplicadas
- [ ] `APP_ENV=producao` definido via `set_env`
- [ ] `GET /backend/v1/saude` do novo projeto mostra `ambiente: "producao"`, banco e armazenamento `ok`
- [ ] Coleção `config` revisada por um admin (limites e gasto máximo de IA)
- [ ] `demo/seed` do novo projeto retorna erro de acesso (comprovando que não roda em produção)
- [ ] Primeiro usuário admin criado no novo projeto (não copiar usuários de teste)

## 5. O que NÃO copiar

- Os usuários fictícios (`*.demo@apo.exemplo`) e seus dados — são criados
  apenas pelo seed de teste e removíveis com `demo/reset`.
- Qualquer preço ou prazo: sempre virão das tabelas editáveis (coleção
  `precos`), nunca do código.
