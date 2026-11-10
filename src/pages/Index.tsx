import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { centavosParaReaisFormatado, reaisParaCentavos } from '@/lib/moeda'
import { executarTestesMoeda } from '@/lib/moeda.test'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle2,
  Clock,
  ShieldAlert,
  Database,
  KeyRound,
  FileText,
  Cpu,
  Mail,
  CreditCard,
  Settings2,
  Globe,
  FileCode2,
  Activity,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

interface CapabilityItem {
  id: number
  item: string
  status: 'nativo' | 'integrável' | 'não disponível'
  summary: string
  details: string
  icon: any
  actionNeeded?: string
}

const capabilities: CapabilityItem[] = [
  {
    id: 1,
    item: 'Banco de dados relacional ou de documentos',
    status: 'nativo',
    icon: Database,
    summary:
      'Skip Cloud (PocketBase v0.36 sobre SQLite/WAL) relacional com tipos JSON estruturados.',
    details:
      'Totalmente nativo e provisionado. Suporta relações (1:N, N:N), tipos texto, número, booleano, data, seleções, arquivos, JSON e vetores de embedding. Suporta transações atômicas via app.runInTransaction((txApp) => ...). Limites práticos: dezenas de milhares a centenas de milhares de linhas com facilidade e arquivos de banco na casa dos GBs sob SQLite WAL. Migrações automáticas em pocketbase/migrations/*.js.',
  },
  {
    id: 2,
    item: 'Login de usuários, papéis e recuperação de senha',
    status: 'nativo',
    icon: KeyRound,
    summary: 'Coleção auth nativa (e-mail/senha, OAuth2, papéis por RLS e recuperação de senha).',
    details:
      'Nativo: Auth por e-mail e senha, link de verificação, fluxo de recuperação de senha por token transacional (requestPasswordReset e confirmPasswordReset). Papéis configuráveis diretamente na coleção users (ex.: author, editor, admin) com bloqueio de auto-elevação por Access Rules (RLS). Provedores OAuth (como Google) são nativos quando habilitados no painel Skip Cloud via pb.collection("users").authWithOAuth2(). Link mágico passwordless puro é integrável via pb_hooks customizado ou token temporário.',
  },
  {
    id: 3,
    item: 'Armazenamento de arquivos privados e descarte definitivo',
    status: 'nativo',
    icon: FileText,
    summary: 'Campos do tipo file no PocketBase com flag "protected" e descarte definitivo.',
    details:
      'Nativo: Campos do tipo file com validação rígida de MIME type, tamanho máximo parametrizável (ex.: 25MB a 50MB por manuscrito) e exclusão atômica física no storage. Arquivos protegidos (protected: true) exigem autenticação/token de visualização com expiração automática, impedindo acesso público a manuscritos não autorizados.',
  },
  {
    id: 4,
    item: 'Tarefas em segundo plano ou filas (processos longos)',
    status: 'integrável',
    icon: Clock,
    summary:
      'Cron nativo do PocketBase e hooks assíncronos. Processos de até 10 min requerem fila externa ou divisão em microetapas.',
    details:
      'Nativo: Agendador cron nativo (cronAdd) e hooks de ciclo de vida (onRecordAfterCreateSuccess). Limitação: O runtime Go/Goja de hooks HTTP possui timeout típico de requisição síncrona (geralmente 30s a 60s). Tarefas com duração contínua de até 10 minutos são integráveis dividindo o pipeline em microetapas com controle de estado no banco (pendente, em_processamento, concluido) orquestradas por cron a cada minuto, ou delegando para webhook de worker dedicado (ex.: Modal, Cloudflare Worker, AWS Lambda).',
    actionNeeded:
      'Recomendação: Para a análise do manuscrito da APO, estruturaremos em etapas de job assíncrono com polling ou subscrição Realtime.',
  },
  {
    id: 5,
    item: 'Chamadas a modelos de IA e controle de gastos',
    status: 'nativo',
    icon: Cpu,
    summary:
      'Skip AI Gateway ($ai.chat, $ai.embed e $ai.agents) nativo com segredos geridos pela plataforma.',
    details:
      'Nativo: Skip AI Gateway nativo via pb_hooks ($ai.chat com tiers "fast" e "reasoning", $ai.embed de 1536 dimensões e micro-agentes com RAG integrado via $ai.agents). Chaves de API não precisam ser inseridas ou expostas no código — o Skip gerencia as credenciais centralmente e debita créditos do workspace. Retenção de dados: O gateway utiliza endpoints corporativos/zero data retention dos provedores subjacentes. Teto de gastos: O consumo pode ser delimitado no painel da organização e auditado em tabela local de tokens/custos antes de disparar o prompt.',
  },
  {
    id: 6,
    item: 'Envio de e-mail transacional',
    status: 'nativo',
    icon: Mail,
    summary: 'Disparo transacional nativo habilitado para autenticação e templates customizados.',
    details:
      'Nativo: O projeto já possui o Skip Cloud email sending habilitado (verificação de e-mail, reset de senha e e-mails acionados por código via hooks do PocketBase). Templates customizados podem ser geridos e disparados para notificações de status, orçamento e envio do Raio-X.',
  },
  {
    id: 7,
    item: 'Pagamentos (Pix, cartão) e webhooks',
    status: 'integrável',
    icon: CreditCard,
    summary:
      'Integrável via Stripe Connectors ou provedor nacional (Asaas, Mercado Pago, EFI) via pb_hooks.',
    details:
      'Integrável: O Skip Cloud possui conector nativo para Stripe com execução segura no backend via pb_hooks ($connectors.executeAsOwner). Para métodos brasileiros locais como Pix nativo com QR Code imediato e boleto, a integração é 100% implementada via pb_hooks com rotas de API personalizadas (/backend/v1/checkout/pix) e tratamento seguro de Webhooks de retorno com validação de assinatura criptográfica.',
    actionNeeded:
      'Aguardar Fase 6 para selecionar o gateway preferido da APO (Stripe vs Asaas/Mercado Pago).',
  },
  {
    id: 8,
    item: 'Variáveis de ambiente, segredos e ambientes',
    status: 'nativo',
    icon: Settings2,
    summary:
      'Gestão nativa de segredos via set_env / $secrets e ambientes preview/production isolados.',
    details:
      'Nativo: Segredos são gerenciados de forma segura na infraestrutura e injetados nos pb_hooks via $os.getenv("CHAVE") ou $secrets.get("CHAVE"). O Skip provê isolamento entre o ambiente de desenvolvimento/preview e o ambiente de produção publicado, com migrações de banco rastreadas.',
  },
  {
    id: 9,
    item: 'Domínio personalizado e HTTPS',
    status: 'nativo',
    icon: Globe,
    summary: 'HTTPS automático nativo com suporte a domínio próprio (DNS CNAME).',
    details:
      'Nativo: Certificados TLS/SSL são emitidos e renovados automaticamente. Domínios customizados (ex.: app.apoeditora.com.br ou portal.apoeditora.com) são vinculados diretamente no painel de publicação do Skip.',
  },
  {
    id: 10,
    item: 'Extração de texto de arquivos .docx e .pdf',
    status: 'nativo',
    icon: FileCode2,
    summary: 'Nativo no servidor via $documents.toMarkdown com preservação de estrutura e tabelas.',
    details:
      'Nativo: A biblioteca server-side $documents.toMarkdown lê arquivos .docx, .pdf, .xlsx e .pptx diretamente em hooks do backend, convertendo-os em Markdown limpo com tabelas e cabeçalhos preservados. O limite é de 10 MB por conversão. PDFs escaneados (sem camada de texto OCR) retornam erro 422 documentado para pedir arquivo digital ao autor.',
  },
  {
    id: 11,
    item: 'Logs, monitoramento e backup do banco',
    status: 'nativo',
    icon: Activity,
    summary: 'Streams de logs em tempo real (requests, hooks, emails, crons) e backups de banco.',
    details:
      'Nativo: Ferramentas nativas de observabilidade para requisições HTTP, saídas console.log/warn/error de hooks, status de envio de e-mails transacionais e execuções de cron. O banco SQLite opera em modo seguro com checkpoints e snapshots automáticos da plataforma.',
  },
  {
    id: 12,
    item: 'Exportação do código-fonte',
    status: 'nativo',
    icon: Layers,
    summary:
      'Código Vite + React + TypeScript e migrações padrão PocketBase totalmente exportáveis.',
    details:
      'Nativo: O projeto consiste em uma árvore padrão React + Vite + Tailwind + shadcn/ui no frontend e arquivos padrão de migrações e hooks PocketBase (Goja JS). Não há lock-in proprietário: o projeto pode ser buildado, executado em qualquer container ou migrado para PocketBase self-hosted.',
  },
]

