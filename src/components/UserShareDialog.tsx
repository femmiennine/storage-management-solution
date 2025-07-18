"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  UserPlus, 
  Mail, 
  Eye,
  Download,
  Loader2,
  X,
  Users
} from 'lucide-react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { FileDocument } from '@/lib/actions/file.actions';
import { 
  shareFileWithUser, 
  getFileShares, 
  removeUserShare,
  UserShareDocument 
} from '@/lib/actions/userShare.actions';

const shareFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  permissions: z.object({
    view: z.boolean(),
    download: z.boolean(),
  }).refine(data => data.view || data.download, {
    message: "At least one permission must be selected",
  }),
});

type ShareFormData = z.infer<typeof shareFormSchema>;

interface UserShareDialogProps {
  open: boolean;
  onClose: () => void;
  file: FileDocument;
}

export function UserShareDialog({ open, onClose, file }: UserShareDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [existingShares, setExistingShares] = useState<UserShareDocument[]>([]);
  const [error, setError] = useState('');

  const form = useForm<ShareFormData>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      email: '',
      permissions: {
        view: true,
        download: true,
      },
    },
  });

  const loadExistingShares = async () => {
    try {
      const shares = await getFileShares(file.$id);
      setExistingShares(shares);
    } catch (error) {
      console.error('Error loading shares:', error);
    }
  };

  useEffect(() => {
    if (open) {
      loadExistingShares();
      form.reset();
      setError('');
    }
  }, [open, file.$id]);

  const onSubmit = async (data: ShareFormData) => {
    setIsLoading(true);
    setError('');
    
    try {
      const permissions = [];
      if (data.permissions.view) permissions.push('view');
      if (data.permissions.download) permissions.push('download');

      await shareFileWithUser({
        fileId: file.$id,
        sharedWithEmail: data.email,
        permissions: permissions as ('view' | 'download')[],
      });

      // Reload shares
      await loadExistingShares();
      
      // Reset form
      form.reset();
    } catch (error: any) {
      setError(error.message || 'Failed to share file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to remove this share?')) return;

    try {
      await removeUserShare(shareId);
      await loadExistingShares();
    } catch (error) {
      console.error('Error removing share:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share "{file.fileName}"</DialogTitle>
          <DialogDescription>
            Share this file with other users by entering their email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Share form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="user@example.com"
                          className="pl-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Enter the email of the user you want to share with
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions"
                render={() => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
                    <div className="space-y-2">
                      <FormField
                        control={form.control}
                        name="permissions.view"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              <Eye className="inline h-4 w-4 mr-2" />
                              Can view
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="permissions.download"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              <Download className="inline h-4 w-4 mr-2" />
                              Can download
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <UserPlus className="mr-2 h-4 w-4" />
                Share File
              </Button>
            </form>
          </Form>

          {/* Existing shares */}
          {existingShares.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Shared with</h4>
              <div className="space-y-2">
                {existingShares.map((share) => (
                  <div 
                    key={share.$id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{share.sharedWithEmail}</p>
                        <div className="flex gap-2 mt-1">
                          {share.permissions.split(',').map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-xs">
                              {perm === 'view' ? <Eye className="h-3 w-3 mr-1" /> : <Download className="h-3 w-3 mr-1" />}
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveShare(share.$id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}