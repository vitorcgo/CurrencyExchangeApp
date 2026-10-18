import { formatDate, formatNumber, formatSignedPercent } from '../utils/format.js'

const STATUS_TEXT = {
  ok: 'Conectado',
  loading: 'Atualizando...',
  error: 'Falha na API',
}

function TickerItem({ label, rate, variation, className = '' }) {
  const positive = variation >= 0
  return (
    <div
      className={`flex items-center gap-1.5 shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg bg-subcard border border-zinc-800 text-xs ${className}`}
    >
      <span className="font-bold text-zinc-300">{label}</span>
      <span className={`font-mono font-semibold ${positive ? 'text-green-400' : 'text-zinc-200'}`}>
        {formatNumber(rate, 4)}
      </span>
      <span className={`text-[10px] font-mono ${positive ? 'text-green-400/90' : 'text-zinc-300/90'}`}>
        {formatSignedPercent(variation)}
      </span>
    </div>
  )
}

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path
        d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3l1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3l1.42-1.42"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function Header({
  status,
  latency,
  ticker,
  latestDate,
  onRefresh,
  theme,
  onToggleTheme,
}) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-panel">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-3 lg:gap-4">
        {/* Marca */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-subcard border border-zinc-800 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-green-400"
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
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-nowrap min-w-0">
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-tight whitespace-nowrap truncate">
                Currency Exchange
              </h1>
              <span className="hidden sm:inline-flex shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/30">
                Pro Terminal
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-medium flex items-center gap-2 whitespace-nowrap truncate">
              <span className="hidden sm:inline">Taxas de referência do BCE via Frankfurter API</span>
              <span className="sm:hidden">Cotação oficial do BCE</span>
              {latestDate && (
                <span className="hidden lg:inline-flex items-center gap-2">
                  <span className="text-zinc-500 font-mono text-[11px]">
                    última cotação {formatDate(latestDate)}
                  </span>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Ticker de referência, apenas em telas largas */}
        <div className="hidden xl:flex items-center gap-2 shrink-0 overflow-hidden bg-subcard border border-zinc-800/90 rounded-2xl px-3 py-1.5">
          {ticker.loading && ticker.items.length === 0 && (
            <span className="text-xs text-zinc-500 font-mono px-2">
              carregando cotações...
            </span>
          )}
          {ticker.error && (
            <span className="text-xs text-zinc-500 font-mono px-2">ticker indisponível</span>
          )}
          {!ticker.error &&
            ticker.items.map((item, index) => (
              <TickerItem
                key={item.label}
                {...item}
                className={index >= 2 ? 'hidden 2xl:flex' : ''}
              />
            ))}
          {!ticker.loading && !ticker.error && ticker.items.length === 0 && (
            <span className="text-xs text-zinc-500 font-mono px-2">sem dados</span>
          )}
        </div>

        {/* Status e ações */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div
            role="status"
            aria-label={STATUS_TEXT[status]}
            title={STATUS_TEXT[status]}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              status === 'error'
                ? 'bg-zinc-900 border-zinc-600/50 text-zinc-200'
                : 'bg-subcard border-green-500/20 text-green-300'
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
            onClick={onToggleTheme}
            aria-label={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
            title={theme === 'light' ? 'Ativar tema escuro' : 'Ativar tema claro'}
            className="p-2 rounded-xl bg-subcard border border-zinc-800 text-zinc-400 hover:text-green-400 hover:border-green-500/40 transition-colors"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={status === 'loading'}
            aria-label="Atualizar cotações"
            title="Atualizar cotações"
            className="p-2 rounded-xl bg-subcard border border-zinc-800 text-zinc-400 hover:text-green-400 hover:border-green-500/40 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
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
