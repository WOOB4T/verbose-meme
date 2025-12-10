export interface ShaderTemplate {
  name: string;
  fragmentShader: string;
  animated: boolean;
}

export const GLSL_COMMON = `
precision highp float;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

vec2 random2(vec2 st) {
  st = vec2(dot(st,vec2(127.1,311.7)), dot(st,vec2(269.5,183.3)));
  return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

float noise(vec2 st) {
  vec2 i = floor(st);
  vec2 f = fract(st);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(dot(random2(i + vec2(0.0,0.0)), f - vec2(0.0,0.0)),
                 dot(random2(i + vec2(1.0,0.0)), f - vec2(1.0,0.0)), u.x),
             mix(dot(random2(i + vec2(0.0,1.0)), f - vec2(0.0,1.0)),
                 dot(random2(i + vec2(1.0,1.0)), f - vec2(1.0,1.0)), u.x), u.y);
}

float fbm(vec2 st, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 0.0;
  for(int i = 0; i < 8; i++) {
    if(i >= octaves) break;
    value += amplitude * noise(st);
    st *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

vec2 rotate2D(vec2 st, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c) * st;
}

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float sdHexagon(vec2 p, float r) {
  const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
  return length(p) * sign(p.y);
}

float sdStar(vec2 p, float r, int n, float m) {
  float an = PI/float(n);
  float en = PI/m;
  vec2 acs = vec2(cos(an), sin(an));
  vec2 ecs = vec2(cos(en), sin(en));
  float bn = mod(atan(p.x, p.y), 2.0*an) - an;
  p = length(p) * vec2(cos(bn), abs(sin(bn)));
  p -= r * acs;
  p += ecs * clamp(-dot(p, ecs), 0.0, r*acs.y/ecs.y);
  return length(p) * sign(p.x);
}

vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TWO_PI * (c * t + d));
}
`;

