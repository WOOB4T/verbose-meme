'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ShaderCanvas } from './ShaderCanvas';
import { ShaderModal } from './ShaderModal';
import { getShaderBatch, ShaderConfig } from '../lib/shaderGenerator';

const BATCH_SIZE = 12;
const INITIAL_COUNT = 24;

export function ShaderGallery() {
  const [shaders, setShaders] = useState<ShaderConfig[]>(() => {
    const initialShaders = getShaderBatch(0, INITIAL_COUNT);
    return initialShaders;
  });
  const [selectedShader, setSelectedShader] = useState<ShaderConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(INITIAL_COUNT);

  const loadMoreShaders = useCallback(() => {
    if (isLoading) return;

    setIsLoading(true);
    
    setTimeout(() => {
      const newShaders = getShaderBatch(nextIdRef.current, BATCH_SIZE);
      nextIdRef.current += BATCH_SIZE;
      
      setShaders((prev) => [...prev, ...newShaders]);
      setIsLoading(false);
    }, 100);
  }, [isLoading]);

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreShaders();
        }
      },
      {
        rootMargin: '400px',
      }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadMoreShaders]);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-black/30 border-b border-white/10">
          <div className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Infinite Shader Gallery
              </span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-400">
              A procedurally generated collection of GLSL fragment shaders. Click any shader to view it animated.
            </p>
          </div>
        </header>

        <main className="max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            {shaders.map((shader) => (
              <div
                key={shader.id}
                className="group relative aspect-square bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:scale-[1.02]"
              >
                <div className="absolute inset-0">
                  <ShaderCanvas
                    shader={shader}
                    width={400}
                    height={400}
                    animated={false}
                    onClick={() => setSelectedShader(shader)}
                  />
                </div>
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-xs font-mono opacity-90">
                      #{shader.id}
                    </p>
                    <p className="text-white/70 text-xs mt-1">
                      {shader.template}
                    </p>
                  </div>
                </div>

                <div className="absolute inset-0 ring-1 ring-white/10 rounded-lg pointer-events-none group-hover:ring-purple-400/50 group-hover:ring-2 transition-all duration-300" />
              </div>
            ))}
          </div>

          <div
            ref={sentinelRef}
            className="flex justify-center items-center py-12"
          >
            {isLoading && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-gray-400 text-sm">Generating more shaders...</p>
              </div>
            )}
          </div>
        </main>
      </div>

      <ShaderModal
        shader={selectedShader}
        onClose={() => setSelectedShader(null)}
      />
    </>
  );
}
