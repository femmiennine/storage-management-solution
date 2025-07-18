"use client";

import { useState, useEffect } from 'react';
import { Hash, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TagInput } from './TagInput';
import { FileDocument } from '@/lib/actions/file.actions';
import { addTagsToFile } from '@/lib/actions/tag.actions';

interface TagsDialogProps {
  open: boolean;
  onClose: () => void;
  file: FileDocument;
  onSuccess?: () => void;
}

export function TagsDialog({ open, onClose, file, onSuccess }: TagsDialogProps) {
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && file.tags) {
      // Parse existing tags from comma-separated string
      setTags(file.tags.split(',').filter(Boolean));
    } else {
      setTags([]);
    }
  }, [open, file]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await addTagsToFile(file.$id, tags);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving tags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
          <DialogDescription>
            Add tags to organize "{file.fileName}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder="Enter tags (press Enter to add)"
            />
            <p className="text-xs text-muted-foreground">
              Tags help you organize and find your files quickly
            </p>
          </div>
          
          {/* Popular tags suggestion */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Suggested tags:</p>
            <div className="flex flex-wrap gap-2">
              {['work', 'personal', 'important', 'archive', 'project'].map((suggestion) => (
                <Button
                  key={suggestion}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!tags.includes(suggestion)) {
                      setTags([...tags, suggestion]);
                    }
                  }}
                  disabled={tags.includes(suggestion)}
                  className="h-7"
                >
                  <Hash className="h-3 w-3 mr-1" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Tags
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}