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
import { IdeaNode } from '@/components/idea-node'
import { Logo } from '@/components/logo'
import { StatusBar } from '@/components/status-bar'
import { CanvasHistoryProvider } from '@/contexts/canvas-history-context'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
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
import {
  canvasSchema,
  viewportStateSchema,
} from '@/schemas/storage-schemas'

const nodeTypes = { idea: IdeaNode }
const canvasStorageKey = 'visual-thinker.canvas.v1'
const viewportStorageKey = 'visual-thinker.viewport.v1'
const paneDoubleClickDelay = 500
const completedPanDistance = 3
const emptyCanvas = { nodes: [], edges: [] }
const defaultViewport = { x: 0, y: 0, zoom: 1 }
const defaultViewportState = {
  ...defaultViewport,
  fitViewport: null,
  isFitViewActive: false,
}
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

function getNodeBounds(node) {
  const width = node.measured?.width ?? node.width ?? 0
  const height = node.measured?.height ?? node.height ?? 0

  return {
    left: node.position.x,
    right: node.position.x + width,
    top: node.position.y,
    bottom: node.position.y + height,
    centerX: node.position.x + width / 2,
    centerY: node.position.y + height / 2,
  }
}

function getAutomaticHandles(sourceNode, targetNode) {
  const source = getNodeBounds(sourceNode)
  const target = getNodeBounds(targetNode)
  const deltaX = target.centerX - source.centerX
  const deltaY = target.centerY - source.centerY
  const overlapsHorizontally =
    Math.max(source.left, target.left) <= Math.min(source.right, target.right)
  const overlapsVertically =
    Math.max(source.top, target.top) <= Math.min(source.bottom, target.bottom)
  const useHorizontalHandles = overlapsVertically
    ? !overlapsHorizontally || Math.abs(deltaX) > Math.abs(deltaY)
    : !overlapsHorizontally && Math.abs(deltaX) > Math.abs(deltaY)

  if (useHorizontalHandles) {
    return deltaX >= 0
      ? { sourceHandle: 'right', targetHandle: 'left' }
      : { sourceHandle: 'left', targetHandle: 'right' }
  }

  return deltaY >= 0
    ? { sourceHandle: 'bottom', targetHandle: 'top' }
    : { sourceHandle: 'top', targetHandle: 'bottom' }
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
  const [statusBarTip, setStatusBarTip] = useState(null)
  const pendingPaneClick = useRef(null)
  const mousePanStartViewport = useRef(null)
  const zoomGestureStartZoom = useRef(null)
  const { flagExperience, maySuggestTip } = useExperiences()
  const visibleStatusBarTip = maySuggestTip(
    statusBarTip === null ? [] : [statusBarTip],
  )
  const panTipIsVisible = visibleStatusBarTip === experienceTips.pan
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
  const { copySelection, cutSelection } = useCanvasClipboard(
    canvas,
    screenToFlowPosition,
    updateCanvas,
  )
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

  const createIdea = useCallback((position) => {
    const id = `idea-${crypto.randomUUID()}`

    updateCanvas((currentCanvas) => ({
      ...currentCanvas,
      nodes: [
        ...currentCanvas.nodes,
        {
          id,
          type: 'idea',
          position,
          data: { label: 'New idea', autofocus: true },
        },
      ],
    }))
  }, [updateCanvas])

  const createIdeaAtScreenPoint = useCallback(
    ({ x, y }) => {
      const position = screenToFlowPosition({ x, y })
      createIdea({ x: position.x - 96, y: position.y - 28 })
    },
    [createIdea, screenToFlowPosition],
  )

  const onPaneClick = useCallback(
    (event) => {
      if (event.button !== 0) return

      clearTimeout(pendingPaneClick.current)
      pendingPaneClick.current = setTimeout(() => {
        setStatusBarTip(
          maySuggestTip([experienceTips.addNode, experienceTips.pan]),
        )
        pendingPaneClick.current = null
      }, paneDoubleClickDelay)
    },
    [maySuggestTip],
  )

  const onPaneDoubleClick = useCallback(
    (event) => {
      if (event.button !== 0) return
      if (!event.target.classList.contains('react-flow__pane')) return
      clearTimeout(pendingPaneClick.current)
      pendingPaneClick.current = null
      createIdeaAtScreenPoint({ x: event.clientX, y: event.clientY })
      flagExperience(knownExperiences.createNodeByDoubleClick, {
        prompted: visibleStatusBarTip === experienceTips.addNode,
      })
      setStatusBarTip(maySuggestTip([]))
    },
    [
      createIdeaAtScreenPoint,
      flagExperience,
      maySuggestTip,
      visibleStatusBarTip,
    ],
  )

  useEffect(
    () => () => clearTimeout(pendingPaneClick.current),
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

  const onConnect = useCallback(
    (connection) =>
      updateCanvas((currentCanvas) => {
        if (!canConnectNodes(currentCanvas.edges, connection)) {
          return currentCanvas
        }

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
      }),
    [updateCanvas],
  )

  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    if (selectedNodes.length < 2) return

    const activeElement = document.activeElement
    if (activeElement?.matches('.react-flow__node-idea input')) {
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
    <CanvasHistoryProvider value={{ beginTransaction, commitTransaction }}>
      <ContextMenu>
        <ContextMenuTrigger className="h-screen w-screen bg-background">
          <main
            className="h-full w-full"
            onDoubleClick={onPaneDoubleClick}
            onWheelCapture={onWheelCapture}
          >
            <ReactFlow
              nodes={canvas.nodes}
              edges={routedEdges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
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
        <ContextMenuContent>
          <ContextMenuItem
            variant="destructive"
            onClick={clearCanvas}
          >
            Clear
          </ContextMenuItem>
          <ContextMenuItem
            variant="destructive"
            onClick={fullReset}
          >
            Full reset
          </ContextMenuItem>
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
