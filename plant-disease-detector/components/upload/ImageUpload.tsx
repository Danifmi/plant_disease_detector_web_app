"use client"

import React, { useCallback, useState } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImageSelect: (imageData: string) => void;
}

export function ImageUpload({ onImageSelect }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona una imagen válida');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleConfirm = () => {
    if (preview) {
      onImageSelect(preview);
    }
  };

  const handleClear = () => {
    setPreview(null);
  };

  if (preview) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-lg overflow-hidden bg-gray-100">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-auto max-h-[400px] object-contain mx-auto"
          />
          <Button
            variant="destructive"
            size="icon"
            onClick={handleClear}
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleClear} className="flex-1">
            Cambiar imagen
          </Button>
          <Button onClick={handleConfirm} className="flex-1">
            Analizar imagen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "relative border-2 border-dashed rounded-lg p-8 text-center transition-colors",
        isDragging 
          ? "border-green-500 bg-green-50" 
          : "border-gray-300 hover:border-gray-400"
      )}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="space-y-4">
        <div className={cn(
          "w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors",
          isDragging ? "bg-green-100" : "bg-gray-100"
        )}>
          {isDragging ? (
            <ImageIcon className="h-8 w-8 text-green-600" />
          ) : (
            <Upload className="h-8 w-8 text-gray-400" />
          )}
        </div>
        
        <div>
          <p className="text-lg font-medium text-gray-700">
            {isDragging ? "Suelta la imagen aquí" : "Arrastra una imagen aquí"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            o haz clic para seleccionar
          </p>
        </div>
        
        <p className="text-xs text-gray-400">
          Formatos soportados: JPG, PNG, WEBP
        </p>
      </div>
    </div>
  );
}
