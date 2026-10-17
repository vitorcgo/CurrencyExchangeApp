import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import Converter from './components/Converter.jsx'
import ConvertedHero from './components/ConvertedHero.jsx'
import RateChart from './components/RateChart.jsx'
import RatesTable from './components/RatesTable.jsx'
import StatsGrid from './components/StatsGrid.jsx'
import { useCurrencies } from './hooks/useCurrencies.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useTicker } from './hooks/useTicker.js'
import { useTimeSeries } from './hooks/useTimeSeries.js'
import { formatDate } from './utils/format.js'

const FREEZE_SECONDS = 60

export default function App() {
  // Lifting state up: o estado compartilhado entre os componentes vive aqui
  const [from, setFrom] = useLocalStorage('fx:from', 'USD')
  const [to, setTo] = useLocalStorage('fx:to', 'BRL')
  const [amount, setAmount] = useState('100')
  const [timeframe, setTimeframe] = useState('30d')
  const [favorites, setFavorites] = useLocalStorage('fx:favorites', [])
  const [frozen, setFrozen] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  // Custom hooks de dados
  const { currencies } = useCurrencies()
  const series = useTimeSeries(from, to, timeframe)
  const ticker = useTicker()

  const currentRate = series.points.length
    ? series.points[series.points.length - 1].rate
    : null
  const isFrozen = frozen != null && frozen.until > now
  const effectiveRate = isFrozen ? frozen.rate : currentRate
  const frozenSecondsLeft = isFrozen
    ? Math.max(0, Math.ceil((frozen.until - now) / 1000))
    : 0

  // Contagem regressiva da taxa congelada (efeito com intervalo)
  useEffect(() => {
    if (frozen == null) return undefined
    const id = setInterval(() => {
      if (Date.now() >= frozen.until) setFrozen(null)
      else setNow(Date.now())
    }, 1000)
    return () => clearInterval(id)
  }, [frozen])

  // Trocar de moeda invalida a taxa congelada
  useEffect(() => {
    setFrozen(null)
  }, [from, to])

  // O título da aba acompanha o par selecionado
  useEffect(() => {
    document.title = `Currency Exchange · ${from} para ${to}`
  }, [from, to])

  const isFavorite = favorites.some(
    (favorite) => favorite.from === from && favorite.to === to,
  )

  function toggleFavorite() {
    setFavorites((prev) =>
      prev.some((favorite) => favorite.from === from && favorite.to === to)
        ? prev.filter((favorite) => !(favorite.from === from && favorite.to === to))
        : [...prev, { from, to }].slice(-8),
    )
  }

  function applyPair(pairFrom, pairTo) {
    setFrom(pairFrom)
    setTo(pairTo)
  }

  function swapCurrencies() {
    setFrom(to)
    setTo(from)
  }

  function toggleFreeze() {
    if (frozen != null) {
      setFrozen(null)
    } else if (currentRate != null) {
      const startedAt = Date.now()
      setNow(startedAt)
      setFrozen({ rate: currentRate, until: startedAt + FREEZE_SECONDS * 1000 })
    }
  }

  // O botão de atualizar renova a série do par e também o ticker
  function handleRefresh() {
    series.refetch()
    ticker.refetch()
  }

  const status = series.error ? 'error' : series.loading ? 'loading' : 'ok'

  return (
    <div className="min-h-screen">
      <Header
        status={status}
        latency={series.latency}
        ticker={ticker}
        latestDate={series.latestDate}
        onRefresh={handleRefresh}
      />

      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {series.error && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/30 px-5 py-3.5">
            <p className="text-sm text-rose-200">
              Não foi possível carregar as cotações da Frankfurter API:{' '}
              <span className="font-mono text-rose-300">{series.error}</span>
            </p>
            <button
              type="button"
              onClick={series.refetch}
              className="shrink-0 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold hover:bg-rose-500/30 transition"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 min-w-0 space-y-6">
            <ConvertedHero
              amount={amount}
              rate={effectiveRate}
              from={from}
              to={to}
              points={series.points}
              isFrozen={isFrozen}
              frozenSecondsLeft={frozenSecondsLeft}
            />
            <Converter
              amount={amount}
              onAmountChange={setAmount}
              from={from}
              to={to}
              onFromChange={setFrom}
              onToChange={setTo}
              onSwap={swapCurrencies}
              currencies={currencies}
              rate={effectiveRate}
              rateLoading={series.loading}
              latestDate={series.latestDate}
              isFrozen={isFrozen}
              frozenSecondsLeft={frozenSecondsLeft}
              onToggleFreeze={toggleFreeze}
              favorites={favorites}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onApplyPair={applyPair}
            />
          </div>

          <div className="lg:col-span-7 min-w-0 space-y-6">
            <RateChart
              points={series.points}
              loading={series.loading}
              from={from}
              to={to}
              timeframe={timeframe}
              onTimeframeChange={setTimeframe}
            />
            <StatsGrid points={series.points} from={from} to={to} />
          </div>
        </div>

        <RatesTable
          points={series.points}
          loading={series.loading}
          from={from}
          to={to}
          timeframe={timeframe}
        />
      </main>

      <footer className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-2">
        <p className="text-center text-xs text-slate-500">
          Projeto didático de React com Vite. Dados: Frankfurter API (taxas de referência do BCE).
          {series.latestDate && (
            <>
              {' '}
              Última cotação oficial:{' '}
              <span className="font-mono text-slate-400">{formatDate(series.latestDate)}</span>.
            </>
          )}
        </p>
      </footer>
    </div>
  )
}
