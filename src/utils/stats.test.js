import { describe, expect, it } from 'vitest'
import {
  minMax,
  periodChange,
  sma,
  trendOf,
  volatility,
  volatilityLabel,
  withVariation,
} from './stats.js'

const points = [
  { date: '2026-01-01', rate: 1 },
  { date: '2026-01-02', rate: 2 },
  { date: '2026-01-03', rate: 1.5 },
]

describe('withVariation', () => {
  it('calcula a variação em relação ao ponto anterior', () => {
    const result = withVariation(points)
    expect(result[0].variation).toBeNull()
    expect(result[1].variation).toBe(100)
    expect(result[2].variation).toBe(-25)
  })

  it('monta a mini-série da sparkline', () => {
    const result = withVariation(points)
    expect(result[0].spark).toEqual([1])
    expect(result[1].spark).toEqual([1, 2])
    expect(result[2].spark).toEqual([1, 2, 1.5])
  })
})

describe('minMax', () => {
  it('devolve nulos para uma lista vazia', () => {
    expect(minMax([])).toEqual({ min: null, max: null })
  })

  it('encontra os extremos', () => {
    expect(minMax(points)).toEqual({ min: 1, max: 2 })
  })
})

describe('sma', () => {
  it('preenche com null até completar a janela', () => {
    expect(sma([{ rate: 1 }, { rate: 2 }, { rate: 3 }, { rate: 4 }], 2)).toEqual([
      null,
      1.5,
      2.5,
      3.5,
    ])
  })
})

describe('periodChange', () => {
  it('calcula a variação total', () => {
    expect(periodChange([{ rate: 1 }, { rate: 2 }])).toBe(100)
    expect(periodChange([{ rate: 1 }])).toBeNull()
    expect(periodChange([{ rate: 0 }, { rate: 2 }])).toBeNull()
  })
})

describe('trendOf', () => {
  it('classifica a direção', () => {
    expect(trendOf(1).label).toBe('Alta')
    expect(trendOf(-1).label).toBe('Baixa')
    expect(trendOf(0).label).toBe('Neutra')
    expect(trendOf(null).label).toBe('Sem dados')
  })
})

describe('volatility', () => {
  it('devolve null com menos de duas variações', () => {
    expect(volatility([{ variation: null }, { variation: 1 }])).toBeNull()
  })

  it('calcula o desvio padrão das variações', () => {
    expect(volatility([{ variation: 2 }, { variation: 4 }])).toBeGreaterThan(0)
  })
})

describe('volatilityLabel', () => {
  it('traduz a volatilidade em rótulo', () => {
    expect(volatilityLabel(null).label).toBe('Sem dados')
    expect(volatilityLabel(0.2).label).toBe('Estável')
    expect(volatilityLabel(0.7).label).toBe('Moderada')
    expect(volatilityLabel(1.2).label).toBe('Alta')
  })
})
