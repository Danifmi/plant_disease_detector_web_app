'use client';

import { AffectedArea } from '@/types/analysis';

interface DiseaseOverlayProps {
  areas: AffectedArea[];
  diseaseColor: string;
}

export default function DiseaseOverlay({ areas, diseaseColor }: DiseaseOverlayProps) {
  const getSeverityColor = (severity: AffectedArea['severity']) => {
    switch (severity) {
      case 'low':
        return 'border-yellow-400 bg-yellow-400/20';
      case 'medium':
        return 'border-orange-500 bg-orange-500/20';
      case 'high':
        return 'border-red-500 bg-red-500/20';
      default:
        return 'border-gray-400 bg-gray-400/20';
    }
  };

  const getSeverityLabel = (severity: AffectedArea['severity']) => {
    switch (severity) {
      case 'low':
        return 'Leve';
      case 'medium':
        return 'Moderado';
      case 'high':
        return 'Severo';
      default:
        return '';
    }
  };

  return (
    <div className="disease-overlay absolute inset-0 pointer-events-none">
      {areas.map((area, index) => (
        <div
          key={index}
          className={`affected-area ${getSeverityColor(area.severity)}`}
          style={{
            left: `${area.x}%`,
            top: `${area.y}%`,
            width: `${area.width}%`,
            height: `${area.height}%`,
          }}
        >
          {/* Severity label */}
          <span
            className={`
              absolute -top-6 left-1/2 transform -translate-x-1/2
              px-2 py-0.5 rounded text-xs font-medium text-white
              ${area.severity === 'low' ? 'bg-yellow-500' : 
                area.severity === 'medium' ? 'bg-orange-500' : 'bg-red-500'}
            `}
          >
            {getSeverityLabel(area.severity)}
          </span>

          {/* Corner markers */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 rounded-tl border-current" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 rounded-tr border-current" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 rounded-bl border-current" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 rounded-br border-current" />
        </div>
      ))}

      {/* Legend */}
      {areas.length > 0 && (
        <div className="absolute bottom-4 left-4 flex gap-3 bg-black/60 rounded-lg px-3 py-2">
          <div className="flex items-center gap-1.5 text-xs text-white">
            <div className="w-3 h-3 rounded-sm bg-yellow-400" />
            <span>Leve</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white">
            <div className="w-3 h-3 rounded-sm bg-orange-500" />
            <span>Moderado</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white">
            <div className="w-3 h-3 rounded-sm bg-red-500" />
            <span>Severo</span>
          </div>
        </div>
      )}
    </div>
  );
}
