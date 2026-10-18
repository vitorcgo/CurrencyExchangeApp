import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Converter from './Converter.jsx'
import { FALLBACK_CURRENCIES } from '../utils/format.js'

function makeProps(overrides = {}) {
  return {
    amount: '100',
    onAmountChange: vi.fn(),
    from: 'USD',
    to: 'BRL',
    onFromChange: vi.fn(),
    onToChange: vi.fn(),
    onSwap: vi.fn(),
    currencies: FALLBACK_CURRENCIES,
    rate: 5.4,
    rateLoading: false,
    latestDate: '2026-10-16',
    updatedAt: Date.now(),
    autoRefresh: 0,
    onAutoRefreshChange: vi.fn(),
    isFrozen: false,
    frozenSecondsLeft: 0,
    onToggleFreeze: vi.fn(),
    favorites: [],
    isFavorite: false,
    onToggleFavorite: vi.fn(),
    onApplyPair: vi.fn(),
    ...overrides,
  }
}

describe('Converter', () => {
  it('renderiza o par e a taxa atual', () => {
    render(<Converter {...makeProps()} />)
    expect(screen.getByText('Conversor de moedas')).toBeInTheDocument()
    expect(screen.getByText('1 USD = 5,4000 BRL')).toBeInTheDocument()
  })

  it('normaliza o valor digitado com separador de milhar', () => {
    const props = makeProps()
    render(<Converter {...props} />)

    fireEvent.change(screen.getByLabelText('Valor a converter'), {
      target: { value: '1.234,56' },
    })

    expect(props.onAmountChange).toHaveBeenCalledWith('1234,56')
  })

  it('mostra erro e não altera o valor em entrada inválida', () => {
    const props = makeProps()
    render(<Converter {...props} />)

    fireEvent.change(screen.getByLabelText('Valor a converter'), {
      target: { value: '1,2,3' },
    })

    expect(props.onAmountChange).not.toHaveBeenCalled()
    expect(screen.getByText(/Valor inválido/)).toBeInTheDocument()
  })

  it('formata o valor ao sair do campo', () => {
    const props = makeProps({ amount: '1234,56' })
    render(<Converter {...props} />)

    fireEvent.blur(screen.getByLabelText('Valor a converter'))
    expect(props.onAmountChange).toHaveBeenCalledWith('1.234,56')
  })

  it('alterna o favorito do par', () => {
    const props = makeProps()
    render(<Converter {...props} />)

    fireEvent.click(screen.getByRole('button', { name: 'Salvar par nos favoritos' }))
    expect(props.onToggleFavorite).toHaveBeenCalledTimes(1)
  })

  it('envia a frequência de atualização escolhida', () => {
    const props = makeProps()
    render(<Converter {...props} />)

    fireEvent.change(screen.getByLabelText('Frequência de atualização automática'), {
      target: { value: '60' },
    })
    expect(props.onAutoRefreshChange).toHaveBeenCalledWith(60)
  })
})
