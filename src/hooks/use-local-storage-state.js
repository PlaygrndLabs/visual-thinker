import { useEffect, useState } from 'react'

function resolveDefaultValue(defaultValue) {
  return typeof defaultValue === 'function' ? defaultValue() : defaultValue
}

export function useLocalStorageState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const savedValue = localStorage.getItem(key)
      return savedValue === null
        ? resolveDefaultValue(defaultValue)
        : JSON.parse(savedValue)
    } catch {
      return resolveDefaultValue(defaultValue)
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // Keep state usable if browser storage is unavailable.
    }
  }, [key, state])

  return [state, setState]
}
