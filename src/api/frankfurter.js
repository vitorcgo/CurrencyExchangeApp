// Cliente da Frankfurter API (https://frankfurter.dev)
// Fonte das taxas: Banco Central Europeu (BCE), publicadas em dias úteis
const BASE_URL = 'https://api.frankfurter.dev/v1'

async function fetchJson(url, signal) {
  const started = performance.now()
  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Frankfurter API respondeu com erro ${response.status}`)
  }
  const data = await response.json()
  return { data, latency: Math.round(performance.now() - started) }
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

// Converte o objeto `rates` da API em um array ordenado de pontos { date, rate }
export function toPoints(rates, symbol) {
  return Object.entries(rates)
    .map(([date, value]) => ({
      date,
      rate: typeof value === 'object' ? value[symbol] : value,
    }))
    .filter((point) => point.rate != null)
    .sort((a, b) => a.date.localeCompare(b.date))
}
