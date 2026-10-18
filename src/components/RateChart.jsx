import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Card from './Card.jsx'
import { useElementWidth } from '../hooks/useElementWidth.js'
import { sma } from '../utils/stats.js'
import {
  formatDate,
  formatDateShort,
  formatRate,
  formatSignedPercent,
} from '../utils/format.js'
import { TIMEFRAMES, todayISO } from '../utils/dates.js'
import { exportChartAsPng } from '../utils/chartExport.js'

const HEIGHT_DESKTOP = 320
const HEIGHT_MOBILE = 260
const PAD_TOP = 14
const PAD_BOTTOM = 26
const PAD_RIGHT = 14

// Rótulos curtos para o eixo Y: valores muito pequenos viram
// notação científica para não invadir a área do gráfico
function formatAxisValue(value) {
  if (value == null || !Number.isFinite(value)) return '-'
  const abs = Math.abs(value)
  if (abs !== 0 && abs < 0.01) {
    return value.toExponential(2).replace('.', ',')
  }
  return formatRate(value)
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function RateChart({ points, loading, from, to, timeframe, onTimeframeChange }) {
  const containerRef = useRef(null)
  const width = useElementWidth(containerRef)
  const [hoverIndex, setHoverIndex] = useState(null)
  const [tooltipHidden, setTooltipHidden] = useState(false)
  const tooltipRef = useRef(null)
  const [tooltipWidth, setTooltipWidth] = useState(0)
  const svgRef = useRef(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  // Mede a largura real do balão (o conteúdo varia com a cotação)
  // antes da pintura, para conseguir prendê-lo nas bordas
  useLayoutEffect(() => {
    const element = tooltipRef.current
    if (!element) return undefined

    const measure = () => {
      const measured = element.offsetWidth
      if (measured) {
        setTooltipWidth((current) => (current === measured ? current : measured))
      }
    }

    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [points, hoverIndex, width])

  // Reinicia o destaque quando a série muda (troca de par ou período),
  // senão o índice antigo pode apontar para fora da nova lista
  useEffect(() => {
    setHoverIndex(null)
    setTooltipHidden(false)
  }, [points])

  // Ajustes de responsividade a partir da largura medida
  const compact = width > 0 && width < 640
  const height = compact ? HEIGHT_MOBILE : HEIGHT_DESKTOP

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
      sma50,
      sma20Last: [...sma20].reverse().find((value) => value != null) ?? null,
      sma50Last: [...sma50].reverse().find((value) => value != null) ?? null,
    }
  }, [points])

  // Reserva espaço para o maior rótulo do eixo Y. Sem isso, moedas com
  // cotações altas (KRW, IDR, HUF) têm o texto cortado na borda esquerda.
  const axisLabels = useMemo(() => {
    if (!model) return []
    return Array.from({ length: 5 }, (_, index) =>
      formatAxisValue(model.max - (index / 4) * (model.max - model.min)),
    )
  }, [model])

  const padLeft = Math.max(
    compact ? 58 : 64,
    Math.round(Math.max(...axisLabels.map((label) => label.length), 4) * (compact ? 6.1 : 6.7)) + 16,
  )

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
    const sma50Path = model.sma50 ? toPath(model.sma50) : ''

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

    return {
      plotWidth,
      plotHeight,
      xAt,
      yAt,
      linePath,
      areaPath,
      smaPath,
      sma50Path,
      yTicks,
      tickIndexes,
    }
  }, [model, points, width, padLeft, height])

  function handlePointerMove(event) {
    if (!geometry) return
    setTooltipHidden(false)
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left - padLeft
    const ratio = Math.min(Math.max(x / geometry.plotWidth, 0), 1)
    setHoverIndex(Math.round(ratio * Math.max(points.length - 1, 0)))
  }

  // Navegação pelo histórico sem mouse. O SVG recebe foco pelo teclado.
  function handleKeyDown(event) {
    if (!points.length) return
    const last = points.length - 1

    if (
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'Home' ||
      event.key === 'End' ||
      event.key === 'Escape'
    ) {
      event.preventDefault()
    }

    if (event.key === 'Escape') {
      setHoverIndex(null)
      setTooltipHidden(true)
      return
    }
    setTooltipHidden(false)
    if (event.key === 'Home') {
      setHoverIndex(0)
      return
    }
    if (event.key === 'End') {
      setHoverIndex(last)
      return
    }
    if (event.key === 'ArrowLeft') {
      setHoverIndex((current) => (current == null ? last : Math.max(0, current - 1)))
      return
    }
    if (event.key === 'ArrowRight') {
      setHoverIndex((current) => (current == null ? 0 : Math.min(last, current + 1)))
    }
  }

  async function handleExport() {
    if (!svgRef.current || exporting) return
    setExporting(true)
    setExportError('')

    try {
      const cardColor = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--color-card')
        .trim()

      await exportChartAsPng(svgRef.current, {
        fileName: `grafico-${from}-${to}-${timeframe}-${todayISO()}.png`,
        background: cardColor || '#121212',
      })
    } catch (error) {
      setExportError(error.message || 'Não foi possível gerar o PNG.')
    } finally {
      setExporting(false)
    }
  }

  const activeIndex = tooltipHidden
    ? null
    : hoverIndex ?? (points.length ? points.length - 1 : null)
  const activePoint = activeIndex != null ? points[activeIndex] : null
  const previousPoint = activeIndex != null && activeIndex > 0 ? points[activeIndex - 1] : null
  const activeVariation =
    activePoint && previousPoint
      ? ((activePoint.rate - previousPoint.rate) / previousPoint.rate) * 100
      : null

  // Prende o balão inteiro dentro da área do gráfico, inclusive nas bordas
  const tooltipHalf = tooltipWidth / 2
  const tooltipMinX = tooltipHalf + 4
  const tooltipMaxX = Math.max(width - tooltipHalf - 4, tooltipMinX)
  const tooltipX =
    geometry && activeIndex != null
      ? Math.min(Math.max(padLeft + geometry.xAt(activeIndex), tooltipMinX), tooltipMaxX)
      : 0

  return (
    <Card className="p-5 sm:p-7" data-purpose="historico-chart">
      {/* Controles */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-zinc-800/70">
        <div className="flex items-center gap-3 min-w-0">
          <div className="shrink-0 px-3 py-1.5 rounded-xl bg-green-950/60 border border-green-500/30 text-xs font-bold text-green-400 uppercase font-mono leading-none">
            {from} / {to}
          </div>
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 flex-wrap">
              Histórico {from} / {to}
              {from === to && (
                <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-normal">
                  Paridade 1:1
                </span>
              )}
            </h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="inline-flex items-center gap-1">
                <span aria-hidden="true" className="w-2 h-0.5 rounded-full bg-zinc-400" />
                SMA(20): {formatRate(model?.sma20Last)}
              </span>
              <span className="inline-flex items-center gap-1 text-zinc-500">
                <span aria-hidden="true" className="w-2 h-0.5 rounded-full bg-zinc-500" />
                SMA(50): {formatRate(model?.sma50Last)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 max-w-full">
          <div className="flex flex-wrap sm:flex-nowrap items-center bg-subcard border border-zinc-800 rounded-xl p-1 text-xs font-semibold text-zinc-400 font-mono max-w-full min-w-0">
            {TIMEFRAMES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTimeframeChange(item.id)}
                aria-pressed={timeframe === item.id}
                className={`shrink-0 px-2.5 py-1 rounded-lg transition-colors border ${
                  timeframe === item.id
                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                    : 'border-transparent hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={!geometry || exporting}
            aria-label="Baixar gráfico em PNG"
            title="Baixar gráfico em PNG"
            className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-subcard border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white hover:border-green-500/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <DownloadIcon />
            <span className="hidden sm:inline">{exporting ? 'Gerando...' : 'PNG'}</span>
          </button>
        </div>
      </div>

      {exportError && (
        <p role="alert" className="text-[11px] text-zinc-200 pt-3">
          {exportError}
        </p>
      )}

      {/* Área do gráfico */}
      <div className="pt-4">
        <div ref={containerRef} className="relative w-full" style={{ height }}>
          {!geometry ? (
            <div className="w-full h-full rounded-2xl bg-panel border border-zinc-800/50 flex items-center justify-center">
              <span className="text-xs font-mono text-zinc-500">
                {loading ? 'carregando série histórica...' : 'sem dados para exibir'}
              </span>
            </div>
          ) : (
            <>
              {activePoint && (
                <div
                  ref={tooltipRef}
                  className="absolute top-2 z-20 pointer-events-none -translate-x-1/2 bg-panel border border-zinc-700 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2 sm:gap-3"
                  style={{ left: tooltipX }}
                >
                  <span className="text-[11px] font-mono text-zinc-400 whitespace-nowrap">
                    {formatDate(activePoint.date)}
                    {activeIndex === points.length - 1 && (
                      <span className="text-green-400"> · atual</span>
                    )}
                  </span>
                  <span className="text-xs font-mono font-bold text-white whitespace-nowrap">
                    {formatRate(activePoint.rate)} {to}
                  </span>
                  {activeVariation != null && (
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded whitespace-nowrap ${
                        activeVariation >= 0
                          ? 'text-green-400 bg-green-950/80'
                          : 'text-zinc-200 bg-zinc-800/80'
                      }`}
                    >
                      {formatSignedPercent(activeVariation)}
                    </span>
                  )}
                </div>
              )}

              <svg
                ref={svgRef}
                width={width}
                height={height}
                className="block select-none outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-green-500/60"
                role="img"
                tabIndex={0}
                aria-label={`Histórico de ${from} para ${to} no período ${timeframe}`}
                aria-describedby="chart-keyboard-help"
                onMouseMove={handlePointerMove}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => {
                  setTooltipHidden(false)
                  if (points.length) {
                    setHoverIndex((current) => current ?? points.length - 1)
                  }
                }}
                onBlur={() => {
                  setHoverIndex(null)
                  setTooltipHidden(false)
                }}
                onKeyDown={handleKeyDown}
              >
                <defs>
                  <linearGradient id="chart-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.32" />
                    <stop offset="45%" stopColor="#16a34a" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#050505" stopOpacity="0" />
                  </linearGradient>
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
                        stroke="var(--color-zinc-800)"
                        strokeOpacity="0.6"
                        strokeDasharray="4 6"
                      />
                      <text
                        x="-10"
                        y={geometry.yAt(tick) + 4}
                        textAnchor="end"
                        fontSize={compact ? 10 : 11}
                        className="fill-zinc-500 font-mono"
                      >
                        {axisLabels[index] ?? formatAxisValue(tick)}
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
                        stroke="var(--color-zinc-800)"
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
                        className="fill-zinc-500 font-mono"
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
                      stroke="var(--color-zinc-400)"
                      strokeOpacity="0.65"
                      strokeWidth="1.5"
                      strokeDasharray="5 4"
                    />
                  )}

                  {/* Média móvel de 50 períodos */}
                  {geometry.sma50Path && (
                    <path
                      d={geometry.sma50Path}
                      fill="none"
                      stroke="var(--color-zinc-500)"
                      strokeOpacity="0.8"
                      strokeWidth="1.5"
                      strokeDasharray="2 4"
                    />
                  )}

                  {/* Linha principal */}
                  <path
                    d={geometry.linePath}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Cruzamento e ponto ativos */}
                  {activePoint && (
                    <>
                      <line
                        x1={geometry.xAt(activeIndex)}
                        x2={geometry.xAt(activeIndex)}
                        y1="0"
                        y2={geometry.plotHeight}
                        stroke="#22c55e"
                        strokeOpacity="0.35"
                        strokeDasharray="4 4"
                      />
                      <circle
                        cx={geometry.xAt(activeIndex)}
                        cy={geometry.yAt(activePoint.rate)}
                        r="4.5"
                        fill="#22c55e"
                        stroke="var(--color-panel)"
                        strokeWidth="2"
                      />
                    </>
                  )}
                </g>
              </svg>

              <p id="chart-keyboard-help" className="sr-only">
                Use as setas esquerda e direita para navegar pelos pontos. Home e End vão ao
                primeiro e ao último ponto. Escape limpa a seleção.
              </p>
              <p className="sr-only" aria-live="polite">
                {activePoint
                  ? `${formatDate(activePoint.date)}: ${formatRate(activePoint.rate)} ${to}`
                  : ''}
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
