import { useEffect } from 'react'
import { z } from 'zod'

import { getConnectionPairKey } from '@/lib/canvas-connections'
import {
  connectIdeasInputSchema,
  createIdeasInputSchema,
  deleteIdeasInputSchema,
  disconnectIdeasInputSchema,
  inspectCanvasInputSchema,
  updateIdeasInputSchema,
} from '@/schemas/webmcp-schemas'

const mutableAnnotations = {
  consequentialHint: false,
  readOnlyHint: false,
  untrustedContentHint: false,
}

function getInputSchema(schema) {
  const inputSchema = z.toJSONSchema(schema, {
    io: 'input',
    target: 'draft-07',
  })
  delete inputSchema.$schema
  return inputSchema
}

function parseInput(toolName, schema, input) {
  const result = schema.safeParse(input ?? {})
  if (result.success) return result.data

  const issue = result.error.issues[0]
  const location = issue.path.length > 0 ? ` at ${issue.path.join('.')}` : ''
  throw new Error(
    `${toolName} received invalid input${location}: ${issue.message}`,
  )
}

function assertUnique(values, getKey, label) {
  const seen = new Set()
  const duplicates = new Set()

  for (const value of values) {
    const key = getKey(value)
    if (seen.has(key)) duplicates.add(key)
    seen.add(key)
  }

  if (duplicates.size > 0) {
    throw new Error(`${label} must be unique: ${[...duplicates].join(', ')}`)
  }
}

function assertIdeasExist(canvas, ideaIds) {
  const existingIds = new Set(canvas.nodes.map((node) => node.id))
  const missingIds = [...new Set(ideaIds)].filter((id) => !existingIds.has(id))

  if (missingIds.length > 0) {
    throw new Error(
      `Unknown idea ID${missingIds.length === 1 ? '' : 's'}: ${missingIds.join(', ')}`,
    )
  }
}

function assertValidConnectionPairs(connections) {
  const selfConnection = connections.find(
    ({ source_id: sourceId, target_id: targetId }) => sourceId === targetId,
  )

  if (selfConnection) {
    throw new Error(
      `An idea cannot connect to itself: ${selfConnection.source_id}`,
    )
  }
}

function toConnectionPair({ source_id: sourceId, target_id: targetId }) {
  return { source: sourceId, target: targetId }
}

function toAgentConnection({ source, target }) {
  return { source_id: source, target_id: target }
}

function getVisibleCanvasBounds(screenToFlowPosition) {
  const canvasElement = document.querySelector('.react-flow')
  if (!canvasElement) return null

  const bounds = canvasElement.getBoundingClientRect()
  const topLeft = screenToFlowPosition({ x: bounds.left, y: bounds.top })
  const bottomRight = screenToFlowPosition({
    x: bounds.right,
    y: bounds.bottom,
  })

  return {
    bottom: bottomRight.y,
    left: topLeft.x,
    right: bottomRight.x,
    top: topLeft.y,
  }
}

