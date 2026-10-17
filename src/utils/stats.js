// Enriquece os pontos com variação % em relação ao dia anterior e com a
// mini-série usada na sparkline da tabela (janela de até 7 pontos)
export function withVariation(points) {
  return points.map((point, index) => {
    const previous = index > 0 ? points[index - 1].rate : null
    return {
      ...point,
      variation:
        previous != null && previous !== 0
          ? ((point.rate - previous) / previous) * 100
          : null,
      spark: points.slice(Math.max(0, index - 6), index + 1).map((p) => p.rate),
    }
  })
}

export function minMax(points) {
  if (!points.length) return { min: null, max: null }
  return points.reduce(
    (acc, point) => ({
      min: Math.min(acc.min, point.rate),
      max: Math.max(acc.max, point.rate),
    }),
    { min: points[0].rate, max: points[0].rate },
  )
}

// Média móvel simples. Retorna um array alinhado com os pontos,
// preenchido com null até a janela ficar completa
export function sma(points, window) {
  let sum = 0
  return points.map((point, index) => {
    sum += point.rate
    if (index >= window) sum -= points[index - window].rate
    return index >= window - 1 ? sum / window : null
  })
}

// Volatilidade: desvio padrão das variações diárias (%)
export function volatility(rows) {
  const changes = rows.map((row) => row.variation).filter((value) => value != null)
  if (changes.length < 2) return null
  const mean = changes.reduce((total, value) => total + value, 0) / changes.length
  const variance =
    changes.reduce((total, value) => total + (value - mean) ** 2, 0) / changes.length
  return Math.sqrt(variance)
}

// Variação total do período (%)
export function periodChange(points) {
  if (points.length < 2) return null
  const first = points[0].rate
  const last = points[points.length - 1].rate
  if (first === 0) return null
  return ((last - first) / first) * 100
}

export function trendOf(change) {
  if (change == null) return { label: 'Sem dados', direction: 'flat' }
  if (change > 0.5) return { label: 'Alta', direction: 'up' }
  if (change < -0.5) return { label: 'Baixa', direction: 'down' }
  return { label: 'Neutra', direction: 'flat' }
}

export function volatilityLabel(value) {
  if (value == null) return { label: 'Sem dados', tone: 'flat' }
  if (value < 0.5) return { label: 'Estável', tone: 'low' }
  if (value < 1) return { label: 'Moderada', tone: 'mid' }
  return { label: 'Alta', tone: 'high' }
}
