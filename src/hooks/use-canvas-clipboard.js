import { useCallback, useEffect, useRef, useState } from 'react'

const canvasClipboardType = 'application/x-visual-thinker'
const ideaHeight = 56
const ideaWidth = 192
const pasteOffset = 32
const pastedIdeaGap = 24

function copyNode(node) {
  const {
    dragging: _dragging,
    measured: _measured,
    resizing: _resizing,
    selected: _selected,
    ...copy
  } = node

  return {
    ...structuredClone(copy),
    data: { ...structuredClone(node.data), autofocus: false },
  }
}

function copyEdge(edge) {
  const { selected: _selected, ...copy } = edge
  return structuredClone(copy)
}

function getSelection(canvas) {
  const nodes = canvas.nodes.filter((node) => node.selected).map(copyNode)
  const selectedNodeIds = new Set(nodes.map((node) => node.id))
  const edges = canvas.edges
    .filter(
      (edge) =>
        edge.selected ||
        (selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)),
    )
    .map(copyEdge)

  return { nodes, edges }
}

function hasItems(selection) {
  return selection.nodes.length > 0 || selection.edges.length > 0
}

function isEditableTarget(target) {
  return Boolean(
    target?.closest?.('input, textarea, select, [contenteditable="true"]'),
  )
}

function isCanvasClipboard(value) {
  return Array.isArray(value?.nodes) && Array.isArray(value?.edges)
}

function getClipboardText(clipboard) {
  return clipboard.nodes.map((node) => node.data.label).join('\n')
}

