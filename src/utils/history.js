import { isCurrencyCode, isISODate, normalizeCurrencyCode } from './validation.js'

export const MAX_HISTORY = 8

// Valida o histórico salvo no localStorage antes de exibir
export function sanitizeHistory(value) {
  if (!Array.isArray(value)) return []

  const seen = new Set()
  const entries = []

  for (const item of value) {
    if (!item || typeof item !== 'object') continue
    if (!isCurrencyCode(item.from) || !isCurrencyCode(item.to)) continue

    const amount = Number(item.amount)
    const rate = Number(item.rate)
    if (!Number.isFinite(amount) || amount <= 0) continue
    if (!Number.isFinite(rate) || rate <= 0) continue
    if (typeof item.at !== 'string' || Number.isNaN(Date.parse(item.at))) continue
    if (!isISODate(item.at.slice(0, 10))) continue

    const from = normalizeCurrencyCode(item.from, 'USD')
    const to = normalizeCurrencyCode(item.to, 'BRL')
    const key = `${from}|${to}|${amount}|${item.at}`
    if (seen.has(key)) continue

    seen.add(key)
    entries.push({
      id: typeof item.id === 'string' && item.id ? item.id : key,
      at: item.at,
      from,
      to,
      amount,
      rate,
    })

    if (entries.length >= MAX_HISTORY) break
  }

  return entries
}
