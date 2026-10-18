import { useState } from 'react'
import Card from './Card.jsx'
import { useRateAlert } from '../hooks/useRateAlert.js'
import { formatRate } from '../utils/format.js'
import { sanitizeAmountInput } from '../utils/validation.js'

function BellIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path
        d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function RateAlert({ from, to, rate, onApplyPair }) {
  const { currentAlert, otherAlert, create, clear } = useRateAlert(from, to, rate)
  const [target, setTarget] = useState('')
  const [direction, setDirection] = useState('above')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const created = create(target, direction)
    if (!created) {
      setError('Informe um valor alvo maior que zero.')
      return
    }
    setError('')
    setTarget('')
  }

  function handleTargetChange(event) {
    const raw = event.target.value
    const clean = sanitizeAmountInput(raw)
    if (clean === null || (clean === '' && raw.trim() !== '')) {
      setError('Valor inválido. Use até 12 dígitos e no máximo 6 casas decimais.')
      return
    }
    setTarget(clean)
    if (error) setError('')
  }

  return (
    <Card className="p-5 sm:p-6" data-purpose="alerta-cotacao">
      <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-800/70">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span className="text-green-400">
            <BellIcon />
          </span>
          Alerta de cotação
        </h3>
        <span className="text-[10px] font-mono text-zinc-500 uppercase">
          {from} / {to}
        </span>
      </div>

      {currentAlert ? (
        <div className="space-y-3">
          <div
            role="status"
            className={`rounded-xl border p-3 ${
              currentAlert.triggered
                ? 'bg-green-500/10 border-green-500/40'
                : 'bg-panel border-zinc-800'
            }`}
          >
            <p className="text-xs text-zinc-300 leading-relaxed">
              Avisar quando {from}/{to} ficar{' '}
              <strong className="text-white">
                {currentAlert.direction === 'above' ? 'acima' : 'abaixo'} de{' '}
                {formatRate(currentAlert.target)}
              </strong>
              .
            </p>
            <p className="text-[11px] font-mono mt-2 text-zinc-400">
              {currentAlert.triggered
                ? `Alvo atingido${currentAlert.triggeredAt ? ` em ${new Date(currentAlert.triggeredAt).toLocaleString('pt-BR')}` : ''}.`
                : rate != null
                  ? `Aguardando. Cotação atual: ${formatRate(rate)} ${to}.`
                  : 'Aguardando uma cotação válida.'}
            </p>
          </div>
          <button
            type="button"
            onClick={clear}
            className="w-full px-3 py-2 rounded-xl bg-subcard border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
          >
            Remover alerta
          </button>
        </div>
      ) : (
        <>
          {otherAlert && (
            <div className="rounded-xl border border-zinc-800 bg-panel p-3 mb-4">
              <p className="text-xs text-zinc-300">
                Alerta salvo para {otherAlert.from}/{otherAlert.to}.
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onApplyPair(otherAlert.from, otherAlert.to)}
                  className="px-2.5 py-1 rounded-lg bg-subcard border border-zinc-700 text-[11px] font-bold text-zinc-300 hover:text-white transition-colors"
                >
                  Abrir par
                </button>
                <button
                  type="button"
                  onClick={clear}
                  className="px-2.5 py-1 rounded-lg bg-subcard border border-zinc-800 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors"
                >
                  Remover
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label
                className="block text-[11px] font-bold tracking-wider text-zinc-400 uppercase mb-1.5"
                htmlFor="alert-target"
              >
                Avisar quando a taxa estiver
              </label>
              <div className="flex gap-2">
                <select
                  value={direction}
                  onChange={(event) => setDirection(event.target.value)}
                  aria-label="Direção do alerta"
                  className="shrink-0 rounded-xl bg-subcard border border-zinc-700/80 text-xs font-semibold text-zinc-300 px-2.5 py-2.5 focus:outline-none focus:border-green-500/50 cursor-pointer"
                >
                  <option value="above">Acima de</option>
                  <option value="below">Abaixo de</option>
                </select>
                <input
                  id="alert-target"
                  type="text"
                  inputMode="decimal"
                  value={target}
                  onChange={handleTargetChange}
                  placeholder={rate != null ? formatRate(rate) : '0,00'}
                  maxLength={20}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={Boolean(error)}
                  aria-describedby="alert-help"
                  className={`min-w-0 flex-1 rounded-xl bg-subcard border px-3 py-2.5 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-green-500/30 ${
                    error ? 'border-zinc-400' : 'border-zinc-700/80 focus:border-green-400'
                  }`}
                />
              </div>
            </div>

            <p
              id="alert-help"
              role={error ? 'alert' : undefined}
              className={`text-[11px] leading-relaxed ${error ? 'text-zinc-100' : 'text-zinc-500'}`}
            >
              {error ||
                'O alerta é verificado enquanto esta aba estiver aberta. Com a atualização automática ativa, a checagem acontece em segundo plano.'}
            </p>

            <button
              type="submit"
              className="w-full px-3 py-2.5 rounded-xl bg-green-500 border border-green-500 text-black text-xs font-extrabold uppercase tracking-wide hover:bg-[#4ade80] transition-colors"
            >
              Criar alerta
            </button>
          </form>
        </>
      )}
    </Card>
  )
}