export const shaderTemplates: ShaderTemplate[] = [
  {
    name: "mandelbrot",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_zoom;
uniform vec2 u_offset;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  float zoom = u_zoom * (1.0 + 0.3 * sin(u_time * 0.5));
  vec2 c = uv * zoom + u_offset;
  vec2 z = vec2(0.0);
  
  float iterations = 0.0;
  const float maxIter = 100.0;
  
  for(float i = 0.0; i < maxIter; i++) {
    z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
    if(length(z) > 2.0) break;
    iterations++;
  }
  
  float t = iterations / maxIter;
  vec3 col = palette(t, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "julia",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec2 u_juliaC;
uniform float u_zoom;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  vec2 z = uv * u_zoom;
  vec2 c = u_juliaC + vec2(cos(u_time * 0.3), sin(u_time * 0.2)) * 0.3;
  
  float iterations = 0.0;
  const float maxIter = 100.0;
  
  for(float i = 0.0; i < maxIter; i++) {
    z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
    if(length(z) > 2.0) break;
    iterations++;
  }
  
  float t = iterations / maxIter;
  vec3 col = palette(t, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "voronoi",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_scale;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv *= u_scale;
  uv += u_time * 0.1;
  
  vec2 i_st = floor(uv);
  vec2 f_st = fract(uv);
  
  float minDist = 1.0;
  vec2 minPoint;
  
  for(int y = -1; y <= 1; y++) {
    for(int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = random2(i_st + neighbor);
      point = 0.5 + 0.5 * sin(u_time + TWO_PI * point);
      vec2 diff = neighbor + point - f_st;
      float dist = length(diff);
      
      if(dist < minDist) {
        minDist = dist;
        minPoint = point;
      }
    }
  }
  
  vec3 col = palette(minDist, u_color1, u_color2, u_color3, vec3(0.0, 0.5, 1.0));
  col *= 1.0 - 0.4 * step(0.98, fract(minDist * 10.0));
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "plasma",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_frequency;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  
  float v = 0.0;
  v += sin((uv.x + u_time) * u_frequency);
  v += sin((uv.y + u_time) * u_frequency);
  v += sin((uv.x + uv.y + u_time) * u_frequency);
  
  vec2 c = uv + vec2(sin(u_time * 0.5), cos(u_time * 0.5));
  v += sin(sqrt(c.x*c.x + c.y*c.y) * u_frequency);
  v *= 0.5;
  
  vec3 col = palette(v, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "tunnel",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_speed;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  
  float t = u_time * u_speed;
  vec2 tuv = vec2(a / PI, 1.0 / r + t);
  
  float pattern = sin(tuv.x * 10.0) * cos(tuv.y * 5.0);
  pattern += fbm(tuv * 3.0, 4);
  
  vec3 col = palette(pattern, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  col *= 1.0 - smoothstep(0.0, 2.0, r);
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "kaleidoscope",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_segments;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  float a = atan(uv.y, uv.x);
  float r = length(uv);
  
  float segmentAngle = TWO_PI / u_segments;
  a = mod(a, segmentAngle);
  a = abs(a - segmentAngle * 0.5);
  
  uv = r * vec2(cos(a), sin(a));
  uv = rotate2D(uv, u_time * 0.5);
  
  float pattern = fbm(uv * 5.0 + u_time, 5);
  pattern += sin(r * 20.0 - u_time * 2.0) * 0.5;
  
  vec3 col = palette(pattern, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "truchet",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_scale;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv *= u_scale;
  
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  
  float n = random(id + floor(u_time));
  if(n < 0.5) gv.x *= -1.0;
  
  vec2 cUv = gv - sign(gv.x + gv.y + 0.001) * 0.5;
  float d = length(cUv);
  
  float mask = smoothstep(0.01, -0.01, abs(d - 0.5) - 0.05);
  
  float t = d + n + u_time * 0.3;
  vec3 col = palette(t, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  col = mix(u_color1 * 0.2, col, mask);
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "sdf_shapes",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_shapeType;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  vec2 st = rotate2D(uv, u_time * 0.5);
  st = fract(st * 3.0) - 0.5;
  
  float d;
  if(u_shapeType < 0.33) {
    d = sdCircle(st, 0.3);
  } else if(u_shapeType < 0.66) {
    d = sdBox(st, vec2(0.25));
  } else {
    d = sdHexagon(st, 0.3);
  }
  
  float pattern = sin(d * 20.0 - u_time * 2.0);
  pattern += fbm(uv * 5.0 + u_time * 0.5, 3);
  
  vec3 col = palette(pattern, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  col = mix(col, u_color1, smoothstep(0.0, 0.01, d));
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "spiral",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_arms;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  float r = length(uv);
  float a = atan(uv.y, uv.x);
  
  float spiral = sin(u_arms * a + r * 20.0 - u_time * 2.0);
  spiral += fbm(vec2(a, r) * 5.0 + u_time, 3);
  
  vec3 col = palette(spiral, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  col *= 1.0 - smoothstep(0.8, 1.5, r);
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "waves",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_frequency;
uniform float u_amplitude;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  
  float wave = sin(uv.x * u_frequency + u_time) * u_amplitude;
  wave += sin(uv.y * u_frequency * 0.7 - u_time * 0.7) * u_amplitude;
  wave += cos((uv.x + uv.y) * u_frequency * 0.5 + u_time * 0.5) * u_amplitude;
  
  float dist = abs(uv.y - 0.5 - wave);
  float line = smoothstep(0.02, 0.0, dist);
  
  float t = uv.x + uv.y + wave;
  vec3 col = palette(t, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  col = mix(col * 0.5, col, line);
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "mandala",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_petals;

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  float a = atan(uv.y, uv.x);
  float r = length(uv);
  
  float pattern = 0.0;
  for(float i = 1.0; i <= 5.0; i++) {
    float petal = sin(u_petals * a + u_time * i * 0.3) * 0.5 + 0.5;
    pattern += petal * exp(-i * r);
  }
  
  pattern += fbm(vec2(a * 2.0, r * 10.0) + u_time * 0.5, 3);
  
  vec3 col = palette(pattern, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "grid_morph",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_scale;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv *= u_scale;
  
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  
  float n = random(id);
  gv = rotate2D(gv, u_time + n * TWO_PI);
  
  float d = sdBox(gv, vec2(0.2 + sin(u_time + n * TWO_PI) * 0.1));
  
  float pattern = sin(d * 15.0 + u_time * 2.0);
  pattern += n;
  
  vec3 col = palette(pattern, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  col = mix(col, u_color2, step(d, 0.0));
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "noise_field",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_octaves;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  
  float n = fbm(uv * 8.0 + u_time * 0.5, int(u_octaves));
  n += fbm(uv * 4.0 - u_time * 0.3, int(u_octaves));
  
  vec3 col = palette(n, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "raymarched_spheres",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float scene(vec3 p) {
  vec3 p1 = p - vec3(sin(u_time) * 0.5, 0.0, 0.0);
  vec3 p2 = p - vec3(cos(u_time) * 0.5, cos(u_time * 0.7) * 0.5, 0.0);
  vec3 p3 = p - vec3(0.0, sin(u_time * 0.5) * 0.5, 0.0);
  
  float d1 = sdSphere(p1, 0.3);
  float d2 = sdSphere(p2, 0.25);
  float d3 = sdSphere(p3, 0.35);
  
  return min(min(d1, d2), d3);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / min(u_resolution.x, u_resolution.y);
  
  vec3 ro = vec3(0.0, 0.0, -2.0);
  vec3 rd = normalize(vec3(uv, 1.0));
  
  float t = 0.0;
  for(int i = 0; i < 64; i++) {
    vec3 p = ro + rd * t;
    float d = scene(p);
    if(d < 0.001) break;
    t += d;
    if(t > 10.0) break;
  }
  
  vec3 col = palette(t * 0.2, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "star_field",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_layers;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  
  vec3 col = vec3(0.0);
  
  for(float i = 0.0; i < 5.0; i++) {
    if(i >= u_layers) break;
    
    float depth = i / u_layers;
    vec2 st = uv + vec2(u_time * (0.1 + depth * 0.2), u_time * (0.05 + depth * 0.1));
    st *= 10.0 * (1.0 + i * 2.0);
    
    vec2 id = floor(st);
    vec2 gv = fract(st) - 0.5;
    
    float n = random(id);
    float size = n * 0.05;
    float star = smoothstep(size, 0.0, length(gv));
    
    vec3 layerCol = palette(n + depth, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
    col += star * layerCol * (1.0 - depth * 0.5);
  }
  
  gl_FragColor = vec4(col, 1.0);
}
`
  },
  {
    name: "interference",
    animated: true,
    fragmentShader: `
uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_sources;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  
  float pattern = 0.0;
  
  for(float i = 0.0; i < 5.0; i++) {
    if(i >= u_sources) break;
    
    float angle = TWO_PI * i / u_sources;
    vec2 source = vec2(cos(angle + u_time), sin(angle + u_time)) * 0.3 + 0.5;
    float dist = length(uv - source);
    pattern += sin(dist * 50.0 - u_time * 2.0) / (dist * 10.0 + 1.0);
  }
  
  vec3 col = palette(pattern, u_color1, u_color2, u_color3, vec3(0.0, 0.33, 0.67));
  
  gl_FragColor = vec4(col, 1.0);
}
`
  }
];

export function getVertexShader(): string {
  return `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;
}
