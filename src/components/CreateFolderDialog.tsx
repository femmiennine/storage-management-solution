"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Folder, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createFolder, renameFolder, FolderDocument } from '@/lib/actions/folder.actions';

const folderFormSchema = z.object({
  name: z.string().min(1, 'Folder name is required').max(255, 'Folder name is too long'),
});

type FolderFormData = z.infer<typeof folderFormSchema>;

interface CreateFolderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  parentId?: string | null;
  folderToEdit?: FolderDocument | null;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
];

const DEFAULT_ICONS = [
  '📁', '📂', '📄', '🖼️', '🎥', '🎵', '📊', '📈',
  '💼', '🎨', '🔧', '⚡', '🚀', '💡', '📚', '🏠',
];

export function CreateFolderDialog({ 
  open, 
  onClose, 
  onSuccess, 
  parentId,
  folderToEdit 
}: CreateFolderDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(folderToEdit?.color || DEFAULT_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(folderToEdit?.icon || '📁');

  const form = useForm<FolderFormData>({
    resolver: zodResolver(folderFormSchema),
    defaultValues: {
      name: folderToEdit?.name || '',
    },
  });

  const isEditing = !!folderToEdit;

  async function onSubmit(data: FolderFormData) {
    setIsLoading(true);
    try {
      if (isEditing) {
        await renameFolder(folderToEdit.$id, data.name);
      } else {
        await createFolder({
          name: data.name,
          parentId,
          color: selectedColor,
          icon: selectedIcon,
        });
      }
      
      form.reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating/updating folder:', error);
      form.setError('name', {
        type: 'manual',
        message: 'Failed to ' + (isEditing ? 'update' : 'create') + ' folder',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Rename Folder' : 'Create New Folder'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Enter a new name for the folder'
              : 'Create a new folder to organize your files'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter folder name" 
                      {...field} 
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <>
                <div className="space-y-2">
                  <FormLabel>Icon</FormLabel>
                  <div className="grid grid-cols-8 gap-2">
                    {DEFAULT_ICONS.map((icon) => (
                      <Button
                        key={icon}
                        type="button"
                        variant={selectedIcon === icon ? 'default' : 'outline'}
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => setSelectedIcon(icon)}
                      >
                        <span className="text-lg">{icon}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Color</FormLabel>
                  <div className="grid grid-cols-8 gap-2">
                    {DEFAULT_COLORS.map((color) => (
                      <Button
                        key={color}
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 p-1"
                        onClick={() => setSelectedColor(color)}
                      >
                        <div 
                          className="h-full w-full rounded"
                          style={{ 
                            backgroundColor: color,
                            border: selectedColor === color ? '2px solid black' : 'none'
                          }}
                        />
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div 
                    className="p-2 rounded"
                    style={{ 
                      backgroundColor: `${selectedColor}20`,
                      color: selectedColor
                    }}
                  >
                    <span className="text-xl">{selectedIcon}</span>
                  </div>
                  <span className="font-medium">
                    {form.watch('name') || 'New Folder'}
                  </span>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Rename' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}