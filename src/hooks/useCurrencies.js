import { useEffect, useState } from 'react'
import { getCurrencies } from '../api/frankfurter.js'
import { isCurrencyCode } from '../utils/validation.js'

// Busca a lista de moedas suportadas pela API.
// Em caso de falha, o Converter usa uma lista local de emergência.
export function useCurrencies() {
  const [state, setState] = useState({
    currencies: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const { data } = await getCurrencies(controller.signal)
        if (controller.signal.aborted) return
        const entries =
          data && typeof data === 'object' && !Array.isArray(data)
            ? Object.entries(data)
            : []
        const currencies = entries
          .filter(([code, name]) => isCurrencyCode(code) && typeof name === 'string')
          .map(([code, name]) => ({ code, name }))
          .sort((a, b) => a.code.localeCompare(b.code))

        if (!currencies.length) {
          throw new Error('Nenhuma moeda disponível na API.')
        }
        setState({ currencies, loading: false, error: null })
      } catch (error) {
        if (controller.signal.aborted || error.name === 'AbortError') return
        setState({ currencies: null, loading: false, error: error.message })
      }
    }

    load()
    return () => controller.abort()
  }, [])

  return state
}
