import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCurrencies } from './frankfurter.js'

// Simula uma requisição que só termina quando o sinal é abortado,
// como acontece com o fetch real quando o tempo limite estoura
function fetchThatWaitsForAbort() {
  return vi.fn((url, options = {}) => {
    return new Promise((resolve, reject) => {
      const signal = options.signal
      if (!signal) return

      if (signal.aborted) {
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'))
        return
      }

      signal.addEventListener(
        'abort',
        () => reject(signal.reason ?? new DOMException('Aborted', 'AbortError')),
        { once: true },
      )
    })
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('fetchJson', () => {
  it('avisa quando a API demora além do tempo limite', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', fetchThatWaitsForAbort())

    const promise = getCurrencies()
    const assertion = expect(promise).rejects.toThrow('demorou para responder')
    await vi.advanceTimersByTimeAsync(12000)

    await assertion
  })

  it('propaga o cancelamento do chamador como AbortError', async () => {
    vi.stubGlobal('fetch', fetchThatWaitsForAbort())

    const controller = new AbortController()
    const promise = getCurrencies(controller.signal)
    const assertion = expect(promise).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()

    await assertion
  })
})
