// Gera um PNG a partir do SVG renderizado do gráfico.
// O SVG usa classes do Tailwind, então os estilos computados são copiados
// para dentro do clone antes de serializar.
const STYLE_PROPERTIES = [
  'fill',
  'fill-opacity',
  'stroke',
  'stroke-width',
  'stroke-opacity',
  'stroke-dasharray',
  'stroke-linecap',
  'stroke-linejoin',
  'font-family',
  'font-size',
  'font-weight',
  'letter-spacing',
  'opacity',
  'text-anchor',
]

function inlineStyles(source, clone) {
  const sourceNodes = [source, ...source.querySelectorAll('*')]
  const cloneNodes = [clone, ...clone.querySelectorAll('*')]

  sourceNodes.forEach((node, index) => {
    const target = cloneNodes[index]
    if (!target) return

    const computed = window.getComputedStyle(node)
    STYLE_PROPERTIES.forEach((property) => {
      const value = computed.getPropertyValue(property)
      if (value) target.style.setProperty(property, value)
    })
    target.removeAttribute('class')
  })
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportChartAsPng(svg, { fileName, background } = {}) {
  if (!svg) throw new Error('Gráfico indisponível.')

  const width =
    Number(svg.getAttribute('width')) || svg.clientWidth || svg.getBoundingClientRect().width
  const height =
    Number(svg.getAttribute('height')) || svg.clientHeight || svg.getBoundingClientRect().height

  if (!width || !height) throw new Error('Gráfico sem dimensões.')

  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  clone.setAttribute('viewBox', `0 0 ${width} ${height}`)

  inlineStyles(svg, clone)

  const backgroundRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
  backgroundRect.setAttribute('x', '0')
  backgroundRect.setAttribute('y', '0')
  backgroundRect.setAttribute('width', '100%')
  backgroundRect.setAttribute('height', '100%')
  backgroundRect.setAttribute('fill', background || '#121212')
  clone.insertBefore(backgroundRect, clone.firstChild)

  const serialized = new XMLSerializer().serializeToString(clone)
  const svgBlob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const image = new Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('Falha ao renderizar o gráfico.'))
      image.src = svgUrl
    })

    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))

    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas indisponível.')

    context.setTransform(scale, 0, 0, scale, 0, 0)
    context.drawImage(image, 0, 0, width, height)

    const pngBlob = await new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/png')
    })
    if (!pngBlob) throw new Error('Não foi possível gerar o PNG.')

    downloadBlob(pngBlob, fileName || 'grafico.png')
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}
