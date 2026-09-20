// Conversion nombre → texte en portugais (Portugal), pour les montants
// "por extenso" exigés dans les contrats légaux (CMI).

const UNITS = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove']
const TEENS = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezasseis', 'dezassete', 'dezoito', 'dezanove']
const TENS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa']
const HUNDREDS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos']

function twoDigitsToWords(n: number): string {
  if (n === 0) return ''
  if (n < 10) return UNITS[n]
  if (n < 20) return TEENS[n - 10]
  const t = Math.floor(n / 10)
  const u = n % 10
  return u === 0 ? TENS[t] : `${TENS[t]} e ${UNITS[u]}`
}

function threeDigitsToWords(n: number): string {
  if (n === 0) return ''
  if (n === 100) return 'cem'
  const h = Math.floor(n / 100)
  const rest = n % 100
  const hWord = h > 0 ? HUNDREDS[h] : ''
  const restWord = twoDigitsToWords(rest)
  if (h > 0 && rest > 0) return `${hWord} e ${restWord}`
  return hWord || restWord
}

export function numberToPortugueseWords(value: number): string {
  const n = Math.round(Math.abs(value))
  if (n === 0) return 'zero'

  const millions = Math.floor(n / 1_000_000)
  const thousands = Math.floor((n % 1_000_000) / 1000)
  const rest = n % 1000

  const parts: string[] = []
  if (millions > 0) {
    parts.push(millions === 1 ? 'um milhão' : `${threeDigitsToWords(millions)} milhões`)
  }
  if (thousands > 0) {
    parts.push(thousands === 1 ? 'mil' : `${threeDigitsToWords(thousands)} mil`)
  }
  if (rest > 0) {
    parts.push(threeDigitsToWords(rest))
  }
  if (parts.length === 0) return 'zero'
  if (parts.length === 1) return parts[0]
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`
}

export function priceInWords(value: number): string {
  return `${numberToPortugueseWords(value)} Euros`
}

export function percentInWords(value: number): string {
  if (Number.isInteger(value)) return `${numberToPortugueseWords(value)} por cento`
  return `${value.toString().replace('.', ',')} por cento`
}
