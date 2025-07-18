import { databases, ID } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite-config';
import { getCurrentUser } from './user.actions';
import { Query } from 'appwrite';
import { logActivity } from './activity.actions';
// Removed bcrypt import - will use simple obfuscation for demo

export interface ShareLinkDocument {
  $id: string;
  fileId: string;
  userId: string;
  token: string;
  password?: string;
  expiresAt?: string;
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
    let attempts = 0;
    while (tokenExists && attempts < 10) {
      try {
        const existingTokens = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.shareLinksCollectionId,
          [Query.equal('token', token)]
        );
        if (existingTokens.documents.length > 0) {
          token = generateShareToken();
          attempts++;
        } else {
          tokenExists = false;
        }
      } catch (error) {
        tokenExists = false;
      }
    }

    // For demo purposes, we'll store password as base64 encoded
    // In production, use proper server-side hashing
    let hashedPassword = undefined;
    if (password) {
      hashedPassword = btoa(password);
    }

    // Calculate expiration date
    let expiresAt = undefined;
    if (expiresIn) {
      const date = new Date();
      date.setDate(date.getDate() + expiresIn);
      expiresAt = date.toISOString();
    }

    // Build document data object
    const documentData: any = {
      fileId,
      userId: user.$id,
      token
    };
    
    // Only add optional fields if they have values
    if (hashedPassword) {
      documentData.password = hashedPassword;
    }
    
    if (expiresAt) {
      documentData.expiresAt = expiresAt;
    }
    
    const shareLink = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.shareLinksCollectionId,
      ID.unique(),
      documentData
    );

    // Log activity
    try {
      await logActivity({
        action: 'file_share',
        resourceType: 'file',
        resourceId: fileId,
        resourceName: file.fileName,
        metadata: {
          shareId: shareLink.$id,
          hasPassword: !!password,
          expiresIn,
          permissions
        }
      });
    } catch (activityError) {
      console.error('Failed to log activity:', activityError);
      // Don't fail the share creation if activity logging fails
    }

    // Return the document
    return shareLink as unknown as ShareLinkDocument;
  } catch (error: any) {
    console.error('Create share link error:', error);
    if (error.message) {
      console.error('Error message:', error.message);
    }
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

    const shareLink = links.documents[0] as unknown as ShareLinkDocument;

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
      
      // For demo purposes, compare base64 encoded passwords
      // In production, use proper server-side validation
      const isValid = btoa(password) === shareLink.password;
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

// Removed trackShareActivity since we don't have views/downloads fields

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

    // Delete the share link
    await databases.deleteDocument(
      appwriteConfig.databaseId,
      appwriteConfig.shareLinksCollectionId,
      linkId
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
      Query.equal('userId', user.$id)
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

    return linksWithFiles as unknown as ShareLinkWithFile[];
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
        Query.lessThan('expiresAt', new Date().toISOString())
      ]
    );

    for (const link of expiredLinks.documents) {
      await databases.deleteDocument(
        appwriteConfig.databaseId,
        appwriteConfig.shareLinksCollectionId,
        link.$id
      );
    }

    return { cleaned: expiredLinks.documents.length };
  } catch (error) {
    console.error('Delete expired share links error:', error);
    throw error;
  }
}