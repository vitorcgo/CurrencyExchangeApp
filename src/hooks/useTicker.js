import { useCallback, useEffect, useState } from 'react'
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
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function buildItems(rates) {
  if (!rates || typeof rates !== 'object') return []

  const dates = Object.keys(rates).filter((date) => ISO_DATE.test(date)).sort()
  if (dates.length < 2) return []

  const latest = rates[dates[dates.length - 1]]
  const previous = rates[dates[dates.length - 2]]
  if (!latest || typeof latest !== 'object' || !previous || typeof previous !== 'object') {
    return []
  }

  return TICKER_PAIRS.map(({ label, code, invert }) => {
    const latestValue = latest?.[code]
    const previousValue = previous?.[code]
    if (
      !Number.isFinite(latestValue) ||
      !Number.isFinite(previousValue) ||
      previousValue === 0
    ) {
      return null
    }

    const now = invert ? 1 / latestValue : latestValue
    const before = invert ? 1 / previousValue : previousValue
    if (!Number.isFinite(now) || !Number.isFinite(before) || before === 0) return null

    return { label, rate: now, variation: ((now - before) / before) * 100 }
  }).filter(Boolean)
}

export function useTicker() {
  const [state, setState] = useState({ items: [], loading: true, error: null })
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    setState((prev) => ({ ...prev, loading: true, error: null }))

    async function load() {
      try {
        const { data } = await getTimeSeries({
          base: 'USD',
          symbols: TICKER_PAIRS.map((pair) => pair.code).join(','),
          start: isoDaysAgo(10),
          end: todayISO(),
          signal: controller.signal,
        })
        setState({ items: buildItems(data?.rates), loading: false, error: null })
      } catch (error) {
        if (error.name === 'AbortError') return
        setState({ items: [], loading: false, error: error.message })
      }
    }

    load()
    return () => controller.abort()
  }, [reloadKey])

  return { ...state, refetch }
}
