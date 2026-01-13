'use client';

import { RefObject } from 'react';
import { Loader2 } from 'lucide-react';

interface CameraPreviewProps {
  videoRef: RefObject<HTMLVideoElement>;
  isLoading: boolean;
  isReady: boolean;
}

export default function CameraPreview({ videoRef, isLoading, isReady }: CameraPreviewProps) {
  return (
    <div className="relative w-full h-full bg-gray-900 rounded-2xl overflow-hidden">
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
          <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-3" />
          <p className="text-white text-sm">Iniciando cámara...</p>
        </div>
      )}

      {/* Not ready state */}
      {!isLoading && !isReady && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-3">
            <svg
              className="w-8 h-8 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <p className="text-gray-400 text-sm">Cámara no activa</p>
        </div>
      )}

      {/* Focus guide overlay */}
      {isReady && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Center guide */}
          <div className="absolute inset-8 border-2 border-white/30 rounded-xl" />
          
          {/* Center crosshair */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-8 h-8 border-2 border-green-400 rounded-full opacity-50" />
          </div>

          {/* Instruction text */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/60 rounded-full">
            <p className="text-white text-xs font-medium">
              Centra la hoja en el marco
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
