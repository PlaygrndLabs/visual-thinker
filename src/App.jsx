import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from '@tanstack/react-hotkeys'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import { Maximize, Minus, Plus } from 'lucide-react'

import { CanvasFloatingButton } from '@/components/canvas-floating-button'
import { AutomaticConnectionLine } from '@/components/automatic-connection-line'
import { IdeaNode } from '@/components/idea-node'
import { Logo } from '@/components/logo'
import { StatusBar } from '@/components/status-bar'
import { CanvasHistoryProvider } from '@/contexts/canvas-history-context'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { useCanvasHistory } from '@/hooks/use-canvas-history'
import { useCanvasClipboard } from '@/hooks/use-canvas-clipboard'
import {
  experienceTips,
  knownExperiences,
  useExperiences,
} from '@/hooks/use-experiences'
import { useLocalStorageState } from '@/hooks/use-local-storage-state'
import { useWheelIntent } from '@/hooks/use-wheel-intent'
import { getAutomaticHandles } from '@/lib/connection-routing'
import {
  canvasSchema,
  viewportStateSchema,
} from '@/schemas/storage-schemas'

const nodeTypes = { idea: IdeaNode }
const canvasStorageKey = 'visual-thinker.canvas.v1'
const viewportStorageKey = 'visual-thinker.viewport.v1'
const multiClickDelay = 500
const multiClickMaxOffset = 5
const newNodePointerOffset = 12
const newIdeaNodeSize = { width: 96, height: 38 }
const completedPanDistance = 3
const emptyCanvas = { nodes: [], edges: [] }
const defaultViewport = { x: 0, y: 0, zoom: 1 }
const defaultViewportState = {
  ...defaultViewport,
  fitViewport: null,
  isFitViewActive: false,
}
const isMacPlatform = /mac/i.test(
  navigator.userAgentData?.platform ?? navigator.platform,
)
const commandKey = isMacPlatform ? '⌘' : 'Ctrl+'
const deleteKey = isMacPlatform ? '⌫' : 'Del'
const shortcuts = {
  addNode: 'Dbl Click',
  clear: `${commandKey}${deleteKey}`,
  copy: `${commandKey}C`,
  cut: `${commandKey}X`,
  disconnect: deleteKey,
  fullReset: isMacPlatform
    ? `⇧${commandKey}${deleteKey}`
    : `${commandKey}Shift+${deleteKey}`,
  paste: `${commandKey}V`,
  remove: deleteKey,
  selectAll: `${commandKey}A`,
}
const clearCanvasHotkey = isMacPlatform ? 'Mod+Backspace' : 'Mod+Delete'
const fullResetHotkey = isMacPlatform
  ? 'Mod+Shift+Backspace'
  : 'Mod+Shift+Delete'
const canvasSelectionStyles = String.raw`
  [&_.react-flow\_\_nodesselection-rect]:[--xy-selection-background-color:transparent]
  [&_.react-flow\_\_nodesselection-rect]:[--xy-selection-border:none]
  [&_.react-flow\_\_selection]:[--xy-selection-background-color:rgb(49_106_197_/_0.15)]
  [&_.react-flow\_\_selection]:[--xy-selection-border:1px_solid_#316ac5]
  [&_.react-flow\_\_pane]:cursor-default!
  [&_.react-flow\_\_pane.draggable]:cursor-grab!
  [&_.react-flow\_\_pane.dragging]:cursor-grabbing!
`

function didViewportPan(startViewport, endViewport) {
  return (
    Math.hypot(
      endViewport.x - startViewport.x,
      endViewport.y - startViewport.y,
    ) > completedPanDistance
  )
}

function clicksBelongToSameSequence(firstClick, nextClick) {
  const elapsed = nextClick.timeStamp - firstClick.timeStamp

  return (
    elapsed >= 0 &&
    elapsed <= multiClickDelay &&
    Math.abs(nextClick.x - firstClick.x) <= multiClickMaxOffset &&
    Math.abs(nextClick.y - firstClick.y) <= multiClickMaxOffset
  )
}

function getConnectionPairKey({ source, target }) {
  return JSON.stringify(source < target ? [source, target] : [target, source])
}

