// Símbolos monetários para exibição
export const CURRENCY_SYMBOLS = {
  AUD: 'A$', BRL: 'R$', CAD: 'C$', CHF: 'CHF', CNY: '¥', CZK: 'Kč',
  DKK: 'kr', EUR: '€', GBP: '£', HKD: 'HK$', HUF: 'Ft', IDR: 'Rp',
  ILS: '₪', INR: '₹', ISK: 'kr', JPY: '¥', KRW: '₩', MXN: 'MX$',
  MYR: 'RM', NOK: 'kr', NZD: 'NZ$', PHP: '₱', PLN: 'zł', RON: 'lei',
  SEK: 'kr', SGD: 'S$', THB: '฿', TRY: '₺', USD: '$', ZAR: 'R',
}

// Nomes em português para as moedas suportadas pela Frankfurter API
export const CURRENCY_NAMES_PT = {
  AUD: 'Dólar Australiano', BRL: 'Real Brasileiro', CAD: 'Dólar Canadense',
  CHF: 'Franco Suíço', CNY: 'Yuan Chinês', CZK: 'Coroa Tcheca',
  DKK: 'Coroa Dinamarquesa', EUR: 'Euro', GBP: 'Libra Esterlina',
  HKD: 'Dólar de Hong Kong', HUF: 'Forint Húngaro', IDR: 'Rupia Indonésia',
  ILS: 'Shekel Israelense', INR: 'Rupia Indiana', ISK: 'Coroa Islandesa',
  JPY: 'Iene Japonês', KRW: 'Won Sul-Coreano', MXN: 'Peso Mexicano',
  MYR: 'Ringgit Malaio', NOK: 'Coroa Norueguesa', NZD: 'Dólar Neozelandês',
  PHP: 'Peso Filipino', PLN: 'Zlóti Polonês', RON: 'Leu Romeno',
  SEK: 'Coroa Sueca', SGD: 'Dólar de Singapura', THB: 'Baht Tailandês',
  TRY: 'Lira Turca', USD: 'Dólar Americano', ZAR: 'Rand Sul-Africano',
}

// Lista de emergência, usada caso a API de moedas falhe ou ainda esteja carregando
export const FALLBACK_CURRENCIES = Object.keys(CURRENCY_NAMES_PT)
  .sort()
  .map((code) => ({ code, name: CURRENCY_NAMES_PT[code] }))

export function currencyName(code, apiName) {
  return CURRENCY_NAMES_PT[code] ?? apiName ?? code
}

export function currencyPrefix(code) {
  const symbol = CURRENCY_SYMBOLS[code] ?? code
  return symbol.length > 1 ? `${symbol} ` : symbol
}

export function formatNumber(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return '-'
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

// Quantidade de casas decimais adequada à magnitude da taxa
export function rateDigits(value) {
  const abs = Math.abs(value)
  if (abs >= 100) return 2
  if (abs >= 1) return 4
  if (abs >= 0.01) return 6
  return 8
}

export function formatRate(value) {
  if (value == null || Number.isNaN(value)) return '-'
  return formatNumber(value, rateDigits(value))
}

export function formatAmount(value, code) {
  return `${currencyPrefix(code)}${formatNumber(value, 2)}`
}

export function formatSignedPercent(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return '-'
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatNumber(value, digits)}%`
}

export function formatDate(iso) {
  if (!iso) return '-'
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

export function formatDateShort(iso) {
  if (!iso) return '-'
  const [, month, day] = iso.split('-')
  return `${day}/${month}`
}

// Aceita "1234.56" e "1.234,56" e devolve 1234.56
export function parseAmount(raw) {
  let text = String(raw).trim()
  if (text.includes(',')) {
    text = text.replace(/\./g, '').replace(',', '.')
  }
  const parsed = Number.parseFloat(text)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}
