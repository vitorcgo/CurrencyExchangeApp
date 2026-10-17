import { useEffect, useState } from 'react'
import { getCurrencies } from '../api/frankfurter.js'

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
        const currencies = Object.entries(data)
          .map(([code, name]) => ({ code, name }))
          .sort((a, b) => a.code.localeCompare(b.code))
        setState({ currencies, loading: false, error: null })
      } catch (error) {
        if (error.name === 'AbortError') return
        setState({ currencies: null, loading: false, error: error.message })
      }
    }

    load()
    return () => controller.abort()
  }, [])

  return state
}
