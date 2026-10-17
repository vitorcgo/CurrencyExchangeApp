import { useEffect, useState } from 'react'

// Observa a largura real de um elemento com ResizeObserver.
// Usado para desenhar o gráfico SVG em pixels reais (responsivo)
export function useElementWidth(ref) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined

    setWidth(element.getBoundingClientRect().width)

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width)
      }
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return width
}
