"use client";

import { useState, useEffect } from 'react';
import { Folder, FolderOpen } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFolders, FolderDocument, updateFileFolder } from '@/lib/actions/folder.actions';

interface BulkMoveDialogProps {
  open: boolean;
  onClose: () => void;
  fileIds: string[];
  currentFolderId: string | null;
  onSuccess: () => void;
}

export function BulkMoveDialog({
  open,
  onClose,
  fileIds,
  currentFolderId,
  onSuccess
}: BulkMoveDialogProps) {
  const [folders, setFolders] = useState<FolderDocument[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchFolders();
    }
  }, [open]);

  const fetchFolders = async () => {
    try {
      // Get all folders
      const allFolders = await getFolders(null, true); // true to get all folders recursively
      setFolders(allFolders.filter(f => f.$id !== currentFolderId));
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleMove = async () => {
    setLoading(true);
    try {
      await Promise.all(
        fileIds.map(fileId => updateFileFolder(fileId, selectedFolder))
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error moving files:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolderTree = (parentId: string | null = null, depth: number = 0) => {
    const childFolders = folders.filter(f => f.parentId === parentId);
    
    return childFolders.map(folder => {
      const hasChildren = folders.some(f => f.parentId === folder.$id);
      const isExpanded = expandedFolders.has(folder.$id);
      const isSelected = selectedFolder === folder.$id;
      
      return (
        <div key={folder.$id}>
          <div
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent ${
              isSelected ? 'bg-primary/10 border border-primary' : ''
            }`}
            style={{ paddingLeft: `${depth * 20 + 8}px` }}
            onClick={() => setSelectedFolder(folder.$id)}
          >
            <Button
              size="sm"
              variant="ghost"
              className="p-0 h-auto"
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) toggleFolder(folder.$id);
              }}
            >
              {hasChildren && isExpanded ? (
                <FolderOpen className="h-4 w-4" />
              ) : (
                <Folder className="h-4 w-4" style={{ color: folder.color }} />
              )}
            </Button>
            <span className="text-sm">{folder.name}</span>
          </div>
          {hasChildren && isExpanded && renderFolderTree(folder.$id, depth + 1)}
        </div>
      );
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {fileIds.length} File{fileIds.length > 1 ? 's' : ''}</DialogTitle>
          <DialogDescription>
            Select a folder to move the selected files to
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] border rounded-md p-2">
          {/* Root folder option */}
          <div
            className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent ${
              selectedFolder === null ? 'bg-primary/10 border border-primary' : ''
            }`}
            onClick={() => setSelectedFolder(null)}
          >
            <Folder className="h-4 w-4" />
            <span className="text-sm">Root (My Files)</span>
          </div>
          
          {/* Folder tree */}
          {renderFolderTree()}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={loading || (selectedFolder === currentFolderId)}
          >
            {loading ? 'Moving...' : 'Move Files'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}