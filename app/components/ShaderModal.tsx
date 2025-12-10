'use client';

import { useEffect } from 'react';
import { ShaderCanvas } from './ShaderCanvas';
import { ShaderConfig } from '../lib/shaderGenerator';

interface ShaderModalProps {
  shader: ShaderConfig | null;
  onClose: () => void;
}

export function ShaderModal({ shader, onClose }: ShaderModalProps) {
  useEffect(() => {
    if (!shader) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [shader, onClose]);

  if (!shader) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-[90vw] h-[90vh] max-w-[1200px] max-h-[1200px] bg-black rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors flex items-center justify-center text-white text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        
        <div className="w-full h-full">
          <ShaderCanvas
            shader={shader}
            width={1200}
            height={1200}
            animated={true}
          />
        </div>

        <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-70">Shader #{shader.id}</p>
              <p className="font-mono text-sm">{shader.template}</p>
            </div>
            <div className="text-xs opacity-50">
              <p>Press ESC or click outside to close</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
