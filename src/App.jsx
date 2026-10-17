import { useState } from 'react'
import Header from './components/Header.jsx'
import Converter from './components/Converter.jsx'
import ConvertedHero from './components/ConvertedHero.jsx'
import Card from './components/Card.jsx'

// Nesta etapa os dados ainda são simulados.
// O consumo da Frankfurter API entra na próxima etapa.
const MOCK_TICKER = {
  loading: false,
  error: null,
  items: [
    { label: 'USD/BRL', rate: 5.412, variation: 0.32 },
    { label: 'EUR/USD', rate: 1.0875, variation: 0.08 },
    { label: 'GBP/USD', rate: 1.2994, variation: 0.21 },
    { label: 'AUD/USD', rate: 0.6682, variation: -0.14 },
  ],
}

export default function App() {
  // Lifting state up: o estado compartilhado vive no App e desce via props
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('BRL')
  const [favorites, setFavorites] = useState([])

  // Taxa fixa por enquanto; na próxima etapa vem da API
  const rate = 1

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

  return (
    <div className="min-h-screen">
      <Header
        status="loading"
        latency={null}
        ticker={MOCK_TICKER}
        latestDate={null}
        onRefresh={() => {}}
      />

      <main className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-6">
            <ConvertedHero
              amount={amount}
              rate={rate}
              from={from}
              to={to}
              points={[]}
              isFrozen={false}
              frozenSecondsLeft={0}
            />
            <Converter
              amount={amount}
              onAmountChange={setAmount}
              from={from}
              to={to}
              onFromChange={setFrom}
              onToChange={setTo}
              onSwap={swapCurrencies}
              currencies={null}
              rate={rate}
              rateLoading={false}
              latestDate={null}
              isFrozen={false}
              frozenSecondsLeft={0}
              onToggleFreeze={() => {}}
              favorites={favorites}
              isFavorite={isFavorite}
              onToggleFavorite={toggleFavorite}
              onApplyPair={applyPair}
            />
          </div>

          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-7">
              <p className="text-sm text-slate-400">
                Gráfico histórico, estatísticas e tabela de cotações chegam nas próximas etapas.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
