"use client"

import React, { useRef, useEffect, useState } from 'react';

interface DiseaseOverlayProps {
  imageUrl: string;
  rustContours: number[][];
  scabContours: number[][];
  showRust?: boolean;
  showScab?: boolean;
}

export function DiseaseOverlay({
  imageUrl,
  rustContours,
  scabContours,
  showRust = true,
  showScab = true
}: DiseaseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      // Ajustar canvas
      canvas.width = img.width;
      canvas.height = img.height;
      setDimensions({ width: img.width, height: img.height });

      // Dibujar imagen
      ctx.drawImage(img, 0, 0);

      // Dibujar contornos de roya (naranja)
      if (showRust && rustContours.length > 0) {
        ctx.strokeStyle = 'rgba(255, 140, 0, 0.9)';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(255, 140, 0, 0.3)';

        rustContours.forEach(contour => {
          if (contour.length >= 4) {
            ctx.beginPath();
            ctx.moveTo(contour[0], contour[1]);
            for (let i = 2; i < contour.length; i += 2) {
              ctx.lineTo(contour[i], contour[i + 1]);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        });
      }

      // Dibujar contornos de sarna (púrpura)
      if (showScab && scabContours.length > 0) {
        ctx.strokeStyle = 'rgba(147, 51, 234, 0.9)';
        ctx.lineWidth = 3;
        ctx.fillStyle = 'rgba(147, 51, 234, 0.3)';

        scabContours.forEach(contour => {
          if (contour.length >= 4) {
            ctx.beginPath();
            ctx.moveTo(contour[0], contour[1]);
            for (let i = 2; i < contour.length; i += 2) {
              ctx.lineTo(contour[i], contour[i + 1]);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        });
      }
    };

    img.src = imageUrl;
  }, [imageUrl, rustContours, scabContours, showRust, showScab]);

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg bg-gray-100">
      <canvas
        ref={canvasRef}
        className="w-full h-auto"
      />
      
      {/* Leyenda */}
      <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs p-2 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-3 h-3 bg-orange-500 rounded" />
          <span>Roya (Rust)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded" />
          <span>Sarna (Scab)</span>
        </div>
      </div>

      {/* Indicador de tamaño */}
      {dimensions.width > 0 && (
        <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {dimensions.width} × {dimensions.height}px
        </div>
      )}
    </div>
  );
}
