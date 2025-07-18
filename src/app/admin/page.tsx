"use client";

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserRole } from '@/types/roles';
import { useUser } from '@/contexts/UserContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Settings, Activity, Database } from 'lucide-react';

function AdminDashboard() {
  const { user } = useUser();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, {user?.name}. Manage your storage system from here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">1,234</p>
            </div>
            <Users className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Storage Used</p>
              <p className="text-2xl font-bold">2.4TB</p>
            </div>
            <Database className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="text-2xl font-bold">342</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">System Health</p>
              <p className="text-2xl font-bold text-green-600">Good</p>
            </div>
            <Settings className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Database className="h-4 w-4 mr-2" />
              Database Maintenance
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>New user registration</span>
              <span className="text-muted-foreground">2 min ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Storage quota updated</span>
              <span className="text-muted-foreground">15 min ago</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>System backup completed</span>
              <span className="text-muted-foreground">1 hour ago</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute 
      requiredRole={UserRole.ADMIN}
      fallbackUrl="/dashboard"
    >
      <AdminDashboard />
    </ProtectedRoute>
  );
}