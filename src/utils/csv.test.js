import { describe, expect, it } from 'vitest'
import { buildCsv } from './csv.js'

const rows = [
  {
    date: '2026-10-16',
    rate: 5.4321,
    variation: 1.23,
  },
  {
    date: '2026-10-17',
    rate: 5.5,
    variation: null,
  },
]

describe('buildCsv', () => {
  it('inclui BOM, cabeçalho e separador compatível com Excel', () => {
    const csv = buildCsv(rows, { pair: 'USD/BRL' })
    expect(csv.startsWith('\uFEFFData;Par;Taxa;Variação (%)')).toBe(true)
    expect(csv).toContain('16/10/2026;USD/BRL;5,4321;1,23')
    expect(csv).toContain('17/10/2026;USD/BRL;5,5000;')
  })

  it('protege texto que começa com fórmula', () => {
    const csv = buildCsv(rows, { pair: '=1+1' })
    expect(csv).toContain(";'=1+1;")
  })

  it('escapa aspas e ponto e vírgula', () => {
    const csv = buildCsv(rows, { pair: 'USD;"teste"' })
    expect(csv).toContain('"USD;""teste"""')
  })

  it('funciona com lista vazia', () => {
    const csv = buildCsv([], { pair: 'EUR/JPY' })
    expect(csv).toBe('\uFEFFData;Par;Taxa;Variação (%)')
  })
})
