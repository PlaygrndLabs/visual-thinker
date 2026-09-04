import { getBezierPath, useStore } from '@xyflow/react'

import {
  getAutomaticHandles,
  getClosestNodeHandle,
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
  const transform = useStore((state) => state.transform)
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
  const pointerPosition = {
    x: (pointer.x - transform[0]) / transform[2],
    y: (pointer.y - transform[1]) / transform[2],
  }
  let sourcePosition = getClosestNodeHandle(fromNode, pointerPosition)

  if (targetNode && targetNode.id !== fromNode.id) {
    const automaticHandles = getAutomaticHandles(
      fromNode,
      targetNode,
    )
    sourcePosition = automaticHandles.sourceHandle
    const automaticTargetPoint = getNodeHandlePoint(
      targetNode,
      automaticHandles.targetHandle,
    )

    toX = automaticTargetPoint.x
    toY = automaticTargetPoint.y
    toPosition = automaticHandles.targetHandle
  }

  const sourcePoint = getNodeHandlePoint(fromNode, sourcePosition)
  fromX = sourcePoint.x
  fromY = sourcePoint.y
  fromPosition = sourcePosition

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
