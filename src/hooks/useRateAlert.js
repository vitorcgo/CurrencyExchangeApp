import { useCallback, useEffect, useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage.js'
import {
  isCurrencyCode,
  normalizeCurrencyCode,
  sanitizeAmountInput,
} from '../utils/validation.js'
import { formatRate, parseAmount } from '../utils/format.js'

function sanitizeAlert(value) {
  if (!value || typeof value !== 'object') return null
  if (!isCurrencyCode(value.from) || !isCurrencyCode(value.to)) return null

  const target = Number(value.target)
  if (!Number.isFinite(target) || target <= 0) return null

  return {
    from: normalizeCurrencyCode(value.from, 'USD'),
    to: normalizeCurrencyCode(value.to, 'BRL'),
    target,
    direction: value.direction === 'below' ? 'below' : 'above',
    triggered: Boolean(value.triggered),
    triggeredAt: typeof value.triggeredAt === 'string' ? value.triggeredAt : null,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : null,
  }
}

// Um alerta por vez. Ele é verificado sempre que a cotação do par atual muda.
export function useRateAlert(from, to, rate) {
  const [stored, setStored] = useLocalStorage('fx:rateAlert', null)
  const alert = useMemo(() => sanitizeAlert(stored), [stored])

  const currentAlert =
    alert && alert.from === from && alert.to === to ? alert : null
  const otherAlert =
    alert && !(alert.from === from && alert.to === to) ? alert : null

  useEffect(() => {
    if (stored != null && alert == null) setStored(null)
  }, [stored, alert, setStored])

  const create = useCallback(
    (targetInput, direction) => {
      const clean = sanitizeAmountInput(targetInput)
      const target = parseAmount(clean)
      if (!clean || target <= 0) return false

      setStored({
        from,
        to,
        target,
        direction: direction === 'below' ? 'below' : 'above',
        triggered: false,
        triggeredAt: null,
        createdAt: new Date().toISOString(),
      })

      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        try {
          const request = Notification.requestPermission()
          if (request?.catch) request.catch(() => {})
        } catch {
          // navegador sem suporte à solicitação de permissão
        }
      }

      return true
    },
    [from, to, setStored],
  )

  const clear = useCallback(() => setStored(null), [setStored])

  // Dispara uma única vez quando o alvo é atingido
  useEffect(() => {
    if (!currentAlert || currentAlert.triggered) return
    if (!Number.isFinite(rate)) return

    const reached =
      currentAlert.direction === 'above'
        ? rate >= currentAlert.target
        : rate <= currentAlert.target
    if (!reached) return

    setStored({
      ...currentAlert,
      triggered: true,
      triggeredAt: new Date().toISOString(),
    })

    if (
      document.hidden &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      const title = `Alerta ${from}/${to}`
      const options = {
        body: `A taxa chegou a ${formatRate(rate)} ${to}.`,
        tag: `fx-alert-${from}-${to}`,
        icon: new URL('icon-192.png', document.baseURI).href,
      }

      async function notify() {
        try {
          const registration = await navigator.serviceWorker?.getRegistration?.()
          if (registration?.showNotification) {
            await registration.showNotification(title, options)
            return
          }
          new Notification(title, options)
        } catch {
          // alguns navegadores bloqueiam a notificação em segundo plano
        }
      }

      notify()
    }
  }, [currentAlert, rate, from, to, setStored])

  return { currentAlert, otherAlert, create, clear }
}
