// Períodos de análise disponíveis no gráfico e na tabela
export const TIMEFRAMES = [
  { id: '7d', label: '7d', days: 7 },
  { id: '15d', label: '15d', days: 15 },
  { id: '30d', label: '30d', days: 30 },
  { id: '3m', label: '3m', days: 91 },
  { id: '6m', label: '6m', days: 182 },
  { id: '1a', label: '1a', days: 365 },
  { id: 'max', label: 'Max', days: null },
]

// Início das taxas de referência do BCE, usado no período "Max"
const FIRST_ECB_DATE = '1999-01-04'

export function toISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayISO() {
  return toISO(new Date())
}

export function isoDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toISO(date)
}

// Converte o id do período em datas de início e fim para a API
export function timeframeRange(timeframeId) {
  const timeframe = TIMEFRAMES.find((item) => item.id === timeframeId)
  if (!timeframe || timeframe.days == null) {
    return { start: FIRST_ECB_DATE, end: todayISO() }
  }
  return { start: isoDaysAgo(timeframe.days), end: todayISO() }
}

// Série "1:1" sintética para quando origem e destino são a mesma moeda.
// A Frankfurter não devolve taxa AUD/AUD, então simulamos os dias úteis
// com taxa fixa em 1 para o gráfico e a tabela continuarem funcionando.
export function paritySeries(timeframeId) {
  const timeframe = TIMEFRAMES.find((item) => item.id === timeframeId)
  const days = timeframe?.days ?? 90
  const cap = Math.min(days, 366)

  const points = []
  const cursor = new Date()
  while (points.length < cap) {
    const weekDay = cursor.getDay()
    if (weekDay !== 0 && weekDay !== 6) {
      points.push({ date: toISO(cursor), rate: 1 })
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return points.reverse()
}
