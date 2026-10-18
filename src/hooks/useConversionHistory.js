import { useCallback, useEffect, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage.js'
import { MAX_HISTORY, sanitizeHistory } from '../utils/history.js'
import { parseAmount } from '../utils/format.js'

// Histórico curto de conversões, persistido no navegador
export function useConversionHistory() {
  const [stored, setStored] = useLocalStorage('fx:history', [])
  const history = useMemo(() => sanitizeHistory(stored), [stored])

  useEffect(() => {
    if (JSON.stringify(history) !== JSON.stringify(stored)) {
      setStored(history)
    }
  }, [stored, history, setStored])

  const record = useCallback(
    ({ from, to, amount, rate }) => {
      const numericAmount = parseAmount(amount)
      if (!Number.isFinite(rate) || rate <= 0 || numericAmount <= 0) return

      setStored((prev) => {
        const list = sanitizeHistory(prev)
        const now = Date.now()
        const last = list[0]

        // Evita repetir a mesma conversão enquanto o usuário ajusta a tela
        if (
          last &&
          last.from === from &&
          last.to === to &&
          Math.abs(last.amount - numericAmount) < 1e-9 &&
          now - Date.parse(last.at) < 120000
        ) {
          return list
        }

        return sanitizeHistory([
          {
            id: `${now}`,
            at: new Date(now).toISOString(),
            from,
            to,
            amount: numericAmount,
            rate,
          },
          ...list,
        ]).slice(0, MAX_HISTORY)
      })
    },
    [setStored],
  )

  const clear = useCallback(() => setStored([]), [setStored])

  return { history, record, clear }
}
