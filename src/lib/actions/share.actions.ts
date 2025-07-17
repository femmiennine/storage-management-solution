import { databases, ID } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite-config';
import { getCurrentUser } from './user.actions';
import { Query } from 'appwrite';
import bcrypt from 'bcryptjs';

export interface ShareLinkDocument {
  $id: string;
  fileId: string;
  userId: string;
  token: string;
  password?: string;
  expiresAt?: string;
  permissions: string[];
  views: number;
  downloads: number;
  isActive: boolean;
  $createdAt: string;
}

export interface CreateShareLinkParams {
  fileId: string;
  password?: string;
  expiresIn?: number; // days
  permissions?: ('view' | 'download')[];
}

export interface ShareLinkWithFile extends ShareLinkDocument {
  file?: any;
}

// Generate a unique share token
function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createShareLink({
  fileId,
  password,
  expiresIn,
  permissions = ['view', 'download']
}: CreateShareLinkParams) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Verify file ownership
    const file = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.filesCollectionId,
      fileId
    );

    if (file.userId !== user.$id) {
      throw new Error('Unauthorized: You can only share your own files');
    }

    // Generate unique token
    let token = generateShareToken();
    
    // Ensure token is unique
    let tokenExists = true;
    while (tokenExists) {
      try {
        await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.shareLinksCollectionId,
          [Query.equal('token', token)]
        );
        token = generateShareToken();
      } catch {
        tokenExists = false;
      }
    }

    // Hash password if provided
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Calculate expiration date
    let expiresAt = undefined;
    if (expiresIn) {
      const date = new Date();
      date.setDate(date.getDate() + expiresIn);
      expiresAt = date.toISOString();
    }

    // Create share link document
    const shareLink = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.shareLinksCollectionId,
      ID.unique(),
      {
        fileId,
        userId: user.$id,
        token,
        password: hashedPassword,
        expiresAt,
        permissions,
        views: 0,
        downloads: 0,
        isActive: true
      }
    );

    return shareLink as ShareLinkDocument;
  } catch (error) {
    console.error('Create share link error:', error);
    throw error;
  }
}

export async function getShareLink(token: string): Promise<ShareLinkWithFile | null> {
  try {
    const links = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.shareLinksCollectionId,
      [Query.equal('token', token)]
    );

    if (links.documents.length === 0) {
      return null;
    }

    const shareLink = links.documents[0] as ShareLinkDocument;

    // Check if link is active
    if (!shareLink.isActive) {
      return null;
    }

    // Check expiration
    if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
      return null;
    }

    // Get associated file
    try {
      const file = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.filesCollectionId,
        shareLink.fileId
      );
      
      return { ...shareLink, file };
    } catch {
      // File might be deleted
      return shareLink;
    }
  } catch (error) {
    console.error('Get share link error:', error);
    return null;
  }
}

export async function validateShareAccess(
  token: string, 
  password?: string
): Promise<ShareLinkWithFile | null> {
  try {
    const shareLink = await getShareLink(token);
    if (!shareLink) return null;

    // Check password if required
    if (shareLink.password) {
      if (!password) {
        throw new Error('Password required');
      }
      
      const isValid = await bcrypt.compare(password, shareLink.password);
      if (!isValid) {
        throw new Error('Invalid password');
      }
    }

    return shareLink;
  } catch (error) {
    console.error('Validate share access error:', error);
    throw error;
  }
}

export async function trackShareActivity(
  token: string, 
  action: 'view' | 'download'
) {
  try {
    const links = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.shareLinksCollectionId,
      [Query.equal('token', token)]
    );

    if (links.documents.length === 0) return;

    const shareLink = links.documents[0];
    const updateData: any = {};

    if (action === 'view') {
      updateData.views = (shareLink.views || 0) + 1;
    } else if (action === 'download') {
      updateData.downloads = (shareLink.downloads || 0) + 1;
    }

    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.shareLinksCollectionId,
      shareLink.$id,
      updateData
    );
  } catch (error) {
    console.error('Track share activity error:', error);
    // Don't throw - tracking failures shouldn't break functionality
  }
}

export async function revokeShareLink(linkId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get share link to verify ownership
    const shareLink = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.shareLinksCollectionId,
      linkId
    );

    if (shareLink.userId !== user.$id) {
      throw new Error('Unauthorized: You can only revoke your own share links');
    }

    // Soft delete by marking as inactive
    await databases.updateDocument(
      appwriteConfig.databaseId,
      appwriteConfig.shareLinksCollectionId,
      linkId,
      { isActive: false }
    );

    return { success: true };
  } catch (error) {
    console.error('Revoke share link error:', error);
    throw error;
  }
}

export async function getShareLinks(fileId?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const queries = [
      Query.equal('userId', user.$id),
      Query.equal('isActive', true)
    ];

    if (fileId) {
      queries.push(Query.equal('fileId', fileId));
    }

    const links = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.shareLinksCollectionId,
      queries
    );

    // Get file details for each link
    const linksWithFiles = await Promise.all(
      links.documents.map(async (link) => {
        try {
          const file = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.filesCollectionId,
            link.fileId
          );
          return { ...link, file };
        } catch {
          return { ...link, file: null };
        }
      })
    );

    return linksWithFiles as ShareLinkWithFile[];
  } catch (error) {
    console.error('Get share links error:', error);
    throw error;
  }
}

export async function deleteExpiredShareLinks() {
  try {
    const expiredLinks = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.shareLinksCollectionId,
      [
        Query.lessThan('expiresAt', new Date().toISOString()),
        Query.equal('isActive', true)
      ]
    );

    for (const link of expiredLinks.documents) {
      await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.shareLinksCollectionId,
        link.$id,
        { isActive: false }
      );
    }

    return { cleaned: expiredLinks.documents.length };
  } catch (error) {
    console.error('Delete expired share links error:', error);
    throw error;
  }
}