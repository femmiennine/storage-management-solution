"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Link2, 
  Calendar, 
  Eye, 
  Download, 
  Lock, 
  Copy, 
  Trash2,
  Check,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCurrentUser } from '@/lib/actions/user.actions';
import { getShareLinks, revokeShareLink, ShareLinkWithFile } from '@/lib/actions/share.actions';

export default function SharesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [shareLinks, setShareLinks] = useState<ShareLinkWithFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/sign-in');
        return;
      }
      setUser(currentUser);
      
      const links = await getShareLinks();
      setShareLinks(links);
    } catch (error) {
      console.error('Error fetching share links data:', error);
      // Don't redirect on error - just show empty state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const copyShareLink = async (token: string, linkId: string) => {
    try {
      const url = `${window.location.origin}/share/${token}`;
      await navigator.clipboard.writeText(url);
      setCopiedId(linkId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleRevoke = async (linkId: string) => {
    if (!confirm('Are you sure you want to revoke this share link?')) return;

    try {
      await revokeShareLink(linkId);
      await fetchData();
    } catch (error) {
      console.error('Error revoking link:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getExpiryStatus = (expiresAt?: string) => {
    if (!expiresAt) return { text: 'Never', variant: 'default' as const };
    
    const expiry = new Date(expiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) return { text: 'Expired', variant: 'destructive' as const };
    if (daysLeft === 0) return { text: 'Today', variant: 'destructive' as const };
    if (daysLeft === 1) return { text: '1 day', variant: 'destructive' as const };
    if (daysLeft <= 7) return { text: `${daysLeft} days`, variant: 'secondary' as const };
    return { text: `${daysLeft} days`, variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Shared Links</h1>
          <p className="text-muted-foreground mt-1">
            Manage your shared file links
          </p>
        </div>

        {/* Stats Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shareLinks.length}</div>
          </CardContent>
        </Card>

        {/* Share Links Table */}
        {shareLinks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Link2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No shared links</p>
              <p className="text-muted-foreground mt-1">
                Share a file to see it here
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shareLinks.map((link) => {
                  const expiry = getExpiryStatus(link.expiresAt);
                  
                  return (
                    <TableRow key={link.$id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {link.file ? (
                            <>
                              <span className="font-medium truncate max-w-[200px]">
                                {link.file.fileName}
                              </span>
                              {link.password && (
                                <Lock className="h-3 w-3 text-muted-foreground" />
                              )}
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">
                              File deleted
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(link.$createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={expiry.variant}>
                          {expiry.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyShareLink(link.token, link.$id)}
                          >
                            {copiedId === link.$id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(`/share/${link.token}`, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleRevoke(link.$id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}