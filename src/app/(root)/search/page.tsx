"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search as SearchIcon, FileText, FolderOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchBar, SearchFilters } from '@/components/SearchBar';
import { searchFiles, searchFolders, SearchResult } from '@/lib/actions/search.actions';
import { FileDocument } from '@/lib/actions/file.actions';
import { FolderDocument } from '@/lib/actions/folder.actions';
import { Skeleton } from '@/components/ui/skeleton';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [loading, setLoading] = useState(false);
  const [fileResults, setFileResults] = useState<FileDocument[]>([]);
  const [folderResults, setFolderResults] = useState<FolderDocument[]>([]);
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({
    types: [],
  });

  const handleSearch = async (query: string, filters: SearchFilters) => {
    setCurrentQuery(query);
    setCurrentFilters(filters);
    
    if (!query && filters.types.length === 0) {
      setFileResults([]);
      setFolderResults([]);
      return;
    }

    setLoading(true);
    try {
      const [files, folders] = await Promise.all([
        searchFiles(query, filters),
        searchFolders(query)
      ]);
      
      setFileResults(files);
      setFolderResults(folders);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery, { types: [] });
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <SearchIcon className="h-10 w-10" />
            Search
          </h1>
          <p className="text-muted-foreground">
            Search through your files and folders
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <SearchBar
            placeholder="Search files and folders..."
            onSearch={handleSearch}
            showFilters={true}
          />
        </div>

        {/* Results */}
        {(currentQuery || currentFilters.types.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                {loading ? (
                  'Searching...'
                ) : (
                  `Found ${fileResults.length} files and ${folderResults.length} folders`
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">
                    All ({fileResults.length + folderResults.length})
                  </TabsTrigger>
                  <TabsTrigger value="files">
                    Files ({fileResults.length})
                  </TabsTrigger>
                  <TabsTrigger value="folders">
                    Folders ({folderResults.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                  {loading ? (
                    <LoadingSkeleton />
                  ) : (
                    <>
                      {/* Folders */}
                      {folderResults.map((folder) => (
                        <div
                          key={folder.$id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                        >
                          <FolderOpen className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium">{folder.name}</p>
                            <p className="text-sm text-muted-foreground">{folder.path}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Files */}
                      {fileResults.map((file) => (
                        <div
                          key={file.$id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                        >
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">{file.fileName}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.fileSize)} • {new Date(file.$createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {fileResults.length === 0 && folderResults.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No results found</p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                  {loading ? (
                    <LoadingSkeleton />
                  ) : (
                    <>
                      {fileResults.map((file) => (
                        <div
                          key={file.$id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                        >
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="font-medium">{file.fileName}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.fileSize)} • {new Date(file.$createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {fileResults.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No files found</p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="folders" className="space-y-4">
                  {loading ? (
                    <LoadingSkeleton />
                  ) : (
                    <>
                      {folderResults.map((folder) => (
                        <div
                          key={folder.$id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent cursor-pointer"
                        >
                          <FolderOpen className="h-5 w-5 text-primary" />
                          <div className="flex-1">
                            <p className="font-medium">{folder.name}</p>
                            <p className="text-sm text-muted-foreground">{folder.path}</p>
                          </div>
                        </div>
                      ))}
                      
                      {folderResults.length === 0 && (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No folders found</p>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!currentQuery && currentFilters.types.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <SearchIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Start searching</p>
              <p className="text-muted-foreground mt-1">
                Enter a search term or use filters to find files and folders
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-6"><div className="max-w-4xl mx-auto space-y-8"><div className="text-center space-y-4"><h1 className="text-4xl font-bold">Loading...</h1></div></div></div>}>
      <SearchContent />
    </Suspense>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </>
  );
}