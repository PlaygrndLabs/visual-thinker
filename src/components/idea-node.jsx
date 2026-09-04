import { useEffect, useRef, useState } from 'react'
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
  const [isEditing, setIsEditing] = useState(false)
  const { updateNodeData } = useReactFlow()
  const {
    beginTransaction,
    commitTransaction,
    deleteNode,
    finishNodeAutofocus,
    pendingFocusNodeId,
  } = useCanvasHistoryTransaction()
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
      className={`group w-fit min-w-24 rounded-xl border bg-card px-3 py-2 shadow-[0_8px_24px_oklch(0.25_0.03_260/0.08)] transition-[border-color,box-shadow] ${
        selected
          ? 'border-primary shadow-[0_0_0_3px_oklch(0.58_0.2_260/0.16),0_8px_24px_oklch(0.25_0.03_260/0.1)]'
          : 'border-border'
      }`}
      onDoubleClick={() => {
        if (isEditing) return

        setIsEditing(true)
        requestAnimationFrame(() => {
          inputRef.current?.focus()
          const textEnd = inputRef.current?.value.length ?? 0
          inputRef.current?.setSelectionRange(textEnd, textEnd)
        })
      }}
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
      <textarea
        ref={inputRef}
        className={`${
          isEditing ? 'nodrag pointer-events-auto' : 'pointer-events-none'
        } nowheel block max-h-25 min-w-0 resize-none overflow-x-hidden overflow-y-auto whitespace-pre [field-sizing:content] bg-transparent text-sm leading-5 font-medium text-card-foreground outline-none placeholder:text-muted-foreground`}
        rows={1}
        value={data.label}
        readOnly={!isEditing}
        onBlur={(event) => {
          setIsEditing(false)

          if (event.currentTarget.value === '') {
            deleteNode(id)
          }

          commitTransaction()
        }}
        onChange={(event) => updateNodeData(id, { label: event.target.value })}
        onFocus={() => {
          setIsEditing(true)
          beginTransaction()
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return

          if (event.key === 'Escape') {
            event.preventDefault()
            event.currentTarget.blur()
            return
          }

          if (event.key !== 'Enter') return

          event.preventDefault()

          if (
            !event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey
          ) {
            event.currentTarget.blur()
            return
          }

          const { selectionEnd, selectionStart, value } = event.currentTarget
          const nextCursorPosition = selectionStart + 1

          updateNodeData(id, {
            label: `${value.slice(0, selectionStart)}\n${value.slice(selectionEnd)}`,
          })
          requestAnimationFrame(() => {
            inputRef.current?.setSelectionRange(
              nextCursorPosition,
              nextCursorPosition,
            )
          })
        }}
        aria-label="Idea text"
      />
    </div>
  )
}
