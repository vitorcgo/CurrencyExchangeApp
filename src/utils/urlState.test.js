import { describe, expect, it } from 'vitest'
import { buildSearch, readUrlState } from './urlState.js'

describe('readUrlState', () => {
  it('lê e valida os parâmetros compartilháveis', () => {
    const state = readUrlState('?from=eur&to=brl&amount=1.234%2C56&period=3m')
    expect(state).toEqual({
      from: 'EUR',
      to: 'BRL',
      amount: '1234,56',
      period: '3m',
    })
  })

  it('ignora valores inválidos', () => {
    const state = readUrlState('?from=US&to=BRLL&amount=abc&period=10d')
    expect(state).toEqual({
      from: null,
      to: null,
      amount: null,
      period: null,
    })
  })

  it('trata valor vazio como ausente', () => {
    expect(readUrlState('?amount=').amount).toBeNull()
  })
})

describe('buildSearch', () => {
  it('omite os valores padrão', () => {
    expect(buildSearch({ from: 'USD', to: 'BRL', amount: '100', period: '30d' })).toBe(
      'from=USD&to=BRL',
    )
    expect(
      buildSearch({ from: 'USD', to: 'BRL', amount: '100,00', period: '30d' }),
    ).toBe('from=USD&to=BRL')
  })

  it('inclui valor e período quando diferentes do padrão', () => {
    const params = new URLSearchParams(
      buildSearch({ from: 'EUR', to: 'JPY', amount: '1.234,56', period: '3m' }),
    )
    expect(params.get('from')).toBe('EUR')
    expect(params.get('to')).toBe('JPY')
    expect(params.get('amount')).toBe('1234,56')
    expect(params.get('period')).toBe('3m')
  })

  it('não grava valor inválido', () => {
    expect(buildSearch({ from: 'USD', to: 'BRL', amount: 'abc', period: '30d' })).toBe(
      'from=USD&to=BRL',
    )
  })
})
