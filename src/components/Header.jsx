import { formatDate, formatNumber, formatSignedPercent } from '../utils/format.js'

const STATUS_TEXT = {
  ok: 'Conectado',
  loading: 'Conectando...',
  error: 'Offline',
}

// Selo de mercado aberto/fechado. As taxas de referência do BCE são
// publicadas apenas em dias úteis, por volta das 16h (horário de Brasília)
function MarketBadge() {
  const day = new Date().getDay()
  const isOpen = day !== 0 && day !== 6

  return (
    <div
      className={`hidden lg:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-sm ${
        isOpen
          ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-400'
          : 'bg-amber-950/40 border-amber-500/30 text-amber-400'
      }`}
    >
      <span className="relative flex h-2 w-2">
        {isOpen && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isOpen ? 'bg-emerald-500' : 'bg-amber-500'
          }`}
        />
      </span>
      <span>{isOpen ? 'MERCADO ABERTO' : 'MERCADO FECHADO'}</span>
    </div>
  )
}

function TickerItem({ label, rate, variation, className = '' }) {
  const positive = variation >= 0
  return (
    <div
      className={`flex items-center gap-1.5 shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-900/60 border border-slate-800 text-xs ${className}`}
    >
      <span className="font-bold text-slate-300">{label}</span>
      <span className={`font-mono font-semibold ${positive ? 'text-emerald-400' : 'text-rose-400'}`}>
        {formatNumber(rate, 4)}
      </span>
      <span className={`text-[10px] font-mono ${positive ? 'text-emerald-400/90' : 'text-rose-400/90'}`}>
        {formatSignedPercent(variation)}
      </span>
    </div>
  )
}

export default function Header({ status, latency, ticker, latestDate, onRefresh }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-panel/90 backdrop-blur-xl shadow-2xl">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 lg:gap-4">
        {/* Marca */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative w-11 h-11 rounded-2xl ring-1 ring-cyan-500/40 p-0.5 bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-950/50">
            <div className="w-full h-full bg-obsidian rounded-[14px] flex items-center justify-center">
              <svg
                className="w-6 h-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,229,255,0.6)]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-nowrap min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-tight whitespace-nowrap truncate">
                Currency Exchange
              </h1>
              <span className="shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Pro<span className="hidden sm:inline"> Terminal</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-2 whitespace-nowrap truncate">
              <span className="hidden sm:inline">Taxas de referência do BCE via Frankfurter API</span>
              <span className="sm:hidden">Cotação oficial do BCE</span>
              {latestDate && (
                <span className="hidden lg:inline-flex items-center gap-2">
                  <span className="inline-block w-1 h-1 rounded-full bg-slate-600" />
                  <span className="text-slate-500 font-mono text-[11px]">
                    última cotação {formatDate(latestDate)}
                  </span>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Ticker ao vivo, apenas em telas largas */}
        <div className="hidden xl:flex items-center gap-2 shrink-0 overflow-hidden bg-subcard/80 border border-slate-800/90 rounded-2xl px-3 py-1.5 shadow-inner">
          {ticker.loading && (
            <span className="text-xs text-slate-500 font-mono px-2 animate-pulse">
              carregando cotações...
            </span>
          )}
          {!ticker.loading && ticker.error && (
            <span className="text-xs text-slate-500 font-mono px-2">ticker indisponível</span>
          )}
          {!ticker.loading &&
            !ticker.error &&
            ticker.items.map((item, index) => (
              <TickerItem
                key={item.label}
                {...item}
                className={index >= 2 ? 'hidden 2xl:flex' : ''}
              />
            ))}
        </div>

        {/* Status e ações */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <MarketBadge />

          <div
            title={STATUS_TEXT[status]}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              status === 'error'
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                : 'bg-[#0c1626] border-cyan-500/20 text-cyan-300'
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path
                d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-mono hidden sm:inline">{STATUS_TEXT[status]}</span>
            {status === 'ok' && latency != null && (
              <span className="font-mono text-[10px] opacity-70 hidden sm:inline">{latency}ms</span>
            )}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            aria-label="Atualizar cotações"
            title="Atualizar cotações"
            className="p-2 rounded-xl bg-subcard border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <polyline points="23 4 23 10 17 10" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="1 20 1 14 7 14" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
