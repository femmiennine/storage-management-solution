import { databases, ID } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite-config';
import { Query } from 'appwrite';
import { getCurrentUser } from './user.actions';
import { getFile, FileDocument } from './file.actions';
import { logActivity } from './activity.actions';

export interface UserShareDocument {
  $id: string;
  fileId: string;
  ownerId: string; // The user who owns the file
  sharedWithId: string; // The user the file is shared with
  sharedWithEmail: string; // Email of the user for display
  permissions: string; // 'view' or 'view,download'
  sharedAt: string;
  $createdAt: string;
}

export interface CreateUserShareParams {
  fileId: string;
  sharedWithEmail: string;
  permissions: ('view' | 'download')[];
}

// Share a file with another user
export async function shareFileWithUser({
  fileId,
  sharedWithEmail,
  permissions
}: CreateUserShareParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error('User not authenticated');

    // Verify file ownership
    const file = await getFile(fileId);
    if (file.userId !== currentUser.$id) {
      throw new Error('Unauthorized: You can only share your own files');
    }

    // Find the user to share with
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal('email', sharedWithEmail)]
    );

    if (users.documents.length === 0) {
      throw new Error('User not found with this email');
    }

    const targetUser = users.documents[0];
    
    // Don't allow sharing with yourself
    if (targetUser.$id === currentUser.$id) {
      throw new Error('You cannot share files with yourself');
    }

    // Check if already shared
    const existingShares = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userSharesCollectionId,
      [
        Query.equal('fileId', fileId),
        Query.equal('sharedWithId', targetUser.$id)
      ]
    );

    if (existingShares.documents.length > 0) {
      // Update existing share
      const share = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userSharesCollectionId,
        existingShares.documents[0].$id,
        {
          permissions: permissions.join(','),
          sharedAt: new Date().toISOString()
        }
      );
      
      return share as UserShareDocument;
    }

    // Create new share
    const share = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userSharesCollectionId,
      ID.unique(),
      {
        fileId,
        ownerId: currentUser.$id,
        sharedWithId: targetUser.$id,
        sharedWithEmail: targetUser.email,
        permissions: permissions.join(','),
        sharedAt: new Date().toISOString()
      }
    );

    // Log activity
    await logActivity({
      action: 'file_share' as any,
      resourceType: 'file',
      resourceId: fileId,
      resourceName: file.fileName,
      metadata: {
        sharedWith: sharedWithEmail,
        permissions: permissions.join(',')
      }
    });

    return share as UserShareDocument;
  } catch (error) {
    console.error('Share file with user error:', error);
    throw error;
  }
}

// Get files shared with the current user
export async function getFilesSharedWithMe() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const shares = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userSharesCollectionId,
      [
        Query.equal('sharedWithId', user.$id),
        Query.orderDesc('sharedAt')
      ]
    );

    // Fetch file details for each share
    const sharesWithFiles = await Promise.all(
      shares.documents.map(async (share) => {
        try {
          const file = await getFile(share.fileId);
          return {
            ...share,
            file
          };
        } catch {
          // File might be deleted
          return {
            ...share,
            file: null
          };
        }
      })
    );

    return sharesWithFiles.filter(share => share.file !== null);
  } catch (error) {
    console.error('Get shared files error:', error);
    throw error;
  }
}

// Get users a file is shared with
export async function getFileShares(fileId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Verify ownership
    const file = await getFile(fileId);
    if (file.userId !== user.$id) {
      throw new Error('Unauthorized: You can only view shares for your own files');
    }

    const shares = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userSharesCollectionId,
      [
        Query.equal('fileId', fileId),
        Query.orderDesc('sharedAt')
      ]
    );

    return shares.documents as UserShareDocument[];
  } catch (error) {
    console.error('Get file shares error:', error);
    throw error;
  }
}

// Remove a user share
export async function removeUserShare(shareId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get the share to verify ownership
    const share = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userSharesCollectionId,
      shareId
    );

    // Only the owner can remove shares
    if (share.ownerId !== user.$id) {
      throw new Error('Unauthorized: You can only remove your own shares');
    }

    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userSharesCollectionId,
      shareId
    );

    return { success: true };
  } catch (error) {
    console.error('Remove user share error:', error);
    throw error;
  }
}

// Check if user has access to a file
export async function checkUserFileAccess(fileId: string): Promise<{
  hasAccess: boolean;
  isOwner: boolean;
  permissions?: string[];
}> {
  try {
    const user = await getCurrentUser();
    if (!user) return { hasAccess: false, isOwner: false };

    // Check if user owns the file
    try {
      const file = await getFile(fileId);
      if (file.userId === user.$id) {
        return { hasAccess: true, isOwner: true, permissions: ['view', 'download', 'delete'] };
      }
    } catch {
      // File might not exist or user doesn't have access
    }

    // Check if file is shared with user
    const shares = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userSharesCollectionId,
      [
        Query.equal('fileId', fileId),
        Query.equal('sharedWithId', user.$id)
      ]
    );

    if (shares.documents.length > 0) {
      const share = shares.documents[0];
      return {
        hasAccess: true,
        isOwner: false,
        permissions: share.permissions.split(',')
      };
    }

    return { hasAccess: false, isOwner: false };
  } catch (error) {
    console.error('Check file access error:', error);
    return { hasAccess: false, isOwner: false };
  }
}