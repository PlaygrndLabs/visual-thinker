import { createContext, useContext } from 'react'

const CanvasHistoryContext = createContext(null)

export const CanvasHistoryProvider = CanvasHistoryContext.Provider

export function useCanvasHistoryTransaction() {
  const history = useContext(CanvasHistoryContext)

  if (!history) {
    throw new Error(
      'useCanvasHistoryTransaction must be used within CanvasHistoryProvider',
    )
  }

  return history
}
