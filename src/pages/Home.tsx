/* Home pública da APO Editora: identidade "Papel e Cerrado" */
import { useId, useState, type ReactNode } from 'react'
import Orcamento from '@/components/Orcamento'

const etapas = [
  [
    'Raio-X da obra',
    'Diagnóstico automático prévio com nota de prontidão, pontos fortes e ajustes.',
    'Gratuito',
  ],
  [
    'Parecer editorial',
    'Um editor lê a obra inteira e entrega um relatório com o que ela precisa e o preço fechado dos próximos serviços.',
    '',
  ],
  [
    'Texto e projeto gráfico',
    'Preparação do texto, diagramação e capa, cada etapa com preço e prazo informados antes de você contratar.',
    '',
  ],
  [
    'Publicação e lançamento',
    'ISBN, livro impresso e e-book, e posicionamento da obra junto aos leitores.',
    '',
  ],
]

type Filtro = 'todas' | 'contos' | 'poesia' | 'juridico'

const filtros: [Filtro, string][] = [
  ['todas', 'Todas'],
  ['contos', 'Contos e crônicas'],
  ['poesia', 'Poesia'],
  ['juridico', 'Jurídico'],
]

const obras: {
  capa: string
  alt: string
  titulo: string
  ano: string
  tags: Filtro[]
  desc: string
  creditos: [string, string][]
}[] = [
  {
    capa: '/capas/fc2.jpg',
    alt: 'Capa de Fígado e Coração, 2ª edição',
    titulo: 'Fígado e Coração: Amor & Superação',
    ano: '2ª edição · 2026',
    tags: ['contos'],
    desc: 'Crônicas reais de amor, coragem e superação, a partir de uma doação de fígado de mãe para filha. Primeiro livro de Tati Rocha, em edição ampliada.',
    creditos: [
      ['Gênero', 'Crônicas e relato'],
      ['Papel', 'Edição: Adão Paulo Oliveira'],
      ['Formato', '206 páginas'],
      ['Ilustração da capa', 'Karla Gonçalves'],
    ],
  },
  {
    capa: '/capas/fc1.jpg',
    alt: 'Capa de Fígado e Coração, 1ª edição',
    titulo: 'Fígado e Coração: Amor & Superação',
    ano: '1ª edição',
    tags: ['contos'],
    desc: 'A primeira edição do livro de Tati Rocha, com prefácio da Dra. Elisa de Carvalho.',
    creditos: [
      ['Gênero', 'Crônicas e relato'],
      ['Papel', 'Edição: Adão Paulo Oliveira'],
      ['Ilustração da capa', 'Markito'],
    ],
  },
  {
    capa: '/capas/cartas.jpg',
    alt: 'Capa de Cartas de Adão',
    titulo: 'Cartas de Adão: Poemas & Contos',
    ano: '1ª edição · 2005',
    tags: ['poesia', 'contos'],
    desc: 'Livro de poemas e contos de Adão Paulo Oliveira, publicado pela Câmara Brasileira de Jovens Escritores.',
    creditos: [
      ['Gênero', 'Poesia e contos'],
      ['Papel', 'Autor'],
      ['Formato', '110 páginas'],
    ],
  },
  {
    capa: '/capas/dv.jpg',
    alt: 'Capa de O Direito à Vida',
    titulo: 'O Direito à Vida: Ensaios sobre a Doação de Órgãos',
    ano: '2026',
    tags: ['juridico'],
    desc: 'Coletânea de ensaios da Comissão de Direito Médico e da Saúde da OAB Subseção Águas Claras/DF, em quatro partes, da Lei nº 9.434/1997 ao acesso à Justiça.',
    creditos: [
      ['Gênero', 'Jurídico'],
      ['Realização', 'OAB Águas Claras/DF'],
      ['Assessoria editorial', 'APO Comunicação & Estratégia'],
      ['Editores', 'Adão Paulo Oliveira e Tati Rocha'],
      ['Coordenação editorial', 'Tati Rocha'],
      ['Formato', '182 páginas'],
    ],
  },
  {
    capa: '/capas/anuario.jpg',
    alt: 'Capa do Anuário da Advocacia Pública do Brasil',
    titulo: 'Anuário da Advocacia Pública do Brasil',
    ano: '2014',
    tags: ['juridico'],
    desc: 'Edição especial sobre a atuação da advocacia pública no país: do pré-sal à Copa, os defensores do patrimônio e das políticas sociais.',
    creditos: [
      ['Gênero', 'Jurídico'],
      ['Publicação', 'Consultor Jurídico'],
      ['Papel', 'Chefe da Assessoria de Comunicação: Adão Paulo Oliveira'],
    ],
  },
]

