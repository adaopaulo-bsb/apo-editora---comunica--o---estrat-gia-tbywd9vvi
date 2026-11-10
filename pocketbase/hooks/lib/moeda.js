// Utilitário de moeda para o backend PocketBase (JS goja)
// Conversão reais ↔ centavos com arredondamento seguro.

function reaisParaCentavos(valor) {
  if (valor === null || valor === undefined) return 0
  if (typeof valor === 'number') {
    if (isNaN(valor)) return 0
    return Math.round(valor * 100)
  }
  var str = String(valor)
    .trim()
    .replace(/[R$\s]/g, '')
  if (!str) return 0
  if (str.indexOf(',') !== -1 && str.indexOf('.') !== -1) {
    if (str.indexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.')
    } else {
      str = str.replace(/,/g, '')
    }
  } else if (str.indexOf(',') !== -1) {
    str = str.replace(',', '.')
  }
  var n = parseFloat(str)
  return isNaN(n) ? 0 : Math.round(n * 100)
}

function centavosParaReaisFormatado(centavos, incluirSimbolo) {
  if (centavos === null || centavos === undefined || isNaN(centavos)) {
    return incluirSimbolo === false ? '0,00' : 'R$ 0,00'
  }
  var v = centavos / 100
  var partes = v.toFixed(2).split('.')
  var inteiro = partes[0]
  var dec = partes[1]
  inteiro = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  var res = inteiro + ',' + dec
  return incluirSimbolo === false ? res : 'R$ ' + res
}

function centavosParaReaisNumero(centavos) {
  if (centavos === null || centavos === undefined || isNaN(centavos)) return 0
  return centavos / 100
}
