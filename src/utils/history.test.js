import { describe, expect, it } from 'vitest'
import { MAX_HISTORY, sanitizeHistory } from './history.js'

function entry(overrides = {}) {
  return {
    id: '1',
    at: '2026-10-17T12:00:00.000Z',
    from: 'usd',
    to: 'brl',
    amount: '1000',
    rate: '5.4',
    ...overrides,
  }
}

describe('sanitizeHistory', () => {
  it('normaliza e converte os campos numéricos', () => {
    expect(sanitizeHistory([entry()])).toEqual([
      {
        id: '1',
        at: '2026-10-17T12:00:00.000Z',
        from: 'USD',
        to: 'BRL',
        amount: 1000,
        rate: 5.4,
      },
    ])
  })

  it('descarta entradas inválidas', () => {
    const result = sanitizeHistory([
      null,
      entry({ from: 'US' }),
      entry({ amount: 0 }),
      entry({ rate: -1 }),
      entry({ at: 'data-invalida' }),
      entry({ at: '2026-02-30T12:00:00.000Z' }),
    ])
    expect(result).toEqual([])
  })

  it('remove duplicados pela chave de conversão', () => {
    const result = sanitizeHistory([entry(), entry({ id: '2' })])
    expect(result).toHaveLength(1)
  })

  it('limita o histórico e mantém a ordem recebida', () => {
    const rows = Array.from({ length: 10 }, (_, index) =>
      entry({
        id: String(index),
        at: `2026-10-${String(10 + index).padStart(2, '0')}T12:00:00.000Z`,
      }),
    )
    const result = sanitizeHistory(rows)
    expect(result).toHaveLength(MAX_HISTORY)
    expect(result[0].id).toBe('0')
    expect(result[7].id).toBe('7')
  })

  it('devolve lista vazia para valor que não é array', () => {
    expect(sanitizeHistory(null)).toEqual([])
    expect(sanitizeHistory({})).toEqual([])
  })
})
