import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { getErrorMessage } from '@/lib/pocketbase/errors'

type Passo = 1 | 2 | 3 | 4

const GENEROS = ['Contos', 'Crônicas e relatos', 'Poesia', 'Romance', 'Jurídico', 'Não ficção', 'Outro']
const OBJETIVOS = ['Publicar com a APO', 'Melhorar o texto antes de publicar', 'Entender se a obra está pronta']
const ESTAGIOS = ['Primeira versão', 'Já revisei sozinho(a)', 'Já passou por revisão profissional']

const campo =
  'w-full rounded-md border border-border bg-card px-3 py-2.5 font-sans text-base text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary'

function Campo({ rotulo, ajuda, children }: { rotulo: string; ajuda?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-sans text-sm font-medium text-foreground">{rotulo}</span>
      {children}
      {ajuda && <span className="mt-1 block font-sans text-xs text-muted-foreground">{ajuda}</span>}
    </label>
  )
}

interface ResultadoRaioX {
  resumo?: string
  nota?: number | string
  pontos_fortes?: string[]
  ajustes?: string[]
  [k: string]: unknown
}

export default function RaioX() {
  const [passo, setPasso] = useState<Passo>(pb.authStore.isValid ? 2 : 1)
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  // passo 1
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [modoEntrar, setModoEntrar] = useState(false)
  // passo 2
  const [titulo, setTitulo] = useState('')
  const [genero, setGenero] = useState(GENEROS[0])
  const [sinopse, setSinopse] = useState('')
  const [objetivo, setObjetivo] = useState(OBJETIVOS[0])
  const [estagio, setEstagio] = useState(ESTAGIOS[0])
  const [publico, setPublico] = useState('')
  // passo 3
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [aceite, setAceite] = useState(false)
  // passo 4
  const [obraId, setObraId] = useState('')
  const [resultado, setResultado] = useState<ResultadoRaioX | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearInterval(timer.current), [])

  async function garantirAutor(nomeCompleto: string): Promise<string> {
    const uid = pb.authStore.record?.id as string
    try {
      const a = await pb.collection('autores').getFirstListItem(`usuario = "${uid}"`)
      return a.id
    } catch {
      const a = await pb.collection('autores').create({ usuario: uid, nome_completo: nomeCompleto })
      return a.id
    }
  }

  async function conta(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      if (modoEntrar) {
        await pb.collection('users').authWithPassword(email, senha)
      } else {
        await pb.collection('users').create({
          email,
          password: senha,
          passwordConfirm: senha,
          name: nome,
          role: 'autor',
        })
        await pb.collection('users').authWithPassword(email, senha)
        await garantirAutor(nome)
      }
      setPasso(2)
    } catch (err) {
      setErro(getErrorMessage(err))
    } finally {
      setEnviando(false)
    }
  }

  function obra(e: FormEvent) {
    e.preventDefault()
    setErro('')
    setPasso(3)
  }

  function acompanhar(id: string) {
    const buscar = async () => {
      try {
        const r = await pb.collection('raio_x').getFirstListItem(`obra = "${id}"`, { sort: '-created' })
        setResultado((r.resultado as ResultadoRaioX) ?? {})
        window.clearInterval(timer.current)
      } catch {
        /* ainda em análise */
      }
    }
    void buscar()
    timer.current = window.setInterval(buscar, 6000)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!arquivo) return setErro('Escolha o arquivo do manuscrito.')
    if (!aceite) return setErro('É preciso aceitar o uso do manuscrito para a análise.')
    setErro('')
    setEnviando(true)
    try {
      const nomeCompleto = (pb.authStore.record?.name as string) || nome || 'Autor'
      const autorId = await garantirAutor(nomeCompleto)
      const o = await pb.collection('obras').create({ autor: autorId, titulo, genero, sinopse, estado: 'questionario' })
      await pb.collection('questionarios').create({
        obra: o.id,
        versao: '1',
        concluido: true,
        respostas: { objetivo, estagio, publico },
      })
      const fd = new FormData()
      fd.append('obra', o.id)
      fd.append('tipo', 'manuscrito')
      fd.append('arquivo', arquivo)
      await pb.collection('arquivos').create(fd)
      setObraId(o.id)
      setPasso(4)
      acompanhar(o.id)
    } catch (err) {
      setErro(getErrorMessage(err))
    } finally {
      setEnviando(false)
    }
  }

  const etapas = ['Sua conta', 'Sua obra', 'Manuscrito', 'Raio-X']

  return (
    <section className="bg-background py-14">
      <div className="mx-auto max-w-2xl px-5">
        <p className="font-sans text-xs font-semibold uppercase tracking-widest text-terracota">Raio-X gratuito</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Conte sobre a sua obra e envie o manuscrito</h1>
        <p className="mt-3 font-serif text-lg text-foreground/80">
          Em poucos minutos você recebe uma análise automática prévia, sem custo: nota de prontidão, pontos fortes e
          ajustes. Depois, um editor da APO pode aprofundar.
        </p>

        <ol className="mt-8 flex gap-2 font-sans text-xs">
          {etapas.map((r, i) => (
            <li
              key={r}
              className={`flex-1 border-t-2 pt-2 ${passo === i + 1 ? 'border-primary font-semibold text-primary' : passo > i + 1 ? 'border-primary/50 text-foreground/70' : 'border-border text-muted-foreground'}`}
            >
              {i + 1}. {r}
            </li>
          ))}
        </ol>

        {erro && (
          <p role="alert" className="mt-6 rounded-md border border-terracota/40 bg-card px-4 py-3 font-sans text-sm text-terracota">
            {erro}
          </p>
        )}

        {passo === 1 && (
          <form onSubmit={conta} className="mt-8 space-y-5">
            {!modoEntrar && (
              <Campo rotulo="Nome completo">
                <input className={campo} required minLength={2} value={nome} onChange={(e) => setNome(e.target.value)} />
              </Campo>
            )}
            <Campo rotulo="E-mail">
              <input className={campo} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Campo>
            <Campo rotulo="Senha" ajuda={modoEntrar ? undefined : 'Mínimo de 8 caracteres.'}>
              <input
                className={campo}
                type="password"
                required
                minLength={8}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />
            </Campo>
            <button disabled={enviando} className="rounded-md bg-primary px-6 py-3 font-sans font-medium text-primary-foreground disabled:opacity-60">
              {enviando ? 'Aguarde…' : modoEntrar ? 'Entrar' : 'Criar conta e continuar'}
            </button>
            <button type="button" onClick={() => setModoEntrar(!modoEntrar)} className="ml-4 font-sans text-sm text-primary underline">
              {modoEntrar ? 'Ainda não tenho conta' : 'Já tenho conta'}
            </button>
          </form>
        )}

        {passo === 2 && (
          <form onSubmit={obra} className="mt-8 space-y-5">
            <Campo rotulo="Título da obra (provisório, se for o caso)">
              <input className={campo} required value={titulo} onChange={(e) => setTitulo(e.target.value)} />
            </Campo>
            <Campo rotulo="Gênero">
              <select className={campo} value={genero} onChange={(e) => setGenero(e.target.value)}>
                {GENEROS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Sobre o que é a obra?" ajuda="Duas ou três frases bastam.">
              <textarea className={campo} rows={4} maxLength={4000} value={sinopse} onChange={(e) => setSinopse(e.target.value)} />
            </Campo>
            <Campo rotulo="O que você quer com o Raio-X?">
              <select className={campo} value={objetivo} onChange={(e) => setObjetivo(e.target.value)}>
                {OBJETIVOS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Em que ponto está o texto?">
              <select className={campo} value={estagio} onChange={(e) => setEstagio(e.target.value)}>
                {ESTAGIOS.map((g) => <option key={g}>{g}</option>)}
              </select>
            </Campo>
            <Campo rotulo="Quem você imagina como leitor?">
              <input className={campo} value={publico} onChange={(e) => setPublico(e.target.value)} />
            </Campo>
            <button className="rounded-md bg-primary px-6 py-3 font-sans font-medium text-primary-foreground">Continuar</button>
          </form>
        )}

        {passo === 3 && (
          <form onSubmit={enviar} className="mt-8 space-y-5">
            <Campo rotulo="Manuscrito" ajuda="PDF, Word (.doc, .docx), RTF, TXT ou EPUB, até 25 MB.">
              <input
                className={campo}
                type="file"
                accept=".pdf,.doc,.docx,.rtf,.txt,.epub"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
            </Campo>
            <label className="flex items-start gap-3 font-sans text-sm text-foreground/80">
              <input type="checkbox" className="mt-1" checked={aceite} onChange={(e) => setAceite(e.target.checked)} />
              <span>
                Autorizo o uso do manuscrito para gerar a análise automática prévia. O texto é privado: só eu e os
                editores da APO temos acesso.
              </span>
            </label>
            <button disabled={enviando} className="rounded-md bg-primary px-6 py-3 font-sans font-medium text-primary-foreground disabled:opacity-60">
              {enviando ? 'Enviando…' : 'Enviar e gerar o Raio-X'}
            </button>
            <button type="button" onClick={() => setPasso(2)} className="ml-4 font-sans text-sm text-primary underline">
              Voltar
            </button>
          </form>
        )}

        {passo === 4 && (
          <div className="mt-8" data-obra={obraId}>
            {!resultado ? (
              <div className="rounded-lg border border-border bg-card p-6">
                <h2 className="font-display text-2xl">Recebemos a sua obra</h2>
                <p className="mt-2 font-serif text-lg text-foreground/80">
                  O Raio-X está sendo preparado. Esta página se atualiza sozinha quando ele ficar pronto.
                </p>
              </div>
            ) : (
              <div className="space-y-5 rounded-lg border border-border bg-card p-6">
                <p className="font-sans text-xs font-semibold uppercase tracking-widest text-terracota">
                  Análise automática prévia
                </p>
                <h2 className="font-display text-2xl">Raio-X de “{titulo}”</h2>
                {resultado.nota !== undefined && (
                  <p className="font-sans text-sm">Nota de prontidão: <strong className="text-lg">{String(resultado.nota)}</strong></p>
                )}
                {resultado.resumo && <p className="font-serif text-lg">{resultado.resumo}</p>}
                {!!resultado.pontos_fortes?.length && (
                  <div>
                    <h3 className="font-display text-lg">Pontos fortes</h3>
                    <ul className="mt-1 list-disc pl-5 font-serif">{resultado.pontos_fortes.map((p) => <li key={p}>{p}</li>)}</ul>
                  </div>
                )}
                {!!resultado.ajustes?.length && (
                  <div>
                    <h3 className="font-display text-lg">Ajustes sugeridos</h3>
                    <ul className="mt-1 list-disc pl-5 font-serif">{resultado.ajustes.map((p) => <li key={p}>{p}</li>)}</ul>
                  </div>
                )}
                <p className="font-sans text-xs text-muted-foreground">
                  Este diagnóstico é automático e prévio. O parecer de um editor da APO é a etapa seguinte.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
