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
import { Plus } from 'lucide-react'

import { IdeaNode } from '@/components/idea-node'
import { Button } from '@/components/ui/button'

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
      createIdeaAtScreenPoint({ x: event.clientX, y: event.clientY })
    },
    [createIdeaAtScreenPoint],
  )

  const onAddIdea = useCallback(() => {
    createIdeaAtScreenPoint({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  }, [createIdeaAtScreenPoint])

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
        panOnDrag={false}
        panOnScroll={false}
        minZoom={0.2}
        maxZoom={2.4}
        zoomOnDoubleClick={false}
        zoomOnPinch={false}
        zoomOnScroll
      >
        <Panel position="top-left" className="m-5 flex items-center gap-3">
          <div className="rounded-xl border border-border/80 bg-background/90 px-3 py-2 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold tracking-tight">Visual Thinker</p>
            <p className="text-xs text-muted-foreground">Click the canvas to capture a thought</p>
          </div>
          <Button size="icon" onClick={onAddIdea} aria-label="Add an idea">
            <Plus aria-hidden="true" />
          </Button>
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
