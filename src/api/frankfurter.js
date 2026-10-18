// Cliente da Frankfurter API (https://frankfurter.dev)
// Fonte das taxas: Banco Central Europeu (BCE), publicadas em dias úteis
import { isISODate } from '../utils/validation.js'

const BASE_URL = 'https://api.frankfurter.dev/v1'

// Tempo máximo de espera por resposta da API
const REQUEST_TIMEOUT_MS = 12000

function timeoutError() {
  const error = new Error('A Frankfurter API demorou para responder. Tente novamente.')
  error.name = 'TimeoutError'
  return error
}

async function fetchJson(url, signal) {
  const started = performance.now()
  const controller = new AbortController()
  let timedOut = false

  const timer = setTimeout(() => {
    timedOut = true
    controller.abort(timeoutError())
  }, REQUEST_TIMEOUT_MS)

  function forwardAbort() {
    controller.abort(signal?.reason)
  }

  if (signal) {
    if (signal.aborted) forwardAbort()
    else signal.addEventListener('abort', forwardAbort, { once: true })
  }

  try {
    let response
    try {
      response = await fetch(url, { signal: controller.signal })
    } catch (error) {
      if (timedOut) throw timeoutError()
      if (error.name === 'AbortError') throw error
      throw new Error('Não foi possível conectar à Frankfurter API')
    }

    if (!response.ok) {
      throw new Error(`Frankfurter API respondeu com erro ${response.status}`)
    }

    try {
      const data = await response.json()
      return { data, latency: Math.round(performance.now() - started) }
    } catch (error) {
      if (timedOut) throw timeoutError()
      if (error.name === 'AbortError') throw error
      throw new Error('Frankfurter API retornou uma resposta inválida')
    }
  } finally {
    clearTimeout(timer)
    if (signal) signal.removeEventListener('abort', forwardAbort)
  }
}

// GET /currencies
// Resposta: { USD: "United States Dollar", BRL: "Brazilian Real", ... }
export function getCurrencies(signal) {
  return fetchJson(`${BASE_URL}/currencies`, signal)
}

// GET /{inicio}..{fim}?base=USD&symbols=BRL
// Resposta: { rates: { "2026-10-16": { BRL: 5.33 }, ... } }
export function getTimeSeries({ base, symbols, start, end, signal }) {
  const params = new URLSearchParams({ base, symbols })
  return fetchJson(`${BASE_URL}/${start}..${end}?${params}`, signal)
}

// GET /latest?base=USD
// Resposta: { amount: 1, base: "USD", date: "2026-10-16", rates: { BRL: 5.33, ... } }
export function getLatestRates({ base, signal }) {
  const params = new URLSearchParams({ base })
  return fetchJson(`${BASE_URL}/latest?${params}`, signal)
}

// Converte o objeto `rates` da API em um array ordenado de pontos { date, rate }
export function toPoints(rates, symbol) {
  if (!rates || typeof rates !== 'object') return []
  return Object.entries(rates)
    .map(([date, value]) => ({
      date,
      rate: value && typeof value === 'object' ? value[symbol] : value,
    }))
    .filter((point) => isISODate(point.date) && Number.isFinite(point.rate))
    .sort((a, b) => a.date.localeCompare(b.date))
}
