import { useEffect, useState } from 'react'

function resolveDefaultValue(defaultValue) {
  return typeof defaultValue === 'function' ? defaultValue() : defaultValue
}

function parseDefaultValue(key, defaultValue, schema) {
  const result = schema.safeParse(resolveDefaultValue(defaultValue))

  if (!result.success) {
    throw new Error(`Invalid default value for localStorage key "${key}"`, {
      cause: result.error,
    })
  }

  return result.data
}

export function useLocalStorageState(key, defaultValue, schema) {
  const [state, setState] = useState(() => {
    const parsedDefaultValue = parseDefaultValue(key, defaultValue, schema)

    try {
      const savedValue = localStorage.getItem(key)
      if (savedValue === null) return parsedDefaultValue

      const result = schema.safeParse(JSON.parse(savedValue))
      return result.success ? result.data : parsedDefaultValue
    } catch {
      return parsedDefaultValue
    }
  })

  useEffect(() => {
    try {
      const result = schema.safeParse(state)
      if (result.success) {
        localStorage.setItem(key, JSON.stringify(result.data))
      }
    } catch {
      // Keep state usable if browser storage is unavailable.
    }
  }, [key, schema, state])

  return [state, setState]
}
