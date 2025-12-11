'use client';

import { useEffect, useRef, memo } from 'react';
import { ShaderConfig } from '../lib/shaderGenerator';

interface ShaderCanvasProps {
  shader: ShaderConfig;
  width: number;
  height: number;
  animated?: boolean;
  onClick?: () => void;
}

function ShaderCanvasComponent({ shader, width, height, animated = false, onClick }: ShaderCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    glRef.current = gl;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, shader.vertexShader);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, shader.fragmentShader);

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders');
      return;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      console.error('Failed to create program');
      return;
    }

    programRef.current = program;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    function render() {
      if (!gl || !programRef.current) return;

      gl.viewport(0, 0, canvas!.width, canvas!.height);
      gl.useProgram(programRef.current);

      const resolutionLocation = gl.getUniformLocation(programRef.current, 'u_resolution');
      if (resolutionLocation) {
        gl.uniform2f(resolutionLocation, canvas!.width, canvas!.height);
      }

      const timeLocation = gl.getUniformLocation(programRef.current, 'u_time');
      if (timeLocation) {
        const elapsed = animated ? (Date.now() - startTimeRef.current) / 1000 : 0;
        gl.uniform1f(timeLocation, elapsed);
      }

      for (const [key, value] of Object.entries(shader.uniforms)) {
        if (key === 'u_resolution' || key === 'u_time') continue;
        
        const location = gl.getUniformLocation(programRef.current, key);
        if (!location) continue;

        if (Array.isArray(value)) {
          if (value.length === 2) {
            gl.uniform2f(location, value[0], value[1]);
          } else if (value.length === 3) {
            gl.uniform3f(location, value[0], value[1], value[2]);
          }
        } else if (typeof value === 'number') {
          gl.uniform1f(location, value);
        }
      }

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      if (animated) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    }

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (gl && programRef.current) {
        gl.deleteProgram(programRef.current);
      }
    };
  }, [shader, animated]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={onClick ? 'cursor-pointer' : ''}
      onClick={onClick}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export const ShaderCanvas = memo(ShaderCanvasComponent);
