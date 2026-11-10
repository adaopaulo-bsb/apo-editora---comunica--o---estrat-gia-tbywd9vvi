/**
 * Utilitário padrão do projeto APO Editora para conversão e formatação monetária (reais ↔ centavos).
 *
 * Regra do projeto:
 * - O banco armazena sempre centavos inteiros (inteiro >= 0).
 * - A interface exibe sempre em reais com formato brasileiro (ex.: "R$ 12,50").
 * - Funções puras, seguras contra erros de arredondamento de ponto flutuante.
 */

/**
 * Converte valor em reais (seja string ou número) para centavos inteiros.
 * Exemplos:
 *   reaisParaCentavos(12.50) -> 1250
 *   reaisParaCentavos("12,50") -> 1250
 *   reaisParaCentavos("R$ 12,50") -> 1250
 *   reaisParaCentavos("12.50") -> 1250
 */
export function reaisParaCentavos(valor: number | string | null | undefined): number {
  if (valor === null || valor === undefined) return 0

  if (typeof valor === 'number') {
    if (isNaN(valor) || !isFinite(valor)) return 0
    return Math.round(valor * 100)
  }

  const str = String(valor).trim()
  if (!str) return 0

  // Limpa símbolos monetários, espaços normais e non-breaking spaces
  const limpo = str.replace(/[R$\s\u00A0]/g, '')

  // Se houver vírgula e ponto:
  // caso "1.250,50": ponto é milhar, vírgula é decimal
  // caso "1,250.50": vírgula é milhar, ponto é decimal
  let normalizado: string
  if (limpo.includes(',') && limpo.includes('.')) {
    if (limpo.indexOf('.') < limpo.indexOf(',')) {
      normalizado = limpo.replace(/\./g, '').replace(',', '.')
    } else {
      normalizado = limpo.replace(/,/g, '')
    }
  } else if (limpo.includes(',')) {
    normalizado = limpo.replace(',', '.')
  } else {
    normalizado = limpo
  }

  const num = parseFloat(normalizado)
  if (isNaN(num) || !isFinite(num)) return 0

  return Math.round(num * 100)
}

/**
 * Converte centavos inteiros para string formatada em reais (pt-BR).
 * Exemplos:
 *   centavosParaReaisFormatado(1250) -> "R$ 12,50"
 *   centavosParaReaisFormatado(0) -> "R$ 0,00"
 *   centavosParaReaisFormatado(1250, false) -> "12,50"
 */
export function centavosParaReaisFormatado(
  centavos: number | null | undefined,
  incluirSimbolo = true,
): string {
  if (centavos === null || centavos === undefined || isNaN(centavos)) {
    return incluirSimbolo ? 'R$ 0,00' : '0,00'
  }

  const valorReais = centavos / 100
  const valorFormatado = valorReais.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  // Garantir espaço normal entre R$ e o valor
  return incluirSimbolo ? `R$ ${valorFormatado}` : valorFormatado
}

/**
 * Converte centavos inteiros para valor numérico em reais (float).
 * Exemplo: centavosParaReaisNumero(1250) -> 12.5
 */
export function centavosParaReaisNumero(centavos: number | null | undefined): number {
  if (centavos === null || centavos === undefined || isNaN(centavos)) return 0
  return centavos / 100
}
