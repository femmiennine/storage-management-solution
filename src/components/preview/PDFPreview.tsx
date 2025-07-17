"use client";

import { useState } from 'react';
import { FileDocument } from '@/lib/actions/file.actions';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PDFPreviewProps {
  file: FileDocument;
}

export function PDFPreview({ file }: PDFPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [scale, setScale] = useState(1);

  // For now, we'll use an iframe to display PDFs
  // In a production app, you might use a library like react-pdf
  return (
    <div className="h-full flex flex-col">
      {/* PDF Controls */}
      <div className="border-b p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const page = parseInt(e.target.value);
                if (page > 0 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }}
              className="w-16 h-8 text-center"
              min={1}
              max={totalPages}
            />
            <span className="text-sm text-muted-foreground">
              of {totalPages}
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setScale(prev => Math.max(0.5, prev - 0.25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setScale(prev => Math.min(2, prev + 0.25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        <iframe
          src={`${file.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&page=${currentPage}&zoom=${scale * 100}`}
          className="w-full h-full border-0"
          title={file.fileName}
        />
      </div>
    </div>
  );
}