const trajetoriaAdao = {
  rotulo: 'Trajetória de Adão Paulo Oliveira',
  titulo: 'Experiência em jornalismo e comunicação jurídica',
  texto:
    'Mais de 30 anos entre redações de televisão, assessorias de comunicação e publicações institucionais de órgãos do sistema de Justiça. Essa vivência com texto, edição e apuração orienta a linha editorial da APO.',
  itens: [
    [
      '1999 a 2001',
      'Repórter e editor de Política e Economia',
      'TV Bandeirantes, Brasília',
      'Cobertura diária de política nacional e economia, com o Palácio do Planalto, o Congresso e os ministérios econômicos, para os jornais da rede.',
    ],
    [
      '2003 a 2004',
      'Repórter, editor e apresentador',
      'TV Câmara',
      'Cobertura especializada do Poder Legislativo, de plenários, comissões e CPIs, com edição e apresentação de telejornais ao vivo.',
    ],
    [
      '2007 a 2016',
      'Chefe da Assessoria de Comunicação',
      'Advocacia-Geral da União (AGU)',
      'Implantou a estrutura de comunicação institucional da AGU: portal de notícias, assessoria de imprensa, redes sociais e programas próprios de rádio e televisão, entre eles a Revista da AGU.',
    ],
    [
      '2018 a 2021',
      'Chefe da Assessoria de Comunicação da Presidência',
      'Supremo Tribunal Federal (STF)',
      'Estruturou os processos de comunicação da Presidência da Corte, com textos e campanhas sobre temas de grande relevância constitucional.',
    ],
    [
      '2021 a 2022',
      'Secretário de Comunicação Social',
      'Conselho Nacional do Ministério Público (CNMP)',
      'Conduziu a comunicação do Conselho, com foco em transparência e no diálogo com a sociedade e com os operadores do Direito.',
    ],
  ],
}

const trajetoriaTati = {
  rotulo: 'Trajetória de Tati Rocha',
  titulo: 'Professora de texto, autora e editora-assistente',
  texto:
    'Quase uma década em sala de aula ensinando a ler e a escrever, e hoje autora publicada. Esse olhar de professora orienta a leitura e a coordenação editorial de contos e crônicas na APO.',
  itens: [
    [
      '1997 a 2005',
      'Professora de Língua Portuguesa, Texto e Redação',
      'Rede pública e escolas particulares de Brasília',
      'Docência em língua portuguesa e produção textual na Fundação Educacional do DF, na Secretaria de Educação, no INEI, no Centro Educacional Leonardo da Vinci (1998 a 2003) e na Sociedade Educacional Fênix (2004 a 2005).',
    ],
    [
      'Desde 2025',
      'Escritora e autora',
      'Fígado e Coração',
      'Autora de "Fígado e Coração: Amor e Superação", com edição de Adão Paulo Oliveira e participação em lançamentos e ações de conscientização sobre doação e transplante de órgãos.',
    ],
    [
      'Competências',
      'Texto, didática e palestras',
      '',
      'Produção, revisão e edição de textos, comunicação oral e didática, escuta ativa e gestão de prazos, que se traduzem em orientação cuidadosa ao autor.',
    ],
  ],
}

