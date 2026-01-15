/**
 * SegmentationViewer Component
 * Visualiza los resultados de segmentación con overlay interactivo
 */

'use client';

import { useState } from 'react';
import { SegmentationResult, SegmentationUtils } from '@/hooks/useSegmentation';

interface SegmentationViewerProps {
  originalImage: string;
  segmentationResult: SegmentationResult;
  className?: string;
}

type ViewMode = 'original' | 'overlay' | 'rust' | 'scab' | 'healthy' | 'split';

export default function SegmentationViewer({
  originalImage,
  segmentationResult,
  className = ''
}: SegmentationViewerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('overlay');
  const [showContours, setShowContours] = useState(true);

  const { masks, overlayImage, percentages, contours, processingTime } = segmentationResult;
  const formattedPercentages = SegmentationUtils.formatPercentages(percentages);
  const overallSeverity = SegmentationUtils.calculateOverallSeverity(percentages);

  const getSeverityBadgeColor = () => {
    const colors = {
      healthy: 'bg-green-500',
      mild: 'bg-yellow-500',
      moderate: 'bg-orange-500',
      severe: 'bg-red-500'
    };
    return colors[overallSeverity];
  };

  const getSeverityLabel = () => {
    const labels = {
      healthy: 'Saludable',
      mild: 'Leve',
      moderate: 'Moderado',
      severe: 'Severo'
    };
    return labels[overallSeverity];
  };

  const getCurrentImage = (): string => {
    switch (viewMode) {
      case 'original':
        return originalImage;
      case 'overlay':
        return overlayImage || originalImage;
      case 'rust':
        return masks.rust || originalImage;
      case 'scab':
        return masks.scab || originalImage;
      case 'healthy':
        return masks.healthy || originalImage;
      default:
        return originalImage;
    }
  };

  return (
    <div className={`segmentation-viewer ${className}`}>
      {/* Header con estadísticas */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Análisis de Segmentación</h3>
          <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getSeverityBadgeColor()}`}>
            {getSeverityLabel()}
          </span>
        </div>
        
        {/* Barras de progreso para porcentajes */}
        <div className="space-y-2">
          <PercentageBar 
            label="Saludable" 
            value={percentages.healthy} 
            color="bg-green-500" 
          />
          <PercentageBar 
            label="Roya" 
            value={percentages.rust} 
            color="bg-orange-500" 
          />
          <PercentageBar 
            label="Sarna" 
            value={percentages.scab} 
            color="bg-amber-800" 
          />
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          Procesado en {processingTime}ms
        </div>
      </div>

      {/* Selector de vista */}
      <div className="flex flex-wrap gap-2 mb-4">
        <ViewModeButton 
          active={viewMode === 'original'} 
          onClick={() => setViewMode('original')}
        >
          Original
        </ViewModeButton>
        <ViewModeButton 
          active={viewMode === 'overlay'} 
          onClick={() => setViewMode('overlay')}
        >
          Con Contornos
        </ViewModeButton>
        <ViewModeButton 
          active={viewMode === 'rust'} 
          onClick={() => setViewMode('rust')}
          disabled={!masks.rust}
        >
          Máscara Roya
        </ViewModeButton>
        <ViewModeButton 
          active={viewMode === 'scab'} 
          onClick={() => setViewMode('scab')}
          disabled={!masks.scab}
        >
          Máscara Sarna
        </ViewModeButton>
        <ViewModeButton 
          active={viewMode === 'healthy'} 
          onClick={() => setViewMode('healthy')}
          disabled={!masks.healthy}
        >
          Áreas Sanas
        </ViewModeButton>
        <ViewModeButton 
          active={viewMode === 'split'} 
          onClick={() => setViewMode('split')}
        >
          Comparación
        </ViewModeButton>
      </div>

      {/* Visualización de imagen */}
      <div className="relative rounded-lg overflow-hidden bg-black">
        {viewMode === 'split' ? (
          <div className="grid grid-cols-2 gap-1">
            <div className="relative">
              <img 
                src={originalImage} 
                alt="Original" 
                className="w-full h-auto"
              />
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Original
              </span>
            </div>
            <div className="relative">
              <img 
                src={overlayImage || originalImage} 
                alt="Segmentado" 
                className="w-full h-auto"
              />
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Segmentado
              </span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img 
              src={getCurrentImage()} 
              alt={`Vista: ${viewMode}`}
              className="w-full h-auto"
            />
            
            {/* Overlay de contornos interactivos */}
            {showContours && viewMode === 'overlay' && (
              <ContourOverlay 
                contours={contours} 
                imageWidth={800} // Ajustar según la imagen real
                imageHeight={600}
              />
            )}
          </div>
        )}
      </div>

      {/* Toggle para contornos */}
      {viewMode === 'overlay' && (
        <div className="mt-3 flex items-center gap-2">
          <input
            type="checkbox"
            id="showContours"
            checked={showContours}
            onChange={(e) => setShowContours(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="showContours" className="text-sm text-gray-600">
            Mostrar información de contornos
          </label>
        </div>
      )}

      {/* Leyenda */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Leyenda</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span>Roya (Rust)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-amber-800 rounded" />
            <span>Sarna (Scab)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <span>Área Saludable</span>
          </div>
        </div>
      </div>

      {/* Detalles de contornos */}
      {(contours.rust.length > 0 || contours.scab.length > 0) && (
        <ContourDetails contours={contours} />
      )}
    </div>
  );
}

// Componente para barra de porcentaje
function PercentageBar({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: number; 
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-20">{label}</span>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className="text-sm w-12 text-right">{value.toFixed(1)}%</span>
    </div>
  );
}

// Botón de modo de vista
function ViewModeButton({ 
  children, 
  active, 
  onClick, 
  disabled = false 
}: { 
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1.5 text-sm rounded-md transition-colors
        ${active 
          ? 'bg-blue-600 text-white' 
          : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {children}
    </button>
  );
}

// Overlay de contornos
function ContourOverlay({ 
  contours, 
  imageWidth, 
  imageHeight 
}: { 
  contours: SegmentationResult['contours'];
  imageWidth: number;
  imageHeight: number;
}) {
  const allContours = [
    ...contours.rust.map(c => ({ ...c, type: 'rust' as const })),
    ...contours.scab.map(c => ({ ...c, type: 'scab' as const }))
  ];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {allContours.map((contour, index) => {
        const { boundingBox, severity, type } = contour;
        const borderColor = type === 'rust' ? 'border-orange-500' : 'border-amber-800';
        const bgColor = severity === 'high' ? 'bg-red-500/20' : severity === 'medium' ? 'bg-orange-500/20' : 'bg-yellow-500/20';
        
        // Calcular posición relativa
        const left = (boundingBox.x / imageWidth) * 100;
        const top = (boundingBox.y / imageHeight) * 100;
        const width = (boundingBox.width / imageWidth) * 100;
        const height = (boundingBox.height / imageHeight) * 100;
        
        return (
          <div
            key={index}
            className={`absolute border-2 ${borderColor} ${bgColor} rounded`}
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: `${width}%`,
              height: `${height}%`
            }}
          >
            <span className={`
              absolute -top-5 left-0 text-xs px-1 rounded
              ${type === 'rust' ? 'bg-orange-500' : 'bg-amber-800'} text-white
            `}>
              {severity}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Detalles de contornos
function ContourDetails({ 
  contours 
}: { 
  contours: SegmentationResult['contours'];
}) {
  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <h4 className="text-sm font-medium mb-3">Áreas Afectadas Detectadas</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contours.rust.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-orange-600 mb-2">
              Roya ({contours.rust.length} áreas)
            </h5>
            <div className="space-y-1 text-xs">
              {contours.rust.slice(0, 5).map((c, i) => (
                <div key={i} className="flex justify-between">
                  <span>Área {i + 1}: {c.area.toFixed(0)}px²</span>
                  <span className={`
                    px-1.5 rounded
                    ${c.severity === 'high' ? 'bg-red-200 text-red-800' : 
                      c.severity === 'medium' ? 'bg-orange-200 text-orange-800' : 
                      'bg-yellow-200 text-yellow-800'}
                  `}>
                    {c.severity}
                  </span>
                </div>
              ))}
              {contours.rust.length > 5 && (
                <div className="text-gray-500">
                  +{contours.rust.length - 5} más...
                </div>
              )}
            </div>
          </div>
        )}
        
        {contours.scab.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-amber-800 mb-2">
              Sarna ({contours.scab.length} áreas)
            </h5>
            <div className="space-y-1 text-xs">
              {contours.scab.slice(0, 5).map((c, i) => (
                <div key={i} className="flex justify-between">
                  <span>Área {i + 1}: {c.area.toFixed(0)}px²</span>
                  <span className={`
                    px-1.5 rounded
                    ${c.severity === 'high' ? 'bg-red-200 text-red-800' : 
                      c.severity === 'medium' ? 'bg-orange-200 text-orange-800' : 
                      'bg-yellow-200 text-yellow-800'}
                  `}>
                    {c.severity}
                  </span>
                </div>
              ))}
              {contours.scab.length > 5 && (
                <div className="text-gray-500">
                  +{contours.scab.length - 5} más...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}