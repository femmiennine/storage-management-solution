"use client";

import { useUser } from '@/contexts/UserContext';
import { usePermissions } from '@/hooks/usePermissions';
import { PermissionGate } from '@/components/PermissionGate';
import { Permission, UserRole } from '@/types/roles';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Trash2, 
  Share2, 
  FolderPlus,
  Settings,
  Users,
  Shield
} from 'lucide-react';

export default function DemoPermissionsPage() {
  const { user, role } = useUser();
  const { can } = usePermissions();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Role-Based Access Control Demo</h1>
        <p className="text-muted-foreground mt-2">
          This page demonstrates how different user roles see different features
        </p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-4">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Current User Info</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground">Role:</span>
              <Badge variant={role === UserRole.ADMIN ? "destructive" : "default"}>
                {role.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>
        
        {user && (
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Name:</span> {user.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Available Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Operations */}
          <div className="space-y-2">
            <h3 className="font-medium mb-2">File Operations</h3>
            
            <PermissionGate 
              permissions={Permission.VIEW_FILES}
              fallback={
                <Button variant="outline" disabled className="w-full justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  View Files (No Permission)
                </Button>
              }
            >
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                View Files ✓
              </Button>
            </PermissionGate>

            <PermissionGate 
              permissions={Permission.UPLOAD_FILES}
              fallback={
                <Button variant="outline" disabled className="w-full justify-start">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files (No Permission)
                </Button>
              }
            >
              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Upload Files ✓
              </Button>
            </PermissionGate>

            <PermissionGate 
              permissions={Permission.DELETE_FILES}
              fallback={
                <Button variant="outline" disabled className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Files (No Permission)
                </Button>
              }
            >
              <Button variant="outline" className="w-full justify-start">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Files ✓
              </Button>
            </PermissionGate>

            <PermissionGate 
              permissions={Permission.SHARE_FILES}
              fallback={
                <Button variant="outline" disabled className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Files (No Permission)
                </Button>
              }
            >
              <Button variant="outline" className="w-full justify-start">
                <Share2 className="h-4 w-4 mr-2" />
                Share Files ✓
              </Button>
            </PermissionGate>
          </div>

          {/* Admin Operations */}
          <div className="space-y-2">
            <h3 className="font-medium mb-2">Admin Operations</h3>
            
            <PermissionGate 
              permissions={Permission.MANAGE_USERS}
              fallback={
                <Button variant="outline" disabled className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users (Admin Only)
                </Button>
              }
            >
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" />
                Manage Users ✓
              </Button>
            </PermissionGate>

            <PermissionGate 
              permissions={Permission.VIEW_ALL_FILES}
              fallback={
                <Button variant="outline" disabled className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  View All Files (Admin Only)
                </Button>
              }
            >
              <Button variant="outline" className="w-full justify-start">
                <Shield className="h-4 w-4 mr-2" />
                View All Files ✓
              </Button>
            </PermissionGate>

            <PermissionGate 
              permissions={Permission.MANAGE_SETTINGS}
              fallback={
                <Button variant="outline" disabled className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  System Settings (Admin Only)
                </Button>
              }
            >
              <Button variant="outline" className="w-full justify-start">
                <Settings className="h-4 w-4 mr-2" />
                System Settings ✓
              </Button>
            </PermissionGate>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Permission Check Results</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Can view files:</span>
            <Badge variant={can(Permission.VIEW_FILES) ? "default" : "secondary"}>
              {can(Permission.VIEW_FILES) ? "YES" : "NO"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Can upload files:</span>
            <Badge variant={can(Permission.UPLOAD_FILES) ? "default" : "secondary"}>
              {can(Permission.UPLOAD_FILES) ? "YES" : "NO"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Can delete files:</span>
            <Badge variant={can(Permission.DELETE_FILES) ? "default" : "secondary"}>
              {can(Permission.DELETE_FILES) ? "YES" : "NO"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Can manage users:</span>
            <Badge variant={can(Permission.MANAGE_USERS) ? "default" : "secondary"}>
              {can(Permission.MANAGE_USERS) ? "YES" : "NO"}
            </Badge>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-muted">
        <h2 className="text-lg font-semibold mb-2">How it works</h2>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Guests</strong> have no permissions and can only access public pages</li>
          <li>• <strong>Users</strong> can view, upload, delete, and share their own files</li>
          <li>• <strong>Admins</strong> have all user permissions plus system management</li>
          <li>• The middleware automatically redirects unauthorized users</li>
          <li>• Components use PermissionGate to show/hide features based on role</li>
        </ul>
      </Card>
    </div>
  );
}