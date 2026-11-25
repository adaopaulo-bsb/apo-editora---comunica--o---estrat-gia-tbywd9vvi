/* Layout: cabeçalho e rodapé do site público da APO Editora */
import { Link, Outlet } from 'react-router-dom'

const links = [
  { href: '/#como-funciona', rotulo: 'Como funciona' },
  { href: '/#obras', rotulo: 'Obras' },
  { href: '/#equipe', rotulo: 'Equipe' },
]

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 -rotate-6 items-center justify-center rounded-full border-2 border-primary font-display text-[13px] font-extrabold text-primary"
            >
              APO
            </span>
            <span className="font-display text-2xl font-extrabold">APO Editora</span>
          </Link>
          <nav
            aria-label="Principal"
            className="flex flex-wrap items-center gap-6 font-sans text-sm font-medium text-muted-foreground"
          >
            {links.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-foreground">
                {l.rotulo}
              </a>
            ))}
            <a
              href="/#raio-x"
              className="rounded bg-primary px-5 py-2.5 text-primary-foreground hover:opacity-90"
            >
              Raio-X gratuito
            </a>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="bg-[hsl(150_31%_18%)] text-[hsl(39_43%_93%)]">
        <div className="mx-auto max-w-6xl px-6 py-10 font-sans text-sm">
          <p className="font-display text-xl font-extrabold">APO Editora</p>
          <p className="mt-2 max-w-xl font-serif text-base opacity-80">
            Uma iniciativa da APO Comunicação &amp; Estratégia. Cada obra é conduzida por um editor,
            com apoio de inteligência artificial em etapas do trabalho.
          </p>
        </div>
      </footer>
    </div>
  )
}
