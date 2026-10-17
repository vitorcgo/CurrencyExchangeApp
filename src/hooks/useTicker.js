import { useEffect, useState } from 'react'
import { getTimeSeries } from '../api/frankfurter.js'
import { isoDaysAgo, todayISO } from '../utils/dates.js'

// Pares exibidos no ticker do cabeçalho, todos derivados do dólar (USD)
const TICKER_PAIRS = [
  { label: 'USD/BRL', code: 'BRL', invert: false },
  { label: 'EUR/USD', code: 'EUR', invert: true },
  { label: 'GBP/USD', code: 'GBP', invert: true },
  { label: 'AUD/USD', code: 'AUD', invert: true },
]

// Monta os itens do ticker com cotação mais recente e variação
// em relação à cotação anterior (lendo os dois últimos dias úteis)
function buildItems(rates) {
  const dates = Object.keys(rates).sort()
  if (dates.length < 2) return []

  const latest = rates[dates[dates.length - 1]]
  const previous = rates[dates[dates.length - 2]]

  return TICKER_PAIRS.map(({ label, code, invert }) => {
    const now = invert ? 1 / latest[code] : latest[code]
    const before = invert ? 1 / previous[code] : previous[code]
    return { label, rate: now, variation: ((now - before) / before) * 100 }
  }).filter((item) => Number.isFinite(item.rate))
}

export function useTicker() {
  const [state, setState] = useState({ items: [], loading: true, error: null })

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const { data } = await getTimeSeries({
          base: 'USD',
          symbols: TICKER_PAIRS.map((pair) => pair.code).join(','),
          start: isoDaysAgo(7),
          end: todayISO(),
          signal: controller.signal,
        })
        setState({ items: buildItems(data.rates), loading: false, error: null })
      } catch (error) {
        if (error.name === 'AbortError') return
        setState({ items: [], loading: false, error: error.message })
      }
    }

    load()
    return () => controller.abort()
  }, [])

  return state
}
