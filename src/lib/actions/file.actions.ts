import { storage, databases, ID } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite-config';
import { getCurrentUser } from './user.actions';
import { Query } from 'appwrite';
import { logActivity } from './activity.actions';

export interface UploadFileParams {
  file: File;
  folderId?: string | null;
  onProgress?: (progress: number) => void;
}

export interface FileDocument {
  $id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  bucketFileId: string;
  folderId: string | null;
  tags?: string; // Comma-separated tags
  $createdAt: string;
}

export async function uploadFile({ file, folderId = null, onProgress }: UploadFileParams) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Upload file to storage bucket
    const uploadedFile = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      file,
      undefined,
      onProgress ? (progress) => {
        onProgress(progress.progress);
      } : undefined
    );

    // Get file URL
    const fileUrl = storage.getFileView(
      appwriteConfig.bucketId,
      uploadedFile.$id
    );

    // Create file document in database
    const fileDocument = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      ID.unique(),
      {
        userId: user.$id,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: fileUrl.toString(),
        bucketFileId: uploadedFile.$id,
        folderId: folderId,
      }
    );

    // Log activity
    await logActivity({
      action: 'file_upload',
      resourceType: 'file',
      resourceId: fileDocument.$id,
      resourceName: file.name,
      metadata: {
        fileSize: file.size,
        fileType: file.type,
        folderId: folderId
      }
    });

    return fileDocument;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

export async function getFile(fileId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const file = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId
    );

    return file as unknown as FileDocument;
  } catch (error) {
    console.error('Get file error:', error);
    throw error;
  }
}

export interface GetFilesParams {
  folderId?: string | null;
  limit?: number;
  offset?: number;
  orderBy?: 'createdAt' | 'name' | 'size';
  orderDirection?: 'asc' | 'desc';
}

export interface GetFilesResponse {
  files: FileDocument[];
  total: number;
  hasMore: boolean;
}

export async function getFiles(params?: GetFilesParams | string | null): Promise<GetFilesResponse | FileDocument[]> {
  // Handle backward compatibility
  if (typeof params === 'string' || params === null || params === undefined) {
    const result = await getFilesLegacy(params);
    return result;
  }

  const {
    folderId,
    limit = 20,
    offset = 0,
    orderBy = 'createdAt',
    orderDirection = 'desc'
  } = params;

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const queries = [
      Query.equal('userId', user.$id),
      Query.limit(limit),
      Query.offset(offset),
    ];

    // If folderId is provided, filter by it
    // If folderId is null, get root files (no folder)
    // If folderId is undefined, get all files
    if (folderId !== undefined) {
      if (folderId === null) {
        queries.push(Query.isNull('folderId'));
      } else {
        queries.push(Query.equal('folderId', folderId));
      }
    }

    // Add ordering
    const orderField = orderBy === 'createdAt' ? '$createdAt' : orderBy === 'name' ? 'fileName' : 'fileSize';
    if (orderDirection === 'desc') {
      queries.push(Query.orderDesc(orderField));
    } else {
      queries.push(Query.orderAsc(orderField));
    }

    const response = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      queries
    );

    return {
      files: response.documents as unknown as FileDocument[],
      total: response.total,
      hasMore: offset + limit < response.total
    };
  } catch (error) {
    console.error('Get files error:', error);
    throw error;
  }
}

// Legacy function for backward compatibility
async function getFilesLegacy(folderId?: string | null): Promise<FileDocument[]> {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const queries = [
      Query.equal('userId', user.$id),
    ];

    if (folderId !== undefined) {
      if (folderId === null) {
        queries.push(Query.isNull('folderId'));
      } else {
        queries.push(Query.equal('folderId', folderId));
      }
    }

    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      queries
    );

    return files.documents as unknown as FileDocument[];
  } catch (error) {
    console.error('Get files error:', error);
    throw error;
  }
}

export async function deleteFile(fileId: string, bucketFileId: string) {
  try {
    // Get file info before deletion for activity log
    const file = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId
    ) as unknown as FileDocument;

    // Delete from storage
    await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);

    // Delete from database
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId
    );

    // Log activity
    await logActivity({
      action: 'file_delete',
      resourceType: 'file',
      resourceId: fileId,
      resourceName: file.fileName,
      metadata: {
        fileSize: file.fileSize,
        fileType: file.fileType
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Delete file error:', error);
    throw error;
  }
}

export async function getFileDownloadUrl(bucketFileId: string) {
  try {
    const result = storage.getFileDownload(
      appwriteConfig.bucketId,
      bucketFileId
    );
    return result.toString();
  } catch (error) {
    console.error('Get download URL error:', error);
    throw error;
  }
}

export async function moveFile(fileId: string, newFolderId: string | null) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get the file to verify ownership
    const file = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId
    );

    if (file.userId !== user.$id) {
      throw new Error('Unauthorized: You can only move your own files');
    }

    // Update the file's folder
    const updatedFile = await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId,
      { folderId: newFolderId }
    );

    return updatedFile as unknown as FileDocument;
  } catch (error) {
    console.error('Move file error:', error);
    throw error;
  }
}