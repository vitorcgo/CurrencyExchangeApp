import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Card from './Card.jsx'
import { useElementWidth } from '../hooks/useElementWidth.js'
import { useTimeSeries } from '../hooks/useTimeSeries.js'
import {
  FALLBACK_CURRENCIES,
  currencyName,
  formatDate,
  formatDateShort,
  formatNumber,
} from '../utils/format.js'

const HEIGHT_DESKTOP = 250
const HEIGHT_MOBILE = 220
const PAD_TOP = 14
const PAD_BOTTOM = 26
const PAD_RIGHT = 14

function LegendItem({ color, label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 whitespace-nowrap">
      <span className={`w-4 h-0.5 rounded-full ${color}`} />
      <span className="font-mono font-bold text-zinc-300">{label}</span>
      <span className="font-mono text-zinc-500">{value}</span>
    </span>
  )
}

export default function ComparisonChart({
  points,
  loading,
  from,
  to,
  timeframe,
  currencies,
  refreshKey,
}) {
  const compareOptions = useMemo(() => {
    const list = currencies ?? FALLBACK_CURRENCIES
    return list.filter((item) => item.code !== from && item.code !== to)
  }, [currencies, from, to])

  const [compareCode, setCompareCode] = useState(() => {
    const preferred = to === 'EUR' ? 'USD' : 'EUR'
    if (preferred !== from && preferred !== to) return preferred
    return compareOptions[0]?.code ?? 'USD'
  })

  const compare = useTimeSeries(from, compareCode, timeframe)
  const { refetch: refetchCompare } = compare

  useEffect(() => {
    if (!compareOptions.length) return
    if (!compareOptions.some((item) => item.code === compareCode)) {
      setCompareCode(compareOptions[0].code)
    }
  }, [compareCode, compareOptions])

  // Atualiza a segunda série junto com o botão de atualizar e o auto refresh
  useEffect(() => {
    if (refreshKey > 0) refetchCompare()
  }, [refreshKey, refetchCompare])

  const aligned = useMemo(() => {
    if (!points.length || !compare.points.length) return []

    const compareMap = new Map(compare.points.map((point) => [point.date, point.rate]))
    const shared = points.filter((point) => compareMap.has(point.date))
    if (shared.length < 2) return []

    const baseStart = shared[0].rate
    const compareStart = compareMap.get(shared[0].date)
    if (
      !Number.isFinite(baseStart) ||
      baseStart <= 0 ||
      !Number.isFinite(compareStart) ||
      compareStart <= 0
    ) {
      return []
    }

    return shared.map((point) => ({
      date: point.date,
      base: (point.rate / baseStart) * 100,
      compare: (compareMap.get(point.date) / compareStart) * 100,
    }))
  }, [points, compare.points])

  const model = useMemo(() => {
    if (!aligned.length) return null
    const values = aligned.flatMap((point) => [point.base, point.compare])
    let min = Math.min(...values)
    let max = Math.max(...values)

    if (min === max) {
      min -= 1
      max += 1
    } else {
      const padding = (max - min) * 0.08
      min -= padding
      max += padding
    }

    return { min, max }
  }, [aligned])

  const containerRef = useRef(null)
  const width = useElementWidth(containerRef)
  const [hoverIndex, setHoverIndex] = useState(null)
  const tooltipRef = useRef(null)
  const [tooltipWidth, setTooltipWidth] = useState(0)

  useEffect(() => {
    setHoverIndex(null)
  }, [aligned])

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
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [hoverIndex, width, aligned])

  const compact = width > 0 && width < 640
  const height = compact ? HEIGHT_MOBILE : HEIGHT_DESKTOP
  const padLeft = compact ? 46 : 50

  const geometry = useMemo(() => {
    if (!model || !aligned.length || width === 0) return null

    const plotWidth = Math.max(width - padLeft - PAD_RIGHT, 10)
    const plotHeight = height - PAD_TOP - PAD_BOTTOM
    const span = model.max - model.min

    const xAt = (index) =>
      aligned.length <= 1
        ? plotWidth / 2
        : (index / (aligned.length - 1)) * plotWidth
    const yAt = (value) => (1 - (value - model.min) / span) * plotHeight

    const toPath = (selector) =>
      aligned
        .map(
          (point, index) =>
            `${index === 0 ? 'M' : 'L'}${xAt(index).toFixed(2)},${yAt(selector(point)).toFixed(2)}`,
        )
        .join('')

    const yTicks = Array.from(
      { length: 4 },
      (_, index) => model.max - (index / 3) * (model.max - model.min),
    )

    const tickCount = Math.max(3, Math.min(5, Math.floor(plotWidth / 130) + 1))
    const tickIndexes = [
      ...new Set(
        Array.from({ length: tickCount }, (_, index) =>
          Math.round((index * (aligned.length - 1)) / Math.max(tickCount - 1, 1)),
        ),
      ),
    ]

    return {
      plotWidth,
      plotHeight,
      xAt,
      yAt,
      basePath: toPath((point) => point.base),
      comparePath: toPath((point) => point.compare),
      yTicks,
      tickIndexes,
    }
  }, [aligned, height, model, padLeft, width])

  const activePoint =
    hoverIndex != null && aligned[hoverIndex] ? aligned[hoverIndex] : null
  const lastPoint = aligned[aligned.length - 1] ?? null

  const tooltipHalf = tooltipWidth / 2
  const tooltipMinX = tooltipHalf + 4
  const tooltipMaxX = Math.max(width - tooltipHalf - 4, tooltipMinX)
  const tooltipX =
    geometry && hoverIndex != null
      ? Math.min(
          Math.max(padLeft + geometry.xAt(hoverIndex), tooltipMinX),
          tooltipMaxX,
        )
      : 0

  function handlePointerMove(event) {
    if (!geometry) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left - padLeft
    const ratio = Math.min(Math.max(x / geometry.plotWidth, 0), 1)
    setHoverIndex(Math.round(ratio * Math.max(aligned.length - 1, 0)))
  }

  const compareLabel =
    compareOptions.find((item) => item.code === compareCode)?.name ?? compareCode
  const unavailable = !loading && !compare.loading && aligned.length < 2

  return (
    <Card className="p-5 sm:p-7 h-full" data-purpose="comparacao-moedas">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-800/70">
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-white">Comparar moedas</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Base 100 no primeiro dia do período. As duas séries usam {from} como origem.
          </p>
        </div>

        <label className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Comparar com
          </span>
          <select
            value={compareCode}
            onChange={(event) => setCompareCode(event.target.value)}
            className="rounded-xl bg-subcard border border-zinc-700/80 text-xs font-semibold text-zinc-200 px-2.5 py-2 focus:outline-none focus:border-green-500/50 focus:ring-2 focus:ring-green-500/30 cursor-pointer max-w-[190px]"
          >
            {compareOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.code} · {currencyName(option.code, option.name)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
        <LegendItem
          color="bg-green-500"
          label={`${from} / ${to}`}
          value={lastPoint ? formatNumber(lastPoint.base, 1) : '-'}
        />
        <LegendItem
          color="bg-zinc-400"
          label={`${from} / ${compareCode}`}
          value={lastPoint ? formatNumber(lastPoint.compare, 1) : '-'}
        />
        <span className="text-[10px] font-mono text-zinc-500 ml-auto">
          {compareLabel}
        </span>
      </div>

      <div className="pt-3">
        <div ref={containerRef} className="relative w-full" style={{ height }}>
          {!geometry ? (
            <div className="w-full h-full rounded-2xl bg-panel border border-zinc-800/50 flex items-center justify-center px-4 text-center">
              <span className="text-xs font-mono text-zinc-500">
                {compare.error
                  ? compare.error
                  : loading || compare.loading
                    ? 'carregando comparação...'
                    : unavailable
                      ? 'sem datas em comum no período'
                      : 'sem dados para exibir'}
              </span>
            </div>
          ) : (
            <>
              {activePoint && (
                <div
                  ref={tooltipRef}
                  className="absolute top-1 z-20 pointer-events-none -translate-x-1/2 bg-panel border border-zinc-700 rounded-xl px-3 py-2 shadow-lg"
                  style={{ left: tooltipX }}
                >
                  <p className="text-[10px] font-mono text-zinc-400 whitespace-nowrap">
                    {formatDate(activePoint.date)}
                  </p>
                  <p className="text-[11px] font-mono text-white whitespace-nowrap mt-0.5">
                    {from}/{to}: <strong>{formatNumber(activePoint.base, 1)}</strong>
                  </p>
                  <p className="text-[11px] font-mono text-zinc-300 whitespace-nowrap">
                    {from}/{compareCode}: <strong>{formatNumber(activePoint.compare, 1)}</strong>
                  </p>
                </div>
              )}

              <svg
                width={width}
                height={height}
                className="block select-none"
                role="img"
                aria-label={`Comparação normalizada entre ${from} para ${to} e ${from} para ${compareCode}`}
                onMouseMove={handlePointerMove}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <g transform={`translate(${padLeft}, ${PAD_TOP})`}>
                  {geometry.yTicks.map((tick, index) => (
                    <g key={`y-${index}`}>
                      <line
                        x1="0"
                        x2={geometry.plotWidth}
                        y1={geometry.yAt(tick)}
                        y2={geometry.yAt(tick)}
                        stroke="var(--color-zinc-800)"
                        strokeOpacity="0.8"
                        strokeDasharray="4 6"
                      />
                      <text
                        x="-10"
                        y={geometry.yAt(tick) + 4}
                        textAnchor="end"
                        fontSize={compact ? 10 : 11}
                        className="fill-zinc-500 font-mono"
                      >
                        {formatNumber(tick, 1)}
                      </text>
                    </g>
                  ))}

                  {geometry.tickIndexes.map((index) => (
                    <g key={`x-${index}`}>
                      <line
                        x1={geometry.xAt(index)}
                        x2={geometry.xAt(index)}
                        y1="0"
                        y2={geometry.plotHeight}
                        stroke="var(--color-zinc-800)"
                        strokeOpacity="0.45"
                        strokeDasharray="4 6"
                      />
                      <text
                        x={geometry.xAt(index)}
                        y={geometry.plotHeight + 18}
                        textAnchor={
                          index === 0
                            ? 'start'
                            : index === aligned.length - 1
                              ? 'end'
                              : 'middle'
                        }
                        fontSize={compact ? 10 : 11}
                        className="fill-zinc-500 font-mono"
                      >
                        {formatDateShort(aligned[index]?.date)}
                      </text>
                    </g>
                  ))}

                  <path
                    d={geometry.comparePath}
                    fill="none"
                    stroke="var(--color-zinc-400)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  <path
                    d={geometry.basePath}
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {hoverIndex != null && activePoint && (
                    <line
                      x1={geometry.xAt(hoverIndex)}
                      x2={geometry.xAt(hoverIndex)}
                      y1="0"
                      y2={geometry.plotHeight}
                      stroke="var(--color-zinc-400)"
                      strokeOpacity="0.5"
                      strokeDasharray="4 4"
                    />
                  )}

                  {lastPoint && (
                    <>
                      <circle
                        cx={geometry.xAt(aligned.length - 1)}
                        cy={geometry.yAt(lastPoint.compare)}
                        r="3.5"
                        fill="var(--color-zinc-400)"
                        stroke="var(--color-panel)"
                        strokeWidth="2"
                      />
                      <circle
                        cx={geometry.xAt(aligned.length - 1)}
                        cy={geometry.yAt(lastPoint.base)}
                        r="4"
                        fill="#22c55e"
                        stroke="var(--color-panel)"
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
