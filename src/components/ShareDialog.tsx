"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Copy, 
  Link, 
  Lock, 
  Calendar,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Download
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createShareLink, getShareLinks, revokeShareLink } from '@/lib/actions/share.actions';
import { FileDocument } from '@/lib/actions/file.actions';

const shareFormSchema = z.object({
  expiresIn: z.string(),
  password: z.string().optional(),
  permissions: z.object({
    view: z.boolean(),
    download: z.boolean(),
  }).refine(data => data.view || data.download, {
    message: "At least one permission must be selected",
  }),
});

type ShareFormData = z.infer<typeof shareFormSchema>;

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  file: FileDocument;
}

export function ShareDialog({ open, onClose, file }: ShareDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [existingLinks, setExistingLinks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('create');

  const form = useForm<ShareFormData>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      expiresIn: '7',
      password: '',
      permissions: {
        view: true,
        download: true,
      },
    },
  });

  const loadExistingLinks = async () => {
    try {
      const links = await getShareLinks(file.$id);
      setExistingLinks(links);
    } catch (error) {
      console.error('Error loading share links:', error);
      setExistingLinks([]);
    }
  };

  const onSubmit = async (data: ShareFormData) => {
    setIsLoading(true);
    try {
      const permissions = [];
      if (data.permissions.view) permissions.push('view');
      if (data.permissions.download) permissions.push('download');

      // Ensure we have at least one permission
      if (permissions.length === 0) {
        throw new Error('At least one permission must be selected');
      }

      const expiresIn = data.expiresIn === 'never' ? undefined : parseInt(data.expiresIn);

      const shareLink = await createShareLink({
        fileId: file.$id,
        password: data.password || undefined,
        expiresIn,
        permissions: permissions as ('view' | 'download')[],
      });

      const url = `${window.location.origin}/share/${shareLink.token}`;
      setShareLink(url);
      
      // Load existing links
      await loadExistingLinks();
      
      // Switch to manage tab
      setActiveTab('manage');
    } catch (error) {
      console.error('Error creating share link:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleRevoke = async (linkId: string) => {
    try {
      await revokeShareLink(linkId);
      await loadExistingLinks();
    } catch (error) {
      console.error('Error revoking link:', error);
    }
  };

  useEffect(() => {
    if (open && file?.$id) {
      loadExistingLinks();
    }
  }, [open, file?.$id]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share "{file.fileName}"</DialogTitle>
          <DialogDescription>
            Create a shareable link for this file
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">Create Link</TabsTrigger>
            <TabsTrigger value="manage">Manage Links</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-4">
            {!shareLink ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Expiration */}
                  <FormField
                    control={form.control}
                    name="expiresIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link Expiration</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="1" id="1day" />
                              <Label htmlFor="1day">1 day</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="7" id="7days" />
                              <Label htmlFor="7days">7 days</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="30" id="30days" />
                              <Label htmlFor="30days">30 days</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="never" id="never" />
                              <Label htmlFor="never">Never</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Password */}
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password Protection (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Enter password"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Leave empty for no password protection
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  {/* Permissions */}
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Share Link
                  </Button>
                </form>
              </Form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Share Link Created!</p>
                  <div className="flex gap-2">
                    <Input
                      value={shareLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShareLink('');
                    form.reset();
                  }}
                >
                  Create Another Link
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            {existingLinks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Link className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No active share links</p>
              </div>
            ) : (
              <div className="space-y-2">
                {existingLinks.map((link) => (
                  <div key={link.$id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        {link.password && <Lock className="h-4 w-4" />}
                        {link.expiresAt && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Expires {new Date(link.expiresAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevoke(link.$id)}
                      >
                        Revoke
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Created {new Date(link.$createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}