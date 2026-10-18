import Card from './Card.jsx'
import { currencyName, formatDate, formatRate } from '../utils/format.js'
import { useLatestRates } from '../hooks/useLatestRates.js'

function RowsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 7 }, (_, index) => (
        <div key={index} className="h-10 rounded-xl bg-subcard" />
      ))}
    </div>
  )
}

export default function AllRates({ from, to, currencies, refreshKey, onSelect }) {
  const latest = useLatestRates(from, refreshKey)
  const isCurrentBase = latest.base === from
  const rates = isCurrentBase ? latest.rates : []
  const date = isCurrentBase ? latest.date : null
  const loading = isCurrentBase ? latest.loading : true
  const error = isCurrentBase ? latest.error : null
  const { refetch } = latest

  return (
    <Card className="p-5 sm:p-6 h-full flex flex-col" data-purpose="todas-moedas">
      <div className="flex items-center justify-between gap-3 pb-4 mb-3 border-b border-zinc-800/70">
        <div>
          <h3 className="text-sm font-bold text-white">Outras moedas</h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Cotações com base em{' '}
            <span className="font-mono font-bold text-green-400">1 {from}</span>
          </p>
        </div>
        {date && (
          <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap">
            {formatDate(date)}
          </span>
        )}
      </div>

      {loading && rates.length === 0 ? (
        <RowsSkeleton />
      ) : error ? (
        <div className="flex flex-col items-start gap-2 py-2">
          <p className="text-xs text-zinc-200">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="px-2.5 py-1 rounded-lg bg-subcard border border-zinc-700 text-[11px] font-bold text-zinc-300 hover:text-white transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="space-y-0.5 max-h-[380px] overflow-y-auto pr-1">
          {rates.map((item) => {
            const active = item.code === to
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => onSelect(item.code)}
                aria-label={`Usar ${item.code} como moeda de destino`}
                className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl border text-left transition-colors ${
                  active
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'border-transparent hover:bg-subcard hover:border-zinc-800'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-xs font-bold text-white shrink-0">
                    {item.code}
                  </span>
                  <span className="text-[11px] text-zinc-400 truncate">
                    {currencyName(item.code, currencies?.find((c) => c.code === item.code)?.name)}
                  </span>
                </span>
                <span className="font-mono text-xs font-bold text-green-300 shrink-0">
                  {formatRate(item.rate)}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </Card>
  )
}
