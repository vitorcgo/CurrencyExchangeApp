import { useMemo } from 'react'
import {
  FALLBACK_CURRENCIES,
  currencyName,
  currencyPrefix,
  formatDate,
  formatNumber,
  formatRate,
} from '../utils/format.js'
import { sanitizeAmountInput } from '../utils/validation.js'

const PRESETS = [100, 500, 1000, 5000]
const QUICK_PAIRS = [
  ['USD', 'BRL'],
  ['EUR', 'USD'],
  ['GBP', 'USD'],
  ['AUD', 'BRL'],
]

function Chevron() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-zinc-400">
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    </div>
  )
}

function BookmarkIcon({ filled }) {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  )
}

export default function Converter({
  amount,
  onAmountChange,
  from,
  to,
  onFromChange,
  onToChange,
  onSwap,
  currencies,
  rate,
  rateLoading,
  latestDate,
  isFrozen,
  frozenSecondsLeft,
  onToggleFreeze,
  favorites,
  isFavorite,
  onToggleFavorite,
  onApplyPair,
}) {
  // Usa a lista da API quando disponível e mantém os valores selecionados
  // mesmo que não estejam na lista (evita "select" vazio)
  const options = useMemo(() => {
    const list = currencies ?? FALLBACK_CURRENCIES
    const missing = [from, to].filter((code) => !list.some((option) => option.code === code))
    if (!missing.length) return list
    return [...missing.map((code) => ({ code, name: code })), ...list]
  }, [currencies, from, to])

  return (
    <section
      className="rounded-3xl bg-card border border-zinc-800/90 p-5 sm:p-7"
      data-purpose="conversor-moedas"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-800/60">
        <h3 className="text-sm font-bold tracking-wide text-white flex items-center gap-2">
          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 6h18M3 12h18m-7 6h7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Conversor de moedas
        </h3>
      </div>

      <div className="space-y-5">
        {/* Valor a converter */}
        <div>
          <label
            className="block text-[11px] font-bold tracking-wider text-zinc-400 uppercase mb-2"
            htmlFor="amount-input"
          >
            Valor a converter
          </label>
          <div className="relative rounded-2xl border border-zinc-700/80 bg-subcard hover:border-green-500/50 transition-colors focus-within:ring-2 focus-within:ring-green-500/40 focus-within:border-green-400">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-mono font-bold text-lg select-none">
              {currencyPrefix(from)}
            </div>
            <input
              id="amount-input"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                const next = sanitizeAmountInput(event.target.value)
                if (next !== null) onAmountChange(next)
              }}
              placeholder="0,00"
              maxLength={16}
              autoComplete="off"
              spellCheck={false}
              className="w-full bg-transparent text-white text-xl sm:text-2xl font-bold py-3.5 pl-16 pr-4 border-none focus:ring-0 focus:outline-none font-mono placeholder:text-zinc-600"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
            <span className="text-[10px] text-zinc-400 uppercase font-semibold">Atalhos:</span>
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onAmountChange(String(preset))}
                className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-subcard border border-zinc-800 hover:border-green-500/40 text-xs font-mono text-zinc-300 hover:text-white transition"
              >
                {currencyPrefix(from)}
                {formatNumber(preset, 0)}
              </button>
            ))}
          </div>
        </div>

        {/* Moedas de origem e destino com botão de inversão */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center pt-1">
          <div>
            <label
              className="block text-[11px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5"
              htmlFor="from-currency"
            >
              De (origem)
            </label>
            <div className="relative">
              <select
                id="from-currency"
                value={from}
                onChange={(event) => onFromChange(event.target.value)}
                className="w-full appearance-none rounded-2xl bg-subcard border border-zinc-700/80 text-white font-medium py-3.5 pl-4 pr-10 text-sm focus:ring-2 focus:ring-green-500/40 focus:border-green-400 cursor-pointer"
              >
                {options.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.code} · {currencyName(option.code, option.name)}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
          </div>

          <div className="flex justify-center md:pt-5">
            <button
              type="button"
              aria-label="Inverter moedas"
              title="Inverter moedas"
              onClick={onSwap}
              className="w-12 h-12 rounded-2xl bg-subcard border border-zinc-700 hover:border-green-500/50 text-zinc-300 hover:text-green-400 flex items-center justify-center transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                <path
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div>
            <label
              className="block text-[11px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5"
              htmlFor="to-currency"
            >
              Para (destino)
            </label>
            <div className="relative">
              <select
                id="to-currency"
                value={to}
                onChange={(event) => onToChange(event.target.value)}
                className="w-full appearance-none rounded-2xl bg-subcard border border-zinc-700/80 text-white font-medium py-3.5 pl-4 pr-10 text-sm focus:ring-2 focus:ring-green-500/40 focus:border-green-400 cursor-pointer"
              >
                {options.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.code} · {currencyName(option.code, option.name)}
                  </option>
                ))}
              </select>
              <Chevron />
            </div>
          </div>
        </div>

        {/* Pares rápidos e favoritos */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1">Rápido:</span>
          {QUICK_PAIRS.map(([pairFrom, pairTo]) => {
            const active = from === pairFrom && to === pairTo
            return (
              <button
                key={`${pairFrom}${pairTo}`}
                type="button"
                onClick={() => onApplyPair(pairFrom, pairTo)}
                className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                  active
                    ? 'bg-subcard border-green-500/40 text-green-300'
                    : 'bg-subcard border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                }`}
              >
                {pairFrom} / {pairTo}
              </button>
            )
          })}
        </div>

        {favorites.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold text-zinc-400 mr-1">Favoritos:</span>
            {favorites.map((favorite) => {
              const active = from === favorite.from && to === favorite.to
              return (
                <button
                  key={`${favorite.from}${favorite.to}`}
                  type="button"
                  onClick={() => onApplyPair(favorite.from, favorite.to)}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                    active
                      ? 'bg-green-950/60 border-green-500/40 text-green-300'
                      : 'bg-subcard border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600'
                  }`}
                >
                  {favorite.from} / {favorite.to}
                </button>
              )
            })}
          </div>
        )}

        {/* Taxa atual e data da cotação */}
        <div className="p-3 rounded-2xl bg-panel border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-400 font-semibold tracking-wider uppercase text-[10px]">
              Taxa atual
            </span>
            <span className="inline-flex items-center font-bold font-mono px-2.5 py-1 rounded-lg bg-subcard border border-green-500/20 text-green-300">
              1 {from} = {formatRate(rate)} {to}
            </span>
            {from === to && (
              <span className="text-[10px] font-mono text-zinc-500">paridade 1:1</span>
            )}
          </div>
          <span className="text-zinc-400 font-medium font-mono text-[11px] whitespace-nowrap">
            {latestDate
              ? `Cotação de ${formatDate(latestDate)}`
              : rateLoading
                ? 'Carregando...'
                : '-'}
          </span>
        </div>

        {/* Ações: salvar par e congelar taxa */}
        <div className="flex items-stretch gap-2.5">
          <button
            type="button"
            onClick={onToggleFreeze}
            disabled={!isFrozen && (rateLoading || rate == null)}
            aria-pressed={isFrozen}
            className={`flex-1 py-4 px-4 sm:px-6 rounded-2xl border font-extrabold text-xs sm:text-sm uppercase tracking-wide sm:tracking-wider whitespace-nowrap flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isFrozen
                ? 'bg-zinc-800 border-green-500/40 text-green-300 hover:bg-zinc-700'
                : 'bg-green-500 border-green-500 text-zinc-950 hover:bg-green-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {isFrozen ? (
                <>
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 7.5-2" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
                </>
              )}
            </svg>
            {isFrozen
              ? `Liberar taxa · ${frozenSecondsLeft}s`
              : rateLoading
                ? 'Carregando taxa...'
                : rate == null
                  ? 'Taxa indisponível'
                  : 'Congelar taxa por 60s'}
          </button>

          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? 'Remover dos favoritos' : 'Salvar par nos favoritos'}
            aria-pressed={isFavorite}
            title={isFavorite ? 'Remover dos favoritos' : 'Salvar par nos favoritos'}
            className={`shrink-0 p-4 rounded-2xl border transition-colors ${
              isFavorite
                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                : 'bg-subcard border-zinc-800 text-zinc-400 hover:text-green-300 hover:border-green-500/40'
            }`}
          >
            <BookmarkIcon filled={isFavorite} />
          </button>
        </div>
      </div>
    </section>
  )
}
