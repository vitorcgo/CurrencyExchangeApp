import { useCallback, useEffect, useState } from 'react'
import { getTimeSeries, toPoints } from '../api/frankfurter.js'
import { paritySeries, timeframeRange } from '../utils/dates.js'

// Busca a série histórica do par selecionado.
// Refaz a busca sempre que from, to ou timeframe mudam e cancela
// requisições antigas com AbortController (evita resposta atrasada).
export function useTimeSeries(from, to, timeframe) {
  const [state, setState] = useState({
    points: [],
    loading: true,
    error: null,
    latency: null,
    latestDate: null,
    updatedAt: null,
    key: null,
  })
  const [reloadKey, setReloadKey] = useState(0)

  const refetch = useCallback(() => setReloadKey((key) => key + 1), [])

  useEffect(() => {
    if (!from || !to) return undefined

    // Mesma moeda: a API não tem taxa de paridade, geramos a série 1:1
    if (from === to) {
      const points = paritySeries(timeframe)
      setState({
        points,
        loading: false,
        error: null,
        latency: null,
        latestDate: points[points.length - 1]?.date ?? null,
        updatedAt: Date.now(),
        key: `${from}/${to}/${timeframe}`,
      })
      return undefined
    }

    const controller = new AbortController()
    const key = `${from}/${to}/${timeframe}`
    // Par mudou: limpa os pontos para nunca exibir dados antigos
    // junto do título do novo par durante o carregamento
    setState((prev) =>
      prev.key === key
        ? { ...prev, loading: true, error: null }
        : {
            points: [],
            loading: true,
            error: null,
            latency: null,
            latestDate: null,
            updatedAt: null,
            key,
          },
    )

    async function load() {
      try {
        const { start, end } = timeframeRange(timeframe)
        const { data, latency } = await getTimeSeries({
          base: from,
          symbols: to,
          start,
          end,
          signal: controller.signal,
        })
        const points = toPoints(data?.rates, to)
        if (!points.length) {
          throw new Error('Nenhuma cotação disponível para o período.')
        }
        setState({
          points,
          loading: false,
          error: null,
          latency,
          latestDate: points[points.length - 1]?.date ?? null,
          updatedAt: Date.now(),
          key,
        })
      } catch (error) {
        if (error.name === 'AbortError') return
        setState((prev) => ({
          ...prev,
          points: [],
          loading: false,
          error: error.message,
          latency: null,
          latestDate: null,
        }))
      }
    }

    load()
    return () => controller.abort()
  }, [from, to, timeframe, reloadKey])

  const expectedKey = from && to ? `${from}/${to}/${timeframe}` : null
  const stale = expectedKey != null && state.key !== expectedKey

  return {
    ...state,
    points: stale ? [] : state.points,
    loading: stale ? true : state.loading,
    error: stale ? null : state.error,
    latency: stale ? null : state.latency,
    latestDate: stale ? null : state.latestDate,
    updatedAt: stale ? null : state.updatedAt,
    refetch,
  }
}