function getUniqueEdges(edges) {
  const seenPairs = new Set()

  return edges.filter((edge) => {
    const pairKey = getConnectionPairKey(edge)
    if (seenPairs.has(pairKey)) return false

    seenPairs.add(pairKey)
    return true
  })
}

function canConnectNodes(edges, { source, target }) {
  if (!source || !target || source === target) return false

  const pairKey = getConnectionPairKey({ source, target })
  return !edges.some((edge) => getConnectionPairKey(edge) === pairKey)
}

function isNewIdeaMostlyVisible({ x, y }, canvasBounds, zoom) {
  const nodeBounds = {
    left: x + newNodePointerOffset,
    right: x + newNodePointerOffset + newIdeaNodeSize.width * zoom,
    top: y + newNodePointerOffset,
    bottom: y + newNodePointerOffset + newIdeaNodeSize.height * zoom,
  }
  const visibleWidth = Math.max(
    0,
    Math.min(nodeBounds.right, canvasBounds.right) -
      Math.max(nodeBounds.left, canvasBounds.left),
  )
  const visibleHeight = Math.max(
    0,
    Math.min(nodeBounds.bottom, canvasBounds.bottom) -
      Math.max(nodeBounds.top, canvasBounds.top),
  )

  return (
    visibleWidth >= (newIdeaNodeSize.width * zoom) / 2 &&
    visibleHeight >= (newIdeaNodeSize.height * zoom) / 2
  )
}

