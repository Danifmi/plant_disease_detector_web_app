'use client';

import { useState, useCallback, DragEvent } from 'react';
import { Upload, Image, X } from 'lucide-react';

interface DragDropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  className?: string;
}

export default function DragDropZone({
  onFileSelect,
  accept = 'image/*',
  maxSize = 10,
  className = '',
}: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      setError(null);

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecciona un archivo de imagen.');
        return false;
      }

      // Check file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSize) {
        setError(`El archivo es demasiado grande. Máximo: ${maxSize}MB`);
        return false;
      }

      return true;
    },
    [maxSize]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        onFileSelect(file);
      }
    },
    [validateFile, onFileSelect]
  );

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  return (
    <div className={className}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          drop-zone relative cursor-pointer
          ${isDragging ? 'active border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center py-8">
          <div
            className={`
              w-16 h-16 rounded-full flex items-center justify-center mb-4
              ${isDragging ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}
            `}
          >
            {isDragging ? (
              <Image className="w-8 h-8" />
            ) : (
              <Upload className="w-8 h-8" />
            )}
          </div>

          <p className="text-gray-700 font-medium mb-1">
            {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen aquí'}
          </p>
          <p className="text-sm text-gray-500 mb-4">o haz clic para seleccionar</p>

          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>PNG, JPG, WEBP</span>
            <span>•</span>
            <span>Máx. {maxSize}MB</span>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
