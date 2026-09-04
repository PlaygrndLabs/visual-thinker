import { getBezierPath, useStore } from '@xyflow/react'

import { getAutomaticHandles } from '@/lib/connection-routing'

export function AutomaticConnectionLine({
  connectionLineStyle,
  fromNode,
  fromPosition,
  fromX,
  fromY,
  pointer,
  toPosition,
  toX,
  toY,
}) {
  const nodeLookup = useStore((state) => state.nodeLookup)
  const flowElement = useStore((state) => state.domNode)
  const flowBounds = flowElement?.getBoundingClientRect()
  const targetNodeElement = flowBounds
    ? document
        .elementsFromPoint(
          pointer.x + flowBounds.left,
          pointer.y + flowBounds.top,
        )
        .map((element) => element.closest('.react-flow__node'))
        .find(
          (element) =>
            element && element.getAttribute('data-id') !== fromNode.id,
        )
    : null
  const targetNode = targetNodeElement
    ? nodeLookup.get(targetNodeElement.getAttribute('data-id'))
    : null

  if (targetNode) {
    const automaticTargetPosition = getAutomaticHandles(
      fromNode,
      targetNode,
    ).targetHandle
    const automaticTargetHandle = targetNodeElement.querySelector(
      `.react-flow__handle.source[data-handleid="${automaticTargetPosition}"]`,
    )
    const automaticTargetBounds =
      automaticTargetHandle?.getBoundingClientRect()

    if (automaticTargetBounds) {
      toX =
        automaticTargetBounds.left +
        automaticTargetBounds.width / 2 -
        flowBounds.left
      toY =
        automaticTargetBounds.top +
        automaticTargetBounds.height / 2 -
        flowBounds.top
      toPosition = automaticTargetPosition
    }
  }

  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
  })

  return (
    <path
      className="react-flow__connection-path"
      d={path}
      style={connectionLineStyle}
    />
  )
}
