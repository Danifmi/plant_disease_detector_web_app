// Componente de subida de imágenes

'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { validateImageFile, createImageUrl } from '@/lib/utils/imageUtils';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageSelect: (file: File, previewUrl: string) => void;
  accept?: string;
  maxSize?: number;
  className?: string;
}

export function ImageUpload({
  onImageSelect,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 10 * 1024 * 1024,
  className
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      // Validar archivo
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setError(validation.error || 'Archivo no válido');
        return;
      }

      // Crear preview y notificar
      const previewUrl = createImageUrl(file);
      setPreview(previewUrl);
      onImageSelect(file, previewUrl);
    },
    [onImageSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        handleFile(file);
      } else {
        setError('Por favor, selecciona un archivo de imagen');
      }
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const clearPreview = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // Mostrar preview si hay imagen seleccionada
  if (preview) {
    return (
      <div className={cn('relative rounded-lg overflow-hidden', className)}>
        <img
          src={preview}
          alt="Preview"
          className="w-full h-full object-contain bg-gray-100"
        />
        <Button
          variant="destructive"
          size="icon"
          className="absolute top-2 right-2"
          onClick={clearPreview}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
          dragOver
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-green-400 hover:bg-gray-50',
          error && 'border-red-300 bg-red-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />

        {error ? (
          <>
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <p className="text-red-600 text-center mb-2">{error}</p>
            <Button variant="outline" size="sm">
              Intentar de nuevo
            </Button>
          </>
        ) : (
          <>
            <div className="p-4 bg-green-100 rounded-full mb-4">
              <Upload className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-medium mb-2">
              {dragOver ? 'Suelta la imagen aquí' : 'Arrastra una imagen'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              o haz clic para seleccionar
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ImageIcon className="h-4 w-4" />
              <span>JPG, PNG, WebP • Máx. 10MB</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
