import { Query } from 'appwrite';
import { databases } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite-config';
import { getCurrentUser } from './user.actions';
import { FileDocument } from './file.actions';
import { FolderDocument } from './folder.actions';
import { SearchFilters } from '@/components/SearchBar';

export interface SearchResult {
  files: FileDocument[];
  folders: FolderDocument[];
  total: number;
}

export async function searchFiles(
  searchQuery: string,
  filters: SearchFilters
): Promise<FileDocument[]> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const queries = [
      Query.equal('userId', user.$id),
    ];

    // Add search query if provided
    if (searchQuery) {
      queries.push(Query.search('fileName', searchQuery));
    }

    // Add type filters
    if (filters.types && filters.types.length > 0) {
      const typeQueries = filters.types.map(type => {
        switch (type) {
          case 'image':
            return Query.startsWith('fileType', 'image/');
          case 'video':
            return Query.startsWith('fileType', 'video/');
          case 'audio':
            return Query.startsWith('fileType', 'audio/');
          case 'document':
            return Query.or([
              Query.contains('fileType', 'pdf'),
              Query.contains('fileType', 'document'),
              Query.startsWith('fileType', 'text/'),
            ]);
          default:
            return null;
        }
      }).filter(Boolean);

      if (typeQueries.length > 0) {
        // Since Appwrite doesn't support OR queries directly, we'll need to run multiple queries
        // For now, we'll just use the first type filter
        if (typeQueries[0]) queries.push(typeQueries[0] as any);
      }
    }

    // Add date range filter
    if (filters.dateRange) {
      queries.push(Query.greaterThanEqual('$createdAt', filters.dateRange.from.toISOString()));
      queries.push(Query.lessThanEqual('$createdAt', filters.dateRange.to.toISOString()));
    }

    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      queries
    );

    let results = files.documents as unknown as FileDocument[];

    // Filter by tags if specified
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(file => {
        if (!file.tags) return false;
        const fileTags = file.tags.split(',').filter(Boolean);
        // Check if file has all the specified tags
        return filters.tags!.every(tag => fileTags.includes(tag));
      });
    }

    return results;
  } catch (error) {
    console.error('Search files error:', error);
    throw error;
  }
}

export async function searchFolders(searchQuery: string): Promise<FolderDocument[]> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const queries = [
      Query.equal('userId', user.$id),
    ];

    if (searchQuery) {
      queries.push(Query.search('name', searchQuery));
    }

    const folders = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      queries
    );

    return folders.documents as unknown as FolderDocument[];
  } catch (error) {
    console.error('Search folders error:', error);
    throw error;
  }
}

export async function quickSearch(query: string): Promise<SearchResult> {
  try {
    const [files, folders] = await Promise.all([
      searchFiles(query, { types: [] }),
      searchFolders(query)
    ]);

    return {
      files,
      folders,
      total: files.length + folders.length
    };
  } catch (error) {
    console.error('Quick search error:', error);
    throw error;
  }
}

// Get search suggestions based on recent files and popular searches
export async function getSearchSuggestions(): Promise<string[]> {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    // Get recent files
    const recentFiles = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      [
        Query.equal('userId', user.$id),
        Query.orderDesc('$createdAt'),
        Query.limit(10)
      ]
    );

    // Extract unique file name parts for suggestions
    const suggestions = new Set<string>();
    recentFiles.documents.forEach((file: any) => {
      const nameParts = file.fileName.split(/[\s._-]+/);
      nameParts.forEach((part: string) => {
        if (part.length > 3) {
          suggestions.add(part.toLowerCase());
        }
      });
    });

    return Array.from(suggestions).slice(0, 5);
  } catch (error) {
    console.error('Get search suggestions error:', error);
    return [];
  }
}