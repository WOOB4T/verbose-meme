import { shaderTemplates, GLSL_COMMON, getVertexShader } from './glslTemplates';

type UniformValue = number | number[];

export interface ShaderConfig {
  id: number;
  template: string;
  uniforms: Record<string, UniformValue>;
  fragmentShader: string;
  vertexShader: string;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateColorPalette(seed: number): { color1: number[]; color2: number[]; color3: number[] } {
  const r1 = seededRandom(seed * 1.1);
  const r2 = seededRandom(seed * 1.2);
  const r3 = seededRandom(seed * 1.3);
  
  const paletteType = Math.floor(seededRandom(seed * 1.4) * 5);
  
  let color1: number[], color2: number[], color3: number[];
  
  switch(paletteType) {
    case 0: // Vibrant
      color1 = [0.5, 0.5, 0.5];
      color2 = [0.5, 0.5, 0.5];
      color3 = [1.0, 1.0, 1.0];
      break;
    case 1: // Pastel
      color1 = [0.5, 0.5, 0.5];
      color2 = [0.5, 0.5, 0.5];
      color3 = [0.8, 0.8, 0.8];
      break;
    case 2: // Neon
      color1 = [0.5, 0.5, 0.5];
      color2 = [0.5 + r1 * 0.3, 0.5 + r2 * 0.3, 0.5 + r3 * 0.3];
      color3 = [1.0, 1.0, 0.5];
      break;
    case 3: // Deep
      color1 = [0.0, 0.0, 0.0];
      color2 = [0.3 + r1 * 0.3, 0.3 + r2 * 0.3, 0.3 + r3 * 0.3];
      color3 = [0.5, 0.5, 0.5];
      break;
    default: // Custom
      color1 = [r1 * 0.5, r2 * 0.5, r3 * 0.5];
      color2 = [0.3 + r1 * 0.4, 0.3 + r2 * 0.4, 0.3 + r3 * 0.4];
      color3 = [0.5 + r1 * 0.5, 0.5 + r2 * 0.5, 0.5 + r3 * 0.5];
  }
  
  return { color1, color2, color3 };
}

export function generateShader(id: number): ShaderConfig {
  const templateIndex = Math.floor(seededRandom(id * 0.123) * shaderTemplates.length);
  const template = shaderTemplates[templateIndex];
  
  const colors = generateColorPalette(id);
  
  const uniforms: Record<string, UniformValue> = {
    u_resolution: [800, 800],
    u_time: 0,
    u_color1: colors.color1,
    u_color2: colors.color2,
    u_color3: colors.color3,
  };
  
  switch(template.name) {
    case 'mandelbrot':
      uniforms.u_zoom = 2.0 + seededRandom(id * 1.5) * 2.0;
      uniforms.u_offset = [
        -0.5 + seededRandom(id * 1.6) * 0.5,
        seededRandom(id * 1.7) * 0.5 - 0.25
      ];
      break;
      
    case 'julia':
      uniforms.u_juliaC = [
        -0.8 + seededRandom(id * 1.8) * 0.8,
        seededRandom(id * 1.9) * 0.4 - 0.2
      ];
      uniforms.u_zoom = 1.5 + seededRandom(id * 2.0) * 1.5;
      break;
      
    case 'voronoi':
      uniforms.u_scale = 3.0 + seededRandom(id * 2.1) * 7.0;
      break;
      
    case 'plasma':
      uniforms.u_frequency = 5.0 + seededRandom(id * 2.2) * 15.0;
      break;
      
    case 'tunnel':
      uniforms.u_speed = 0.5 + seededRandom(id * 2.3) * 1.5;
      break;
      
    case 'kaleidoscope':
      uniforms.u_segments = Math.floor(4 + seededRandom(id * 2.4) * 8);
      break;
      
    case 'truchet':
      uniforms.u_scale = 5.0 + seededRandom(id * 2.5) * 10.0;
      break;
      
    case 'sdf_shapes':
      uniforms.u_shapeType = seededRandom(id * 2.6);
      break;
      
    case 'spiral':
      uniforms.u_arms = Math.floor(3 + seededRandom(id * 2.7) * 10);
      break;
      
    case 'waves':
      uniforms.u_frequency = 5.0 + seededRandom(id * 2.8) * 15.0;
      uniforms.u_amplitude = 0.1 + seededRandom(id * 2.9) * 0.3;
      break;
      
    case 'mandala':
      uniforms.u_petals = Math.floor(4 + seededRandom(id * 3.0) * 12);
      break;
      
    case 'grid_morph':
      uniforms.u_scale = 3.0 + seededRandom(id * 3.1) * 7.0;
      break;
      
    case 'noise_field':
      uniforms.u_octaves = Math.floor(3 + seededRandom(id * 3.2) * 5);
      break;
      
    case 'star_field':
      uniforms.u_layers = Math.floor(3 + seededRandom(id * 3.3) * 3);
      break;
      
    case 'interference':
      uniforms.u_sources = Math.floor(2 + seededRandom(id * 3.4) * 4);
      break;
  }
  
  const fragmentShaderCode = GLSL_COMMON + template.fragmentShader;
  
  return {
    id,
    template: template.name,
    uniforms,
    fragmentShader: fragmentShaderCode,
    vertexShader: getVertexShader(),
  };
}

export function getShaderBatch(startId: number, count: number): ShaderConfig[] {
  const shaders: ShaderConfig[] = [];
  for (let i = 0; i < count; i++) {
    shaders.push(generateShader(startId + i));
  }
  return shaders;
}
