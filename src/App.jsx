import { Background, BackgroundVariant, ReactFlow } from '@xyflow/react'

function App() {
  return (
    <main className="h-screen w-screen bg-background">
      <ReactFlow
        nodes={[]}
        edges={[]}
        panOnDrag={false}
        panOnScroll={false}
        zoomOnDoubleClick={false}
        zoomOnPinch={false}
        zoomOnScroll={false}
      >
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

export default App
