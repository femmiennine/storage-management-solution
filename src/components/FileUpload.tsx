"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  Video, 
  Music,
  File
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { uploadFile } from '@/lib/actions/file.actions';

interface FileUploadProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
  folderId?: string | null;
}

interface FilePreview {
  file: File;
  preview?: string;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('audio/')) return Music;
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
  return File;
};

export function FileUpload({ open, onClose, onUploadComplete, folderId }: FileUploadProps) {
  const router = useRouter();
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const filesPreviews = newFiles.map(file => {
      const preview = file.type.startsWith('image/') 
        ? URL.createObjectURL(file) 
        : undefined;
      return { file, preview };
    });
    setFiles(prev => [...prev, ...filesPreviews]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleUpload = async () => {
    setUploading(true);
    setUploadErrors({});

    for (const filePreview of files) {
      const { file } = filePreview;
      try {
        await uploadFile({
          file,
          folderId,
          onProgress: (progress) => {
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          }
        });
      } catch (error: any) {
        setUploadErrors(prev => ({
          ...prev,
          [file.name]: error.message || 'Upload failed'
        }));
      }
    }

    setUploading(false);
    
    // Clean up previews
    files.forEach(fp => {
      if (fp.preview) URL.revokeObjectURL(fp.preview);
    });
    
    setFiles([]);
    setUploadProgress({});
    onClose();
    
    if (onUploadComplete) {
      onUploadComplete();
    } else {
      router.refresh();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors"
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Support for images, documents, videos, and more
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button variant="outline" disabled={uploading} asChild>
                <span>Select Files</span>
              </Button>
            </label>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {files.map((filePreview, index) => {
                const { file, preview } = filePreview;
                const Icon = getFileIcon(file.type);
                const progress = uploadProgress[file.name];
                const error = uploadErrors[file.name];

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt={file.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <Icon className="h-10 w-10 text-muted-foreground" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      {progress !== undefined && (
                        <Progress value={progress} className="h-1 mt-1" />
                      )}
                      {error && (
                        <p className="text-xs text-destructive mt-1">{error}</p>
                      )}
                    </div>

                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={files.length === 0 || uploading}
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}