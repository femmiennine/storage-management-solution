"use client";

import { useState } from 'react';
import { FileDocument } from '@/lib/actions/file.actions';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImagePreviewProps {
  file: FileDocument;
}

export function ImagePreview({ file }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="relative h-full flex flex-col">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button size="sm" variant="secondary" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleRotate}>
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <img
          src={file.fileUrl}
          alt={file.fileName}
          className="max-w-full max-h-full object-contain transition-all duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
        />
      </div>
    </div>
  );
}