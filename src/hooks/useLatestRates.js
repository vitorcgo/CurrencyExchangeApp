import { useCallback, useEffect, useState } from 'react'
import { getLatestRates } from '../api/frankfurter.js'
import { isCurrencyCode, isISODate } from '../utils/validation.js'

// Cotações mais recentes de todas as moedas usando `from` como base.
// `refreshKey` permite atualizar junto com o restante do painel.
export function useLatestRates(base, refreshKey = 0) {
  const [state, setState] = useState({
    rates: [],
    date: null,
    base: null,
    loading: true,
    error: null,
  })
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    if (!isCurrencyCode(base)) return undefined

    const controller = new AbortController()
    setState((prev) =>
      prev.base === base
        ? { ...prev, loading: true, error: null }
        : { rates: [], date: null, base, loading: true, error: null },
    )

    async function load() {
      try {
        const { data } = await getLatestRates({ base, signal: controller.signal })
        const entries =
          data?.rates && typeof data.rates === 'object' && !Array.isArray(data.rates)
            ? Object.entries(data.rates)
            : []

        const rates = entries
          .filter(
            ([code, value]) =>
              isCurrencyCode(code) &&
              code !== base &&
              Number.isFinite(value) &&
              value > 0,
          )
          .map(([code, rate]) => ({ code, rate }))
          .sort((a, b) => a.code.localeCompare(b.code))

        if (!rates.length) {
          throw new Error('Nenhuma cotação disponível para a moeda de origem.')
        }

        setState({
          rates,
          date: isISODate(data?.date) ? data.date : null,
          base,
          loading: false,
          error: null,
        })
      } catch (error) {
        if (error.name === 'AbortError') return
        setState({ rates: [], date: null, base, loading: false, error: error.message })
      }
    }

    load()
    return () => controller.abort()
  }, [base, refreshKey, reloadKey])

  return { ...state, refetch }
}
