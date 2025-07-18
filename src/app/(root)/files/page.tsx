"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FileText, 
  Image, 
  Video, 
  Music,
  File,
  Download,
  Trash2,
  MoreVertical,
  Upload,
  FolderPlus,
  Share2,
  FolderOpen,
  Hash,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUpload } from '@/components/FileUpload';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FolderCard } from '@/components/FolderCard';
import { CreateFolderDialog } from '@/components/CreateFolderDialog';
import { ShareDialog } from '@/components/ShareDialog';
import { TagsDialog } from '@/components/TagsDialog';
import { UserShareDialog } from '@/components/UserShareDialog';
import { RenameFolderDialog } from '@/components/RenameFolderDialog';
import { FilePreview } from '@/components/FilePreview';
import { BulkMoveDialog } from '@/components/BulkMoveDialog';
import { getCurrentUser } from '@/lib/actions/user.actions';
import { getFiles, deleteFile, getFileDownloadUrl, FileDocument, GetFilesResponse } from '@/lib/actions/file.actions';
import { getFolders, FolderDocument } from '@/lib/actions/folder.actions';
import { Pagination } from '@/components/Pagination';

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
  const searchParams = useSearchParams();
  const currentFolderId = searchParams.get('folderId');
  
  const [user, setUser] = useState<any>(null);
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [folders, setFolders] = useState<FolderDocument[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalFiles, setTotalFiles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [showUpload, setShowUpload] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [fileToShare, setFileToShare] = useState<FileDocument | null>(null);
  const [showTagsDialog, setShowTagsDialog] = useState(false);
  const [fileToTag, setFileToTag] = useState<FileDocument | null>(null);
  const [showUserShareDialog, setShowUserShareDialog] = useState(false);
  const [fileToUserShare, setFileToUserShare] = useState<FileDocument | null>(null);
  const [showRenameFolderDialog, setShowRenameFolderDialog] = useState(false);
  const [folderToRename, setFolderToRename] = useState<FolderDocument | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [fileToPreview, setFileToPreview] = useState<FileDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [showBulkMove, setShowBulkMove] = useState(false);

  const fetchData = async (page = currentPage, size = pageSize) => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/sign-in');
        return;
      }
      setUser(currentUser);
      
      // Fetch folders for current location
      const userFolders = await getFolders(currentFolderId);
      setFolders(userFolders);
      
      // Fetch files for current folder with pagination
      const response = await getFiles({
        folderId: currentFolderId === null ? null : currentFolderId,
        limit: size,
        offset: (page - 1) * size,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      });
      
      // Handle both response types (for backward compatibility)
      if (Array.isArray(response)) {
        setFiles(response);
        setFilteredFiles(response);
        setTotalFiles(response.length);
      } else {
        setFiles(response.files);
        setFilteredFiles(response.files);
        setTotalFiles(response.total);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      router.push('/sign-in');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchData(1, pageSize);
  }, [currentFolderId]);

  useEffect(() => {
    fetchData(currentPage, pageSize);
  }, [currentPage, pageSize]);

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
      await fetchData(currentPage, pageSize);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const selectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.$id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedFiles.size} file${selectedFiles.size > 1 ? 's' : ''}?`;
    if (!confirm(confirmMessage)) return;

    try {
      const filesToDelete = files.filter(f => selectedFiles.has(f.$id));
      await Promise.all(
        filesToDelete.map(file => deleteFile(file.$id, file.bucketFileId))
      );
      setSelectedFiles(new Set());
      setIsSelecting(false);
      await fetchData(currentPage, pageSize);
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };

  const handleBulkDownload = async () => {
    if (selectedFiles.size === 0) return;

    try {
      const filesToDownload = files.filter(f => selectedFiles.has(f.$id));
      for (const file of filesToDownload) {
        const downloadUrl = await getFileDownloadUrl(file.bucketFileId);
        window.open(downloadUrl, '_blank');
        // Add delay to prevent browser blocking multiple downloads
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Bulk download error:', error);
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
        {/* Breadcrumb */}
        <Breadcrumb folderId={currentFolderId} />

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">My Files</h1>
            <p className="text-muted-foreground mt-1">
              {folders.length} folders, {filteredFiles.length} of {files.length} files
              {selectedFiles.size > 0 && ` • ${selectedFiles.size} selected`}
            </p>
          </div>
          <div className="flex gap-2">
            {isSelecting && selectedFiles.size > 0 ? (
              <>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2" 
                  onClick={() => setShowBulkMove(true)}
                >
                  <FolderOpen className="h-5 w-5" />
                  Move ({selectedFiles.size})
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="gap-2" 
                  onClick={handleBulkDownload}
                >
                  <Download className="h-5 w-5" />
                  Download ({selectedFiles.size})
                </Button>
                <Button 
                  size="lg" 
                  variant="destructive" 
                  className="gap-2" 
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-5 w-5" />
                  Delete ({selectedFiles.size})
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => {
                    setIsSelecting(false);
                    setSelectedFiles(new Set());
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => setIsSelecting(!isSelecting)}
                  disabled={files.length === 0}
                >
                  {isSelecting ? 'Cancel Selection' : 'Select Files'}
                </Button>
                <Button size="lg" variant="outline" className="gap-2" onClick={() => setShowCreateFolder(true)}>
                  <FolderPlus className="h-5 w-5" />
                  New Folder
                </Button>
                <Button size="lg" className="gap-2" onClick={() => setShowUpload(true)}>
                  <Upload className="h-5 w-5" />
                  Upload Files
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-4 flex-1">
            {isSelecting && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                  onCheckedChange={selectAll}
                />
                <label className="text-sm font-medium">
                  Select All
                </label>
              </div>
            )}
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
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

        {/* Files and Folders Grid */}
        {folders.length === 0 && filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <File className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">This folder is empty</p>
              <p className="text-muted-foreground mt-1">
                {searchQuery || selectedType !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'Create a folder or upload files to get started'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Folders */}
            {folders.map((folder) => (
              <FolderCard
                key={folder.$id}
                folder={folder}
                onRefresh={() => fetchData(currentPage, pageSize)}
                onRename={(folder) => {
                  setFolderToRename(folder);
                  setShowRenameFolderDialog(true);
                }}
              />
            ))}
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file.fileType);
              
              return (
                <Card key={file.$id} className={`overflow-hidden group hover:shadow-lg transition-shadow ${
                  selectedFiles.has(file.$id) ? 'ring-2 ring-primary' : ''
                }`}>
                  <div className="relative">
                    {isSelecting && (
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedFiles.has(file.$id)}
                          onCheckedChange={() => toggleFileSelection(file.$id)}
                          className="bg-background"
                        />
                      </div>
                    )}
                    <div 
                      className="aspect-video bg-muted flex items-center justify-center cursor-pointer"
                      onClick={() => {
                        if (isSelecting) {
                          toggleFileSelection(file.$id);
                        } else {
                          setFileToPreview(file);
                          setShowPreview(true);
                        }
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
                      {formatFileSize(file.fileSize)} • {new Date(file.$createdAt).toLocaleDateString()}
                    </p>
                    {file.tags && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {file.tags.split(',').filter(Boolean).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground"
                          >
                            <Hash className="h-3 w-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFileToTag(file);
                          setShowTagsDialog(true);
                        }}
                        title="Tags"
                      >
                        <Hash className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFileToUserShare(file);
                          setShowUserShareDialog(true);
                        }}
                        title="Share with User"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFileToShare(file);
                          setShowShareDialog(true);
                        }}
                        title="Share Link"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(file)}
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDelete(file)}
                        title="Delete"
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
          fetchData(currentPage, pageSize);
        }}
        folderId={currentFolderId}
      />

      {/* Create Folder Dialog */}
      <CreateFolderDialog
        open={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
        onSuccess={() => {
          setShowCreateFolder(false);
          fetchData(currentPage, pageSize);
        }}
        parentId={currentFolderId}
      />

      {/* Share Dialog */}
      {fileToShare && (
        <ShareDialog
          open={showShareDialog}
          onClose={() => {
            setShowShareDialog(false);
            setFileToShare(null);
          }}
          file={fileToShare}
        />
      )}

      {/* Tags Dialog */}
      {fileToTag && (
        <TagsDialog
          open={showTagsDialog}
          onClose={() => {
            setShowTagsDialog(false);
            setFileToTag(null);
          }}
          file={fileToTag}
          onSuccess={() => fetchData(currentPage, pageSize)}
        />
      )}

      {/* User Share Dialog */}
      {fileToUserShare && (
        <UserShareDialog
          open={showUserShareDialog}
          onClose={() => {
            setShowUserShareDialog(false);
            setFileToUserShare(null);
          }}
          file={fileToUserShare}
        />
      )}

      {/* Rename Folder Dialog */}
      {folderToRename && (
        <RenameFolderDialog
          open={showRenameFolderDialog}
          onClose={() => {
            setShowRenameFolderDialog(false);
            setFolderToRename(null);
          }}
          folder={folderToRename}
          onSuccess={() => fetchData(currentPage, pageSize)}
        />
      )}

      {/* File Preview */}
      {fileToPreview && (
        <FilePreview
          open={showPreview}
          onClose={() => {
            setShowPreview(false);
            setFileToPreview(null);
          }}
          file={fileToPreview}
          files={filteredFiles}
          onFileChange={(file) => setFileToPreview(file)}
        />
      )}

      {/* Bulk Move Dialog */}
      <BulkMoveDialog
        open={showBulkMove}
        onClose={() => setShowBulkMove(false)}
        fileIds={Array.from(selectedFiles)}
        currentFolderId={currentFolderId}
        onSuccess={() => {
          setShowBulkMove(false);
          setSelectedFiles(new Set());
          setIsSelecting(false);
          fetchData(currentPage, pageSize);
        }}
      />

      {/* Pagination */}
      {totalFiles > 0 && (
        <div className="mt-8 pb-8">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalFiles / pageSize)}
            pageSize={pageSize}
            totalItems={totalFiles}
            onPageChange={(page) => {
              setCurrentPage(page);
              setSelectedFiles(new Set());
              setIsSelecting(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
              setSelectedFiles(new Set());
              setIsSelecting(false);
            }}
          />
        </div>
      )}
    </div>
  );
}