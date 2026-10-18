import { TIMEFRAMES } from './dates.js'
import { parseAmount } from './format.js'
import {
  isCurrencyCode,
  normalizeCurrencyCode,
  sanitizeAmountInput,
} from './validation.js'

// Estado que pode ser compartilhado por link:
// ?from=USD&to=BRL&amount=1000&period=30d
export function readUrlState(search = window.location.search) {
  const params = new URLSearchParams(search)

  const rawFrom = params.get('from')
  const rawTo = params.get('to')
  const rawAmount = params.get('amount')
  const rawPeriod = params.get('period')

  const from = isCurrencyCode(rawFrom) ? normalizeCurrencyCode(rawFrom, null) : null
  const to = isCurrencyCode(rawTo) ? normalizeCurrencyCode(rawTo, null) : null

  let amount = null
  if (rawAmount != null && /^[\d.,]+$/.test(rawAmount.trim())) {
    const clean = sanitizeAmountInput(rawAmount)
    if (clean && parseAmount(clean) > 0) amount = clean
  }

  const period = TIMEFRAMES.some((item) => item.id === rawPeriod) ? rawPeriod : null

  return { from, to, amount, period }
}

// Monta a query string sem repetir os valores padrão
export function buildSearch({ from, to, amount, period }) {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)

  const cleanAmount = sanitizeAmountInput(amount)
  if (cleanAmount && parseAmount(cleanAmount) !== 100) params.set('amount', cleanAmount)

  if (period && period !== '30d') params.set('period', period)

  return params.toString()
}
