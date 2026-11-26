/* Orçamento: faixas de referência de preço e prazo por serviço, em janela sobre a página */
import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/* Padrão de lauda usado nas faixas de preço. Alterar aqui ajusta o texto e o exemplo. */
const LAUDA = 1800
const fmt = (n: number) => n.toLocaleString('pt-BR')

type Linha = [servico: string, detalhe: string, preco: string, prazo: string]

const grupos: { titulo: string; linhas: Linha[] }[] = [
  {
    titulo: 'Parecer editorial',
    linhas: [
      [
        'Até 60 mil palavras',
        'Leitura completa por um editor, com relatório e preço fechado dos próximos serviços.',
        'R$ 290 a R$ 450',
        '3 a 5 dias úteis',
      ],
      ['De 60 a 120 mil palavras', '', 'R$ 450 a R$ 690', ''],
      ['Acima de 120 mil palavras', '', 'R$ 690 a R$ 890', ''],
    ],
  },
  {
    titulo: `Preparação do texto (por lauda de ${fmt(LAUDA)} caracteres, com espaços)`,
    linhas: [
      ['Nível 1: revisão', 'Correção ortográfica e gramatical.', 'R$ 9 a R$ 16 por lauda', ''],
      [
        'Nível 2: revisão com copydesk',
        'Revisão, padronização e clareza do texto.',
        'R$ 12 a R$ 25 por lauda',
        '8 a 15 dias úteis (obra de cerca de 170 laudas)',
      ],
      [
        'Nível 3: edição aprofundada',
        'Intervenção maior no texto, com o editor.',
        'R$ 25 a R$ 40 por lauda',
        '',
      ],
    ],
  },
  {
    titulo: 'Projeto gráfico',
    linhas: [
      ['Diagramação do miolo', '', 'R$ 6 a R$ 12 por página', '10 a 20 dias úteis (miolo e capa)'],
      ['Capa', '', 'R$ 600 a R$ 1.800', ''],
    ],
  },
  {
    titulo: 'Publicação',
    linhas: [
      ['ISBN e ficha catalográfica', 'Orçado à parte.', 'R$ 60 a R$ 150', '3 a 7 dias úteis'],
      [
        'Livro impresso',
        'Cotado com gráficas conforme formato, páginas e tiragem.',
        'Consulte valores',
        'Conforme a gráfica',
      ],
    ],
  },
]

export default function Orcamento({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl font-extrabold">Orçamento</DialogTitle>
          <DialogDescription className="font-serif text-base text-muted-foreground">
            Faixas de referência por serviço. O valor firme é definido depois do Parecer, que é
            descontado se você contratar a preparação do texto ou o projeto gráfico em até 15 dias.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {grupos.map((g) => (
            <section key={g.titulo}>
              <h3 className="border-b-2 border-terracota pb-1 font-display text-lg font-semibold">
                {g.titulo}
              </h3>
              {g.linhas.map(([servico, detalhe, preco, prazo]) => (
                <div
                  key={servico}
                  className="grid gap-1 border-b border-border py-3 sm:grid-cols-[1fr_auto] sm:gap-6"
                >
                  <div>
                    <p className="font-serif text-lg font-semibold leading-tight">{servico}</p>
                    {detalhe && (
                      <p className="font-serif text-sm text-muted-foreground">{detalhe}</p>
                    )}
                  </div>
                  <div className="font-sans text-sm sm:text-right">
                    <p className="font-semibold text-terracota">{preco}</p>
                    {prazo && <p className="text-muted-foreground">{prazo}</p>}
                  </div>
                </div>
              ))}
            </section>
          ))}
          <div className="bg-card p-4 font-serif text-base leading-snug">
            <p className="font-semibold">O que é uma lauda</p>
            <p className="mt-1 text-muted-foreground">
              Lauda é a unidade usada para medir o tamanho de um texto e calcular o trabalho de
              revisão e edição. Ela não equivale a uma página do livro. Aqui, cada lauda tem{' '}
              {fmt(LAUDA)} caracteres, contando os espaços. Cada profissional pode adotar outro
              padrão: em editoras literárias é comum cerca de 2.100 caracteres, no jornalismo 1.400
              e na tradução 1.250. Por isso informamos o nosso: um manuscrito de {fmt(170 * LAUDA)}{' '}
              caracteres tem 170 laudas.
            </p>
          </div>
          <div className="bg-card p-4 font-serif text-base leading-snug">
            <p className="font-semibold">
              Exemplo: obra de 170 laudas e 160 páginas, com revisão e copydesk (nível 2)
            </p>
            <p className="mt-1 text-muted-foreground">
              Total estimado, sem impressão: R$ 3.890 a R$ 8.420, em 21 a 40 dias úteis.
            </p>
          </div>
          <p className="font-serif text-sm text-muted-foreground">
            Os prazos contam a partir da aprovação do orçamento e do recebimento do material, com
            uma rodada de revisão do autor por etapa. Os valores são referências e podem mudar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
