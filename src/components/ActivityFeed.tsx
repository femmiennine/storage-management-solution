"use client";

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  FileText, 
  Download, 
  Trash2, 
  Share2, 
  FolderPlus,
  FolderOpen,
  FileUp,
  Users,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  getActivities, 
  formatActivityMessage, 
  ActivityDocument,
  ActivityAction 
} from '@/lib/actions/activity.actions';

interface ActivityFeedProps {
  userId?: string;
  resourceId?: string;
  resourceType?: 'file' | 'folder' | 'share';
  limit?: number;
  showLoadMore?: boolean;
}

const activityIcons: Record<ActivityAction, any> = {
  file_upload: FileUp,
  file_download: Download,
  file_delete: Trash2,
  file_share: Share2,
  file_move: FileText,
  folder_create: FolderPlus,
  folder_delete: Trash2,
  folder_rename: FolderOpen,
  share_access: Users,
  bulk_delete: Trash2,
  bulk_download: Download,
  bulk_move: FolderOpen,
};

export function ActivityFeed({ 
  userId, 
  resourceId, 
  resourceType,
  limit = 20,
  showLoadMore = true 
}: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchActivities = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const result = await getActivities(userId, limit, isLoadMore ? offset : 0);
      
      if (isLoadMore) {
        setActivities(prev => [...prev, ...result.activities]);
      } else {
        setActivities(result.activities);
      }
      
      setOffset(isLoadMore ? offset + limit : limit);
      setHasMore(result.activities.length === limit);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [userId, resourceId, resourceType]);

  const handleLoadMore = () => {
    fetchActivities(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No activity yet</p>
          <p className="text-muted-foreground mt-1">
            Activities will appear here when you perform actions
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = activityIcons[activity.action] || Activity;
        const isDestructive = activity.action.includes('delete');
        
        return (
          <Card key={activity.$id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback 
                    className={isDestructive ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}
                  >
                    <Icon className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">You</span>{' '}
                    {formatActivityMessage(activity)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.$createdAt), { addSuffix: true })}
                  </p>
                  {activity.metadata && (() => {
                    try {
                      const metadata = JSON.parse(activity.metadata);
                      return Object.keys(metadata).length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {metadata.fileSize && (
                            <span>Size: {formatFileSize(metadata.fileSize)}</span>
                          )}
                          {metadata.count && (
                            <span>{metadata.count} items</span>
                          )}
                        </div>
                      );
                    } catch (e) {
                      return null;
                    }
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {showLoadMore && hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}