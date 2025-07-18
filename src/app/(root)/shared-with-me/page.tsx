"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  FileText, 
  Image, 
  Video, 
  Music,
  File,
  Download,
  Eye,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FilePreview } from '@/components/FilePreview';
import { getCurrentUser } from '@/lib/actions/user.actions';
import { getFilesSharedWithMe } from '@/lib/actions/userShare.actions';
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
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function SharedWithMePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sharedFiles, setSharedFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [fileToPreview, setFileToPreview] = useState<any>(null);

  const fetchData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/sign-in');
        return;
      }
      setUser(currentUser);
      
      const files = await getFilesSharedWithMe();
      setSharedFiles(files);
    } catch (error) {
      console.error('Error fetching shared files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownload = async (file: any) => {
    try {
      const downloadUrl = await getFileDownloadUrl(file.bucketFileId);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Shared with Me</h1>
          <p className="text-muted-foreground mt-1">
            Files that others have shared with you
          </p>
        </div>

        {/* Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared Files</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sharedFiles.length}</div>
            <p className="text-xs text-muted-foreground">
              From {new Set(sharedFiles.map(s => s.ownerId)).size} users
            </p>
          </CardContent>
        </Card>

        {/* Shared Files Grid */}
        {sharedFiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No shared files yet</p>
              <p className="text-muted-foreground mt-1">
                Files shared with you will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sharedFiles.map((share) => {
              const file = share.file;
              const Icon = getFileIcon(file.fileType);
              const permissions = share.permissions.split(',');
              
              return (
                <Card key={share.$id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <div 
                      className="aspect-video bg-muted flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        setFileToPreview(file);
                        setShowPreview(true);
                      }}
                    >
                      {file.fileType.startsWith('image/') ? (
                        <img 
                          src={file.fileUrl} 
                          alt={file.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Icon className="h-16 w-16 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate mb-1" title={file.fileName}>
                      {file.fileName}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {formatFileSize(file.fileSize)}
                    </p>
                    
                    {/* Permissions badges */}
                    <div className="flex gap-2 mb-3">
                      {permissions.map((perm) => (
                        <Badge key={perm} variant="secondary" className="text-xs">
                          {perm === 'view' ? <Eye className="h-3 w-3 mr-1" /> : <Download className="h-3 w-3 mr-1" />}
                          {perm}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* Share info */}
                    <div className="text-xs text-muted-foreground mb-3">
                      <p>Shared by: {share.ownerId}</p>
                      <p className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(share.sharedAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setFileToPreview(file);
                          setShowPreview(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {permissions.includes('download') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* File Preview */}
      {fileToPreview && (
        <FilePreview
          open={showPreview}
          onClose={() => {
            setShowPreview(false);
            setFileToPreview(null);
          }}
          file={fileToPreview}
          files={sharedFiles.map(s => s.file)}
          onFileChange={(file) => setFileToPreview(file)}
        />
      )}
    </div>
  );
}