const Index = () => {
  const [activeTab, setActiveTab] = useState<'capacidades' | 'bloqueios' | 'fases' | 'moeda'>(
    'capacidades',
  )
  const testeMoedaResultado = useMemo(() => executarTestesMoeda(), [])
  const [exemploInput, setExemploInput] = useState('12,50')

  const countNative = capabilities.filter((c) => c.status === 'nativo').length
  const countIntegrable = capabilities.filter((c) => c.status === 'integrável').length
  const countUnavailable = capabilities.filter((c) => c.status === 'não disponível').length

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Aviso: app em construção (Fase 1 — estrutura base, sem telas finais) */}
      <div className="bg-amber-950 text-amber-100 text-xs sm:text-sm text-center px-4 py-2">
        APO Editora — app em construção (Fase 1: estrutura base). Nenhuma tela final de produto foi
        implementada ainda.
      </div>

      {/* Header institucional */}
      <header className="border-b bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-serif tracking-tight text-2xl font-bold text-amber-900">
                APO Editora
              </span>
              <Badge
                variant="outline"
                className="border-amber-700/30 text-amber-900 bg-amber-50 text-xs"
              >
                Fase 1: Fundação (em andamento)
              </Badge>
            </div>
            <p className="text-sm text-slate-600">
              Fase 1 — Fundação do Projeto: estrutura base no PocketBase (coleções, regras de acesso
              e hooks). Sem telas finais de produto nesta fase.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium">
              {countNative} Nativos
            </Badge>
            <Badge className="bg-sky-600 hover:bg-sky-700 text-white font-medium">
              {countIntegrable} Integráveis
            </Badge>
            {countUnavailable > 0 && (
              <Badge variant="destructive">{countUnavailable} Indisponíveis</Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Banner de Status da Fase 0 */}
        <div className="mb-8 p-6 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 rounded-xl text-white shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold uppercase tracking-wider">
                <Sparkles className="h-4 w-4" /> Diagnóstico Oficial de Infraestrutura
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                Análise de Viabilidade Técnica: 100% Viável no Skip Cloud
              </h2>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                Nenhum dos requisitos centrais da APO Editora é bloqueado. Dos 12 itens analisados,{' '}
                <strong className="text-white">10 são totalmente nativos</strong> e{' '}
                <strong className="text-white">
                  2 são integráveis com arquitetura já validada
                </strong>{' '}
                (pagamentos e filas assíncronas).
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 shrink-0">
              <div className="px-4 py-3 bg-white/10 backdrop-blur rounded-lg border border-white/15 text-center">
                <div className="text-2xl font-bold text-amber-400">0</div>
                <div className="text-xs text-slate-300 uppercase font-medium">
                  Bloqueios Críticos
                </div>
              </div>
              <div className="px-4 py-3 bg-white/10 backdrop-blur rounded-lg border border-white/15 text-center">
                <div className="text-2xl font-bold text-emerald-400">10 / 12</div>
                <div className="text-xs text-slate-300 uppercase font-medium">Recursos Nativos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação entre seções */}
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
          <TabsList className="grid grid-cols-3 max-w-md bg-slate-200">
            <TabsTrigger value="capacidades" className="text-xs sm:text-sm">
              Itens 1 a 12
            </TabsTrigger>
            <TabsTrigger value="bloqueios" className="text-xs sm:text-sm">
              Bloqueios & Alternativas
            </TabsTrigger>
            <TabsTrigger value="fases" className="text-xs sm:text-sm">
              Roteiro das Fases
            </TabsTrigger>
            <TabsTrigger value="moeda" className="text-xs sm:text-sm">
              Moeda (Fase 2)
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Matriz dos 12 Itens */}
          <TabsContent value="capacidades" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {capabilities.map((cap) => {
                const Icon = cap.icon
                const isNative = cap.status === 'nativo'
                const isIntegrable = cap.status === 'integrável'

                return (
                  <Card
                    key={cap.id}
                    className="border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${isNative ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <span className="text-xs font-mono font-semibold text-slate-400">
                              Item #{String(cap.id).padStart(2, '0')}
                            </span>
                            <CardTitle className="text-base font-semibold leading-tight text-slate-900">
                              {cap.item}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge
                          className={`shrink-0 capitalize ${
                            isNative
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200'
                              : isIntegrable
                                ? 'bg-sky-100 text-sky-800 hover:bg-sky-200 border-sky-200'
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {cap.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-slate-600 pt-2 font-medium">
                        {cap.summary}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 text-xs text-slate-700 leading-relaxed border-t border-slate-100 mt-2 py-3 bg-slate-50/50">
                      <p>{cap.details}</p>
                      {cap.actionNeeded && (
                        <div className="mt-2 text-xs font-semibold text-amber-900 bg-amber-50 p-2 rounded border border-amber-200/50">
                          {cap.actionNeeded}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* TAB 2: Análise de Bloqueios e Alternativas Propostas */}
          <TabsContent value="bloqueios" className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                  <ShieldAlert className="h-5 w-5" />
                  <span>Análise de Riscos e Bloqueios</span>
                </div>
                <CardTitle className="text-xl">O que bloqueia a APO Editora hoje?</CardTitle>
                <CardDescription>
                  Avaliação franca sobre limites arquiteturais e propostas de solução antes de
                  iniciar o código.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 text-sm">
                  <strong>Conclusão do Diagnóstico:</strong> Não existem bloqueios impeditivos no
                  ecossistema do Skip Cloud. A plataforma atende nativamente a 83% dos requisitos
                  (10 de 12), e os outros 2 itens possuem soluções técnicas integráveis
                  consolidadas.
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-base text-slate-900">
                    Pontos de Atenção e Soluções Propostas:
                  </h3>

                  <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-600" />
                        1. Timeout em tarefas pesadas (IA e análise de livros grandes)
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-amber-700 border-amber-300 bg-amber-50"
                      >
                        Atenção Arquitetural
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>O cenário:</strong> Analisar um livro completo de 300 páginas em uma
                      única chamada HTTP síncrona estouraria o timeout do gateway (geralmente
                      30–60s). Além disso, o token window do modelo seria excedido.
                    </p>
                    <div className="p-3 bg-slate-50 rounded border text-xs text-slate-700 space-y-1">
                      <p className="font-semibold text-slate-900">Alternativa recomendada:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>
                          <strong>Máquina de Estados de Análise:</strong> O upload do manuscrito
                          salva o arquivo e cria um registro na coleção{' '}
                          <code className="bg-slate-200 px-1 py-0.5 rounded">analises</code> com
                          status <em>pendente</em>.
                        </li>
                        <li>
                          <strong>Chunking em microetapas:</strong> Uma rota de backend ou worker
                          executa a extração em blocos (sumário, amostras por capítulos, métricas de
                          legibilidade) salvando o progresso parcial no banco.
                        </li>
                        <li>
                          <strong>Feedback Realtime:</strong> O autor visualiza no frontend uma
                          barra de progresso viva via subscrição nativa Realtime do PocketBase (
                          <code className="bg-slate-200 px-1 py-0.5 rounded">useRealtime</code>),
                          sem travar a conexão.
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-sky-600" />
                        2. Pagamentos Nacionais (Pix instantâneo vs Stripe)
                      </h4>
                      <Badge variant="outline" className="text-sky-700 border-sky-300 bg-sky-50">
                        Decisão de Negócio
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>O cenário:</strong> O autor brasileiro espera pagar prioritariamente
                      via Pix ou cartão parcelado em reais com antifraude nacional. O conector
                      padrão do Skip foca em Stripe.
                    </p>
                    <div className="p-3 bg-slate-50 rounded border text-xs text-slate-700 space-y-1">
                      <p className="font-semibold text-slate-900">Alternativa recomendada:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>
                          <strong>Opção A (Mais rápida):</strong> Stripe Checkout configurado com
                          suporte a BRL e Pix (recurso beta da Stripe Brasil).
                        </li>
                        <li>
                          <strong>Opção B (Recomendada para o mercado brasileiro da APO):</strong>{' '}
                          Integração via API de um provedor nacional (como Asaas, Mercado Pago ou
                          EFI Bank) através de pb_hooks em{' '}
                          <code className="bg-slate-200 px-1 py-0.5 rounded">
                            pocketbase/hooks/pagamentos.js
                          </code>
                          , gerando o QR Code Copia e Cola do Pix e tratando o Webhook de liquidação
                          com segurança.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Visão do Roteiro das Fases */}
          <TabsContent value="fases" className="space-y-4">
            <Card className="border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl">Cronograma de Fases do Projeto APO</CardTitle>
                <CardDescription>
                  Cada fase avança somente após validação rigorosa dos critérios de aceite.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible defaultValue="fase-0" className="w-full">
                  <AccordionItem value="fase-0">
                    <AccordionTrigger className="text-sm font-semibold text-amber-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Fase 0: Preparação — Diagnóstico e Contexto-Mestre
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-slate-600 space-y-2 pl-6">
                      <p>
                        • Verificação completa das 12 capacidades técnicas do Skip Cloud
                        (concluído).
                      </p>
                      <p>
                        • Fixação de regras permanentes: uso exclusivo de recursos nativos e dados
                        fictícios até Fase 6.
                      </p>
                      <p>
                        • Critério de aceite: Resposta técnica fundamentada e aprovada pelo usuário.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fase-1">
                    <AccordionTrigger className="text-sm font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                        Fase 1: Fundação do Projeto, Ambientes e Estrutura (Backend)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-slate-600 space-y-1 pl-6">
                      <p>• Configuração das variáveis de ambiente e estrutura de migrações.</p>
                      <p>• Criação da infraestrutura base do PocketBase.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fase-2">
                    <AccordionTrigger className="text-sm font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                        Fase 2: Modelo de Dados (Backend)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-slate-600 space-y-1 pl-6">
                      <p>
                        • Coleções de Manuscritos, Tabelas de Preços e Prazos editáveis, Análises e
                        Pedidos.
                      </p>
                      <p>• Índices de performance e regras de validação.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fase-3">
                    <AccordionTrigger className="text-sm font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                        Fase 3: Login, Papéis, Termos e Auditoria (Backend)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-slate-600 space-y-1 pl-6">
                      <p>• Papéis (Autor, Avaliador APO, Administrador).</p>
                      <p>
                        • Aceite auditável de termos de privacidade e descarte seguro de arquivos.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fase-4">
                    <AccordionTrigger className="text-sm font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                        Fase 4: Upload Seguro, Extração de Texto e Motor de Preços (Backend)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-slate-600 space-y-1 pl-6">
                      <p>• Conversão .docx e .pdf via $documents.toMarkdown.</p>
                      <p>
                        • Contagem de palavras e cálculo dinâmico de preços a partir das tabelas
                        editáveis.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fase-5">
                    <AccordionTrigger className="text-sm font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                        Fase 5: Pipeline de Análise com IA e Geração do Raio-X (Backend)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-slate-600 space-y-1 pl-6">
                      <p>• Prompts estruturados de diagnóstico editorial via $ai.chat.</p>
                      <p>• Consolidação das métricas literárias e geração do relatório técnico.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fase-6">
                    <AccordionTrigger className="text-sm font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                        Fase 6: Pedidos, Orçamento, Aceite, Abatimento e Console APO (API)
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-slate-600 space-y-1 pl-6">
                      <p>• Gestão de propostas comerciais e abatimento do Raio-X na contratação.</p>
                      <p>• Fim do uso exclusivo de dados fictícios após validação desta etapa.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fase-7-10">
                    <AccordionTrigger className="text-sm font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-slate-300" />
                        Fases 7 a 10: Frontend, Painéis, Experiência do Autor e Piloto
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-xs text-slate-600 space-y-1 pl-6">
                      <p>• Construção da interface com identidade da APO Editora.</p>
                      <p>• Visualização gráfica interativa do Raio-X Literário.</p>
                      <p>
                        • Painel do autor, console administrativo da editora e testes de segurança.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Utilitário de Conversão Monetária (Fase 2) */}
          <TabsContent value="moeda" className="space-y-6">
            <Card className="border-slate-200">
              <CardHeader>
                <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Módulo Unificado de Moeda (reais ↔ centavos)</span>
                </div>
                <CardTitle className="text-xl">Validação de Conversão Monetária</CardTitle>
                <CardDescription>
                  O banco armazena sempre centavos inteiros. Telas e relatórios exibem em reais com
                  vírgula.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-950 text-sm space-y-2">
                  <div className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Bateria de Testes Automatizados:{' '}
                    {testeMoedaResultado.sucesso
                      ? 'TODOS OS TESTES PASSARAM'
                      : 'FALHA NOS TESTES'}{' '}
                    ({testeMoedaResultado.total - testeMoedaResultado.falhas}/
                    {testeMoedaResultado.total})
                  </div>
                  <ul className="text-xs space-y-1 pl-5 list-disc text-emerald-900">
                    {testeMoedaResultado.resultados.map((r, i) => (
                      <li key={i}>
                        <strong>{r.descricao}</strong>: esperado{' '}
                        <code className="bg-white/70 px-1 rounded">{String(r.esperado)}</code>,
                        obtido <code className="bg-white/70 px-1 rounded">{String(r.obtido)}</code>{' '}
                        ✓
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-white space-y-3">
                  <h4 className="font-semibold text-sm text-slate-900">
                    Demonstração Interativa ao Vivo:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div>
                      <label className="text-xs font-medium text-slate-700 block mb-1">
                        Entrada em Reais (input do usuário):
                      </label>
                      <input
                        type="text"
                        value={exemploInput}
                        onChange={(e) => setExemploInput(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Ex: 12,50"
                      />
                    </div>
                    <div className="p-3 bg-slate-50 rounded border text-center">
                      <div className="text-xs text-slate-500 font-medium">
                        Gravado no Banco (Centavos):
                      </div>
                      <div className="text-lg font-bold font-mono text-indigo-700">
                        {reaisParaCentavos(exemploInput)}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded border text-center">
                      <div className="text-xs text-slate-500 font-medium">
                        Exibido na Interface:
                      </div>
                      <div className="text-lg font-bold text-emerald-700">
                        {centavosParaReaisFormatado(reaisParaCentavos(exemploInput))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rodapé de Instrução para Próxima Fase */}
        <div className="mt-8 border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            Status do plano:{' '}
            <strong>
              Aguardando aprovação formal do usuário sobre o Prompt 0.1 para avançar para o Prompt
              1.1
            </strong>
            .
          </p>
          <div className="flex items-center gap-1 font-semibold text-amber-900">
            Próximo passo: Fase 1 (Fundação do Projeto) <ArrowRight className="h-3 w-3" />
          </div>
        </div>
      </main>
    </div>
  )
}

export default Index
