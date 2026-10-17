import { useMemo } from 'react'
import Card from './Card.jsx'
import {
  minMax,
  periodChange,
  trendOf,
  volatility,
  volatilityLabel,
  withVariation,
} from '../utils/stats.js'
import { formatDate, formatNumber, formatRate, formatSignedPercent } from '../utils/format.js'

const TREND_TONES = {
  up: 'text-green-400',
  down: 'text-zinc-200',
  flat: 'text-zinc-300',
}

const VOLATILITY_TONES = {
  low: 'text-green-400',
  mid: 'text-zinc-300',
  high: 'text-zinc-100',
  flat: 'text-zinc-300',
}

function TrendArrow({ direction }) {
  if (direction === 'flat') return null
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      {direction === 'up' ? (
        <path d="M5 10l7-7m0 0l7 7m-7-7v18" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M19 14l-7 7m0 0l-7-7m7 7V3" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

export default function StatsGrid({ points, from, to }) {
  const stats = useMemo(() => {
    const rows = withVariation(points)
    const change = periodChange(points)
    const vol = volatility(rows)
    return {
      change,
      trend: trendOf(change),
      vol,
      volLabel: volatilityLabel(vol),
      ...minMax(points),
    }
  }, [points])

  const last = points.length ? points[points.length - 1] : null

  return (
    <Card className="p-5 sm:p-7" data-purpose="painel-estatisticas">
      <h3 className="text-sm font-bold tracking-wide text-white flex items-center gap-2 pb-4 mb-4 border-b border-zinc-800/60">
        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Análise do período
        <span className="font-mono text-xs text-zinc-400">
          {from} / {to}
        </span>
      </h3>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
        <div className="bg-subcard p-3 rounded-2xl border border-zinc-800/80">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            Tendência do período
          </span>
          <span
            className={`text-sm font-bold font-mono mt-1 flex items-center gap-1.5 flex-wrap ${TREND_TONES[stats.trend.direction]}`}
          >
            <TrendArrow direction={stats.trend.direction} />
            {stats.trend.label}
            {stats.change != null && (
              <span className="text-xs font-normal opacity-80">
                ({formatSignedPercent(stats.change)})
              </span>
            )}
          </span>
        </div>

        <div className="bg-subcard p-3 rounded-2xl border border-zinc-800/80">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            Volatilidade diária
          </span>
          <span className={`text-sm font-bold font-mono mt-1 block ${VOLATILITY_TONES[stats.volLabel.tone]}`}>
            {stats.vol == null ? '-' : `${formatNumber(stats.vol, 2)}%`}{' '}
            <span className="text-xs font-normal opacity-80">{stats.volLabel.label}</span>
          </span>
        </div>

        <div className="bg-subcard p-3 rounded-2xl border border-zinc-800/80">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            Mínimo do período
          </span>
          <span className="text-sm font-bold font-mono text-zinc-300 mt-1 block">
            {formatRate(stats.min)}
          </span>
        </div>

        <div className="bg-subcard p-3 rounded-2xl border border-zinc-800/80">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            Última cotação
          </span>
          <span className="text-sm font-bold font-mono text-green-300 mt-1 block">
            {formatRate(last?.rate)}
            {last && (
              <span className="text-xs font-normal text-zinc-500"> em {formatDate(last.date)}</span>
            )}
          </span>
        </div>
      </div>
    </Card>
  )
}
