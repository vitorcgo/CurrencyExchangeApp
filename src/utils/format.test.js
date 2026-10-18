import { describe, expect, it } from 'vitest'
import { formatNumber, formatRate, parseAmount } from './format.js'

describe('parseAmount', () => {
  it('aceita vírgula como separador decimal', () => {
    expect(parseAmount('1.234,56')).toBe(1234.56)
    expect(parseAmount('0,5')).toBe(0.5)
  })

  it('aceita ponto como separador decimal quando não é milhar', () => {
    expect(parseAmount('1234.56')).toBe(1234.56)
    expect(parseAmount('1.5')).toBe(1.5)
  })

  it('interpreta ponto como milhar no padrão brasileiro', () => {
    expect(parseAmount('1.000')).toBe(1000)
    expect(parseAmount('1.234.567')).toBe(1234567)
  })

  it('devolve zero para valor vazio ou inválido', () => {
    expect(parseAmount('')).toBe(0)
    expect(parseAmount('abc')).toBe(0)
    expect(parseAmount('-10')).toBe(0)
  })
})

describe('formatação numérica', () => {
  it('usa o padrão brasileiro', () => {
    expect(formatNumber(1234.5)).toBe('1.234,50')
    expect(formatRate(5.4)).toBe('5,4000')
  })
})
