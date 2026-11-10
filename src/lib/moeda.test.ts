/**
 * Testes unitários para o módulo de conversão monetária reais ↔ centavos.
 * Critério de aceite:
 * Provar que R$ 12,50 -> 1250 e 1250 -> "R$ 12,50".
 */

import { centavosParaReaisFormatado, centavosParaReaisNumero, reaisParaCentavos } from './moeda'

export function executarTestesMoeda(): {
  sucesso: boolean
  total: number
  falhas: number
  resultados: Array<{ descricao: string; passou: boolean; esperado: unknown; obtido: unknown }>
} {
  const casos = [
    {
      descricao: 'R$ 12,50 vira 1250 centavos',
      fn: () => reaisParaCentavos('R$ 12,50'),
      esperado: 1250,
    },
    {
      descricao: '"12,50" vira 1250 centavos',
      fn: () => reaisParaCentavos('12,50'),
      esperado: 1250,
    },
    {
      descricao: '12.50 numérico vira 1250 centavos',
      fn: () => reaisParaCentavos(12.5),
      esperado: 1250,
    },
    {
      descricao: '1250 centavos vira "R$ 12,50"',
      fn: () => centavosParaReaisFormatado(1250),
      esperado: 'R$ 12,50',
    },
    {
      descricao: '1250 centavos sem símbolo vira "12,50"',
      fn: () => centavosParaReaisFormatado(1250, false),
      esperado: '12,50',
    },
    {
      descricao: '1250 centavos como número vira 12.5 reais',
      fn: () => centavosParaReaisNumero(1250),
      esperado: 12.5,
    },
    {
      descricao: '0 centavos vira "R$ 0,00"',
      fn: () => centavosParaReaisFormatado(0),
      esperado: 'R$ 0,00',
    },
    {
      descricao: 'Valores com milhar "R$ 1.250,00" vira 125000 centavos',
      fn: () => reaisParaCentavos('R$ 1.250,00'),
      esperado: 125000,
    },
    {
      descricao: '125000 centavos vira "R$ 1.250,00"',
      fn: () => centavosParaReaisFormatado(125000),
      esperado: 'R$ 1.250,00',
    },
  ]

  let falhas = 0
  const resultados = casos.map((c) => {
    const obtido = c.fn()
    const passou = obtido === c.esperado
    if (!passou) falhas++
    return {
      descricao: c.descricao,
      passou,
      esperado: c.esperado,
      obtido,
    }
  })

  return {
    sucesso: falhas === 0,
    total: casos.length,
    falhas,
    resultados,
  }
}
