const CURRENCY_CODE = /^[A-Z]{3}$/
const AMOUNT_SHAPE = /^\d{0,12}([.,]\d{0,6})?$/
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

export function isCurrencyCode(value) {
  return typeof value === 'string' && CURRENCY_CODE.test(value.trim().toUpperCase())
}

// Confere formato e existência da data no calendário
export function isISODate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function normalizeCurrencyCode(value, fallback) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : ''
  return CURRENCY_CODE.test(code) ? code : fallback
}

// Aceita apenas pares válidos, remove duplicados e limita o total salvo
export function sanitizeFavorites(value) {
  if (!Array.isArray(value)) return []

  const seen = new Set()
  const favorites = []
  for (const item of value) {
    if (!item || !isCurrencyCode(item.from) || !isCurrencyCode(item.to)) continue

    const from = item.from.trim().toUpperCase()
    const to = item.to.trim().toUpperCase()
    const key = `${from}/${to}`
    if (seen.has(key)) continue

    seen.add(key)
    favorites.push({ from, to })
  }
  return favorites.slice(-8)
}

// Mantém números e no máximo um separador decimal. Valores colados com
// separador de milhar (1.234,56 ou 1.234.567) são normalizados.
export function sanitizeAmountInput(raw) {
  let text = String(raw ?? '').replace(/[^\d.,]/g, '')
  if (!text) return ''
  // Um separador sozinho não representa um valor válido
  if (!/\d/.test(text)) return null

  const lastComma = text.lastIndexOf(',')
  const lastDot = text.lastIndexOf('.')
  if (lastComma >= 0 && lastDot >= 0) {
    const decimal = lastComma > lastDot ? ',' : '.'
    const thousands = decimal === ',' ? '.' : ','
    text = text.split(thousands).join('')
  } else if (lastComma < 0 && /^\d{1,3}(\.\d{3})+$/.test(text)) {
    // Somente pontos, em grupos de três: é separador de milhar no padrão pt-BR
    text = text.replace(/\./g, '')
  }

  if ((text.match(/[.,]/g) ?? []).length > 1) return null
  if (text.length > 19) return null
  return AMOUNT_SHAPE.test(text) ? text : null
}
