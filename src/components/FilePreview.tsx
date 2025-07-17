"use client";

import { useState } from 'react';
import { FileDocument } from '@/lib/actions/file.actions';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Download, 
  Maximize2, 
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Share2
} from 'lucide-react';
import { PDFPreview } from './preview/PDFPreview';
import { VideoPreview } from './preview/VideoPreview';
import { AudioPreview } from './preview/AudioPreview';
import { ImagePreview } from './preview/ImagePreview';
import { TextPreview } from './preview/TextPreview';
import { ShareDialog } from './ShareDialog';

interface FilePreviewProps {
  open: boolean;
  onClose: () => void;
  file: FileDocument;
  files?: FileDocument[];
  onFileChange?: (file: FileDocument) => void;
}

export function FilePreview({ 
  open, 
  onClose, 
  file, 
  files = [],
  onFileChange 
}: FilePreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const currentIndex = files.findIndex(f => f.$id === file.$id);
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < files.length - 1;

  const navigatePrevious = () => {
    if (hasPrevious && onFileChange) {
      onFileChange(files[currentIndex - 1]);
    }
  };

  const navigateNext = () => {
    if (hasNext && onFileChange) {
      onFileChange(files[currentIndex + 1]);
    }
  };

  const handleDownload = async () => {
    window.open(file.fileUrl, '_blank');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') navigatePrevious();
    if (e.key === 'ArrowRight') navigateNext();
    if (e.key === 'Escape') {
      if (isFullscreen) {
        setIsFullscreen(false);
      } else {
        onClose();
      }
    }
  };

  const getPreviewComponent = () => {
    const fileType = file.fileType.toLowerCase();
    
    if (fileType.startsWith('image/')) {
      return <ImagePreview file={file} />;
    }
    
    if (fileType.includes('pdf')) {
      return <PDFPreview file={file} />;
    }
    
    if (fileType.startsWith('video/')) {
      return <VideoPreview file={file} />;
    }
    
    if (fileType.startsWith('audio/')) {
      return <AudioPreview file={file} />;
    }
    
    if (fileType.startsWith('text/') || 
        fileType.includes('javascript') || 
        fileType.includes('json') ||
        fileType.includes('xml') ||
        fileType.includes('html') ||
        fileType.includes('css')) {
      return <TextPreview file={file} />;
    }
    
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-lg text-muted-foreground mb-4">
          Preview not available for this file type
        </p>
        <Button onClick={handleDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent 
          className={`max-w-[90vw] max-h-[90vh] p-0 overflow-hidden ${
            isFullscreen ? 'w-screen h-screen max-w-full max-h-full' : ''
          }`}
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-4">
              <h2 className="font-semibold truncate max-w-[300px]" title={file.fileName}>
                {file.fileName}
              </h2>
              {files.length > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={navigatePrevious}
                    disabled={!hasPrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentIndex + 1} / {files.length}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={navigateNext}
                    disabled={!hasNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-auto bg-background">
            {getPreviewComponent()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <ShareDialog
        open={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        file={file}
      />
    </>
  );
}