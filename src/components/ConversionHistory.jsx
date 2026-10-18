import Card from './Card.jsx'
import { formatNumber } from '../utils/format.js'

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function formatEntryTime(at) {
  const date = new Date(at)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()

  const time = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (sameDay) return time
  return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${time}`
}

export default function ConversionHistory({ history, onSelect, onClear }) {
  return (
    <Card className="p-5 sm:p-6" data-purpose="historico-conversoes">
      <div className="flex items-center justify-between gap-3 pb-4 mb-3 border-b border-zinc-800/70">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="text-green-400">
            <ClockIcon />
          </span>
          Histórico recente
        </h3>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="text-xs text-zinc-500 leading-relaxed py-2">
          As conversões mais recentes aparecem aqui depois de alguns segundos.
        </p>
      ) : (
        <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
          {history.map((entry) => (
            <button
              key={`${entry.id}-${entry.at}-${entry.from}-${entry.to}`}
              type="button"
              onClick={() => onSelect(entry)}
              className="w-full text-left rounded-xl border border-transparent hover:border-zinc-800 hover:bg-subcard px-2.5 py-2 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-white">
                  {entry.from} / {entry.to}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {formatEntryTime(entry.at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-0.5">
                <span className="text-[11px] font-mono text-zinc-400 truncate">
                  {formatNumber(entry.amount, 2)} {entry.from}
                </span>
                <span className="text-xs font-mono font-bold text-green-300 truncate">
                  {formatNumber(entry.amount * entry.rate, 2)} {entry.to}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}
