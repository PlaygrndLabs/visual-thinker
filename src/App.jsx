import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useHotkeys } from '@tanstack/react-hotkeys'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
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
import { useLocalStorageState } from '@/hooks/use-local-storage-state'

const nodeTypes = { idea: IdeaNode }
const canvasStorageKey = 'visual-thinker.canvas.v1'
const viewportStorageKey = 'visual-thinker.viewport.v1'
const paneDoubleClickDelay = 500
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
`

function ThinkingCanvas() {
  const {
    beginTransaction,
    canvas,
    commitTransaction,
    redo,
    setCanvas,
    undo,
    updateCanvas,
  } = useCanvasHistory(canvasStorageKey, emptyCanvas)
  const [viewportState, setViewportState] = useLocalStorageState(
    viewportStorageKey,
    defaultViewportState,
  )
  const [logoResetKey, setLogoResetKey] = useState(0)
  const [statusBarTip, setStatusBarTip] = useState('navigation')
  const pendingPaneClick = useRef(null)
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

  const onPaneClick = useCallback((event) => {
    if (event.button !== 0) return

    clearTimeout(pendingPaneClick.current)
    pendingPaneClick.current = setTimeout(() => {
      setStatusBarTip('add-node')
      pendingPaneClick.current = null
    }, paneDoubleClickDelay)
  }, [])

  const onPaneDoubleClick = useCallback(
    (event) => {
      if (event.button !== 0) return
      if (!event.target.classList.contains('react-flow__pane')) return
      clearTimeout(pendingPaneClick.current)
      pendingPaneClick.current = null
      createIdeaAtScreenPoint({ x: event.clientX, y: event.clientY })
      setStatusBarTip('navigation')
    },
    [createIdeaAtScreenPoint],
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
      updateCanvas((currentCanvas) => ({
        ...currentCanvas,
        edges: addEdge(
          { ...connection, type: 'smoothstep' },
          currentCanvas.edges,
        ),
      })),
    [updateCanvas],
  )

  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    if (selectedNodes.length < 2) return

    const activeElement = document.activeElement
    if (activeElement?.matches('.react-flow__node-idea input')) {
      activeElement.blur()
    }
  }, [])

  const handleZoomIn = useCallback(async () => {
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
  }, [getViewport, setViewportState, zoomIn])

  const handleZoomOut = useCallback(async () => {
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
  }, [getViewport, setViewportState, zoomOut])

  const handleMoveStart = useCallback(
    (event) => {
      if (!event) return

      setViewportState((currentState) => ({
        ...currentState,
        isFitViewActive: false,
      }))
    },
    [setViewportState],
  )

  const handleMoveEnd = useCallback(
    (event, viewport) => {
      if (!event) return

      setViewportState((currentState) => ({
        ...currentState,
        ...viewport,
        isFitViewActive: false,
      }))
    },
    [setViewportState],
  )

  const clearCanvas = useCallback(async () => {
    updateCanvas(emptyCanvas)
    setViewportState(defaultViewportState)
    setLogoResetKey((currentKey) => currentKey + 1)
    await setViewport(defaultViewport)
  }, [setViewport, setViewportState, updateCanvas])

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
    selectedViewport,
    setViewport,
    setViewportState,
  ])

  return (
    <CanvasHistoryProvider value={{ beginTransaction, commitTransaction }}>
      <ContextMenu>
        <ContextMenuTrigger className="h-screen w-screen bg-background">
          <main className="h-full w-full" onDoubleClick={onPaneDoubleClick}>
            <ReactFlow
              nodes={canvas.nodes}
              edges={canvas.edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onBeforeDelete={async () => {
                beginTransaction()
                return true
              }}
              onDelete={commitTransaction}
              onNodeDragStart={beginTransaction}
              onNodeDragStop={commitTransaction}
              onSelectionChange={onSelectionChange}
              onMoveStart={handleMoveStart}
              onMoveEnd={handleMoveEnd}
              onPaneClick={onPaneClick}
              connectionRadius={28}
              defaultEdgeOptions={{
                type: 'smoothstep',
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
                <StatusBar tipKey={statusBarTip} />
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
