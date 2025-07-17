"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen,
  Plus,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getFolders, FolderDocument } from '@/lib/actions/folder.actions';
import { cn } from '@/lib/utils';

interface FolderTreeProps {
  currentFolderId?: string | null;
  onCreateFolder?: (parentId: string | null) => void;
  onFolderSelect?: (folderId: string | null) => void;
}

interface FolderNodeProps {
  folder: FolderDocument;
  level: number;
  currentFolderId?: string | null;
  onCreateFolder?: (parentId: string | null) => void;
  onFolderSelect?: (folderId: string | null) => void;
}

function FolderNode({ 
  folder, 
  level, 
  currentFolderId, 
  onCreateFolder,
  onFolderSelect 
}: FolderNodeProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [subfolders, setSubfolders] = useState<FolderDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isActive = folder.$id === currentFolderId;

  const handleToggle = async () => {
    if (!isExpanded && subfolders.length === 0) {
      setIsLoading(true);
      try {
        const folders = await getFolders(folder.$id);
        setSubfolders(folders);
      } catch (error) {
        console.error('Error loading subfolders:', error);
      } finally {
        setIsLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const handleFolderClick = () => {
    if (onFolderSelect) {
      onFolderSelect(folder.$id);
    } else {
      router.push(`/files?folderId=${folder.$id}`);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 py-1.5 px-2 rounded-md hover:bg-accent cursor-pointer",
          isActive && "bg-accent"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0"
          onClick={handleToggle}
        >
          {isLoading ? (
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>

        <div
          className="flex items-center gap-2 flex-1"
          onClick={handleFolderClick}
        >
          {folder.icon || (isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />)}
          <span className="text-sm truncate">{folder.name}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onCreateFolder?.(folder.$id)}>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isExpanded && subfolders.length > 0 && (
        <div>
          {subfolders.map((subfolder) => (
            <FolderNode
              key={subfolder.$id}
              folder={subfolder}
              level={level + 1}
              currentFolderId={currentFolderId}
              onCreateFolder={onCreateFolder}
              onFolderSelect={onFolderSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({ 
  currentFolderId, 
  onCreateFolder,
  onFolderSelect 
}: FolderTreeProps) {
  const [rootFolders, setRootFolders] = useState<FolderDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRootFolders();
  }, []);

  const loadRootFolders = async () => {
    try {
      const folders = await getFolders(null);
      setRootFolders(folders);
    } catch (error) {
      console.error('Error loading folders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="px-4 mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => onCreateFolder?.(null)}
        >
          <Plus className="h-4 w-4" />
          New Folder
        </Button>
      </div>

      <div className="space-y-0.5">
        {rootFolders.map((folder) => (
          <FolderNode
            key={folder.$id}
            folder={folder}
            level={0}
            currentFolderId={currentFolderId}
            onCreateFolder={onCreateFolder}
            onFolderSelect={onFolderSelect}
          />
        ))}
      </div>
    </div>
  );
}