function ThinkingCanvas() {
  const {
    beginTransaction,
    canvas,
    commitTransaction,
    redo,
    setCanvas,
    undo,
    updateCanvas,
  } = useCanvasHistory(canvasStorageKey, emptyCanvas, canvasSchema)
  const [viewportState, setViewportState] = useLocalStorageState(
    viewportStorageKey,
    defaultViewportState,
    viewportStateSchema,
  )
  const [logoResetKey, setLogoResetKey] = useState(0)
  const [pendingFocusNodeId, setPendingFocusNodeId] = useState(null)
  const [statusBarTip, setStatusBarTip] = useState(null)
  const [pasteIsAvailable, setPasteIsAvailable] = useState(false)
  const [contextMenuTarget, setContextMenuTarget] = useState({
    type: 'canvas',
    point: null,
  })
  const pendingEdgeClick = useRef(null)
  const pendingPaneClick = useRef(null)
  const newNodeClickSequence = useRef(null)
  const suppressNextPaneClick = useRef(false)
  const suppressPaneClickReset = useRef(null)
  const mousePanStartViewport = useRef(null)
  const zoomGestureStartZoom = useRef(null)
  const pasteAvailabilityRequest = useRef(0)
  const { flagExperience, maySuggestTip } = useExperiences()
  const visibleStatusBarTip = maySuggestTip(
    statusBarTip === null ? [] : [statusBarTip],
  )
  const panTipIsVisible = visibleStatusBarTip === experienceTips.pan
  const removeConnectionTipIsVisible =
    visibleStatusBarTip === experienceTips.removeConnection
  const zoomTipIsVisible = visibleStatusBarTip === experienceTips.zoom
  const selectedViewport = useMemo(
    () => ({
      x: viewportState.x,
      y: viewportState.y,
      zoom: viewportState.zoom,
    }),
    [viewportState.x, viewportState.y, viewportState.zoom],
  )
  const isFitViewActive = Boolean(
    viewportState.isFitViewActive && viewportState.fitViewport,
  )
  const initialViewport = isFitViewActive
    ? viewportState.fitViewport
    : selectedViewport
  const {
    fitView,
    getViewport,
    screenToFlowPosition,
    setViewport,
    zoomIn,
    zoomOut,
  } = useReactFlow()
  const {
    canPasteSelection,
    copySelection,
    cutSelection,
    hasInternalClipboard,
    pasteSelection,
  } = useCanvasClipboard(canvas, screenToFlowPosition, updateCanvas)
  const routedEdges = useMemo(() => {
    const nodesById = new Map(canvas.nodes.map((node) => [node.id, node]))

    return getUniqueEdges(canvas.edges).map((edge) => {
      const sourceNode = nodesById.get(edge.source)
      const targetNode = nodesById.get(edge.target)

      if (!sourceNode || !targetNode) return edge

      return {
        ...edge,
        ...getAutomaticHandles(sourceNode, targetNode),
      }
    })
  }, [canvas.edges, canvas.nodes])
  const isValidConnection = useCallback(
    (connection) => canConnectNodes(canvas.edges, connection),
    [canvas.edges],
  )

  useEffect(() => {
    setCanvas((currentCanvas) => {
      const uniqueEdges = getUniqueEdges(currentCanvas.edges)
      const needsMigration =
        uniqueEdges.length !== currentCanvas.edges.length ||
        uniqueEdges.some(
          (edge) =>
            edge.type !== 'default' ||
            edge.sourceHandle != null ||
            edge.targetHandle != null,
        )

      if (!needsMigration) {
        return currentCanvas
      }

      return {
        ...currentCanvas,
        edges: uniqueEdges.map((edge) => ({
          ...edge,
          type: 'default',
          sourceHandle: null,
          targetHandle: null,
        })),
      }
    })
  }, [setCanvas])

  const panCanvas = useCallback(
    ({ x, y }) => {
      const viewport = getViewport()
      void setViewport({
        ...viewport,
        x: viewport.x + x,
        y: viewport.y + y,
      })
    },
    [getViewport, setViewport],
  )

  const startTrackpadPan = useCallback(() => {
    setViewportState((currentState) => ({
      ...currentState,
      isFitViewActive: false,
    }))
  }, [setViewportState])

  const finishTrackpadPan = useCallback(() => {
    const viewport = getViewport()
    setViewportState((currentState) => ({
      ...currentState,
      ...viewport,
      isFitViewActive: false,
    }))

  }, [getViewport, setViewportState])

  const startWheelZoom = useCallback(() => {
    zoomGestureStartZoom.current = getViewport().zoom
  }, [getViewport])

  const finishWheelZoom = useCallback(() => {
    if (
      zoomGestureStartZoom.current !== null &&
      Math.abs(getViewport().zoom - zoomGestureStartZoom.current) > 0.001
    ) {
      flagExperience(knownExperiences.canvasScrollZoom, {
        prompted: zoomTipIsVisible,
      })
      setStatusBarTip(maySuggestTip([]))
    }

    zoomGestureStartZoom.current = null
  }, [flagExperience, getViewport, maySuggestTip, zoomTipIsVisible])

  const onWheelCapture = useWheelIntent({
    onPan: panCanvas,
    onPanEnd: finishTrackpadPan,
    onPanStart: startTrackpadPan,
    onZoomEnd: finishWheelZoom,
    onZoomStart: startWheelZoom,
  })

  const createIdea = useCallback(
    (position) => {
      const id = `idea-${crypto.randomUUID()}`

      updateCanvas((currentCanvas) => ({
        ...currentCanvas,
        nodes: [
          ...currentCanvas.nodes,
          {
            id,
            type: 'idea',
            position,
            data: { label: '' },
          },
        ],
      }))
      setPendingFocusNodeId(id)
      return id
    },
    [updateCanvas],
  )

  const finishNodeAutofocus = useCallback((id) => {
    setPendingFocusNodeId((currentId) => (currentId === id ? null : currentId))
  }, [])

  const deleteNode = useCallback(
    (id) => {
      setCanvas((currentCanvas) => ({
        nodes: currentCanvas.nodes.filter((node) => node.id !== id),
        edges: currentCanvas.edges.filter(
          (edge) => edge.source !== id && edge.target !== id,
        ),
      }))
    },
    [setCanvas],
  )

  const finishIdeaEditing = useCallback(
    (id, label) => {
      if (label === '') {
        deleteNode(id)
      }

      commitTransaction()
    },
    [commitTransaction, deleteNode],
  )

  const createIdeaAtScreenPoint = useCallback(
    ({ x, y }, canvasBounds) => {
      if (!isNewIdeaMostlyVisible({ x, y }, canvasBounds, getViewport().zoom)) {
        return null
      }

      const position = screenToFlowPosition({
        x: x + newNodePointerOffset,
        y: y + newNodePointerOffset,
      })
      return createIdea(position)
    },
    [createIdea, getViewport, screenToFlowPosition],
  )

  const handleContextMenu = useCallback((event) => {
    const availabilityRequest = pasteAvailabilityRequest.current + 1
    pasteAvailabilityRequest.current = availabilityRequest
    const hitElements = document.elementsFromPoint(event.clientX, event.clientY)
    const nodeElement =
      event.target.closest('.react-flow__node') ??
      hitElements
        .map((element) => element.closest('.react-flow__node'))
        .find(Boolean)
    const edgeElement =
      event.target.closest('.react-flow__edge') ??
      hitElements
        .map((element) => element.closest('.react-flow__edge'))
        .find(Boolean)

    if (nodeElement) {
      const nodeId = nodeElement.getAttribute('data-id')
      const selectedNodeIds = canvas.nodes
        .filter((node) => node.selected)
        .map((node) => node.id)
      const nodeIsInSelection = selectedNodeIds.includes(nodeId)
      const nodeIds = nodeIsInSelection ? selectedNodeIds : [nodeId]

      setCanvas((currentCanvas) => ({
        nodes: currentCanvas.nodes.map((node) => ({
          ...node,
          selected: nodeIds.includes(node.id),
        })),
        edges: currentCanvas.edges.map((edge) => ({
          ...edge,
          selected: false,
        })),
      }))
      setContextMenuTarget({ type: 'nodes', ids: nodeIds })
      return
    }

    if (edgeElement) {
      const edgeId = edgeElement.getAttribute('data-id')

      setCanvas((currentCanvas) => ({
        nodes: currentCanvas.nodes.map((node) => ({
          ...node,
          selected: false,
        })),
        edges: currentCanvas.edges.map((edge) => ({
          ...edge,
          selected: edge.id === edgeId,
        })),
      }))
      setContextMenuTarget({ type: 'connection', id: edgeId })
      return
    }

    setContextMenuTarget({
      type: 'canvas',
      point: { x: event.clientX, y: event.clientY },
    })
    setPasteIsAvailable(hasInternalClipboard)

    if (!hasInternalClipboard) {
      void canPasteSelection().then((isAvailable) => {
        if (pasteAvailabilityRequest.current !== availabilityRequest) return
        setPasteIsAvailable(isAvailable)
      })
    }
  }, [canPasteSelection, canvas.nodes, hasInternalClipboard, setCanvas])

  const addIdeaFromContextMenu = useCallback(() => {
    if (!contextMenuTarget.point) return

    const canvasElement = document.querySelector('.react-flow')
    if (!canvasElement) return

    createIdeaAtScreenPoint(
      contextMenuTarget.point,
      canvasElement.getBoundingClientRect(),
    )
  }, [contextMenuTarget, createIdeaAtScreenPoint])

  const writeSelectionToSystemClipboard = useCallback((copyAction) => {
    const text = copyAction()
    if (text === null || !navigator.clipboard?.writeText) return

    void navigator.clipboard.writeText(text).catch(() => {})
  }, [])

  const copyFromContextMenu = useCallback(() => {
    writeSelectionToSystemClipboard(copySelection)
  }, [copySelection, writeSelectionToSystemClipboard])

  const cutFromContextMenu = useCallback(() => {
    writeSelectionToSystemClipboard(cutSelection)
  }, [cutSelection, writeSelectionToSystemClipboard])

  const removeContextNodes = useCallback(() => {
    if (contextMenuTarget.type !== 'nodes') return

    const removedNodeIds = new Set(contextMenuTarget.ids)
    updateCanvas((currentCanvas) => ({
      nodes: currentCanvas.nodes.filter((node) => !removedNodeIds.has(node.id)),
      edges: currentCanvas.edges.filter(
        (edge) =>
          !removedNodeIds.has(edge.source) &&
          !removedNodeIds.has(edge.target),
      ),
    }))
  }, [contextMenuTarget, updateCanvas])

  const disconnectContextEdge = useCallback(() => {
    if (contextMenuTarget.type !== 'connection') return

    updateCanvas((currentCanvas) => ({
      ...currentCanvas,
      edges: currentCanvas.edges.filter(
        (edge) => edge.id !== contextMenuTarget.id,
      ),
    }))
  }, [contextMenuTarget, updateCanvas])

  const onPaneClick = useCallback(
    (event) => {
      if (event.button !== 0) return

      const click = {
        x: event.clientX,
        y: event.clientY,
        timeStamp: event.timeStamp,
      }
      const previousClick = pendingPaneClick.current

      if (previousClick && clicksBelongToSameSequence(previousClick, click)) {
        clearTimeout(previousClick.timeoutId)
        pendingPaneClick.current = null
        const nodeId = createIdeaAtScreenPoint(
          click,
          event.target.getBoundingClientRect(),
        )
        if (!nodeId) return

        newNodeClickSequence.current = { ...click, nodeId }
        flagExperience(knownExperiences.createNodeByDoubleClick, {
          prompted: visibleStatusBarTip === experienceTips.addNode,
        })
        setStatusBarTip(maySuggestTip([]))
        return
      }

      clearTimeout(previousClick?.timeoutId)
      const pendingClick = { ...click, timeoutId: null }
      pendingClick.timeoutId = setTimeout(() => {
        if (pendingPaneClick.current !== pendingClick) return

        setStatusBarTip(
          maySuggestTip([experienceTips.addNode, experienceTips.pan]),
        )
        pendingPaneClick.current = null
      }, multiClickDelay)
      pendingPaneClick.current = pendingClick
    },
    [
      createIdeaAtScreenPoint,
      flagExperience,
      maySuggestTip,
      visibleStatusBarTip,
    ],
  )

  const onCanvasPointerDownCapture = useCallback(
    (event) => {
      const creationClick = newNodeClickSequence.current
      const pointerClick = {
        x: event.clientX,
        y: event.clientY,
        timeStamp: event.timeStamp,
      }
      const creationNode = creationClick
        ? [...document.querySelectorAll('.react-flow__node')].find(
            (node) => node.getAttribute('data-id') === creationClick.nodeId,
          )
        : null
      const creationTextarea = creationNode?.querySelector('textarea')
      const isOutsideCreationNode =
        creationTextarea && !creationNode.contains(event.target)
      const isBenignThirdClick =
        event.button === 0 &&
        isOutsideCreationNode &&
        creationTextarea.value === '' &&
        clicksBelongToSameSequence(creationClick, pointerClick)

      if (isBenignThirdClick) {
        event.preventDefault()
        event.stopPropagation()
        newNodeClickSequence.current = null
        suppressNextPaneClick.current = true
        clearTimeout(suppressPaneClickReset.current)
        suppressPaneClickReset.current = setTimeout(() => {
          suppressNextPaneClick.current = false
          suppressPaneClickReset.current = null
        }, 0)
        return
      }

      if (isOutsideCreationNode) {
        newNodeClickSequence.current = null
        finishIdeaEditing(creationClick.nodeId, creationTextarea.value)
        creationTextarea.blur()
        return
      }

      const activeTextarea = document.activeElement
      if (!activeTextarea?.matches('.react-flow__node-idea textarea')) return

      const activeNode = activeTextarea.closest('.react-flow__node')
      if (!activeNode || activeNode.contains(event.target)) return

      newNodeClickSequence.current = null
      finishIdeaEditing(
        activeNode.getAttribute('data-id'),
        activeTextarea.value,
      )
      activeTextarea.blur()
    },
    [finishIdeaEditing],
  )

  const onCanvasClickCapture = useCallback((event) => {
    if (!suppressNextPaneClick.current) return

    event.preventDefault()
    event.stopPropagation()
    suppressNextPaneClick.current = false
    clearTimeout(suppressPaneClickReset.current)
    suppressPaneClickReset.current = null
  }, [])

  const onEdgeClick = useCallback(
    (event) => {
      if (event.button !== 0) return

      clearTimeout(pendingEdgeClick.current)
      pendingEdgeClick.current = setTimeout(() => {
        setStatusBarTip(
          maySuggestTip([experienceTips.removeConnection]),
        )
        pendingEdgeClick.current = null
      }, multiClickDelay)
    },
    [maySuggestTip],
  )

  const onEdgeDoubleClick = useCallback(
    (event, edge) => {
      if (event.button !== 0) return

      event.stopPropagation()
      clearTimeout(pendingEdgeClick.current)
      pendingEdgeClick.current = null
      let didRemoveConnection = false

      updateCanvas((currentCanvas) => {
        if (!currentCanvas.edges.some(({ id }) => id === edge.id)) {
          return currentCanvas
        }

        didRemoveConnection = true
        return {
          ...currentCanvas,
          edges: currentCanvas.edges.filter(({ id }) => id !== edge.id),
        }
      })

      if (!didRemoveConnection) return

      flagExperience(knownExperiences.removeConnectionByDoubleClick, {
        prompted: removeConnectionTipIsVisible,
      })
      setStatusBarTip(maySuggestTip([]))
    },
    [
      flagExperience,
      maySuggestTip,
      removeConnectionTipIsVisible,
      updateCanvas,
    ],
  )

  useEffect(
    () => () => {
      clearTimeout(pendingEdgeClick.current)
      clearTimeout(pendingPaneClick.current?.timeoutId)
      clearTimeout(suppressPaneClickReset.current)
    },
    [],
  )

  const onNodesChange = useCallback(
    (changes) =>
      setCanvas((currentCanvas) => ({
        ...currentCanvas,
        nodes: applyNodeChanges(changes, currentCanvas.nodes),
      })),
    [setCanvas],
  )

  const onEdgesChange = useCallback(
    (changes) =>
      setCanvas((currentCanvas) => ({
        ...currentCanvas,
        edges: applyEdgeChanges(changes, currentCanvas.edges),
      })),
    [setCanvas],
  )

  const connectNodes = useCallback(
    (connection) => {
      let didCreateConnection = false

      updateCanvas((currentCanvas) => {
        if (!canConnectNodes(currentCanvas.edges, connection)) {
          return currentCanvas
        }

        didCreateConnection = true

        return {
          ...currentCanvas,
          edges: addEdge(
            {
              ...connection,
              sourceHandle: null,
              targetHandle: null,
              type: 'default',
            },
            currentCanvas.edges,
          ),
        }
      })

      if (didCreateConnection) {
        setStatusBarTip(
          maySuggestTip([experienceTips.removeConnection]),
        )
      }
    },
    [maySuggestTip, updateCanvas],
  )

  const onConnectEnd = useCallback(
    (event, connectionState) => {
      const pointer =
        'clientX' in event
          ? event
          : event.changedTouches?.[0]
      if (!pointer || !connectionState.fromNode) return

      const targetNodeElement = document
        .elementFromPoint(pointer.clientX, pointer.clientY)
        ?.closest('.react-flow__node')
      const targetNodeId = targetNodeElement?.getAttribute('data-id')
      if (!targetNodeId) return

      connectNodes({
        source: connectionState.fromNode.id,
        target: targetNodeId,
      })
    },
    [connectNodes],
  )

  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    if (selectedNodes.length < 2) return

    const activeElement = document.activeElement
    if (activeElement?.matches('.react-flow__node-idea textarea')) {
      activeElement.blur()
    }
  }, [])

  const handleSelectionStart = useCallback(() => {
    setStatusBarTip(maySuggestTip([experienceTips.pan]))
  }, [maySuggestTip])

  const handleZoomIn = useCallback(async () => {
    setStatusBarTip(
      maySuggestTip([experienceTips.zoom, experienceTips.pan]),
    )
    setViewportState((currentState) => ({
      ...currentState,
      isFitViewActive: false,
    }))
    await zoomIn({ duration: 200 })
    setViewportState((currentState) => ({
      ...currentState,
      ...getViewport(),
      isFitViewActive: false,
    }))
  }, [getViewport, maySuggestTip, setViewportState, zoomIn])

  const handleZoomOut = useCallback(async () => {
    setStatusBarTip(
      maySuggestTip([experienceTips.zoom, experienceTips.pan]),
    )
    setViewportState((currentState) => ({
      ...currentState,
      isFitViewActive: false,
    }))
    await zoomOut({ duration: 200 })
    setViewportState((currentState) => ({
      ...currentState,
      ...getViewport(),
      isFitViewActive: false,
    }))
  }, [getViewport, maySuggestTip, setViewportState, zoomOut])

  const handleMoveStart = useCallback(
    (event) => {
      if (!event) return

      if (event.type !== 'wheel') {
        mousePanStartViewport.current = getViewport()
      }

      setViewportState((currentState) => ({
        ...currentState,
        isFitViewActive: false,
      }))
    },
    [getViewport, setViewportState],
  )

  const handleMoveEnd = useCallback(
    (event, viewport) => {
      if (!event) return

      setViewportState((currentState) => ({
        ...currentState,
        ...viewport,
        isFitViewActive: false,
      }))

      if (
        mousePanStartViewport.current &&
        didViewportPan(mousePanStartViewport.current, viewport)
      ) {
        flagExperience(knownExperiences.canvasPan, {
          prompted: panTipIsVisible,
        })
        setStatusBarTip(maySuggestTip([]))
      }

      mousePanStartViewport.current = null
    },
    [flagExperience, maySuggestTip, panTipIsVisible, setViewportState],
  )

  const clearCanvas = useCallback(async () => {
    updateCanvas(emptyCanvas)
    setViewportState(defaultViewportState)
    setLogoResetKey((currentKey) => currentKey + 1)
    setStatusBarTip(null)
    await setViewport(defaultViewport)
  }, [setViewport, setViewportState, updateCanvas])

  const fullReset = useCallback(() => {
    try {
      localStorage.clear()
    } finally {
      window.location.reload()
    }
  }, [])

  const selectAllNodes = useCallback(() => {
    setCanvas((currentCanvas) => ({
      ...currentCanvas,
      nodes: currentCanvas.nodes.map((node) => ({ ...node, selected: true })),
      edges: currentCanvas.edges.map((edge) => ({ ...edge, selected: false })),
    }))
  }, [setCanvas])

  useHotkeys(
    [
      { hotkey: 'Mod+A', callback: selectAllNodes },
      { hotkey: 'Mod+Z', callback: undo },
      { hotkey: 'Mod+Shift+Z', callback: redo },
      { hotkey: 'Mod+Y', callback: redo },
      {
        hotkey: 'Mod+C',
        callback: copySelection,
        options: { preventDefault: false },
      },
      {
        hotkey: 'Mod+X',
        callback: cutSelection,
        options: { preventDefault: false },
      },
      { hotkey: clearCanvasHotkey, callback: clearCanvas },
      { hotkey: fullResetHotkey, callback: fullReset },
    ],
    { ignoreInputs: true },
  )

  const toggleFitView = useCallback(async () => {
    setStatusBarTip(
      maySuggestTip([experienceTips.pan, experienceTips.zoom]),
    )

    if (isFitViewActive) {
      await setViewport(selectedViewport, { duration: 300 })
      setViewportState((currentState) => ({
        ...currentState,
        isFitViewActive: false,
      }))
      return
    }

    const didFit = await fitView({ duration: 300, maxZoom: 1.4, padding: 0.2 })
    if (!didFit) return

    setViewportState((currentState) => ({
      ...currentState,
      fitViewport: getViewport(),
      isFitViewActive: true,
    }))
  }, [
    fitView,
    getViewport,
    isFitViewActive,
    maySuggestTip,
    selectedViewport,
    setViewport,
    setViewportState,
  ])

  return (
    <CanvasHistoryProvider
      value={{
        beginTransaction,
        finishIdeaEditing,
        finishNodeAutofocus,
        pendingFocusNodeId,
      }}
    >
      <ContextMenu>
        <ContextMenuTrigger className="h-screen w-screen bg-background">
          <main
            className="h-full w-full"
            onClickCapture={onCanvasClickCapture}
            onContextMenuCapture={handleContextMenu}
            onPointerDownCapture={onCanvasPointerDownCapture}
            onWheelCapture={onWheelCapture}
          >
            <ReactFlow
              nodes={canvas.nodes}
              edges={routedEdges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onEdgeClick={onEdgeClick}
              onEdgeDoubleClick={onEdgeDoubleClick}
              onConnect={connectNodes}
              onConnectEnd={onConnectEnd}
              isValidConnection={isValidConnection}
              onBeforeDelete={async () => {
                beginTransaction()
                return true
              }}
              onDelete={commitTransaction}
              onNodeDragStart={beginTransaction}
              onNodeDragStop={commitTransaction}
              onSelectionChange={onSelectionChange}
              onSelectionStart={handleSelectionStart}
              onMoveStart={handleMoveStart}
              onMoveEnd={handleMoveEnd}
              onPaneClick={onPaneClick}
              connectionMode={ConnectionMode.Loose}
              connectionRadius={28}
              connectionLineComponent={AutomaticConnectionLine}
              defaultEdgeOptions={{
                type: 'default',
                style: { stroke: 'var(--primary)', strokeWidth: 2 },
              }}
              deleteKeyCode={['Backspace', 'Delete']}
              defaultViewport={initialViewport}
              multiSelectionKeyCode="Shift"
              panOnDrag={[1]}
              panActivationKeyCode="Space"
              panOnScroll={false}
              paneClickDistance={3}
              selectionOnDrag
              className={canvasSelectionStyles}
              minZoom={0.2}
              maxZoom={2.4}
              proOptions={{ hideAttribution: true }}
              zoomOnDoubleClick={false}
              zoomOnPinch={false}
              zoomOnScroll
            >
              <Panel position="top-left" className="m-5">
                <Logo key={logoResetKey} />
              </Panel>
              <Panel
                position="bottom-center"
                className="m-5"
              >
                <StatusBar tipKey={visibleStatusBarTip} />
              </Panel>
              <Panel position="bottom-right" className="m-5 -translate-y-4">
                <div className="flex flex-col items-center gap-2">
                  <CanvasFloatingButton
                    aria-label={
                      isFitViewActive
                        ? 'Restore previous view'
                        : 'Fit all content'
                    }
                    aria-pressed={isFitViewActive}
                    disabled={canvas.nodes.length === 0}
                    onClick={toggleFitView}
                    title={
                      isFitViewActive
                        ? 'Restore previous view'
                        : 'Fit all content'
                    }
                  >
                    <Maximize />
                  </CanvasFloatingButton>
                  <div className="flex flex-col overflow-hidden rounded-sm border bg-background/95 shadow-[0_6px_18px_oklch(0.25_0.03_260/0.1)] backdrop-blur-sm">
                    <CanvasFloatingButton
                      aria-label="Zoom in"
                      className="border-b"
                      grouped
                      onClick={handleZoomIn}
                      title="Zoom in"
                    >
                      <Plus />
                    </CanvasFloatingButton>
                    <CanvasFloatingButton
                      aria-label="Zoom out"
                      grouped
                      onClick={handleZoomOut}
                      title="Zoom out"
                    >
                      <Minus />
                    </CanvasFloatingButton>
                  </div>
                </div>
              </Panel>
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1.25}
                color="var(--canvas-dot)"
              />
            </ReactFlow>
          </main>
        </ContextMenuTrigger>
        <ContextMenuContent className="min-w-44">
          {contextMenuTarget.type === 'nodes' && (
            <>
              <ContextMenuItem
                variant="destructive"
                onClick={removeContextNodes}
              >
                Remove
                <ContextMenuShortcut>{shortcuts.remove}</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onClick={cutFromContextMenu}>
                Cut
                <ContextMenuShortcut>{shortcuts.cut}</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onClick={copyFromContextMenu}>
                Copy
                <ContextMenuShortcut>{shortcuts.copy}</ContextMenuShortcut>
              </ContextMenuItem>
            </>
          )}
          {contextMenuTarget.type === 'connection' && (
            <ContextMenuItem
              variant="destructive"
              onClick={disconnectContextEdge}
            >
              Disconnect
              <ContextMenuShortcut>{shortcuts.disconnect}</ContextMenuShortcut>
            </ContextMenuItem>
          )}
          {contextMenuTarget.type === 'canvas' && (
            <>
              <ContextMenuItem onClick={addIdeaFromContextMenu}>
                Add node
                <ContextMenuShortcut>{shortcuts.addNode}</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem
                disabled={canvas.nodes.length === 0}
                onClick={selectAllNodes}
              >
                Select all
                <ContextMenuShortcut>{shortcuts.selectAll}</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem
                disabled={!pasteIsAvailable}
                onClick={pasteSelection}
              >
                Paste
                <ContextMenuShortcut>{shortcuts.paste}</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                disabled={canvas.nodes.length === 0 && canvas.edges.length === 0}
                variant="destructive"
                onClick={clearCanvas}
              >
                Clear
                <ContextMenuShortcut>{shortcuts.clear}</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem
                variant="destructive"
                onClick={fullReset}
              >
                Full reset
                <ContextMenuShortcut>{shortcuts.fullReset}</ContextMenuShortcut>
              </ContextMenuItem>
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
    </CanvasHistoryProvider>
  )
}

function App() {
  return (
    <ReactFlowProvider>
      <ThinkingCanvas />
    </ReactFlowProvider>
  )
}

export default App
