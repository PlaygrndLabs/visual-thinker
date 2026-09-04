import { getBezierPath, useStore } from '@xyflow/react'

import {
  getAutomaticHandles,
  getNodeBounds,
  getNodeHandlePoint,
} from '@/lib/connection-routing'

function getNodeAtPoint(nodeLookup, point, sourceNodeId) {
  let targetNode = null

  for (const node of nodeLookup.values()) {
    if (node.id === sourceNodeId || node.hidden) continue

    const bounds = getNodeBounds(node)
    const containsPoint =
      point.x >= bounds.left &&
      point.x <= bounds.right &&
      point.y >= bounds.top &&
      point.y <= bounds.bottom

    if (
      containsPoint &&
      (!targetNode || node.internals.z >= targetNode.internals.z)
    ) {
      targetNode = node
    }
  }

  return targetNode
}

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
  const transform = useStore((state) => state.transform)
  const [translateX, translateY, zoom] = transform
  const pointerInFlow = {
    x: (pointer.x - translateX) / zoom,
    y: (pointer.y - translateY) / zoom,
  }
  const targetNode = getNodeAtPoint(
    nodeLookup,
    pointerInFlow,
    fromNode.id,
  )

  if (targetNode) {
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