const leque = [
  {
    capa: '/capas/anuario.jpg',
    alt: 'Capa do Anuário da Advocacia Pública',
    cls: 'left-0 top-16 h-72 -rotate-[9deg]',
  },
  {
    capa: '/capas/fc1.jpg',
    alt: 'Capa de Fígado e Coração, 1ª edição',
    cls: 'left-28 top-4 h-80 -rotate-[3deg]',
  },
  {
    capa: '/capas/dv.jpg',
    alt: 'Capa de O Direito à Vida',
    cls: 'left-56 top-10 h-[19rem] rotate-[4deg]',
  },
  {
    capa: '/capas/fc2.jpg',
    alt: 'Capa de Fígado e Coração, 2ª edição',
    cls: 'left-80 top-2 h-80 rotate-[9deg]',
  },
]

const Rotulo = ({ children }: { children: string }) => (
  <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-primary">
    {children}
  </p>
)

const Chip = ({ children }: { children: string }) => (
  <span className="rounded-full border border-foreground/25 px-3 py-1 font-sans text-xs font-medium text-muted-foreground">
    {children}
  </span>
)

const CartaoEquipe = ({ dados, children }: { dados: typeof trajetoriaAdao; children: ReactNode }) => {
  const [aberto, setAberto] = useState(false)
  const id = useId()
  return (
    <article className="bg-background p-7">
      {children}
      <div onMouseLeave={() => setAberto(false)}>
      <button
        type="button"
        aria-expanded={aberto}
        aria-controls={id}
        onMouseEnter={() => setAberto(true)}
        onClick={() => setAberto((v) => !v)}
        className="mt-5 font-sans text-sm font-semibold text-terracota underline-offset-4 hover:underline"
      >
        {aberto ? 'Ocultar trajetória' : 'Ver trajetória completa'}
      </button>
      <div
        id={id}
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-4 border-t-2 border-terracota pt-4">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-terracota">
              {dados.rotulo}
            </p>
            <h4 className="mt-1 font-display text-xl font-extrabold leading-tight text-primary">{dados.titulo}</h4>
            <p className="mt-2 font-serif text-base leading-snug text-muted-foreground">{dados.texto}</p>
            <div className="mt-3">
              {dados.itens.map(([quando, cargo, onde, texto]) => (
                <div key={cargo} className="border-t border-foreground/15 py-3">
                  <p className="font-sans text-xs font-semibold uppercase tracking-wider text-terracota">{quando}</p>
                  <p className="font-display text-lg font-semibold leading-tight">{cargo}</p>
                  {onde && <p className="font-sans text-xs text-muted-foreground">{onde}</p>}
                  <p className="mt-1 font-serif text-base leading-snug">{texto}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>
    </article>
  )
}

export default function Home() {
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const visiveis = obras.filter((o) => filtro === 'todas' || o.tags.includes(filtro))

  return (
    <>
      <section className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-6 pb-10 pt-16">
        <div className="min-w-0 flex-1 basis-[420px]">
          <Rotulo>Talentos Humanos e IA de Última Geração</Rotulo>
          <h1 className="mt-4 font-display text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl">
            Seu livro merece uma edição à altura da{' '}
            <span className="bg-[linear-gradient(transparent_60%,hsl(var(--accent))_60%)]">
              sua história
            </span>
          </h1>
          <p className="mt-6 max-w-xl font-serif text-xl leading-relaxed text-muted-foreground">
            A APO Comunicação e Estratégia trabalha com um time de profissionais com vasta
            experiência em editoração, com a colaboração de Inteligência Artificial.
          </p>
          <p className="mt-3 max-w-xl font-serif text-lg leading-relaxed text-muted-foreground">
            Responda a um questionário, envie seu manuscrito e receba, sem custo, o Raio-X da obra:
            um diagnóstico com pontos fortes, ajustes e o caminho até a publicação.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 font-sans text-[15px] font-semibold">
            <a
              href="#raio-x"
              className="rounded bg-primary px-6 py-4 text-primary-foreground hover:opacity-90"
            >
              Fazer o Raio-X gratuito
            </a>
            <a
              href="#equipe"
              className="rounded border-[1.5px] border-foreground px-6 py-[14px] hover:bg-secondary"
            >
              Conhecer a equipe
            </a>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Contos', 'Poesia', 'Jurídico', 'Jornalismo', 'Crônicas'].map((c) => (
              <Chip key={c}>{c}</Chip>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 basis-[400px] justify-center">
          <div className="relative h-[26rem] w-[30rem] max-w-full">
            {leque.map((l) => (
              <img
                key={l.capa}
                src={l.capa}
                alt={l.alt}
                className={`absolute w-auto shadow-[0_14px_30px_rgba(28,26,23,0.35)] ${l.cls}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl px-6 py-14">
        <Rotulo>Do manuscrito ao livro</Rotulo>
        <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight">Como funciona</h2>
        <p className="mt-3 max-w-2xl font-serif text-lg leading-relaxed text-muted-foreground">
          Você começa de graça e só contrata o que a sua obra realmente precisa.
        </p>
        <ol className="mt-8 grid gap-6 md:grid-cols-2">
          {etapas.map(([nome, texto, tag], i) => (
            <li key={nome} className="flex gap-5 border border-border bg-card p-6">
              <span className="w-12 flex-none font-display text-3xl font-extrabold leading-none text-terracota">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-xl font-semibold">{nome}</h3>
                <p className="mt-1 font-serif text-lg leading-snug text-muted-foreground">{texto}</p>
                {tag && (
                  <span className="mt-3 inline-block rounded-full bg-secondary px-3 py-1 font-sans text-xs font-semibold">
                    {tag}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8">
          <Orcamento>
            <button
              type="button"
              className="rounded bg-primary px-6 py-4 font-sans text-[15px] font-semibold text-primary-foreground hover:opacity-90"
            >
              Orçamento: veja preços e prazos
            </button>
          </Orcamento>
        </div>
      </section>

      <section id="equipe" className="bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Rotulo>Quem edita o seu livro</Rotulo>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight">
            Equipe editorial
          </h2>
          <p className="mt-3 max-w-2xl font-serif text-lg leading-relaxed text-muted-foreground">
            Experiência em editoração, texto jurídico, jornalismo e literatura, com uma rede de
            revisores, diagramadores e ilustradores parceiros.
          </p>
          <div className="mt-9 grid items-start gap-8 md:grid-cols-2">
            <CartaoEquipe dados={trajetoriaAdao}>
              <div className="flex items-center gap-4">
                <img
                  src="/equipe/adao.jpg"
                  alt="Adão Paulo Oliveira"
                  className="h-24 w-24 rounded-full object-cover"
                />
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-wider text-primary">
                    Editor
                  </p>
                  <h3 className="font-display text-2xl font-semibold">Adão Paulo Oliveira</h3>
                </div>
              </div>
              <p className="mt-4 font-serif text-lg leading-snug">
                Jornalista e psicólogo, com mais de 30 anos de atuação em comunicação institucional.
                Conduz a linha editorial, a revisão e o relacionamento com os autores.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Ficção (contos)', 'Poesia', 'Jurídico', 'Jornalismo'].map((c) => (
                  <Chip key={c}>{c}</Chip>
                ))}
              </div>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 font-serif text-base leading-snug text-muted-foreground">
                <li>
                  Editor de <i>Fígado e Coração: Amor &amp; Superação</i>, de Tati Rocha (1ª e 2ª
                  edições)
                </li>
                <li>
                  Autor de <i>Cartas de Adão: Poemas &amp; Contos</i> (2005)
                </li>
                <li>
                  Editor, com Tati Rocha, de{' '}
                  <i>O Direito à Vida: Ensaios sobre a Doação de Órgãos</i> (OAB Águas Claras/DF,
                  2026), com assessoria editorial da APO
                </li>
                <li>
                  Editor-assistente do <i>Anuário da Advocacia Pública do Brasil</i> (Consultor
                  Jurídico, 2014)
                </li>
              </ul>
            </CartaoEquipe>
            <CartaoEquipe dados={trajetoriaTati}>
              <div className="flex items-center gap-4">
                <img
                  src="/equipe/tati.jpg"
                  alt="Tati Rocha"
                  className="h-24 w-24 rounded-full object-cover"
                />
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-wider text-primary">
                    Editora-assistente
                  </p>
                  <h3 className="font-display text-2xl font-semibold">Tati Rocha</h3>
                </div>
              </div>
              <p className="mt-4 font-serif text-lg leading-snug">
                De Brasília, formada em Letras, professora e terapeuta integrativa. Escritora e
                palestrante, autora de <i>Fígado e Coração</i>, seu primeiro livro. Apoia a equipe
                editorial e acolhe autores estreantes.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['Crônicas e relatos', 'Autores estreantes', 'Apoio editorial'].map((c) => (
                  <Chip key={c}>{c}</Chip>
                ))}
              </div>
              <ul className="mt-4 list-disc space-y-1.5 pl-5 font-serif text-base leading-snug text-muted-foreground">
                <li>
                  Editora e coordenadora editorial de <i>O Direito à Vida</i> (OAB Águas Claras/DF,
                  2026)
                </li>
                <li>
                  Vive o processo editorial dos dois lados: como autora e como parte da equipe
                </li>
                <li>
                  <i>Fígado e Coração</i> nasceu de uma história real de doação de órgãos e
                  superação
                </li>
              </ul>
            </CartaoEquipe>
          </div>
          <p className="mt-6 border-l-2 border-primary pl-4 font-serif text-base text-muted-foreground">
            Cada obra é conduzida por um editor da APO, com a colaboração de Inteligência Artificial
            em etapas do trabalho.
          </p>
        </div>
      </section>

      <section id="obras" className="mx-auto max-w-6xl px-6 py-16">
        <Rotulo>Experiência editorial</Rotulo>
        <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight">
          Obras e áreas de atuação
        </h2>
        <p className="mt-3 font-serif text-lg text-muted-foreground">
          Alguns trabalhos que mostram a nossa experiência com diferentes tipos de texto.
        </p>
        <div
          className="mb-8 mt-6 flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrar obras por área"
        >
          {filtros.map(([id, nome]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filtro === id}
              onClick={() => setFiltro(id)}
              className={`rounded-full border px-4 py-2 font-sans text-sm font-medium ${
                filtro === id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-foreground/25 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {nome}
            </button>
          ))}
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {visiveis.map((o) => (
            <article key={o.capa} className="flex gap-5 bg-card p-5">
              <img
                src={o.capa}
                alt={o.alt}
                className="h-56 w-auto flex-none self-start shadow-[0_8px_20px_rgba(28,26,23,0.25)]"
              />
              <div className="min-w-0">
                <p className="font-sans text-xs font-semibold uppercase tracking-wider text-primary">
                  {o.ano}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold leading-tight">
                  {o.titulo}
                </h3>
                <p className="mt-2 font-serif text-base leading-snug">{o.desc}</p>
                <dl className="mt-3 space-y-0.5 font-sans text-xs text-muted-foreground">
                  {o.creditos.map(([k, v]) => (
                    <div key={k} className="flex gap-1.5">
                      <dt className="font-semibold">{k}:</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="raio-x" className="bg-[hsl(150_31%_18%)] py-16 text-[hsl(39_43%_93%)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-6">
          <div className="min-w-0 flex-1 basis-[28rem]">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Próximo passo
            </p>
            <h2 className="mt-2 font-display text-4xl font-extrabold leading-tight">
              Comece pelo Raio-X, ou fale com um editor
            </h2>
            <p className="mt-3 font-serif text-xl opacity-80">
              Sem compromisso. Se a sua obra pedir mais, indicamos o melhor caminho.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 font-sans text-base font-semibold">
            <a
              href="#raio-x"
              className="rounded bg-accent px-7 py-[18px] text-accent-foreground hover:opacity-90"
            >
              Fazer o Raio-X gratuito
            </a>
            <a
              href="#contato"
              className="rounded border-[1.5px] border-[hsl(39_43%_93%)] px-7 py-4 hover:bg-white/10"
            >
              Falar com um editor
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
