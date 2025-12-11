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
  const r4 = seededRandom(seed * 1.4);
  const r5 = seededRandom(seed * 1.5);
  const r6 = seededRandom(seed * 1.6);
  
  const paletteType = Math.floor(seededRandom(seed * 1.7) * 10);
  
  let color1: number[], color2: number[], color3: number[];
  
  switch(paletteType) {
    case 0: // Vibrant Rainbow
      color1 = [0.5, 0.5, 0.5];
      color2 = [0.5, 0.5, 0.5];
      color3 = [1.0, 1.0, 1.0];
      break;
    case 1: // Pastel Dream
      color1 = [0.5, 0.5, 0.5];
      color2 = [0.5, 0.5, 0.5];
      color3 = [0.8 + r1 * 0.2, 0.8 + r2 * 0.2, 0.8 + r3 * 0.2];
      break;
    case 2: // Neon Glow
      color1 = [0.5, 0.5, 0.5];
      color2 = [0.5 + r1 * 0.3, 0.5 + r2 * 0.3, 0.5 + r3 * 0.3];
      color3 = [1.0, 1.0, 0.5 + r4 * 0.5];
      break;
    case 3: // Deep Ocean
      color1 = [0.0, 0.1 * r1, 0.2 * r2];
      color2 = [0.1 + r1 * 0.2, 0.3 + r2 * 0.2, 0.5 + r3 * 0.3];
      color3 = [0.3, 0.6, 0.8];
      break;
    case 4: // Sunset Fire
      color1 = [0.5, 0.2, 0.0];
      color2 = [0.5, 0.3 + r1 * 0.2, 0.1];
      color3 = [1.0, 0.5 + r2 * 0.3, 0.2 + r3 * 0.3];
      break;
    case 5: // Toxic Slime
      color1 = [0.2 * r1, 0.5, 0.1 * r2];
      color2 = [0.3 + r3 * 0.2, 0.5, 0.2 + r4 * 0.2];
      color3 = [0.5 + r5 * 0.3, 0.9, 0.3 + r6 * 0.3];
      break;
    case 6: // Purple Haze
      color1 = [0.3, 0.0, 0.3];
      color2 = [0.4 + r1 * 0.2, 0.2 * r2, 0.5 + r3 * 0.3];
      color3 = [0.6 + r4 * 0.3, 0.3 + r5 * 0.3, 0.8 + r6 * 0.2];
      break;
    case 7: // Cyber Pink
      color1 = [0.5, 0.1 * r1, 0.4];
      color2 = [0.5 + r2 * 0.2, 0.2 + r3 * 0.2, 0.5 + r4 * 0.2];
      color3 = [1.0, 0.2 + r5 * 0.3, 0.8 + r6 * 0.2];
      break;
    case 8: // Earth Tones
      color1 = [0.3 + r1 * 0.2, 0.2 + r2 * 0.1, 0.1];
      color2 = [0.4 + r3 * 0.2, 0.3 + r4 * 0.2, 0.2 + r5 * 0.2];
      color3 = [0.6 + r1 * 0.2, 0.5 + r2 * 0.2, 0.3 + r3 * 0.2];
      break;
    default: // Alien Spectrum
      color1 = [r1 * 0.5, r2 * 0.5, r3 * 0.5];
      color2 = [0.3 + r4 * 0.5, 0.3 + r5 * 0.5, 0.3 + r6 * 0.5];
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
      
    case 'raymarched_spheres':
      // Uses default uniforms (colors) - no special parameters needed
      break;
      
    case 'hexagonal_grid':
      uniforms.u_scale = 5.0 + seededRandom(id * 3.5) * 10.0;
      break;
      
    case 'domain_warping':
      uniforms.u_warpAmount = 0.1 + seededRandom(id * 3.6) * 0.4;
      break;
      
    case 'metaballs':
      uniforms.u_ballCount = Math.floor(3 + seededRandom(id * 3.7) * 5);
      break;
      
    case 'reaction_diffusion':
      uniforms.u_complexity = 0.5 + seededRandom(id * 3.8) * 1.5;
      break;
      
    case 'optical_illusion':
      uniforms.u_rings = 10.0 + seededRandom(id * 3.9) * 30.0;
      break;
      
    case 'cellular_automata':
      uniforms.u_scale = 5.0 + seededRandom(id * 4.0) * 15.0;
      break;
      
    case 'perlin_worms':
      uniforms.u_thickness = 0.05 + seededRandom(id * 4.1) * 0.15;
      break;
      
    case 'fractal_tree':
      uniforms.u_branches = 3.0 + seededRandom(id * 4.2) * 10.0;
      break;
      
    case 'hypnotic_circles':
      uniforms.u_circleCount = Math.floor(5 + seededRandom(id * 4.3) * 10);
      break;
      
    case 'lava_lamp':
      uniforms.u_blobSize = 0.03 + seededRandom(id * 4.4) * 0.07;
      break;
      
    case 'electric_field':
      uniforms.u_charges = Math.floor(3 + seededRandom(id * 4.5) * 5);
      break;
      
    case 'paisley_pattern':
      uniforms.u_scale = 3.0 + seededRandom(id * 4.6) * 7.0;
      break;
      
    case 'aurora':
      uniforms.u_waves = Math.floor(3 + seededRandom(id * 4.7) * 5);
      break;
      
    case 'geometric_tiles':
      uniforms.u_scale = 5.0 + seededRandom(id * 4.8) * 10.0;
      break;
      
    case 'cosmic_dust':
      uniforms.u_density = 2.0 + seededRandom(id * 4.9) * 5.0;
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