export function useCanvasClipboard(
  canvas,
  screenToFlowPosition,
  updateCanvas,
) {
  const clipboardRef = useRef(null)
  const clipboardWriteRef = useRef(null)
  const pasteCountRef = useRef(0)
  const [hasInternalClipboard, setHasInternalClipboard] = useState(false)

  const copySelection = useCallback(() => {
    const selection = getSelection(canvas)
    clipboardWriteRef.current = null
    if (!hasItems(selection)) return null

    clipboardRef.current = selection
    clipboardWriteRef.current = selection
    pasteCountRef.current = 0
    setHasInternalClipboard(true)
    return getClipboardText(selection)
  }, [canvas])

  const cutSelection = useCallback(() => {
    const selection = getSelection(canvas)
    clipboardWriteRef.current = null
    if (!hasItems(selection)) return null

    clipboardRef.current = selection
    clipboardWriteRef.current = selection
    pasteCountRef.current = 0
    setHasInternalClipboard(true)

    const removedNodeIds = new Set(selection.nodes.map((node) => node.id))
    const removedEdgeIds = new Set(selection.edges.map((edge) => edge.id))

    updateCanvas((currentCanvas) => ({
      nodes: currentCanvas.nodes.filter(
        (node) => !removedNodeIds.has(node.id),
      ),
      edges: currentCanvas.edges.filter(
        (edge) =>
          !removedEdgeIds.has(edge.id) &&
          !removedNodeIds.has(edge.source) &&
          !removedNodeIds.has(edge.target),
      ),
    }))
    return getClipboardText(selection)
  }, [canvas, updateCanvas])

  const pasteCanvasItems = useCallback((clipboard, screenPoint = null) => {
    const targetPosition = screenPoint
      ? screenToFlowPosition(screenPoint)
      : null
    const clipboardCenter = clipboard.nodes.length > 0
      ? {
          x:
            (Math.min(...clipboard.nodes.map((node) => node.position.x)) +
              Math.max(
                ...clipboard.nodes.map(
                  (node) => node.position.x + (node.width ?? ideaWidth),
                ),
              )) /
            2,
          y:
            (Math.min(...clipboard.nodes.map((node) => node.position.y)) +
              Math.max(
                ...clipboard.nodes.map(
                  (node) => node.position.y + (node.height ?? ideaHeight),
                ),
              )) /
            2,
        }
      : null
    const translation = targetPosition && clipboardCenter
      ? {
          x: targetPosition.x - clipboardCenter.x,
          y: targetPosition.y - clipboardCenter.y,
        }
      : (() => {
          pasteCountRef.current += 1
          const offset = pasteOffset * pasteCountRef.current
          return { x: offset, y: offset }
        })()

    updateCanvas((currentCanvas) => {
      const nodeIdMap = new Map(
        clipboard.nodes.map((node) => [
          node.id,
          `idea-${crypto.randomUUID()}`,
        ]),
      )
      const availableNodeIds = new Set([
        ...currentCanvas.nodes.map((node) => node.id),
        ...nodeIdMap.values(),
      ])
      const pastedNodes = clipboard.nodes.map((node) => ({
        ...structuredClone(node),
        id: nodeIdMap.get(node.id),
        position: {
          x: node.position.x + translation.x,
          y: node.position.y + translation.y,
        },
        selected: true,
        data: { ...structuredClone(node.data), autofocus: false },
      }))
      const pastedEdges = clipboard.edges
        .map((edge) => ({
          ...structuredClone(edge),
          id: `edge-${crypto.randomUUID()}`,
          source: nodeIdMap.get(edge.source) ?? edge.source,
          target: nodeIdMap.get(edge.target) ?? edge.target,
          selected: true,
        }))
        .filter(
          (edge) =>
            availableNodeIds.has(edge.source) &&
            availableNodeIds.has(edge.target),
        )

      return {
        nodes: [
          ...currentCanvas.nodes.map((node) => ({
            ...node,
            selected: false,
          })),
          ...pastedNodes,
        ],
        edges: [
          ...currentCanvas.edges.map((edge) => ({
            ...edge,
            selected: false,
          })),
          ...pastedEdges,
        ],
      }
    })
  }, [screenToFlowPosition, updateCanvas])

  const pastePlainText = useCallback(
    (text, screenPoint = null) => {
      const labels = text
        .split(/\r\n?|\n/)
        .map((line) => line.trim())
        .filter(Boolean)

      if (labels.length === 0) return false

      const center = screenToFlowPosition(
        screenPoint ?? {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
        },
      )
      const step = ideaHeight + pastedIdeaGap
      const startY = center.y - ideaHeight / 2 - ((labels.length - 1) * step) / 2

      updateCanvas((currentCanvas) => ({
        nodes: [
          ...currentCanvas.nodes.map((node) => ({
            ...node,
            selected: false,
          })),
          ...labels.map((label, index) => ({
            id: `idea-${crypto.randomUUID()}`,
            type: 'idea',
            position: {
              x: center.x - ideaWidth / 2,
              y: startY + index * step,
            },
            data: { label, autofocus: false },
            selected: true,
          })),
        ],
        edges: currentCanvas.edges.map((edge) => ({
          ...edge,
          selected: false,
        })),
      }))

      return true
    },
    [screenToFlowPosition, updateCanvas],
  )

  const pasteSelection = useCallback(async (screenPoint = null) => {
    if (clipboardRef.current) {
      pasteCanvasItems(clipboardRef.current, screenPoint)
      return true
    }

    if (!navigator.clipboard?.readText) return false

    try {
      const text = await navigator.clipboard.readText()
      return pastePlainText(text, screenPoint)
    } catch {
      return false
    }
  }, [pasteCanvasItems, pastePlainText])

  const canPasteSelection = useCallback(async () => {
    if (clipboardRef.current) return true
    if (!navigator.clipboard?.readText) return false

    try {
      return (await navigator.clipboard.readText()).trim().length > 0
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    const writeCanvasClipboard = (event) => {
      if (isEditableTarget(event.target)) {
        clipboardRef.current = null
        clipboardWriteRef.current = null
        setHasInternalClipboard(false)
        return
      }

      const clipboard = clipboardWriteRef.current
      clipboardWriteRef.current = null
      if (!clipboard || !event.clipboardData) return

      event.clipboardData.setData(
        'text/plain',
        getClipboardText(clipboard),
      )
      event.clipboardData.setData(
        canvasClipboardType,
        JSON.stringify(clipboard),
      )
      event.preventDefault()
    }

    const pasteClipboard = (event) => {
      if (isEditableTarget(event.target) || !event.clipboardData) return

      const canvasData = event.clipboardData.getData(canvasClipboardType)
      if (canvasData) {
        try {
          const clipboard = JSON.parse(canvasData)
          if (isCanvasClipboard(clipboard)) {
            pasteCanvasItems(clipboard)
            event.preventDefault()
            return
          }
        } catch {
          // Fall through to plain text when canvas clipboard data is invalid.
        }
      }

      const text = event.clipboardData.getData('text/plain')
      const internalClipboard = clipboardRef.current
      if (
        internalClipboard &&
        text === getClipboardText(internalClipboard)
      ) {
        pasteCanvasItems(internalClipboard)
        event.preventDefault()
        return
      }

      if (!pastePlainText(text)) return

      event.preventDefault()
    }

    const forgetInMemoryClipboard = () => {
      clipboardRef.current = null
      clipboardWriteRef.current = null
      setHasInternalClipboard(false)
    }

    const forgetHiddenClipboard = () => {
      if (document.hidden) forgetInMemoryClipboard()
    }

    document.addEventListener('copy', writeCanvasClipboard)
    document.addEventListener('cut', writeCanvasClipboard)
    document.addEventListener('paste', pasteClipboard)
    document.addEventListener('visibilitychange', forgetHiddenClipboard)
    window.addEventListener('blur', forgetInMemoryClipboard)

    return () => {
      document.removeEventListener('copy', writeCanvasClipboard)
      document.removeEventListener('cut', writeCanvasClipboard)
      document.removeEventListener('paste', pasteClipboard)
      document.removeEventListener('visibilitychange', forgetHiddenClipboard)
      window.removeEventListener('blur', forgetInMemoryClipboard)
    }
  }, [pasteCanvasItems, pastePlainText])

  return {
    canPasteSelection,
    copySelection,
    cutSelection,
    hasInternalClipboard,
    pasteSelection,
  }
}
