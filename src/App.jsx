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

import { IdeaNode } from '@/components/idea-node'

const nodeTypes = { idea: IdeaNode }

function ThinkingCanvas() {
  const [nodes, setNodes] = useState([])
  const [edges, setEdges] = useState([])
  const nextNodeId = useRef(1)
  const { screenToFlowPosition } = useReactFlow()

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

  return (
    <main className="h-screen w-screen bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        connectionRadius={28}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'var(--primary)', strokeWidth: 2 },
        }}
        deleteKeyCode={['Backspace', 'Delete']}
        panOnDrag={[1]}
        panActivationKeyCode="Space"
        panOnScroll={false}
        minZoom={0.2}
        maxZoom={2.4}
        proOptions={{ hideAttribution: true }}
        zoomOnDoubleClick={false}
        zoomOnPinch={false}
        zoomOnScroll
      >
        <Panel
          position="bottom-right"
          className="m-5 text-xs text-muted-foreground"
        >
          <kbd className="font-sans">Space</kbd> + drag or middle-drag to pan
          <span className="mx-2 text-border">·</span>
          Scroll to zoom
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
