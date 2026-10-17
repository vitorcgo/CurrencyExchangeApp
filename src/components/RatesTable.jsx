import { useEffect, useMemo, useState } from 'react'
import Card from './Card.jsx'
import { withVariation } from '../utils/stats.js'
import { formatDate, formatRate, formatSignedPercent } from '../utils/format.js'
import { buildCsv, downloadCsv } from '../utils/csv.js'

const PAGE_SIZE = 8

const VARIATION_FILTERS = [
  { id: 'all', label: 'Todas as variações' },
  { id: 'up', label: 'Somente altas' },
  { id: 'down', label: 'Somente baixas' },
]

function SortIcon({ active, direction }) {
  return (
    <svg
      className={`w-3.5 h-3.5 ${active ? 'text-green-400' : 'text-zinc-500'}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {active && direction === 'asc' ? (
        <path d="M8 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      ) : active ? (
        <path d="M8 14l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M7 15l5 5 5-5M7 9l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

// Mini-gráfico da janela de 7 dias que termina no dia da linha
function Sparkline({ values }) {
  if (!values || values.length < 2) {
    return <span className="text-xs text-zinc-600 font-mono">-</span>
  }
  const width = 96
  const height = 20
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - 2 - ((value - min) / span) * (height - 4)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  const positive = values[values.length - 1] >= values[0]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={positive ? 'text-green-400' : 'text-zinc-200'}
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function RatesTable({ points, loading, from, to, timeframe }) {
  const [query, setQuery] = useState('')
  const [variationFilter, setVariationFilter] = useState('all')
  const [sort, setSort] = useState({ key: 'date', direction: 'desc' })
  const [page, setPage] = useState(1)

  // Sempre que o filtro, o par ou o período mudam, volta para a primeira página
  useEffect(() => {
    setPage(1)
  }, [query, variationFilter, sort, from, to, timeframe, points.length])

  const rows = useMemo(() => {
    let list = withVariation(points)

    const needle = query.trim()
    if (needle) {
      list = list.filter(
        (row) => formatDate(row.date).includes(needle) || row.date.includes(needle),
      )
    }
    if (variationFilter === 'up') {
      list = list.filter((row) => row.variation != null && row.variation > 0)
    }
    if (variationFilter === 'down') {
      list = list.filter((row) => row.variation != null && row.variation < 0)
    }

    const factor = sort.direction === 'asc' ? 1 : -1
    return [...list].sort((a, b) =>
      sort.key === 'rate' ? (a.rate - b.rate) * factor : a.date.localeCompare(b.date) * factor,
    )
  }, [points, query, variationFilter, sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * PAGE_SIZE
  const visible = rows.slice(start, start + PAGE_SIZE)

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: key === 'date' ? 'desc' : 'asc' },
    )
  }

  function handleExport() {
    if (!rows.length) return
    const csv = buildCsv(rows, { pair: `${from}/${to}` })
    const today = new Date().toISOString().slice(0, 10)
    downloadCsv(`cotacoes-${from}-${to}-${today}.csv`, csv)
  }

  const windowStart = Math.max(1, Math.min(currentPage - 2, pageCount - 4))
  const pageNumbers = Array.from(
    { length: Math.min(5, pageCount) },
    (_, index) => windowStart + index,
  )

  return (
    <Card className="p-5 sm:p-7" data-purpose="tabela-cotacoes">
      {/* Cabeçalho e controles */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800/80">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/80 font-mono text-xs text-zinc-300">
              {from} / {to}
            </span>
            Tabela de cotações
          </h3>
          <span className="px-2.5 py-1 rounded-xl bg-[#111111] border border-green-500/20 text-xs font-mono font-bold text-green-400 whitespace-nowrap">
            {rows.length} {rows.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          <div className="relative w-full sm:w-52">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtrar por data..."
              className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-green-500/50"
            />
            <svg
              className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
          </div>

          <select
            value={variationFilter}
            onChange={(event) => setVariationFilter(event.target.value)}
            className="bg-[#171717] border border-zinc-700/80 rounded-xl py-2 px-3 text-xs font-semibold text-zinc-300 focus:outline-none focus:border-green-500/50 cursor-pointer"
          >
            {VARIATION_FILTERS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleExport}
            disabled={!rows.length}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-lg shadow-green-950/40 whitespace-nowrap"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabela */}
      {loading && !points.length ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-11 rounded-xl bg-[#1a1a1a]/70 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-[#0a0a0a]/60">
          <table className="w-full text-left border-collapse min-w-[420px] sm:min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-800 bg-[#151515] text-xs text-zinc-400 font-semibold select-none">
                <th scope="col" className="py-3.5 px-3 sm:px-5 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('date')}
                    className="flex items-center gap-1.5 hover:text-zinc-200 transition"
                  >
                    Data
                    <SortIcon active={sort.key === 'date'} direction={sort.direction} />
                  </button>
                </th>
                <th scope="col" className="py-3.5 px-3 sm:px-5 font-semibold hidden sm:table-cell">
                  Par
                </th>
                <th scope="col" className="py-3.5 px-3 sm:px-5 font-semibold hidden md:table-cell">
                  Tendência (7d)
                </th>
                <th scope="col" className="py-3.5 px-3 sm:px-5 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('rate')}
                    className="inline-flex items-center gap-1.5 hover:text-zinc-200 transition"
                  >
                    Fechamento
                    <SortIcon active={sort.key === 'rate'} direction={sort.direction} />
                  </button>
                </th>
                <th scope="col" className="py-3.5 px-3 sm:px-5 text-right font-semibold whitespace-nowrap">
                  Variação 24h
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-zinc-500">
                    Nenhuma cotação encontrada para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                visible.map((row) => (
                  <tr key={row.date} className="hover:bg-[#1a1a1a]/80 transition-colors">
                    <td className="py-3 px-3 sm:px-5 text-white font-mono text-xs sm:text-sm whitespace-nowrap">
                      <span className="inline-flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                        {formatDate(row.date)}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-5 hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#1a1a1a] border border-zinc-800 font-mono text-xs text-zinc-200 whitespace-nowrap">
                        {from} / {to}
                      </span>
                    </td>
                    <td className="py-3 px-3 sm:px-5 hidden md:table-cell">
                      <Sparkline values={row.spark} />
                    </td>
                    <td className="py-3 px-3 sm:px-5 text-right font-bold text-green-300 font-mono text-xs sm:text-sm whitespace-nowrap">
                      {formatRate(row.rate)}
                    </td>
                    <td className="py-3 px-3 sm:px-5 text-right font-mono whitespace-nowrap">
                      {row.variation == null ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
                          -
                        </span>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            row.variation > 0
                              ? 'bg-green-950/40 text-green-400 border-green-500/20'
                              : row.variation < 0
                                ? 'bg-zinc-800/60 text-zinc-200 border-zinc-600/50'
                                : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60'
                          }`}
                        >
                          {formatSignedPercent(row.variation)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 text-xs text-zinc-400 font-medium">
        <span>
          {rows.length === 0
            ? 'Nenhum registro'
            : `Mostrando ${start + 1} a ${Math.min(start + PAGE_SIZE, rows.length)} de ${rows.length} cotações`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg bg-[#171717] border border-zinc-800 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          {pageNumbers.map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => setPage(number)}
              className={`px-3 py-1.5 rounded-lg border transition ${
                number === currentPage
                  ? 'bg-green-500/20 border-green-500/40 text-green-300 font-bold'
                  : 'bg-[#171717] border-zinc-800 hover:text-white'
              }`}
            >
              {number}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
            disabled={currentPage === pageCount}
            className="px-3 py-1.5 rounded-lg bg-[#171717] border border-zinc-800 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Próxima
          </button>
        </div>
      </div>
    </Card>
  )
}
