'use client';

interface ConfidenceBarProps {
  label: string;
  value: number;
  color: string;
  isMain?: boolean;
}

export default function ConfidenceBar({
  label,
  value,
  color,
  isMain = false,
}: ConfidenceBarProps) {
  const percentage = value * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm ${isMain ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
          {label}
          {isMain && (
            <span className="ml-2 text-xs font-normal text-green-600">
              ← Resultado
            </span>
          )}
        </span>
        <span className={`text-sm ${isMain ? 'font-bold' : 'font-medium'}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      
      <div className="confidence-bar">
        <div
          className="confidence-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            opacity: isMain ? 1 : 0.6,
          }}
        />
      </div>
    </div>
  );
}
