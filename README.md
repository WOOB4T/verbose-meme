# Infinite Shader Gallery

An endless scroll gallery of procedurally generated GLSL fragment shaders. Each shader is completely unique and visually distinct, creating an alien art gallery experience.

## Features

- **Infinite Scroll**: Automatically generates more shaders as you scroll down
- **30+ Unique Shader Templates**: Including fractals, SDFs, noise functions, domain repetition, color palettes, raymarching, 2D patterns, and more
- **Procedural Generation**: Each shader uses seeded randomness to ensure uniqueness while maintaining consistency
- **Interactive Modal**: Click any thumbnail to view the full animated version
- **Responsive Grid Layout**: Adapts to different screen sizes
- **WebGL Powered**: Real-time shader rendering using WebGL

## Shader Types

The gallery includes diverse shader techniques:

### Fractals & Mathematics
- Mandelbrot Set - Classic fractal with animated zoom
- Julia Set - Complex plane fractals with varying parameters
- Spiral - Multi-armed spiral patterns
- Mandala - Symmetrical petal patterns

### Signed Distance Fields (SDFs)
- SDF Shapes - Circles, boxes, hexagons with distance field effects
- Metaballs - Organic flowing blob patterns
- Geometric Tiles - Rotating tile patterns

### Noise & Organic Patterns
- Voronoi - Cellular patterns with animated centers
- Noise Field - Multi-octave Perlin noise
- Domain Warping - Noise-warped patterns
- Reaction Diffusion - Turing pattern simulation
- Perlin Worms - Flowing organic lines

### Geometric & Tiling
- Truchet Tiles - Randomized curved tile patterns
- Kaleidoscope - Radial symmetry effects
- Hexagonal Grid - Hexagon-based patterns
- Grid Morph - Animated grid transformations
- Paisley Pattern - Decorative drop patterns

### Effects & Phenomena
- Plasma - Multi-wave interference patterns
- Tunnel - Classic demoscene tunnel effect
- Star Field - Multi-layer parallax stars
- Interference - Wave interference patterns
- Electric Field - Charge field visualization
- Aurora - Northern lights effect
- Lava Lamp - Organic blob movement
- Cosmic Dust - Layered space dust effect

### Advanced Techniques
- Optical Illusion - Hypnotic ring and spiral combinations
- Cellular Automata - Conway-style patterns
- Fractal Tree - Recursive branching patterns
- Hypnotic Circles - Concentric animated rings
- Raymarched Spheres - 3D raymarching in 2D

## Color Palettes

10 distinct color palette types:
- Vibrant Rainbow
- Pastel Dream
- Neon Glow
- Deep Ocean
- Sunset Fire
- Toxic Slime
- Purple Haze
- Cyber Pink
- Earth Tones
- Alien Spectrum

Each palette is further randomized per shader for maximum variety.

## Technical Implementation

### Architecture
- **Next.js 16** with App Router
- **React 19** with hooks for state management
- **TypeScript** for type safety
- **Tailwind CSS 4** for styling
- **WebGL** for shader rendering

### Key Components
- `ShaderGallery` - Main gallery with infinite scroll using IntersectionObserver
- `ShaderCanvas` - WebGL canvas component with shader compilation and rendering
- `ShaderModal` - Full-screen modal for animated shader viewing
- `shaderGenerator` - Seeded random shader configuration generator
- `glslTemplates` - Library of 30+ GLSL fragment shader templates

### Shader Generation
Each shader is generated with:
1. A unique ID (sequential)
2. Seeded random number generation for consistency
3. Random template selection from 30+ options
4. Random color palette (10 types)
5. Template-specific parameters (zoom, scale, frequency, etc.)

The seeded randomness ensures the same ID always generates the same shader, while different IDs produce completely unique results.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view the gallery.

## Performance

- Thumbnails render shaders at 400x400 resolution without animation
- Modal renders at 1200x1200 with full animation
- Uses `memo()` to prevent unnecessary re-renders
- WebGL contexts are properly cleaned up on unmount
- Intersection Observer triggers loading 400px before reaching the bottom

## Browser Support

Requires WebGL support. Works best in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT
