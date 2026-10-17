// Cliente da Frankfurter API (https://frankfurter.dev)
// Fonte das taxas: Banco Central Europeu (BCE), publicadas em dias úteis
const BASE_URL = 'https://api.frankfurter.dev/v1'

async function fetchJson(url, signal) {
  const started = performance.now()
  let response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Não foi possível conectar à Frankfurter API')
  }
  if (!response.ok) {
    throw new Error(`Frankfurter API respondeu com erro ${response.status}`)
  }

  let data
  try {
    data = await response.json()
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new Error('Frankfurter API retornou uma resposta inválida')
  }
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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

// Converte o objeto `rates` da API em um array ordenado de pontos { date, rate }
export function toPoints(rates, symbol) {
  if (!rates || typeof rates !== 'object') return []
  return Object.entries(rates)
    .map(([date, value]) => ({
      date,
      rate: value && typeof value === 'object' ? value[symbol] : value,
    }))
    .filter((point) => ISO_DATE.test(point.date) && Number.isFinite(point.rate))
    .sort((a, b) => a.date.localeCompare(b.date))
}
