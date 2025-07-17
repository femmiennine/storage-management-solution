import { storage, databases, ID } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite-config';
import { getCurrentUser } from './user.actions';

export interface UploadFileParams {
  file: File;
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
  $createdAt: string;
}

export async function uploadFile({ file, onProgress }: UploadFileParams) {
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
      }
    );

    return fileDocument;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

export async function getFiles(userId?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const files = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      []
    );

    // Filter files by userId
    const userFiles = files.documents.filter(
      (file: any) => file.userId === (userId || user.$id)
    );

    return userFiles as FileDocument[];
  } catch (error) {
    console.error('Get files error:', error);
    throw error;
  }
}

export async function deleteFile(fileId: string, bucketFileId: string) {
  try {
    // Delete from storage
    await storage.deleteFile(appwriteConfig.bucketId, bucketFileId);

    // Delete from database
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId
    );

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