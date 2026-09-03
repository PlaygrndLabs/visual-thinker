import { useCallback, useRef } from 'react'

import { useLocalStorageState } from '@/hooks/use-local-storage-state'

const historyLimit = 100

function createSnapshot(canvas) {
  return structuredClone({
    nodes: canvas.nodes.map(
      ({
        dragging: _dragging,
        measured: _measured,
        selected: _selected,
        ...node
      }) => ({
        ...node,
        data: { ...node.data, autofocus: false },
      }),
    ),
    edges: canvas.edges.map(({ selected: _selected, ...edge }) => edge),
  })
}

function snapshotsMatch(first, second) {
  return JSON.stringify(first) === JSON.stringify(second)
}

export function useCanvasHistory(storageKey, initialCanvas) {
  const [canvas, setCanvasState] = useLocalStorageState(
    storageKey,
    initialCanvas,
  )
  const canvasRef = useRef(canvas)
  const pastRef = useRef([])
  const futureRef = useRef([])
  const transactionStartRef = useRef(null)

  const setCanvas = useCallback((update) => {
    const nextCanvas =
      typeof update === 'function' ? update(canvasRef.current) : update

    canvasRef.current = nextCanvas
    setCanvasState(nextCanvas)
  }, [setCanvasState])

  const remember = useCallback((snapshot) => {
    pastRef.current = [...pastRef.current, snapshot].slice(-historyLimit)
    futureRef.current = []
  }, [])

  const updateCanvas = useCallback(
    (update) => {
      const nextCanvas =
        typeof update === 'function' ? update(canvasRef.current) : update
      const currentSnapshot = createSnapshot(canvasRef.current)
      const nextSnapshot = createSnapshot(nextCanvas)

      if (!snapshotsMatch(currentSnapshot, nextSnapshot)) {
        remember(currentSnapshot)
      }

      canvasRef.current = nextCanvas
      setCanvasState(nextCanvas)
    },
    [remember, setCanvasState],
  )

  const beginTransaction = useCallback(() => {
    transactionStartRef.current ??= createSnapshot(canvasRef.current)
  }, [])

  const commitTransaction = useCallback(() => {
    const transactionStart = transactionStartRef.current
    if (!transactionStart) return

    const currentSnapshot = createSnapshot(canvasRef.current)
    transactionStartRef.current = null

    if (!snapshotsMatch(transactionStart, currentSnapshot)) {
      remember(transactionStart)
    }
  }, [remember])

  const undo = useCallback(() => {
    const previousCanvas = pastRef.current.at(-1)
    if (!previousCanvas) return

    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current = [
      createSnapshot(canvasRef.current),
      ...futureRef.current,
    ].slice(0, historyLimit)
    transactionStartRef.current = null
    canvasRef.current = previousCanvas
    setCanvasState(previousCanvas)
  }, [setCanvasState])

  const redo = useCallback(() => {
    const nextCanvas = futureRef.current[0]
    if (!nextCanvas) return

    futureRef.current = futureRef.current.slice(1)
    pastRef.current = [
      ...pastRef.current,
      createSnapshot(canvasRef.current),
    ].slice(-historyLimit)
    transactionStartRef.current = null
    canvasRef.current = nextCanvas
    setCanvasState(nextCanvas)
  }, [setCanvasState])

  return {
    beginTransaction,
    canvas,
    commitTransaction,
    redo,
    setCanvas,
    undo,
    updateCanvas,
  }
}
