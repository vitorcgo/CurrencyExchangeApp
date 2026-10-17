import { useEffect, useState } from 'react'

// Custom hook genérico: estado sincronizado com o localStorage.
// Usado para lembrar o par de moedas escolhido e os favoritos.
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // localStorage indisponível (modo privado etc.), apenas ignora
    }
  }, [key, value])

  return [value, setValue]
}
