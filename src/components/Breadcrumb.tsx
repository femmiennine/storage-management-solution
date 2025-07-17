"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { getFolderPath, FolderDocument } from '@/lib/actions/folder.actions';
import { cn } from '@/lib/utils';

interface BreadcrumbProps {
  folderId?: string | null;
  className?: string;
}

export function Breadcrumb({ folderId, className }: BreadcrumbProps) {
  const [path, setPath] = useState<FolderDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (folderId) {
      loadPath();
    } else {
      setPath([]);
    }
  }, [folderId]);

  const loadPath = async () => {
    if (!folderId) return;
    
    setIsLoading(true);
    try {
      const folderPath = await getFolderPath(folderId);
      setPath(folderPath);
    } catch (error) {
      console.error('Error loading folder path:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <nav className={cn("flex items-center gap-1 text-sm", className)}>
      <Link
        href="/files"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Link>

      {path.map((folder, index) => (
        <div key={folder.$id} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {index === path.length - 1 ? (
            <span className="font-medium">{folder.name}</span>
          ) : (
            <Link
              href={`/files?folderId=${folder.$id}`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {folder.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}