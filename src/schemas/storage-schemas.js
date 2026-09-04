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

export const experienceLevelSchema = z.enum([
  'not-experienced-yet',
  'tried-once',
  'may-know-it',
  'knows-it',
])

const experienceRecordV1Schema = z.object({
  expLevel: experienceLevelSchema,
  lastUsedAt: z.number().int().nonnegative().nullable(),
  practiceStrength: z.number().int().min(0).max(4),
  currentBoutUseCount: z.number().int().min(0).max(8),
  retentionStrength: z.number().int().min(0).max(6),
  spacedReturnCount: z.number().int().min(0).max(3),
  longestSuccessfulGapMs: z.number().int().nonnegative(),
})

export const experiencesV1Schema = z.object({
  'canvas-scroll-zoom': experienceRecordV1Schema,
  'canvas-pan': experienceRecordV1Schema,
  'create-node-by-double-click': experienceRecordV1Schema,
})
