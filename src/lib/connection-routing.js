function getNodeBounds(node) {
  const position = node.internals?.positionAbsolute ?? node.position
  const width = node.measured?.width ?? node.width ?? 0
  const height = node.measured?.height ?? node.height ?? 0

  return {
    left: position.x,
    right: position.x + width,
    top: position.y,
    bottom: position.y + height,
    centerX: position.x + width / 2,
    centerY: position.y + height / 2,
  }
}

export function getNodeHandlePoint(node, position) {
  const bounds = getNodeBounds(node)

  switch (position) {
    case 'top':
      return { x: bounds.centerX, y: bounds.top }
    case 'right':
      return { x: bounds.right, y: bounds.centerY }
    case 'bottom':
      return { x: bounds.centerX, y: bounds.bottom }
    case 'left':
      return { x: bounds.left, y: bounds.centerY }
    default:
      return { x: bounds.centerX, y: bounds.centerY }
  }
}

export function getClosestNodeHandle(node, point) {
  const positions = ['top', 'right', 'bottom', 'left']

  return positions.reduce((closestPosition, position) => {
    const closestPoint = getNodeHandlePoint(node, closestPosition)
    const handlePoint = getNodeHandlePoint(node, position)
    const closestDistance =
      (point.x - closestPoint.x) ** 2 + (point.y - closestPoint.y) ** 2
    const handleDistance =
      (point.x - handlePoint.x) ** 2 + (point.y - handlePoint.y) ** 2

    return handleDistance < closestDistance ? position : closestPosition
  })
}

export function getAutomaticHandles(sourceNode, targetNode) {
  const source = getNodeBounds(sourceNode)
  const target = getNodeBounds(targetNode)
  const deltaX = target.centerX - source.centerX
  const deltaY = target.centerY - source.centerY
  const overlapsHorizontally =
    Math.max(source.left, target.left) <= Math.min(source.right, target.right)
  const overlapsVertically =
    Math.max(source.top, target.top) <= Math.min(source.bottom, target.bottom)
  const useHorizontalHandles = overlapsVertically
    ? !overlapsHorizontally || Math.abs(deltaX) > Math.abs(deltaY)
    : !overlapsHorizontally && Math.abs(deltaX) > Math.abs(deltaY)

  if (useHorizontalHandles) {
    return deltaX >= 0
      ? { sourceHandle: 'right', targetHandle: 'left' }
      : { sourceHandle: 'left', targetHandle: 'right' }
  }

  return deltaY >= 0
    ? { sourceHandle: 'bottom', targetHandle: 'top' }
    : { sourceHandle: 'top', targetHandle: 'bottom' }
}
