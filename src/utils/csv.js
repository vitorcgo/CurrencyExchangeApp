import { formatDate, formatNumber, formatRate } from './format.js'

// Gera o CSV com separador ";" e BOM UTF-8, o formato que abre
// corretamente no Excel em português (acentos e vírgula decimal)
export function buildCsv(rows, { pair }) {
  const header = ['Data', 'Par', 'Fechamento', 'Variação (%)']
  const lines = rows.map((row) =>
    [
      formatDate(row.date),
      pair,
      formatRate(row.rate),
      row.variation == null ? '' : formatNumber(row.variation, 2),
    ].join(';'),
  )
  return `\uFEFF${[header.join(';'), ...lines].join('\r\n')}`
}

// Dispara o download do arquivo no navegador
export function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
