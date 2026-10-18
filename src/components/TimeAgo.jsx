import { useEffect, useState } from 'react'

function secondsLabel(seconds) {
  if (seconds < 10) return 'atualizado agora'
  if (seconds < 60) return `atualizado há ${seconds}s`
  if (seconds < 3600) return `atualizado há ${Math.floor(seconds / 60)} min`
  return `atualizado há ${Math.floor(seconds / 3600)} h`
}

// Mostra há quanto tempo a última resposta da API chegou
export default function TimeAgo({ timestamp }) {
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!timestamp) return undefined
    const id = setInterval(() => setTick((value) => value + 1), 10000)
    return () => clearInterval(id)
  }, [timestamp])

  if (!timestamp) return null

  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000))
  return <span>{secondsLabel(seconds)}</span>
}
