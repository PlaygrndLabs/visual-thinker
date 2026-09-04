import { useEffect, useRef } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'

import { useCanvasHistoryTransaction } from '@/contexts/canvas-history-context'

const handlePositions = [
  Position.Top,
  Position.Right,
  Position.Bottom,
  Position.Left,
]

export function IdeaNode({ id, data, selected }) {
  const inputRef = useRef(null)
  const { updateNodeData } = useReactFlow()
  const { beginTransaction, commitTransaction } =
    useCanvasHistoryTransaction()

  useEffect(() => {
    if (!data.autofocus) return

    inputRef.current?.focus()
    inputRef.current?.select()
    updateNodeData(id, { autofocus: false })
  }, [data.autofocus, id, updateNodeData])

  return (
    <div
      className={`group min-w-48 rounded-xl border bg-card px-3 py-2 shadow-[0_8px_24px_oklch(0.25_0.03_260/0.08)] transition-[border-color,box-shadow] ${
        selected
          ? 'border-primary shadow-[0_0_0_3px_oklch(0.58_0.2_260/0.16),0_8px_24px_oklch(0.25_0.03_260/0.1)]'
          : 'border-border'
      }`}
    >
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
        className="nodrag nowheel block w-full bg-transparent text-sm font-medium text-card-foreground outline-none placeholder:text-muted-foreground"
        value={data.label}
        onBlur={commitTransaction}
        onChange={(event) => updateNodeData(id, { label: event.target.value })}
        onFocus={beginTransaction}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === 'Escape') {
            event.currentTarget.blur()
          }
        }}
        aria-label="Idea text"
      />
    </div>
  )
}
