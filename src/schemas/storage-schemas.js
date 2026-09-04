import { z } from 'zod'

const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
})

const viewportSchema = pointSchema.extend({
  zoom: z.number().finite().positive(),
})

const canvasNodeSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  position: pointSchema,
  data: z
    .object({
      label: z.string(),
      autofocus: z.boolean().optional(),
    })
    .passthrough(),
}).passthrough()

const canvasEdgeSchema = z
  .object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
  })
  .passthrough()

export const canvasSchema = z.object({
  nodes: z.array(canvasNodeSchema),
  edges: z.array(canvasEdgeSchema),
})

export const viewportStateSchema = viewportSchema.extend({
  fitViewport: viewportSchema.nullable(),
  isFitViewActive: z.boolean(),
})
