'use client';

import { Camera, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraControlsProps {
  isReady: boolean;
  isLoading: boolean;
  onCapture: () => void;
  onStart: () => void;
}

export default function CameraControls({
  isReady,
  isLoading,
  onCapture,
  onStart,
}: CameraControlsProps) {
  if (!isReady && !isLoading) {
    return (
      <Button
        onClick={onStart}
        className="w-full gap-2"
        size="lg"
      >
        <Camera className="w-5 h-5" />
        Iniciar cámara
      </Button>
    );
  }

  if (isLoading) {
    return (
      <Button
        disabled
        className="w-full gap-2"
        size="lg"
      >
        <Loader2 className="w-5 h-5 animate-spin" />
        Cargando cámara...
      </Button>
    );
  }

  return (
    <div className="flex justify-center">
      <button
        onClick={onCapture}
        className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus:outline-none focus:ring-4 focus:ring-green-500/50"
      >
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
          <Camera className="w-8 h-8 text-white" />
        </div>
      </button>
    </div>
  );
}
