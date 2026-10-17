import { useMemo } from 'react'
import { parseAmount, currencyPrefix, formatNumber, formatRate, formatSignedPercent } from '../utils/format.js'
import { minMax, periodChange } from '../utils/stats.js'

function MiniStat({ label, value, accent, trend }) {
  let color = 'text-zinc-300'
  if (trend != null && Number.isFinite(trend)) {
    color = trend > 0 ? 'text-green-400' : trend < 0 ? 'text-zinc-200' : 'text-zinc-300'
  } else if (accent) {
    color = 'text-green-300'
  }

  return (
    <div className="bg-subcard p-2 rounded-xl border border-zinc-800">
      <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">{label}</p>
      <p className={`text-xs font-bold font-mono mt-0.5 ${color}`}>{value}</p>
    </div>
  )
}

export default function ConvertedHero({ amount, rate, from, to, points, isFrozen, frozenSecondsLeft }) {
  const converted = parseAmount(amount) * (rate ?? 0)

  const stats = useMemo(() => {
    const { min, max } = minMax(points)
    return { min, max, change: periodChange(points) }
  }, [points])

  return (
    <section
      className="rounded-3xl bg-card border border-zinc-800 p-5 sm:p-6"
      data-purpose="valor-convertido"
    >
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-zinc-800/70">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-green-400 uppercase">
            Valor convertido
          </span>
          <span
            className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
              isFrozen
                ? 'bg-green-950/60 text-green-300 border-green-500/20'
                : 'bg-zinc-800/60 text-zinc-400 border-zinc-700/60'
            }`}
          >
            {isFrozen ? `Taxa congelada · ${frozenSecondsLeft}s` : 'Taxa de referência'}
          </span>
        </div>

        <div className="py-3.5 text-center sm:text-left">
          <div className="flex items-baseline justify-center sm:justify-start gap-2 min-w-0">
            <span className="text-lg sm:text-xl font-bold text-zinc-400 font-mono shrink-0">{currencyPrefix(to)}</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-green-400 font-mono max-w-full truncate">
              {rate == null ? '-' : formatNumber(converted, 2)}
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-medium text-zinc-400 pt-1 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <span className="font-mono">
              {formatNumber(parseAmount(amount), 2)} × {formatRate(rate)}
            </span>
            <span className="text-zinc-500">·</span>
            <span className="font-mono">
              {from} para {to}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-2.5 border-t border-zinc-800/70 text-center">
          <MiniStat label="Mín. período" value={formatRate(stats.min)} />
          <MiniStat label="Máx. período" value={formatRate(stats.max)} accent />
          <MiniStat
            label="Variação"
            value={formatSignedPercent(stats.change)}
            trend={stats.change}
          />
        </div>
      </div>
    </section>
  )
}
