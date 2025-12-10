import { PaperMetadata, Technique, ClassifierOutput } from './types';

const TECHNIQUE_KEYWORDS: Record<Technique, string[]> = {
  RENDERING: [
    'rendering',
    'render',
    'rasterization',
    'rasterize',
    'fragment shader',
    'vertex shader',
  ],
  SHADER_OPTIMIZATION: [
    'shader',
    'glsl',
    'hlsl',
    'spirv',
    'shader optimization',
    'shader compilation',
  ],
  GPU_ACCELERATION: [
    'gpu',
    'cuda',
    'opencl',
    'vulkan',
    'directx',
    'graphics pipeline',
    'parallel',
    'acceleration',
  ],
  ANIMATION: [
    'animation',
    'motion',
    'skeletal',
    'keyframe',
    'deformation',
    'rigging',
    'blending',
  ],
  GEOMETRY_PROCESSING: [
    'geometry',
    'mesh',
    'polygon',
    'mesh processing',
    'geometric',
    'tessellation',
    'subdivision',
    'procedural',
  ],
  LIGHTING: [
    'lighting',
    'light',
    'illumination',
    'shadow',
    'global illumination',
    'ambient occlusion',
    'radiosity',
    'photorealistic',
  ],
  TEXTURE_OPTIMIZATION: [
    'texture',
    'texel',
    'compression',
    'mipmap',
    'anisotropic',
    'filtering',
    'sampler',
    'atlas',
  ],
  REAL_TIME_RAY_TRACING: [
    'ray tracing',
    'ray casting',
    'path tracing',
    'ray traversal',
    'bvh',
    'acceleration structure',
    'rtx',
    'rt core',
  ],
  VOLUMETRIC_RENDERING: [
    'volumetric',
    'volume',
    'voxel',
    'smoke',
    'fog',
    'fluids',
    'particles',
    'cloud',
  ],
  POST_PROCESSING: [
    'post-processing',
    'post processing',
    'postprocessing',
    'bloom',
    'depth of field',
    'motion blur',
    'lens flare',
    'tone mapping',
  ],
  PERFORMANCE_OPTIMIZATION: [
    'performance',
    'optimization',
    'efficient',
    'fast',
    'interactive',
    'real-time',
    'frame rate',
    'latency',
  ],
  NEURAL_RENDERING: [
    'neural',
    'neural network',
    'deep learning',
    'neural rendering',
    'nerf',
    'machine learning',
    'ai',
    'learned',
  ],
  PROCEDURAL_GENERATION: [
    'procedural',
    'generation',
    'generated',
    'algorithm',
    'noise',
    'fractal',
    'perlin',
    'simplex',
  ],
};

const WEBGL_RELEVANT_KEYWORDS = [
  'webgl',
  'web graphics',
  'browser',
  'javascript',
  'threejs',
  'babylon',
  'wasm',
  'webassembly',
  'interactive',
  'real-time',
  'realtime',
];

export function classifyPaper(paper: PaperMetadata): ClassifierOutput {
  const text = `${paper.title} ${paper.abstract}`.toLowerCase();

  const detectedTechniques = detectTechniques(text);
  const webglRelevanceScore = calculateWebglRelevance(text);
  const rationale = generateRationale(paper, detectedTechniques);

  return {
    techniqueCategories: detectedTechniques.length > 0
      ? detectedTechniques
      : ['RENDERING'],
    realTimeFeability: webglRelevanceScore,
    rationale,
  };
}

function detectTechniques(text: string): Technique[] {
  const scores: Record<Technique, number> = {
    RENDERING: 0,
    SHADER_OPTIMIZATION: 0,
    GPU_ACCELERATION: 0,
    ANIMATION: 0,
    GEOMETRY_PROCESSING: 0,
    LIGHTING: 0,
    TEXTURE_OPTIMIZATION: 0,
    REAL_TIME_RAY_TRACING: 0,
    VOLUMETRIC_RENDERING: 0,
    POST_PROCESSING: 0,
    PERFORMANCE_OPTIMIZATION: 0,
    NEURAL_RENDERING: 0,
    PROCEDURAL_GENERATION: 0,
  };

  for (const [technique, keywords] of Object.entries(TECHNIQUE_KEYWORDS)) {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        scores[technique as Technique] += matches.length;
      }
    }
  }

  // Sort by score and return top techniques
  const sortedTechniques = Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([technique]) => technique as Technique);

  return sortedTechniques.length > 0 ? sortedTechniques : ['RENDERING'];
}

function calculateWebglRelevance(text: string): number {
  let score = 0.3; // Base score for any graphics paper

  // Check for explicit WebGL/web mentions
  for (const keyword of WEBGL_RELEVANT_KEYWORDS) {
    if (text.includes(keyword)) {
      score += 0.15;
    }
  }

  // Check if it mentions real-time/interactive capabilities
  if (
    text.includes('real-time') ||
    text.includes('realtime') ||
    text.includes('interactive') ||
    text.includes('interactive rendering')
  ) {
    score += 0.15;
  }

  // Check for performance-focused papers
  if (
    text.includes('optimization') ||
    text.includes('efficient') ||
    text.includes('fast algorithm') ||
    text.includes('performance')
  ) {
    score += 0.1;
  }

  // Check for GPU-centric approaches
  if (
    text.includes('gpu') ||
    text.includes('shader') ||
    text.includes('parallel')
  ) {
    score += 0.15;
  }

  // Reduce score for research-heavy or offline techniques
  if (
    text.includes('offline') ||
    text.includes('preprocessing') ||
    text.includes('monte carlo') ||
    text.includes('photorealistic') ||
    text.includes('high-quality rendering')
  ) {
    score -= 0.2;
  }

  // Boost for specific compatible techniques
  if (
    text.includes('procedural') ||
    text.includes('animation') ||
    text.includes('geometry processing')
  ) {
    score += 0.1;
  }

  return Math.max(0, Math.min(1, score));
}

function generateRationale(
  paper: PaperMetadata,
  techniques: Technique[]
): string {
  const techniqueStr = techniques.slice(0, 3).join(', ');

  if (techniques.includes('REAL_TIME_RAY_TRACING')) {
    return `Focuses on ${techniqueStr}. Real-time ray tracing techniques with modern GPU support are implementable in WebGL-based projects.`;
  }

  if (techniques.includes('NEURAL_RENDERING')) {
    return `Addresses ${techniqueStr}. Neural rendering approaches can be adapted for real-time use via WebAssembly and GPU compute.`;
  }

  if (
    techniques.includes('SHADER_OPTIMIZATION') ||
    techniques.includes('GPU_ACCELERATION')
  ) {
    return `Focuses on ${techniqueStr}. GPU-optimized techniques are directly applicable to WebGL implementations.`;
  }

  if (techniques.includes('ANIMATION') || techniques.includes('GEOMETRY_PROCESSING')) {
    return `Covers ${techniqueStr}. These techniques integrate well with WebGL rendering pipelines.`;
  }

  return `Addresses ${techniqueStr}. Relevant for real-time graphics implementations in modern web environments.`;
}
