import { databases, ID } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite-config';
import { getCurrentUser } from './user.actions';
import { Query } from 'appwrite';

export interface FolderDocument {
  $id: string;
  name: string;
  parentId: string | null;
  userId: string;
  path: string;
  color?: string;
  icon?: string;
  $createdAt: string;
  $updatedAt: string;
}

export interface CreateFolderParams {
  name: string;
  parentId?: string | null;
  color?: string;
  icon?: string;
}

export async function createFolder({ name, parentId = null, color, icon }: CreateFolderParams) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Generate path based on parent
    let path = '/';
    if (parentId) {
      const parent = await getFolder(parentId);
      if (!parent) throw new Error('Parent folder not found');
      path = `${parent.path}${parent.name}/`;
    }

    const folder = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      ID.unique(),
      {
        name,
        parentId,
        userId: user.$id,
        path,
        color,
        icon,
      }
    );

    return folder as FolderDocument;
  } catch (error) {
    console.error('Create folder error:', error);
    throw error;
  }
}

export async function getFolders(parentId: string | null = null, recursive: boolean = false) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    if (recursive) {
      // Get all folders for the user
      const folders = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.foldersCollectionId,
        [Query.equal('userId', user.$id)]
      );
      return folders.documents as FolderDocument[];
    }

    const queries = [
      Query.equal('userId', user.$id),
    ];

    if (parentId === null) {
      queries.push(Query.isNull('parentId'));
    } else {
      queries.push(Query.equal('parentId', parentId));
    }

    const folders = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      queries
    );

    return folders.documents as FolderDocument[];
  } catch (error) {
    console.error('Get folders error:', error);
    throw error;
  }
}

export async function getFolder(folderId: string) {
  try {
    const folder = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      folderId
    );

    return folder as FolderDocument;
  } catch (error) {
    console.error('Get folder error:', error);
    return null;
  }
}

export async function getFolderPath(folderId: string): Promise<FolderDocument[]> {
  try {
    const path: FolderDocument[] = [];
    let currentFolder = await getFolder(folderId);

    while (currentFolder) {
      path.unshift(currentFolder);
      if (currentFolder.parentId) {
        currentFolder = await getFolder(currentFolder.parentId);
      } else {
        break;
      }
    }

    return path;
  } catch (error) {
    console.error('Get folder path error:', error);
    return [];
  }
}

export async function renameFolder(folderId: string, newName: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const folder = await getFolder(folderId);
    if (!folder) throw new Error('Folder not found');
    if (folder.userId !== user.$id) throw new Error('Unauthorized');

    const updatedFolder = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      folderId,
      { name: newName }
    );

    // Update paths of all subfolders
    await updateSubfolderPaths(folderId);

    return updatedFolder as FolderDocument;
  } catch (error) {
    console.error('Rename folder error:', error);
    throw error;
  }
}

export async function deleteFolder(folderId: string, deleteContents: boolean = false) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const folder = await getFolder(folderId);
    if (!folder) throw new Error('Folder not found');
    if (folder.userId !== user.$id) throw new Error('Unauthorized');

    // Check if folder has contents
    const subfolders = await getFolders(folderId);
    const files = await getFilesInFolder(folderId);

    if ((subfolders.length > 0 || files.length > 0) && !deleteContents) {
      throw new Error('Folder is not empty. Set deleteContents to true to delete all contents.');
    }

    if (deleteContents) {
      // Recursively delete all subfolders
      for (const subfolder of subfolders) {
        await deleteFolder(subfolder.$id, true);
      }

      // Delete all files in folder
      for (const file of files) {
        // This would call your existing deleteFile function
        // await deleteFile(file.$id, file.bucketFileId);
      }
    }

    // Delete the folder itself
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      folderId
    );

    return { success: true };
  } catch (error) {
    console.error('Delete folder error:', error);
    throw error;
  }
}

export async function moveFolder(folderId: string, newParentId: string | null) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const folder = await getFolder(folderId);
    if (!folder) throw new Error('Folder not found');
    if (folder.userId !== user.$id) throw new Error('Unauthorized');

    // Prevent moving a folder into itself or its descendants
    if (newParentId) {
      const isDescendant = await isFolderDescendant(folderId, newParentId);
      if (isDescendant) {
        throw new Error('Cannot move folder into its own descendant');
      }
    }

    // Calculate new path
    let newPath = '/';
    if (newParentId) {
      const newParent = await getFolder(newParentId);
      if (!newParent) throw new Error('New parent folder not found');
      newPath = `${newParent.path}${newParent.name}/`;
    }

    // Update the folder
    const updatedFolder = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      folderId,
      {
        parentId: newParentId,
        path: newPath
      }
    );

    // Update paths of all subfolders
    await updateSubfolderPaths(folderId);

    return updatedFolder as FolderDocument;
  } catch (error) {
    console.error('Move folder error:', error);
    throw error;
  }
}

// Helper function to check if a folder is a descendant of another
async function isFolderDescendant(ancestorId: string, descendantId: string): Promise<boolean> {
  let currentFolder = await getFolder(descendantId);
  
  while (currentFolder && currentFolder.parentId) {
    if (currentFolder.parentId === ancestorId) {
      return true;
    }
    currentFolder = await getFolder(currentFolder.parentId);
  }
  
  return false;
}

// Helper function to update paths of all subfolders recursively
async function updateSubfolderPaths(folderId: string) {
  const folder = await getFolder(folderId);
  if (!folder) return;

  const subfolders = await getFolders(folderId);
  
  for (const subfolder of subfolders) {
    const newPath = `${folder.path}${folder.name}/`;
    
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.foldersCollectionId,
      subfolder.$id,
      { path: newPath }
    );
    
    // Recursively update subfolders
    await updateSubfolderPaths(subfolder.$id);
  }
}

// Helper function to get files in a folder
async function getFilesInFolder(folderId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      [
        Query.equal('userId', user.$id),
        Query.equal('folderId', folderId)
      ]
    );

    return files.documents;
  } catch (error) {
    console.error('Get files in folder error:', error);
    return [];
  }
}

// Create default folders for new users
export async function createDefaultFolders(userId: string) {
  const defaultFolders = [
    { name: 'Documents', icon: '📄', color: '#3B82F6' },
    { name: 'Images', icon: '🖼️', color: '#8B5CF6' },
    { name: 'Videos', icon: '🎥', color: '#EF4444' },
    { name: 'Music', icon: '🎵', color: '#10B981' },
  ];

  try {
    for (const folderData of defaultFolders) {
      await createFolder(folderData);
    }
  } catch (error) {
    console.error('Error creating default folders:', error);
  }
}

// Update file's folder
export async function updateFileFolder(fileId: string, folderId: string | null) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Update the file's folderId
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId,
      {
        folderId: folderId || null
      }
    );

    return { success: true };
  } catch (error) {
    console.error('Update file folder error:', error);
    throw error;
  }
}