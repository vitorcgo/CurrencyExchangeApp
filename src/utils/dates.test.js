import { describe, expect, it } from 'vitest'
import {
  paritySeries,
  timeframeRange,
  toISO,
  todayISO,
} from './dates.js'

function daysBetween(start, end) {
  return (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000
}

describe('toISO', () => {
  it('formata a data local sem depender do fuso', () => {
    expect(toISO(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})

describe('todayISO', () => {
  it('devolve uma data ISO válida', () => {
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('timeframeRange', () => {
  it('inclui o dia de hoje na contagem', () => {
    const { start, end } = timeframeRange('7d')
    expect(daysBetween(start, end)).toBe(6)
  })

  it('usa 30 dias como fallback', () => {
    const { start, end } = timeframeRange('inexistente')
    expect(daysBetween(start, end)).toBe(29)
  })

  it('começa em 1999 no período máximo', () => {
    expect(timeframeRange('max').start).toBe('1999-01-04')
  })
})

describe('paritySeries', () => {
  it('gera apenas dias úteis com taxa 1', () => {
    const points = paritySeries('7d')
    expect(points).toHaveLength(5)
    expect(points.every((point) => point.rate === 1)).toBe(true)
    expect(points.every((point) => !isWeekend(point.date))).toBe(true)
  })

  it('respeita o início da série do BCE no período máximo', () => {
    const points = paritySeries('max')
    expect(points[0].date).toBe('1999-01-04')
    expect(points[points.length - 1].date <= todayISO()).toBe(true)
  })
})

function isWeekend(iso) {
  const day = new Date(`${iso}T12:00:00`).getDay()
  return day === 0 || day === 6
}
