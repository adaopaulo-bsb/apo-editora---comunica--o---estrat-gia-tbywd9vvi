/* Falar com um editor: escolha entre os dois editores e abra o WhatsApp */
import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const editores = [
  { nome: 'Adão Paulo Oliveira', papel: 'Editor', telefone: '5561999656652' },
  { nome: 'Tati Rocha', papel: 'Editora-assistente', telefone: '5561999395260' },
]

const mensagem = 'Olá! Vim pelo site da APO Editora e gostaria de falar sobre a minha obra.'

export default function FalarComEditor({ children }: { children: ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-extrabold">Falar com um editor</DialogTitle>
          <DialogDescription className="font-serif text-base text-muted-foreground">
            Escolha com quem você quer conversar. A conversa abre no WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {editores.map((e) => (
            <a
              key={e.telefone}
              href={`https://wa.me/${e.telefone}?text=${encodeURIComponent(mensagem)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-border bg-card p-4 hover:bg-secondary"
            >
              <span className="block font-sans text-xs font-semibold uppercase tracking-wider text-terracota">
                {e.papel}
              </span>
              <span className="block font-display text-xl font-semibold">{e.nome}</span>
              <span className="font-sans text-sm text-muted-foreground">Conversar no WhatsApp</span>
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
