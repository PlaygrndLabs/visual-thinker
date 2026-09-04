import { z } from 'zod'

const ideaIdSchema = z
  .string()
  .min(1)
  .describe('The exact idea ID returned by inspect_canvas or create_ideas.')
const coordinateSchema = z
  .number()
  .finite()
  .describe('An absolute coordinate in the canvas coordinate system.')
const ideaTextSchema = z
  .string()
  .min(1)
  .describe('The non-empty text displayed by the idea.')

export const inspectCanvasInputSchema = z
  .object({
    cursor: z
      .number()
      .int()
      .nonnegative()
      .default(0)
      .describe('Zero-based item offset from a previous inspect_canvas result.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .default(25)
      .describe('Maximum records to return, from 1 through 50.'),
  })
  .strict()

const createIdeaSchema = z
  .object({
    text: ideaTextSchema,
    x: coordinateSchema,
    y: coordinateSchema,
  })
  .strict()

export const createIdeasInputSchema = z
  .object({
    ideas: z
      .array(createIdeaSchema)
      .min(1)
      .describe('Ideas to create as one undoable canvas change.'),
  })
  .strict()

const updateIdeaSchema = z
  .object({
    id: ideaIdSchema,
    text: ideaTextSchema.optional(),
    x: coordinateSchema.optional(),
    y: coordinateSchema.optional(),
  })
  .strict()
  .refine(
    ({ text, x, y }) => text !== undefined || x !== undefined || y !== undefined,
    { message: 'Provide at least one of text, x, or y.' },
  )
  .describe('An idea ID and at least one text or coordinate change.')

export const updateIdeasInputSchema = z
  .object({
    ideas: z
      .array(updateIdeaSchema)
      .min(1)
      .describe('Idea patches to apply as one undoable canvas change.'),
  })
  .strict()

const connectionSchema = z
  .object({
    source_id: ideaIdSchema.describe('One endpoint idea ID.'),
    target_id: ideaIdSchema.describe('The other endpoint idea ID.'),
  })
  .strict()

const connectionsInputSchema = z
  .object({
    connections: z
      .array(connectionSchema)
      .min(1)
      .describe('Undirected idea pairs to change as one undoable canvas change.'),
  })
  .strict()

export const connectIdeasInputSchema = connectionsInputSchema
export const disconnectIdeasInputSchema = connectionsInputSchema

export const deleteIdeasInputSchema = z
  .object({
    idea_ids: z
      .array(ideaIdSchema)
      .min(1)
      .describe('Ideas to delete as one undoable canvas change.'),
  })
  .strict()
