"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  File, 
  Download, 
  Eye, 
  EyeOff, 
  Lock,
  FileText,
  Image,
  Video,
  Music,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  validateShareAccess, 
  trackShareActivity, 
  ShareLinkWithFile 
} from '@/lib/actions/share.actions';
import { getFileDownloadUrl } from '@/lib/actions/file.actions';

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.startsWith('video/')) return Video;
  if (fileType.startsWith('audio/')) return Music;
  if (fileType.includes('pdf') || fileType.includes('document')) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function SharePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [shareLink, setShareLink] = useState<ShareLinkWithFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    checkShareLink();
  }, [token]);

  const checkShareLink = async () => {
    try {
      // First try without password
      const link = await validateShareAccess(token);
      setShareLink(link);
      
      // Track view
      if (link) {
        await trackShareActivity(token, 'view');
      }
    } catch (error: any) {
      if (error.message === 'Password required') {
        setRequiresPassword(true);
      } else {
        setError('Invalid or expired share link');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const link = await validateShareAccess(token, password);
      if (link) {
        setShareLink(link);
        setRequiresPassword(false);
        await trackShareActivity(token, 'view');
      }
    } catch (error: any) {
      setError(error.message || 'Invalid password');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!shareLink?.file || !shareLink.permissions.includes('download')) return;

    setDownloading(true);
    try {
      await trackShareActivity(token, 'download');
      const downloadUrl = await getFileDownloadUrl(shareLink.file.bucketFileId);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download file');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Password Protected</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Enter password to access this file</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
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
              </div>
              
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Access File
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shareLink || !shareLink.file) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <div className="mx-auto mb-4 p-3 bg-destructive/10 rounded-full w-fit">
              <File className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Share Link Invalid</h2>
            <p className="text-muted-foreground">
              {error || 'This share link is invalid or has expired.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const file = shareLink.file;
  const Icon = getFileIcon(file.fileType);
  const canDownload = shareLink.permissions.includes('download');
  const isImage = file.fileType.startsWith('image/');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold mb-2">Shared File</h1>
          <p className="text-muted-foreground">
            Someone shared this file with you
          </p>
        </div>

        {/* File Preview */}
        <Card className="overflow-hidden">
          {isImage && (
            <div className="bg-muted p-8">
              <img 
                src={file.fileUrl} 
                alt={file.fileName}
                className="max-w-full max-h-[500px] mx-auto rounded-lg shadow-lg"
              />
            </div>
          )}
          
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-1">{file.fileName}</h2>
                <p className="text-muted-foreground">
                  {formatFileSize(file.fileSize)} • Shared on {new Date().toLocaleDateString()}
                </p>
                
                <div className="mt-4 flex gap-2">
                  {canDownload && (
                    <Button 
                      onClick={handleDownload} 
                      disabled={downloading}
                      className="gap-2"
                    >
                      {downloading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      Download
                    </Button>
                  )}
                  
                  {!canDownload && (
                    <p className="text-sm text-muted-foreground mt-2">
                      View only - Download not permitted
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Share Stats */}
            <div className="mt-6 pt-6 border-t flex gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{shareLink.views} views</span>
              </div>
              {canDownload && (
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span>{shareLink.downloads} downloads</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Powered by Storage Management Solution</p>
          <Button 
            variant="link" 
            className="mt-2"
            onClick={() => router.push('/')}
          >
            Get your own storage account
          </Button>
        </div>
      </div>
    </div>
  );
}