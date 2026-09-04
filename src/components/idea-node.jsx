import { useEffect, useRef } from 'react'
import {
  Handle,
  Position,
  useConnection,
  useInternalNode,
  useReactFlow,
} from '@xyflow/react'

import { useCanvasHistoryTransaction } from '@/contexts/canvas-history-context'
import { getAutomaticHandles } from '@/lib/connection-routing'

const handlePositions = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
]

export function IdeaNode({ id, data, selected }) {
  const inputRef = useRef(null)
  const { updateNodeData } = useReactFlow()
  const internalNode = useInternalNode(id)
  const connectionSourceNode = useConnection((connection) =>
    connection.inProgress ? connection.fromNode : null,
  )
  const {
    beginTransaction,
    commitTransaction,
    deleteNode,
    finishNodeAutofocus,
    pendingFocusNodeId,
  } = useCanvasHistoryTransaction()
  const automaticTargetPosition =
    connectionSourceNode &&
    connectionSourceNode.id !== id &&
    internalNode
      ? getAutomaticHandles(connectionSourceNode, internalNode).targetHandle
      : null

  useEffect(() => {
    if (pendingFocusNodeId !== id) return

    const focusTimeout = setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
      finishNodeAutofocus(id)
    }, 0)

    return () => clearTimeout(focusTimeout)
  }, [finishNodeAutofocus, id, pendingFocusNodeId])

  return (
    <div
      className={`group relative w-fit min-w-24 rounded-xl border bg-card px-3 py-2 shadow-[0_8px_24px_oklch(0.25_0.03_260/0.08)] transition-[border-color,box-shadow] ${
        selected
          ? 'border-primary shadow-[0_0_0_3px_oklch(0.58_0.2_260/0.16),0_8px_24px_oklch(0.25_0.03_260/0.1)]'
          : 'border-border'
      }`}
    >
      {handlePositions.map((position) => (
        <Handle
          key={`automatic-target-${position}`}
          id={`automatic-target-${position}`}
          type="target"
          position={position}
          isConnectableStart={false}
          className="pointer-events-none! h-3! w-3! border-0! bg-transparent! opacity-0!"
        />
      ))}
      {handlePositions.map((position) => (
        <Handle
          key={position}
          id={position}
          type="source"
          position={position}
          className={`!h-3 !w-3 !border-2 !border-card !bg-primary transition-opacity ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        />
      ))}
      <input
        ref={inputRef}
        className="nodrag nowheel block min-w-0 [field-sizing:content] bg-transparent text-sm font-medium text-card-foreground outline-none placeholder:text-muted-foreground"
        value={data.label}
        onBlur={(event) => {
          if (event.currentTarget.value === '') {
            deleteNode(id)
          }

          commitTransaction()
        }}
        onChange={(event) => updateNodeData(id, { label: event.target.value })}
        onFocus={beginTransaction}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'Escape') {
            event.currentTarget.blur()
          }
        }}
        aria-label="Idea text"
      />
      {automaticTargetPosition && (
        <div
          aria-hidden="true"
          className={`react-flow__handle react-flow__handle-${automaticTargetPosition} target connectable connectableend pointer-events-auto! absolute! inset-0! z-10! h-full! w-full! translate-x-0! translate-y-0! cursor-crosshair! rounded-xl! border-0! bg-transparent! opacity-0!`}
          data-handleid={`automatic-target-${automaticTargetPosition}`}
          data-handlepos={automaticTargetPosition}
          data-nodeid={id}
        />
      )}
    </div>
  )
}
