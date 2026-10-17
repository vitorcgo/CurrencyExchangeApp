import { useEffect, useMemo, useRef, useState } from 'react'
import Card from './Card.jsx'
import { useElementWidth } from '../hooks/useElementWidth.js'
import { sma } from '../utils/stats.js'
import {
  formatDate,
  formatDateShort,
  formatRate,
  formatSignedPercent,
} from '../utils/format.js'
import { TIMEFRAMES } from '../utils/dates.js'

const HEIGHT_DESKTOP = 320
const HEIGHT_MOBILE = 260
const PAD_TOP = 14
const PAD_BOTTOM = 26
const PAD_RIGHT = 14

// Rótulos curtos para o eixo Y: valores muito pequenos viram
// notação científica para não invadir a área do gráfico
function formatAxisValue(value) {
  if (value == null || Number.isNaN(value)) return '-'
  const abs = Math.abs(value)
  if (abs !== 0 && abs < 0.01) {
    return value.toExponential(2).replace('.', ',')
  }
  return formatRate(value)
}

export default function RateChart({ points, loading, from, to, timeframe, onTimeframeChange }) {
  const containerRef = useRef(null)
  const width = useElementWidth(containerRef)
  const [hoverIndex, setHoverIndex] = useState(null)

  // Reinicia o destaque quando a série muda (troca de par ou período),
  // senão o índice antigo pode apontar para fora da nova lista
  useEffect(() => {
    setHoverIndex(null)
  }, [points])

  // Ajustes de responsividade a partir da largura medida
  const compact = width > 0 && width < 640
  const height = compact ? HEIGHT_MOBILE : HEIGHT_DESKTOP
  const padLeft = compact ? 58 : 64

  const model = useMemo(() => {
    if (!points.length) return null
    const rates = points.map((point) => point.rate)
    let min = Math.min(...rates)
    let max = Math.max(...rates)
    // Série constante (ex.: paridade 1:1): abre uma faixa artificial
    if (min === max) {
      const padding = Math.abs(max) * 0.005 || 0.0005
      min -= padding
      max += padding
    }
    const sma20 = sma(points, 20)
    const sma50 = sma(points, 50)
    return {
      min,
      max,
      sma20,
      sma20Last: [...sma20].reverse().find((value) => value != null) ?? null,
      sma50Last: [...sma50].reverse().find((value) => value != null) ?? null,
    }
  }, [points])

  const geometry = useMemo(() => {
    if (!model || !points.length || width === 0) return null

    const plotWidth = Math.max(width - padLeft - PAD_RIGHT, 10)
    const plotHeight = height - PAD_TOP - PAD_BOTTOM
    const span = model.max - model.min

    const xAt = (index) =>
      points.length <= 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth
    const yAt = (rate) => (1 - (rate - model.min) / span) * plotHeight

    const toPath = (values) => {
      let path = ''
      let open = false
      values.forEach((value, index) => {
        if (value == null) {
          open = false
          return
        }
        path += `${open ? 'L' : 'M'}${xAt(index).toFixed(2)},${yAt(value).toFixed(2)}`
        open = true
      })
      return path
    }

    const linePath = toPath(points.map((point) => point.rate))
    const areaPath = linePath
      ? `${linePath}L${xAt(points.length - 1).toFixed(2)},${plotHeight}L${xAt(0).toFixed(2)},${plotHeight}Z`
      : ''
    const smaPath = model.sma20 ? toPath(model.sma20) : ''

    const yTicks = Array.from({ length: 5 }, (_, index) => model.max - (index / 4) * span)

    // Menos rótulos no eixo X quando a tela é estreita
    const tickCount = Math.max(3, Math.min(7, Math.floor(plotWidth / 130) + 1))
    const tickIndexes = [
      ...new Set(
        Array.from({ length: tickCount }, (_, index) =>
          Math.round((index * (points.length - 1)) / Math.max(tickCount - 1, 1)),
        ),
      ),
    ]

    return { plotWidth, plotHeight, xAt, yAt, linePath, areaPath, smaPath, yTicks, tickIndexes }
  }, [model, points, width, padLeft, height])

  function handlePointerMove(event) {
    if (!geometry) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left - padLeft
    const ratio = Math.min(Math.max(x / geometry.plotWidth, 0), 1)
    setHoverIndex(Math.round(ratio * Math.max(points.length - 1, 0)))
  }

  const activeIndex = hoverIndex ?? (points.length ? points.length - 1 : null)
  const activePoint = activeIndex != null ? points[activeIndex] : null
  const previousPoint = activeIndex != null && activeIndex > 0 ? points[activeIndex - 1] : null
  const activeVariation =
    activePoint && previousPoint
      ? ((activePoint.rate - previousPoint.rate) / previousPoint.rate) * 100
      : null

  const tooltipX =
    geometry && activeIndex != null
      ? Math.min(Math.max(padLeft + geometry.xAt(activeIndex), 118), Math.max(width - 118, 118))
      : 0

  return (
    <Card className="p-5 sm:p-7" data-purpose="historico-chart">
      {/* Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800/70">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs font-bold text-emerald-400 uppercase font-mono leading-none">
            {from} / {to}
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
              Histórico {from} / {to}
              {from === to && (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                  Paridade 1:1
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
              SMA(20): {formatRate(model?.sma20Last)} | SMA(50): {formatRate(model?.sma50Last)}
            </p>
          </div>
        </div>

        <div className="flex items-center bg-subcard border border-slate-800 rounded-xl p-1 text-xs font-semibold text-slate-400 font-mono overflow-x-auto max-w-full shrink-0">
          {TIMEFRAMES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onTimeframeChange(item.id)}
              className={`shrink-0 px-2.5 py-1 rounded-lg transition border ${
                timeframe === item.id
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-sm'
                  : 'border-transparent hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Área do gráfico */}
      <div className="pt-4">
        <div ref={containerRef} className="relative w-full" style={{ height }}>
          {!geometry ? (
            <div className="w-full h-full rounded-2xl bg-[#080d17]/50 border border-slate-800/50 flex items-center justify-center">
              <span className="text-xs font-mono text-slate-500 animate-pulse">
                {loading ? 'carregando série histórica...' : 'sem dados para exibir'}
              </span>
            </div>
          ) : (
            <>
              {activePoint && (
                <div
                  className="absolute top-2 z-20 pointer-events-none -translate-x-1/2 bg-[#09111d]/95 border border-cyan-500/40 rounded-xl px-3 py-1.5 shadow-xl shadow-cyan-950/60 backdrop-blur-md flex items-center gap-2 sm:gap-3"
                  style={{ left: tooltipX }}
                >
                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    {formatDate(activePoint.date)}
                    {activeIndex === points.length - 1 && (
                      <span className="text-cyan-400"> · atual</span>
                    )}
                  </span>
                  <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-cyan-400" />
                  <span className="text-xs font-mono font-bold text-white whitespace-nowrap">
                    {formatRate(activePoint.rate)} {to}
                  </span>
                  {activeVariation != null && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                        activeVariation >= 0
                          ? 'text-emerald-400 bg-emerald-950/80'
                          : 'text-rose-400 bg-rose-950/80'
                      }`}
                    >
                      {formatSignedPercent(activeVariation)}
                    </span>
                  )}
                </div>
              )}

              <svg
                width={width}
                height={height}
                className="block select-none"
                onMouseMove={handlePointerMove}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <defs>
                  <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.32" />
                    <stop offset="45%" stopColor="#10b981" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#070b12" stopOpacity="0" />
                  </linearGradient>
                  <filter id="chart-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <g transform={`translate(${padLeft}, ${PAD_TOP})`}>
                  {/* Linhas de grade e rótulos do eixo Y */}
                  {geometry.yTicks.map((tick, index) => (
                    <g key={`y-${index}`}>
                      <line
                        x1="0"
                        x2={geometry.plotWidth}
                        y1={geometry.yAt(tick)}
                        y2={geometry.yAt(tick)}
                        stroke="#1e293b"
                        strokeOpacity="0.6"
                        strokeDasharray="4 6"
                      />
                      <text
                        x="-10"
                        y={geometry.yAt(tick) + 4}
                        textAnchor="end"
                        fontSize={compact ? 10 : 11}
                        className="fill-slate-500 font-mono"
                      >
                        {formatAxisValue(tick)}
                      </text>
                    </g>
                  ))}

                  {/* Linhas de grade e rótulos do eixo X */}
                  {geometry.tickIndexes.map((index) => (
                    <g key={`x-${index}`}>
                      <line
                        x1={geometry.xAt(index)}
                        x2={geometry.xAt(index)}
                        y1="0"
                        y2={geometry.plotHeight}
                        stroke="#1e293b"
                        strokeOpacity="0.35"
                        strokeDasharray="4 6"
                      />
                      <text
                        x={geometry.xAt(index)}
                        y={geometry.plotHeight + 18}
                        textAnchor={
                          index === 0
                            ? 'start'
                            : index === points.length - 1
                              ? 'end'
                              : 'middle'
                        }
                        fontSize={compact ? 10 : 11}
                        className="fill-slate-500 font-mono"
                      >
                        {formatDateShort(points[index]?.date)}
                      </text>
                    </g>
                  ))}

                  {/* Área com gradiente */}
                  {geometry.areaPath && <path d={geometry.areaPath} fill="url(#chart-area-gradient)" />}

                  {/* Média móvel de 20 períodos */}
                  {geometry.smaPath && (
                    <path
                      d={geometry.smaPath}
                      fill="none"
                      stroke="#10b981"
                      strokeOpacity="0.55"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                    />
                  )}

                  {/* Linha principal */}
                  <path
                    d={geometry.linePath}
                    fill="none"
                    stroke="#00f2fe"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#chart-line-glow)"
                  />

                  {/* Cruzamento e ponto ativos */}
                  {activePoint && (
                    <>
                      <line
                        x1={geometry.xAt(activeIndex)}
                        x2={geometry.xAt(activeIndex)}
                        y1="0"
                        y2={geometry.plotHeight}
                        stroke="#00e5ff"
                        strokeOpacity="0.35"
                        strokeDasharray="4 4"
                      />
                      <circle
                        cx={geometry.xAt(activeIndex)}
                        cy={geometry.yAt(activePoint.rate)}
                        r="4.5"
                        fill="#00f2fe"
                        stroke="#080e1a"
                        strokeWidth="2"
                      />
                    </>
                  )}
                </g>
              </svg>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
