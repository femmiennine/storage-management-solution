"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/user.actions';
import { getFiles, FileDocument } from '@/lib/actions/file.actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUpload } from '@/components/FileUpload';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  Upload,
  HardDrive,
  FileIcon,
  Clock
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/sign-in');
        return;
      }
      setUser(currentUser);
      
      const userFiles = await getFiles();
      setFiles(userFiles);
    } catch (error) {
      console.error('Error fetching data:', error);
      router.push('/sign-in');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const calculateStats = () => {
    const totalSize = files.reduce((acc, file) => acc + file.fileSize, 0);
    const documents = files.filter(f => f.fileType.includes('pdf') || f.fileType.includes('document')).length;
    const images = files.filter(f => f.fileType.startsWith('image/')).length;
    const videos = files.filter(f => f.fileType.startsWith('video/')).length;

    return [
      { 
        title: 'Total Storage', 
        value: `${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB / 10 GB`, 
        icon: HardDrive,
        color: 'text-blue-600'
      },
      { 
        title: 'Documents', 
        value: `${documents} files`, 
        icon: FileText,
        color: 'text-green-600'
      },
      { 
        title: 'Images', 
        value: `${images} files`, 
        icon: Image,
        color: 'text-purple-600'
      },
      { 
        title: 'Videos', 
        value: `${videos} files`, 
        icon: Video,
        color: 'text-red-600'
      },
    ];
  };

  const storageStats = calculateStats();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user?.fullName || 'User'}</h1>
            <p className="text-muted-foreground mt-1">Manage your files and storage</p>
          </div>
          <Button size="lg" className="gap-2" onClick={() => setShowUpload(true)}>
            <Upload className="h-5 w-5" />
            Upload Files
          </Button>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {storageStats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Files */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No files uploaded yet</p>
                <p className="text-muted-foreground mt-1">Upload your first file to get started</p>
                <Button className="mt-4" variant="outline" onClick={() => setShowUpload(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {files.slice(0, 5).map((file) => {
                  const Icon = file.fileType.startsWith('image/') ? Image :
                               file.fileType.startsWith('video/') ? Video :
                               file.fileType.startsWith('audio/') ? Music :
                               file.fileType.includes('pdf') || file.fileType.includes('document') ? FileText :
                               FileIcon;
                  
                  return (
                    <div key={file.$id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Icon className="h-8 w-8 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{file.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.$createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {files.length > 5 && (
                  <p className="text-sm text-center text-muted-foreground">
                    And {files.length - 5} more files...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Upload Dialog */}
      <FileUpload 
        open={showUpload} 
        onClose={() => setShowUpload(false)}
        onUploadComplete={() => {
          setShowUpload(false);
          fetchData();
        }}
      />
    </div>
  );
}