"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Image, 
  Video, 
  Music,
  File,
  Download,
  Trash2,
  MoreVertical,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FileUpload } from '@/components/FileUpload';
import { getCurrentUser } from '@/lib/actions/user.actions';
import { getFiles, deleteFile, getFileDownloadUrl, FileDocument } from '@/lib/actions/file.actions';

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

export default function FilesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

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
      setFilteredFiles(userFiles);
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

  useEffect(() => {
    let filtered = files;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(file => 
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (selectedType !== 'all') {
      filtered = filtered.filter(file => {
        switch (selectedType) {
          case 'image':
            return file.fileType.startsWith('image/');
          case 'video':
            return file.fileType.startsWith('video/');
          case 'audio':
            return file.fileType.startsWith('audio/');
          case 'document':
            return file.fileType.includes('pdf') || file.fileType.includes('document');
          default:
            return true;
        }
      });
    }

    setFilteredFiles(filtered);
  }, [searchQuery, selectedType, files]);

  const handleDownload = async (file: FileDocument) => {
    try {
      const downloadUrl = await getFileDownloadUrl(file.bucketFileId);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleDelete = async (file: FileDocument) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      await deleteFile(file.$id, file.bucketFileId);
      await fetchData();
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const typeFilters = [
    { value: 'all', label: 'All Files', icon: File },
    { value: 'image', label: 'Images', icon: Image },
    { value: 'video', label: 'Videos', icon: Video },
    { value: 'audio', label: 'Audio', icon: Music },
    { value: 'document', label: 'Documents', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Files</h1>
            <p className="text-muted-foreground mt-1">
              {filteredFiles.length} of {files.length} files
            </p>
          </div>
          <Button size="lg" className="gap-2" onClick={() => setShowUpload(true)}>
            <Upload className="h-5 w-5" />
            Upload Files
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          <div className="flex gap-2 flex-wrap">
            {typeFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={selectedType === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedType(filter.value)}
                className="gap-2"
              >
                <filter.icon className="h-4 w-4" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Files Grid */}
        {filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <File className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No files found</p>
              <p className="text-muted-foreground mt-1">
                {searchQuery || selectedType !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Upload your first file to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file.fileType);
              
              return (
                <Card key={file.$id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted flex items-center justify-center">
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
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate mb-1" title={file.fileName}>
                      {file.fileName}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {formatFileSize(file.fileSize)} • {new Date(file.$createdAt).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDelete(file)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
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