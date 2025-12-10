import { z } from 'zod';

export const TechniqueSchema = z.enum([
  'RENDERING',
  'SHADER_OPTIMIZATION',
  'GPU_ACCELERATION',
  'ANIMATION',
  'GEOMETRY_PROCESSING',
  'LIGHTING',
  'TEXTURE_OPTIMIZATION',
  'REAL_TIME_RAY_TRACING',
  'VOLUMETRIC_RENDERING',
  'POST_PROCESSING',
  'PERFORMANCE_OPTIMIZATION',
  'NEURAL_RENDERING',
  'PROCEDURAL_GENERATION',
]);

export type Technique = z.infer<typeof TechniqueSchema>;

export const PaperMetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  authors: z.array(z.string()),
  abstract: z.string(),
  pdfUrl: z.string(),
  publishedAt: z.string().datetime(),
  arxivId: z.string(),
  categories: z.array(z.string()),
});

export type PaperMetadata = z.infer<typeof PaperMetadataSchema>;

export const ClassifierOutputSchema = z.object({
  techniqueCategories: z.array(TechniqueSchema).min(1),
  realTimeFeability: z.number().min(0).max(1),
  rationale: z.string(),
});

export type ClassifierOutput = z.infer<typeof ClassifierOutputSchema>;

export const PaperRecordSchema = z.object({
  metadata: PaperMetadataSchema,
  classifier: ClassifierOutputSchema,
});

export type PaperRecord = z.infer<typeof PaperRecordSchema>;

export const PapersIndexSchema = z.object({
  papers: z.array(PaperRecordSchema),
  lastUpdated: z.string().datetime(),
  totalCount: z.number(),
});

export type PapersIndex = z.infer<typeof PapersIndexSchema>;
