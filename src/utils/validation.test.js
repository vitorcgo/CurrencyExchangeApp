import { describe, expect, it } from 'vitest'
import {
  isCurrencyCode,
  isISODate,
  normalizeCurrencyCode,
  sanitizeAmountInput,
  sanitizeFavorites,
} from './validation.js'

describe('isCurrencyCode', () => {
  it('aceita códigos de três letras em qualquer caixa', () => {
    expect(isCurrencyCode('USD')).toBe(true)
    expect(isCurrencyCode(' brl ')).toBe(true)
    expect(isCurrencyCode('US')).toBe(false)
    expect(isCurrencyCode('USDT')).toBe(false)
    expect(isCurrencyCode(null)).toBe(false)
  })
})

describe('normalizeCurrencyCode', () => {
  it('normaliza e aplica fallback', () => {
    expect(normalizeCurrencyCode(' eur ', 'USD')).toBe('EUR')
    expect(normalizeCurrencyCode('1O0', 'BRL')).toBe('BRL')
    expect(normalizeCurrencyCode(null)).toBeUndefined()
  })
})

describe('isISODate', () => {
  it('confere formato e existência no calendário', () => {
    expect(isISODate('2026-10-17')).toBe(true)
    expect(isISODate('2026-02-30')).toBe(false)
    expect(isISODate('2026-13-01')).toBe(false)
    expect(isISODate('17/10/2026')).toBe(false)
    expect(isISODate(null)).toBe(false)
  })
})

describe('sanitizeAmountInput', () => {
  it('remove símbolos e normaliza separador de milhar', () => {
    expect(sanitizeAmountInput('R$ 1.234,56')).toBe('1234,56')
    expect(sanitizeAmountInput('1.234.567')).toBe('1234567')
    expect(sanitizeAmountInput('1.000')).toBe('1000')
    expect(sanitizeAmountInput('1234.56')).toBe('1234.56')
    expect(sanitizeAmountInput('1.234.567.890,123456')).toBe('1234567890,123456')
  })

  it('recusa formatos inválidos', () => {
    expect(sanitizeAmountInput('1,2,3')).toBeNull()
    expect(sanitizeAmountInput('1234567890123')).toBeNull()
    expect(sanitizeAmountInput('12,1234567')).toBeNull()
    expect(sanitizeAmountInput(',')).toBeNull()
    expect(sanitizeAmountInput('.')).toBeNull()
  })

  it('devolve vazio quando não há números', () => {
    expect(sanitizeAmountInput('abc')).toBe('')
    expect(sanitizeAmountInput('')).toBe('')
  })

  it('aceita o limite de 12 dígitos e 6 casas', () => {
    expect(sanitizeAmountInput('123456789012,123456')).toBe('123456789012,123456')
  })
})

describe('sanitizeFavorites', () => {
  it('remove inválidos, normaliza e elimina duplicados', () => {
    const result = sanitizeFavorites([
      { from: 'usd', to: 'brl' },
      { from: 'USD', to: 'BRL' },
      { from: 'EURO', to: 'BRL' },
      null,
      { from: 'eur', to: 'jpy' },
    ])

    expect(result).toEqual([
      { from: 'USD', to: 'BRL' },
      { from: 'EUR', to: 'JPY' },
    ])
  })

  it('limita o total a oito pares', () => {
    const result = sanitizeFavorites(
      Array.from({ length: 10 }, (_, index) => ({
        from: 'USD',
        to: ['BRL', 'EUR', 'JPY', 'GBP', 'CHF', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK'][index],
      })),
    )

    expect(result).toHaveLength(8)
    expect(result[0]).toEqual({ from: 'USD', to: 'JPY' })
    expect(result[7]).toEqual({ from: 'USD', to: 'DKK' })
  })
})
