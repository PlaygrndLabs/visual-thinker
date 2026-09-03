import { useCallback, useRef, useState } from 'react'
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
import { Logotype } from '@/components/logotype'

const nodeTypes = { idea: IdeaNode }
const canvasSelectionStyles = String.raw`
  [&_.react-flow\_\_nodesselection-rect]:[--xy-selection-background-color:transparent]
  [&_.react-flow\_\_nodesselection-rect]:[--xy-selection-border:none]
  [&_.react-flow\_\_selection]:[--xy-selection-background-color:rgb(49_106_197_/_0.15)]
  [&_.react-flow\_\_selection]:[--xy-selection-border:1px_solid_#316ac5]
`

function ThinkingCanvas() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const [isFitViewActive, setIsFitViewActive] = useState(false)
  const nextNodeId = useRef(1)
  const savedViewport = useRef(null)
  const {
    fitView,
    getViewport,
    screenToFlowPosition,
    setViewport,
    zoomIn,
    zoomOut,
  } = useReactFlow()

  const createIdea = useCallback((position) => {
    const id = `idea-${nextNodeId.current++}`

    setNodes((currentNodes) => [
      ...currentNodes,
      {
        id,
        type: 'idea',
        position,
        data: { label: 'New idea', autofocus: true },
      },
    ])
  }, [])

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
      createIdeaAtScreenPoint({ x: event.clientX, y: event.clientY })
    },
    [createIdeaAtScreenPoint],
  )

  const onNodesChange = useCallback(
    (changes) => setNodes((currentNodes) => applyNodeChanges(changes, currentNodes)),
    [],
  )

  const onEdgesChange = useCallback(
    (changes) => setEdges((currentEdges) => applyEdgeChanges(changes, currentEdges)),
    [],
  )

  const onConnect = useCallback(
    (connection) =>
      setEdges((currentEdges) =>
        addEdge({ ...connection, type: 'smoothstep' }, currentEdges),
      ),
    [],
  )

  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    if (selectedNodes.length < 2) return

    const activeElement = document.activeElement
    if (activeElement?.matches('.react-flow__node-idea input')) {
      activeElement.blur()
    }
  }, [])

  const handleZoomIn = useCallback(() => {
    setIsFitViewActive(false)
    zoomIn({ duration: 200 })
  }, [zoomIn])

  const handleZoomOut = useCallback(() => {
    setIsFitViewActive(false)
    zoomOut({ duration: 200 })
  }, [zoomOut])

  const toggleFitView = useCallback(async () => {
    if (isFitViewActive) {
      if (savedViewport.current) {
        await setViewport(savedViewport.current, { duration: 300 })
      }
      setIsFitViewActive(false)
      return
    }

    savedViewport.current = getViewport()
    const didFit = await fitView({ duration: 300, maxZoom: 1.4, padding: 0.2 })
    setIsFitViewActive(didFit)
  }, [fitView, getViewport, isFitViewActive, setViewport])

  return (
    <main className="h-screen w-screen bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onMoveStart={(event) => {
          if (event) setIsFitViewActive(false)
        }}
        onPaneClick={onPaneClick}
        connectionRadius={28}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'var(--primary)', strokeWidth: 2 },
        }}
        deleteKeyCode={['Backspace', 'Delete']}
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
          <Logotype />
        </Panel>
        <Panel
          position="bottom-center"
          className="m-5 whitespace-nowrap text-xs text-muted-foreground"
        >
          <kbd className="font-sans">Space</kbd> + drag or middle-drag to pan
          <span className="mx-2 text-border">·</span>
          Scroll to zoom
        </Panel>
        <Panel position="bottom-right" className="m-5 -translate-y-4">
          <div className="flex flex-col items-center gap-2">
            <CanvasFloatingButton
              aria-label={
                isFitViewActive ? 'Restore previous view' : 'Fit all content'
              }
              aria-pressed={isFitViewActive}
              disabled={nodes.length === 0}
              onClick={toggleFitView}
              title={
                isFitViewActive ? 'Restore previous view' : 'Fit all content'
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
