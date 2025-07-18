import { ID, Query } from 'appwrite';
import { databases } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite-config';
import { getCurrentUser } from './user.actions';

export type ActivityAction = 
  | 'file_upload'
  | 'file_download'
  | 'file_delete'
  | 'file_share'
  | 'file_move'
  | 'folder_create'
  | 'folder_delete'
  | 'folder_rename'
  | 'share_access'
  | 'bulk_delete'
  | 'bulk_download'
  | 'bulk_move';

export interface ActivityDocument {
  $id: string;
  userId: string;
  action: ActivityAction;
  resourceType: 'file' | 'folder' | 'share';
  resourceId: string;
  resourceName: string;
  metadata?: string; // Stored as JSON string in database
  ipAddress?: string;
  userAgent?: string;
  $createdAt: string;
}

export interface LogActivityParams {
  action: ActivityAction;
  resourceType: 'file' | 'folder' | 'share';
  resourceId: string;
  resourceName: string;
  metadata?: Record<string, any>;
}

export async function logActivity({
  action,
  resourceType,
  resourceId,
  resourceName,
  metadata = {}
}: LogActivityParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return;

    // Get user's IP and user agent from headers (in a real app)
    // For now, we'll use placeholders
    const activity = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.activitiesCollectionId,
      ID.unique(),
      {
        userId: user.$id,
        action,
        resourceType,
        resourceId,
        resourceName,
        metadata: JSON.stringify(metadata), // Convert object to string
        ipAddress: 'Unknown', // In production, get from request headers
        userAgent: 'Unknown', // In production, get from request headers
      }
    );

    return activity as unknown as ActivityDocument;
  } catch (error) {
    console.error('Log activity error:', error);
    // Don't throw - we don't want activity logging failures to break the app
  }
}

export async function getActivities(
  userId?: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const queries = [
      Query.orderDesc('$createdAt'),
      Query.limit(limit),
      Query.offset(offset)
    ];

    // If userId provided, filter by user, otherwise get all activities for current user
    if (userId) {
      queries.push(Query.equal('userId', userId));
    } else {
      queries.push(Query.equal('userId', user.$id));
    }

    const activities = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.activitiesCollectionId,
      queries
    );

    return {
      activities: activities.documents as unknown as ActivityDocument[],
      total: activities.total
    };
  } catch (error) {
    console.error('Get activities error:', error);
    throw error;
  }
}

export async function getResourceActivities(
  resourceId: string,
  resourceType: 'file' | 'folder' | 'share'
) {
  try {
    const activities = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.activitiesCollectionId,
      [
        Query.equal('resourceId', resourceId),
        Query.equal('resourceType', resourceType),
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ]
    );

    return activities.documents as unknown as ActivityDocument[];
  } catch (error) {
    console.error('Get resource activities error:', error);
    throw error;
  }
}

export async function getRecentActivities(hours: number = 24) {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const since = new Date();
    since.setHours(since.getHours() - hours);

    const activities = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.activitiesCollectionId,
      [
        Query.equal('userId', user.$id),
        Query.greaterThanEqual('$createdAt', since.toISOString()),
        Query.orderDesc('$createdAt'),
        Query.limit(50)
      ]
    );

    return activities.documents as unknown as ActivityDocument[];
  } catch (error) {
    console.error('Get recent activities error:', error);
    throw error;
  }
}

// Helper function to format activity messages
export function formatActivityMessage(activity: ActivityDocument): string {
  const actionMessages: Record<ActivityAction, string> = {
    file_upload: 'uploaded file',
    file_download: 'downloaded file',
    file_delete: 'deleted file',
    file_share: 'shared file',
    file_move: 'moved file',
    folder_create: 'created folder',
    folder_delete: 'deleted folder',
    folder_rename: 'renamed folder',
    share_access: 'accessed shared file',
    bulk_delete: 'deleted multiple files',
    bulk_download: 'downloaded multiple files',
    bulk_move: 'moved multiple files'
  };

  const message = actionMessages[activity.action] || activity.action;
  
  // Parse metadata if it exists
  let metadata: any = {};
  if (activity.metadata) {
    try {
      metadata = JSON.parse(activity.metadata);
    } catch (e) {
      // If parsing fails, treat as empty object
    }
  }
  
  if (metadata.count) {
    return `${message} (${metadata.count} items)`;
  }
  
  if (metadata.destination) {
    return `${message} to ${metadata.destination}`;
  }
  
  return `${message} "${activity.resourceName}"`;
}