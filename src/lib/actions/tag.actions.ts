import { databases } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite-config';
import { Query } from 'appwrite';
import { getCurrentUser } from './user.actions';
import { logActivity } from './activity.actions';

export interface Tag {
  name: string;
  count: number;
}

// Add tags to a file
export async function addTagsToFile(fileId: string, tags: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get current file
    const file = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId
    );

    if (file.userId !== user.$id) {
      throw new Error('Unauthorized: You can only tag your own files');
    }

    // Get existing tags
    const existingTags = file.tags ? file.tags.split(',').filter(Boolean) : [];
    
    // Merge with new tags (remove duplicates)
    const allTags = [...new Set([...existingTags, ...tags])];
    
    // Update file with tags
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId,
      { tags: allTags.join(',') }
    );

    // Log activity
    await logActivity({
      action: 'file_tag' as any,
      resourceType: 'file',
      resourceId: fileId,
      resourceName: file.fileName,
      metadata: { tags: tags.join(', ') }
    });

    return updatedFile;
  } catch (error) {
    console.error('Add tags error:', error);
    throw error;
  }
}

// Remove tags from a file
export async function removeTagsFromFile(fileId: string, tagsToRemove: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get current file
    const file = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId
    );

    if (file.userId !== user.$id) {
      throw new Error('Unauthorized: You can only modify tags on your own files');
    }

    // Get existing tags
    const existingTags = file.tags ? file.tags.split(',').filter(Boolean) : [];
    
    // Remove specified tags
    const remainingTags = existingTags.filter(tag => !tagsToRemove.includes(tag));
    
    // Update file with remaining tags
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId,
      { tags: remainingTags.join(',') }
    );

    return updatedFile;
  } catch (error) {
    console.error('Remove tags error:', error);
    throw error;
  }
}

// Get all tags for the current user
export async function getUserTags(): Promise<Tag[]> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get all files for the user
    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      [Query.equal('userId', user.$id)]
    );

    // Extract and count tags
    const tagCounts = new Map<string, number>();
    
    files.documents.forEach(file => {
      if (file.tags) {
        const tags = file.tags.split(',').filter(Boolean);
        tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
    });

    // Convert to array and sort by count
    const tagsArray: Tag[] = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return tagsArray;
  } catch (error) {
    console.error('Get user tags error:', error);
    throw error;
  }
}

// Search files by tags
export async function searchFilesByTags(tags: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const queries = [Query.equal('userId', user.$id)];
    
    // For each tag, we need to check if it's contained in the tags string
    // Since Appwrite doesn't have a "contains" query for strings, we'll fetch all
    // and filter client-side
    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      queries
    );

    // Filter files that have all the specified tags
    const filteredFiles = files.documents.filter(file => {
      if (!file.tags) return false;
      const fileTags = file.tags.split(',').filter(Boolean);
      return tags.every(tag => fileTags.includes(tag));
    });

    return filteredFiles;
  } catch (error) {
    console.error('Search files by tags error:', error);
    throw error;
  }
}

// Get suggested tags based on existing tags
export async function getSuggestedTags(input: string): Promise<string[]> {
  try {
    const allTags = await getUserTags();
    
    if (!input) {
      // Return top 10 most used tags
      return allTags.slice(0, 10).map(t => t.name);
    }
    
    // Filter tags that start with the input
    const filtered = allTags
      .filter(tag => tag.name.toLowerCase().startsWith(input.toLowerCase()))
      .slice(0, 10)
      .map(t => t.name);
    
    return filtered;
  } catch (error) {
    console.error('Get suggested tags error:', error);
    return [];
  }
}