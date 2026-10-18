import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import Converter from './components/Converter.jsx'
import ConvertedHero from './components/ConvertedHero.jsx'
import RateChart from './components/RateChart.jsx'
import ComparisonChart from './components/ComparisonChart.jsx'
import AllRates from './components/AllRates.jsx'
import ConversionHistory from './components/ConversionHistory.jsx'
import RateAlert from './components/RateAlert.jsx'
import RatesTable from './components/RatesTable.jsx'
import StatsGrid from './components/StatsGrid.jsx'
import { useCurrencies } from './hooks/useCurrencies.js'
import { useConversionHistory } from './hooks/useConversionHistory.js'
import { useLocalStorage } from './hooks/useLocalStorage.js'
import { useTicker } from './hooks/useTicker.js'
import { useTheme } from './hooks/useTheme.js'
import { useTimeSeries } from './hooks/useTimeSeries.js'
import { formatDate } from './utils/format.js'
import { buildSearch, readUrlState } from './utils/urlState.js'
import { normalizeCurrencyCode, sanitizeFavorites } from './utils/validation.js'

const FREEZE_SECONDS = 60
const AUTO_REFRESH_OPTIONS = [0, 60, 300, 900]

export default function App() {
  // Lifting state up: o estado compartilhado entre os componentes vive aqui
  const [initialUrl] = useState(readUrlState)
  const [urlOverride, setUrlOverride] = useState(initialUrl)

  const [storedFrom, setFrom] = useLocalStorage(
    'fx:from',
    initialUrl.from ?? 'USD',
  )
  const [storedTo, setTo] = useLocalStorage('fx:to', initialUrl.to ?? 'BRL')
  const [storedFavorites, setFavorites] = useLocalStorage('fx:favorites', [])
  const [storedAutoRefresh, setAutoRefresh] = useLocalStorage('fx:autoRefresh', 0)
  const [amount, setAmount] = useState(initialUrl.amount ?? '100')
  const [timeframe, setTimeframe] = useState(initialUrl.period ?? '30d')
  const [frozen, setFrozen] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [refreshTick, setRefreshTick] = useState(0)
  const [lastRate, setLastRate] = useState({ from: null, to: null, rate: null })

  const from = normalizeCurrencyCode(urlOverride?.from ?? storedFrom, 'USD')
  const to = normalizeCurrencyCode(urlOverride?.to ?? storedTo, 'BRL')
  const favorites = useMemo(() => sanitizeFavorites(storedFavorites), [storedFavorites])
  const autoRefresh = AUTO_REFRESH_OPTIONS.includes(Number(storedAutoRefresh))
    ? Number(storedAutoRefresh)
    : 0

  const { theme, toggleTheme } = useTheme()
  const { history, record, clear: clearHistory } = useConversionHistory()

  // A URL tem prioridade sobre o localStorage na primeira carga
  useEffect(() => {
    if (urlOverride == null) return
    if (urlOverride.from) setFrom(urlOverride.from)
    if (urlOverride.to) setTo(urlOverride.to)
    setUrlOverride(null)
  }, [urlOverride, setFrom, setTo])

  // Corrige valores antigos ou inválidos gravados no localStorage
  useEffect(() => {
    if (storedFrom !== from) setFrom(from)
    if (storedTo !== to) setTo(to)
  }, [storedFrom, from, storedTo, to, setFrom, setTo])

  // Mantém a URL sincronizada para permitir compartilhar o par e o valor
  useEffect(() => {
    const search = buildSearch({ from, to, amount, period: timeframe })
    const next = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
    window.history.replaceState(null, '', next)
  }, [from, to, amount, timeframe])

  // Normaliza a frequência de atualização salva
  useEffect(() => {
    if (storedAutoRefresh !== autoRefresh) setAutoRefresh(autoRefresh)
  }, [storedAutoRefresh, autoRefresh, setAutoRefresh])

  // Remove favoritos inválidos ou duplicados que tenham ficado salvos
  useEffect(() => {
    const clean = sanitizeFavorites(storedFavorites)
    if (JSON.stringify(clean) !== JSON.stringify(storedFavorites)) {
      setFavorites(clean)
    }
  }, [storedFavorites, setFavorites])

  // Custom hooks de dados
  const { currencies } = useCurrencies()
  const series = useTimeSeries(from, to, timeframe)
  const ticker = useTicker()

  // Guarda a última taxa válida do par. Assim, trocar só o período do gráfico
  // não zera o conversor enquanto a nova série está carregando.
  useEffect(() => {
    if (!series.points.length) return
    const latest = series.points[series.points.length - 1].rate
    if (!Number.isFinite(latest)) return

    setLastRate((prev) =>
      prev.from === from && prev.to === to && prev.rate === latest
        ? prev
        : { from, to, rate: latest },
    )
  }, [from, to, series.points])

  const latestPoint = series.points[series.points.length - 1]
  const pointsRate = latestPoint ? latestPoint.rate : null
  const currentRate =
    Number.isFinite(pointsRate)
      ? pointsRate
      : series.loading && lastRate.from === from && lastRate.to === to
        ? lastRate.rate
        : null

  const isFrozen =
    frozen != null &&
    frozen.from === from &&
    frozen.to === to &&
    frozen.until > now
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

  // Registra a conversão depois que o usuário para de digitar
  useEffect(() => {
    if (effectiveRate == null) return undefined
    const id = setTimeout(() => {
      record({ from, to, amount, rate: effectiveRate })
    }, 1500)
    return () => clearTimeout(id)
  }, [from, to, amount, effectiveRate, record])

  // Atualização automática do painel inteiro
  useEffect(() => {
    if (!autoRefresh) return undefined
    const id = setInterval(() => {
      series.refetch()
      ticker.refetch()
      setRefreshTick((tick) => tick + 1)
    }, autoRefresh * 1000)
    return () => clearInterval(id)
  }, [autoRefresh, series.refetch, ticker.refetch])

  const isFavorite = favorites.some(
    (favorite) => favorite.from === from && favorite.to === to,
  )

  function toggleFavorite() {
    setFavorites((prev) => {
      const list = sanitizeFavorites(prev)
      const exists = list.some(
        (favorite) => favorite.from === from && favorite.to === to,
      )
      return exists
        ? list.filter((favorite) => !(favorite.from === from && favorite.to === to))
        : [...list, { from, to }].slice(-8)
    })
  }

  function applyPair(pairFrom, pairTo) {
    setFrom(pairFrom)
    setTo(pairTo)
  }

  function applyHistory(entry) {
    applyPair(entry.from, entry.to)
    setAmount(String(entry.amount).replace('.', ','))
  }

  function swapCurrencies() {
    setFrom(to)
    setTo(from)
  }

  function toggleFreeze() {
    if (isFrozen) {
      setFrozen(null)
    } else if (currentRate != null) {
      const startedAt = Date.now()
      setNow(startedAt)
      setFrozen({
        rate: currentRate,
        until: startedAt + FREEZE_SECONDS * 1000,
        from,
        to,
      })
    }
  }

  // O botão de atualizar renova a série, o ticker e os painéis derivados
  function handleRefresh() {
    series.refetch()
    ticker.refetch()
    setRefreshTick((tick) => tick + 1)
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
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {series.error && (
          <div
            role="alert"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-600/50 bg-zinc-900/70 px-5 py-3.5"
          >
            <p className="text-sm text-zinc-100">
              Não foi possível carregar as cotações da Frankfurter API:{' '}
              <span className="font-mono text-zinc-200">{series.error}</span>
            </p>
            <button
              type="button"
              onClick={series.refetch}
              className="shrink-0 self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-zinc-100/10 border border-zinc-500/40 text-zinc-100 text-xs font-bold hover:bg-zinc-100/20 transition"
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
              updatedAt={series.updatedAt}
              autoRefresh={autoRefresh}
              onAutoRefreshChange={setAutoRefresh}
              isFrozen={isFrozen}
              frozenSecondsLeft={frozenSecondsLeft}
              onToggleFreeze={toggleFreeze}
              favorites={favorites}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onApplyPair={applyPair}
            />
            <ConversionHistory
              history={history}
              onSelect={applyHistory}
              onClear={clearHistory}
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
            <RateAlert
              from={from}
              to={to}
              rate={currentRate}
              onApplyPair={applyPair}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 min-w-0">
            <ComparisonChart
              points={series.points}
              loading={series.loading}
              from={from}
              to={to}
              timeframe={timeframe}
              currencies={currencies}
              refreshKey={refreshTick}
            />
          </div>
          <div className="lg:col-span-4 min-w-0">
            <AllRates
              from={from}
              to={to}
              currencies={currencies}
              refreshKey={refreshTick}
              onSelect={setTo}
            />
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
        <p className="text-center text-xs text-zinc-500">
          Projeto didático de React com Vite. Dados: Frankfurter API (taxas de referência do BCE).
          {series.latestDate && (
            <>
              {' '}
              Última cotação oficial:{' '}
              <span className="font-mono text-zinc-400">{formatDate(series.latestDate)}</span>.
            </>
          )}
        </p>
      </footer>
    </div>
  )
}