function createToolDefinitions({
  getCanvas,
  screenToFlowPosition,
  updateCanvas,
}) {
  return [
    {
      name: 'inspect_canvas',
      description:
        'Inspect the current Visual Thinker ideas and undirected connections. Returns visible canvas bounds for choosing absolute coordinates.',
      inputSchema: getInputSchema(inspectCanvasInputSchema),
      annotations: {
        consequentialHint: false,
        readOnlyHint: true,
        untrustedContentHint: true,
      },
      execute(input) {
        const { cursor, limit } = parseInput(
          'inspect_canvas',
          inspectCanvasInputSchema,
          input,
        )
        const canvas = getCanvas()
        const items = [
          ...canvas.nodes.map((node) => ({
            id: node.id,
            kind: 'idea',
            text: node.data.label,
            x: node.position.x,
            y: node.position.y,
          })),
          ...canvas.edges.map((edge) => ({
            kind: 'connection',
            ...toAgentConnection(edge),
          })),
        ]
        const nextCursor = cursor + limit < items.length ? cursor + limit : null

        return {
          connection_count: canvas.edges.length,
          idea_count: canvas.nodes.length,
          items: items.slice(cursor, cursor + limit),
          next_cursor: nextCursor,
          visible_bounds: getVisibleCanvasBounds(screenToFlowPosition),
        }
      },
    },
    {
      name: 'create_ideas',
      description:
        'Create one or more non-empty ideas at explicit absolute canvas coordinates in one undoable change.',
      inputSchema: getInputSchema(createIdeasInputSchema),
      annotations: mutableAnnotations,
      execute(input) {
        const { ideas } = parseInput('create_ideas', createIdeasInputSchema, input)
        const created = ideas.map(({ text, x, y }, index) => {
          const id = `idea-${crypto.randomUUID()}`
          return {
            id,
            index,
            node: {
              id,
              type: 'idea',
              position: { x, y },
              data: { label: text, autofocus: false },
            },
          }
        })

        updateCanvas((canvas) => ({
          ...canvas,
          nodes: [...canvas.nodes, ...created.map(({ node }) => node)],
        }))

        return {
          created: created.map(({ id, index }) => ({ id, index })),
        }
      },
    },
    {
      name: 'update_ideas',
      description:
        'Update the text or absolute canvas coordinates of one or more existing ideas in one undoable change.',
      inputSchema: getInputSchema(updateIdeasInputSchema),
      annotations: mutableAnnotations,
      execute(input) {
        const { ideas } = parseInput(
          'update_ideas',
          updateIdeasInputSchema,
          input,
        )
        assertUnique(ideas, ({ id }) => id, 'Updated idea IDs')
        const patchesById = new Map(ideas.map((idea) => [idea.id, idea]))

        updateCanvas((canvas) => {
          assertIdeasExist(canvas, ideas.map(({ id }) => id))

          return {
            ...canvas,
            nodes: canvas.nodes.map((node) => {
              const patch = patchesById.get(node.id)
              if (!patch) return node

              return {
                ...node,
                position: {
                  x: patch.x ?? node.position.x,
                  y: patch.y ?? node.position.y,
                },
                data: patch.text === undefined
                  ? node.data
                  : { ...node.data, label: patch.text, autofocus: false },
              }
            }),
          }
        })

        return { updated_idea_ids: ideas.map(({ id }) => id) }
      },
    },
    {
      name: 'connect_ideas',
      description:
        'Create undirected connections between existing ideas. Existing or repeated pairs remain single connections.',
      inputSchema: getInputSchema(connectIdeasInputSchema),
      annotations: mutableAnnotations,
      execute(input) {
        const { connections } = parseInput(
          'connect_ideas',
          connectIdeasInputSchema,
          input,
        )
        assertValidConnectionPairs(connections)
        const requestedPairs = connections.map(toConnectionPair)
        let created = []
        let alreadyConnected = []

        updateCanvas((canvas) => {
          assertIdeasExist(
            canvas,
            requestedPairs.flatMap(({ source, target }) => [source, target]),
          )
          const seenKeys = new Set(canvas.edges.map(getConnectionPairKey))
          const newEdges = []

          for (const pair of requestedPairs) {
            const key = getConnectionPairKey(pair)
            if (seenKeys.has(key)) {
              alreadyConnected.push(toAgentConnection(pair))
              continue
            }

            seenKeys.add(key)
            created.push(toAgentConnection(pair))
            newEdges.push({
              id: `edge-${crypto.randomUUID()}`,
              source: pair.source,
              sourceHandle: null,
              target: pair.target,
              targetHandle: null,
              type: 'default',
            })
          }

          return { ...canvas, edges: [...canvas.edges, ...newEdges] }
        })

        return { already_connected: alreadyConnected, created }
      },
    },
    {
      name: 'disconnect_ideas',
      description:
        'Remove undirected connections between existing ideas in one undoable change.',
      inputSchema: getInputSchema(disconnectIdeasInputSchema),
      annotations: mutableAnnotations,
      execute(input) {
        const { connections } = parseInput(
          'disconnect_ideas',
          disconnectIdeasInputSchema,
          input,
        )
        assertValidConnectionPairs(connections)
        const requestedPairs = connections.map(toConnectionPair)
        const requestedKeys = new Set(requestedPairs.map(getConnectionPairKey))
        let disconnected = []
        let notConnected = []

        updateCanvas((canvas) => {
          assertIdeasExist(
            canvas,
            requestedPairs.flatMap(({ source, target }) => [source, target]),
          )
          const existingKeys = new Set(canvas.edges.map(getConnectionPairKey))
          disconnected = requestedPairs
            .filter((pair) => existingKeys.has(getConnectionPairKey(pair)))
            .map(toAgentConnection)
          notConnected = requestedPairs
            .filter((pair) => !existingKeys.has(getConnectionPairKey(pair)))
            .map(toAgentConnection)

          return {
            ...canvas,
            edges: canvas.edges.filter(
              (edge) => !requestedKeys.has(getConnectionPairKey(edge)),
            ),
          }
        })

        return { disconnected, not_connected: notConnected }
      },
    },
    {
      name: 'delete_ideas',
      description:
        'Delete one or more existing ideas and their incident connections in one undoable change.',
      inputSchema: getInputSchema(deleteIdeasInputSchema),
      annotations: mutableAnnotations,
      execute(input) {
        const { idea_ids: ideaIds } = parseInput(
          'delete_ideas',
          deleteIdeasInputSchema,
          input,
        )
        assertUnique(ideaIds, (id) => id, 'Deleted idea IDs')
        const removedIds = new Set(ideaIds)
        let deletedConnectionCount = 0

        updateCanvas((canvas) => {
          assertIdeasExist(canvas, ideaIds)
          deletedConnectionCount = canvas.edges.filter(
            ({ source, target }) =>
              removedIds.has(source) || removedIds.has(target),
          ).length

          return {
            nodes: canvas.nodes.filter(({ id }) => !removedIds.has(id)),
            edges: canvas.edges.filter(
              ({ source, target }) =>
                !removedIds.has(source) && !removedIds.has(target),
            ),
          }
        })

        return {
          deleted_connection_count: deletedConnectionCount,
          deleted_idea_ids: ideaIds,
        }
      },
    },
  ]
}

export function useWebMCPTools({ getCanvas, screenToFlowPosition, updateCanvas }) {
  useEffect(() => {
    const modelContext = document.modelContext
    if (!modelContext?.registerTool) return undefined

    const controller = new AbortController()
    const tools = createToolDefinitions({
      getCanvas,
      screenToFlowPosition,
      updateCanvas,
    })

    void Promise.all(
      tools.map((tool) =>
        modelContext.registerTool(tool, { signal: controller.signal }),
      ),
    ).catch((error) => {
      if (!controller.signal.aborted) {
        console.warn('Visual Thinker could not register its WebMCP tools.', error)
      }
    })

    return () => controller.abort()
  }, [getCanvas, screenToFlowPosition, updateCanvas])
}
