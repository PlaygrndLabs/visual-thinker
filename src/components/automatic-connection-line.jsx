import { getBezierPath, useStore } from '@xyflow/react'

import {
  getAutomaticHandles,
  getNodeHandlePoint,
} from '@/lib/connection-routing'

export function AutomaticConnectionLine({
  connectionLineStyle,
  fromNode,
  fromPosition,
  fromX,
  fromY,
  pointer,
  toNode,
  toPosition,
  toX,
  toY,
}) {
  const nodeLookup = useStore((state) => state.nodeLookup)
  const flowElement = useStore((state) => state.domNode)
  const flowBounds = flowElement?.getBoundingClientRect()
  const hoveredTargetNodeElement = flowBounds
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
  const hoveredTargetNode = hoveredTargetNodeElement
    ? nodeLookup.get(hoveredTargetNodeElement.getAttribute('data-id'))
    : null
  const targetNode = hoveredTargetNode ?? toNode

  if (targetNode && targetNode.id !== fromNode.id) {
    const automaticTargetPosition = getAutomaticHandles(
      fromNode,
      targetNode,
    ).targetHandle
    const automaticTargetPoint = getNodeHandlePoint(
      targetNode,
      automaticTargetPosition,
    )

    toX = automaticTargetPoint.x
    toY = automaticTargetPoint.y
    toPosition = automaticTargetPosition
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
