import { useCallback, useRef } from 'react'

const pasteOffset = 32

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

export function useCanvasClipboard(canvas, updateCanvas) {
  const clipboardRef = useRef(null)
  const pasteCountRef = useRef(0)

  const copySelection = useCallback(() => {
    const selection = getSelection(canvas)
    if (selection.nodes.length === 0 && selection.edges.length === 0) return

    clipboardRef.current = selection
    pasteCountRef.current = 0
  }, [canvas])

  const cutSelection = useCallback(() => {
    const selection = getSelection(canvas)
    if (selection.nodes.length === 0 && selection.edges.length === 0) return

    clipboardRef.current = selection
    pasteCountRef.current = 0

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
  }, [canvas, updateCanvas])

  const pasteSelection = useCallback(() => {
    const clipboard = clipboardRef.current
    if (!clipboard) return

    pasteCountRef.current += 1
    const offset = pasteOffset * pasteCountRef.current

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
          x: node.position.x + offset,
          y: node.position.y + offset,
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
  }, [updateCanvas])

  return { copySelection, cutSelection, pasteSelection }
}
