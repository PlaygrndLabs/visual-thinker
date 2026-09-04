export function getConnectionPairKey({ source, target }) {
  return JSON.stringify(source < target ? [source, target] : [target, source])
}

export function getUniqueEdges(edges) {
  const seenPairs = new Set()

  return edges.filter((edge) => {
    const pairKey = getConnectionPairKey(edge)
    if (seenPairs.has(pairKey)) return false

    seenPairs.add(pairKey)
    return true
  })
}

export function canConnectNodes(edges, { source, target }) {
  if (!source || !target || source === target) return false

  const pairKey = getConnectionPairKey({ source, target })
  return !edges.some((edge) => getConnectionPairKey(edge) === pairKey)
}
