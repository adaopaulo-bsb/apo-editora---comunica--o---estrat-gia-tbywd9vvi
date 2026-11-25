/* Home pública da APO Editora: identidade "Papel e Cerrado" */

const etapas = [
  ['Raio-X', 'Gratuito. Uma leitura inicial da sua obra, com faixas de preço e prazo.'],
  ['Parecer', 'Um editor lê o texto e diz com franqueza o que a obra precisa.'],
  ['Preparação', 'Revisão e edição do texto, no nível que a obra pede.'],
  ['Projeto gráfico', 'Capa, miolo e diagramação, com ISBN e ficha catalográfica.'],
  ['Publicação', 'Livro pronto. Impressão sob consulta, com orçamento de gráficas.'],
]

const obras = [
  { capa: '/capas/fc2.jpg', titulo: 'Fígado e Coração', info: 'Crônicas · 2ª edição' },
  { capa: '/capas/fc1.jpg', titulo: 'Fígado e Coração', info: 'Crônicas · 1ª edição' },
  { capa: '/capas/cartas.jpg', titulo: 'Cartas de Adão', info: 'Poemas e contos' },
  { capa: '/capas/dv.jpg', titulo: 'O Direito à Vida', info: 'Jurídico · OAB Águas Claras/DF' },
  {
    capa: '/capas/anuario.jpg',
    titulo: 'Anuário da Advocacia Pública',
    info: 'Jornalismo e Jurídico',
  },
]

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

export default function Home() {
  return (
    <>
      <section className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-6 pb-10 pt-16">
        <div className="min-w-0 flex-1 basis-[420px]">
          <Rotulo>Editora autônoma · Brasília</Rotulo>
          <h1 className="mt-4 font-display text-5xl font-extrabold leading-none tracking-tight md:text-7xl">
            Seu livro, do texto{' '}
            <span className="bg-[linear-gradient(transparent_60%,hsl(var(--accent))_60%)]">
              à estante.
            </span>
          </h1>
          <p className="mt-6 max-w-lg font-serif text-xl leading-relaxed text-muted-foreground">
            Parecer, revisão, capa e publicação conduzidos por editores de verdade, com apoio de
            inteligência artificial nas etapas em que ela ajuda.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 font-sans text-[15px] font-semibold">
            <a
              href="#raio-x"
              className="rounded bg-primary px-6 py-4 text-primary-foreground hover:opacity-90"
            >
              Fazer o Raio-X gratuito
            </a>
            <a
              href="#obras"
              className="rounded border-[1.5px] border-foreground px-6 py-[14px] hover:bg-secondary"
            >
              Ver obras publicadas
            </a>
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

      <section id="como-funciona" className="mx-auto flex max-w-6xl flex-wrap gap-14 px-6 py-14">
        <div className="min-w-0 flex-1 basis-80">
          <Rotulo>Como funciona</Rotulo>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight">
            Cinco camadas. Você contrata só até onde quiser.
          </h2>
          <p className="mt-4 font-serif text-lg leading-relaxed text-muted-foreground">
            Preço e prazo vêm de tabelas editáveis e aparecem antes da decisão. Ninguém compra o
            pacote inteiro por obrigação.
          </p>
        </div>
        <ol className="min-w-0 flex-[1.4] basis-[28rem]">
          {etapas.map(([nome, texto], i) => (
            <li key={nome} className="flex gap-5 border-t border-foreground/20 py-5">
              <span className="w-12 font-display text-3xl font-extrabold leading-none text-primary">
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold">{nome}</h3>
                <p className="mt-1 font-serif text-lg leading-snug text-muted-foreground">
                  {texto}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section id="obras" className="bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-6">
          <Rotulo>Experiência editorial</Rotulo>
          <h2 className="mb-9 mt-3 font-display text-4xl font-extrabold">Obras que conduzimos</h2>
          <div className="flex flex-wrap items-end gap-7">
            {obras.map((o, i) => (
              <figure key={o.capa} className="min-w-0 flex-1 basis-36">
                <div className="flex h-72 items-end justify-center">
                  <img
                    src={o.capa}
                    alt={`Capa de ${o.titulo}${i < 2 ? `, ${o.info.split(' · ')[1]}` : ''}`}
                    className="max-h-72 max-w-full shadow-[0_10px_24px_rgba(28,26,23,0.28)]"
                  />
                </div>
                <figcaption className="mt-3">
                  <span className="block font-display text-lg font-semibold">{o.titulo}</span>
                  <span className="font-sans text-xs font-medium text-muted-foreground">
                    {o.info}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section
        id="equipe"
        className="mx-auto flex max-w-6xl flex-wrap items-center gap-12 px-6 py-16"
      >
        <div className="min-w-0 flex-1 basis-72">
          <Rotulo>Equipe</Rotulo>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight">
            Duas pessoas, olho em cada texto.
          </h2>
        </div>
        <div className="flex min-w-0 flex-[2] basis-[30rem] flex-wrap gap-8">
          {[
            ['/equipe/adao.jpg', 'Adão Paulo Oliveira', 'Editor. Jornalista e psicólogo.'],
            ['/equipe/tati.jpg', 'Tati Rocha', 'Editora-assistente. Professora e autora.'],
          ].map(([foto, nome, papel]) => (
            <div key={nome} className="flex flex-1 basis-60 items-center gap-4">
              <img src={foto} alt={nome} className="h-28 w-28 rounded-full object-cover" />
              <div>
                <p className="font-display text-xl font-semibold">{nome}</p>
                <p className="font-serif text-base text-muted-foreground">{papel}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="raio-x" className="bg-[hsl(150_31%_18%)] py-16 text-[hsl(39_43%_93%)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-8 px-6">
          <div className="min-w-0 flex-1 basis-[28rem]">
            <h2 className="font-display text-4xl font-extrabold leading-tight">
              Quanto custa levar seu texto até o livro?
            </h2>
            <p className="mt-3 font-serif text-xl opacity-80">
              O Raio-X é gratuito e mostra faixas de preço e prazo por etapa.
            </p>
          </div>
          <a
            href="#raio-x"
            className="rounded bg-accent px-8 py-[18px] font-sans text-base font-semibold text-accent-foreground hover:opacity-90"
          >
            Começar o Raio-X
          </a>
        </div>
      </section>
    </>
  )
}
