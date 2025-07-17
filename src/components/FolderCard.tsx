"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Folder, 
  MoreVertical, 
  Trash2, 
  Edit3,
  FolderInput
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderDocument, deleteFolder, renameFolder } from '@/lib/actions/folder.actions';
import { cn } from '@/lib/utils';

interface FolderCardProps {
  folder: FolderDocument;
  onRefresh?: () => void;
  onRename?: (folder: FolderDocument) => void;
  className?: string;
}

export function FolderCard({ folder, onRefresh, onRename, className }: FolderCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFolderClick = () => {
    router.push(`/files?folderId=${folder.$id}`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this folder? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteFolder(folder.$id, false);
      onRefresh?.();
    } catch (error: any) {
      if (error.message?.includes('not empty')) {
        if (confirm('This folder contains files. Delete all contents?')) {
          try {
            await deleteFolder(folder.$id, true);
            onRefresh?.();
          } catch (err) {
            console.error('Error deleting folder:', err);
            alert('Failed to delete folder');
          }
        }
      } else {
        console.error('Error deleting folder:', error);
        alert('Failed to delete folder');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card 
      className={cn(
        "overflow-hidden group hover:shadow-lg transition-all duration-200 cursor-pointer",
        isDeleting && "opacity-50",
        className
      )}
      onClick={handleFolderClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="p-3 rounded-lg"
              style={{ 
                backgroundColor: folder.color ? `${folder.color}20` : '#3B82F620',
                color: folder.color || '#3B82F6'
              }}
            >
              {folder.icon ? (
                <span className="text-2xl">{folder.icon}</span>
              ) : (
                <Folder className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="font-medium truncate" title={folder.name}>
                {folder.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {new Date(folder.$createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  onRename?.(folder);
                }}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/files?folderId=${folder.$id}&action=move`);
                }}
              >
                <FolderInput className="h-4 w-4 mr-2" />
                Move
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}