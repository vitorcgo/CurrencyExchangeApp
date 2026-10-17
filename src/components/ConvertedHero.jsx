import { useMemo } from 'react'
import { parseAmount, currencyPrefix, formatNumber, formatRate, formatSignedPercent } from '../utils/format.js'
import { minMax, periodChange } from '../utils/stats.js'

function MiniStat({ label, value, accent, trend }) {
  let color = 'text-slate-300'
  if (trend != null && !Number.isNaN(trend)) {
    color = trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-rose-400' : 'text-slate-300'
  } else if (accent) {
    color = 'text-cyan-300'
  }

  return (
    <div className="bg-subcard/80 p-2 rounded-xl border border-slate-800">
      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{label}</p>
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
      className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0b1524] via-card to-panel border border-cyan-500/20 p-5 sm:p-6 shadow-2xl shadow-cyan-950/20 shadow-glass"
      data-purpose="valor-convertido"
    >
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/70">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-widest text-cyan-400 uppercase">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Valor convertido em tempo real
          </span>
          <span
            className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
              isFrozen
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/20'
                : 'bg-slate-800/60 text-slate-400 border-slate-700/60'
            }`}
          >
            {isFrozen ? `Taxa congelada · ${frozenSecondsLeft}s` : 'Taxa ao vivo'}
          </span>
        </div>

        <div className="py-3.5 text-center sm:text-left">
          <div className="flex items-baseline justify-center sm:justify-start gap-2">
            <span className="text-xl font-bold text-slate-400 font-mono">{currencyPrefix(to)}</span>
            <h2 className="text-5xl font-extrabold tracking-tight text-neon-strong drop-shadow-[0_0_24px_rgba(0,242,254,0.4)] font-mono">
              {formatNumber(converted, 2)}
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-medium text-slate-400 pt-1 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <span className="font-mono">
              {formatNumber(parseAmount(amount), 2)} × {formatRate(rate)}
            </span>
            <span className="text-slate-500">·</span>
            <span className="font-mono">
              {from} para {to}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-2.5 border-t border-slate-800/70 text-center">
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
