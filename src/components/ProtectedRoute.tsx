"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { UserRole, Permission, hasPermission, hasAnyPermission } from '@/types/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, ANY permission is enough
  fallbackUrl?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermissions,
  requireAll = false,
  fallbackUrl = '/sign-in',
  fallback
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, role, isLoading, isAuthenticated } = useUser();

  useEffect(() => {
    if (!isLoading) {
      // Check if user is authenticated
      if (!isAuthenticated) {
        router.push(fallbackUrl);
        return;
      }

      // Check role if specified
      if (requiredRole && role !== requiredRole && role !== UserRole.ADMIN) {
        // Admin can access everything
        router.push(fallbackUrl);
        return;
      }

      // Check permissions if specified
      if (requiredPermissions && requiredPermissions.length > 0) {
        const hasRequiredPermissions = requireAll
          ? requiredPermissions.every(permission => hasPermission(role, permission))
          : hasAnyPermission(role, requiredPermissions);

        if (!hasRequiredPermissions) {
          router.push(fallbackUrl);
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, role, requiredRole, requiredPermissions, requireAll, fallbackUrl, router]);

  // Show loading state
  if (isLoading) {
    return fallback || (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render anything if not authorized (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // Check role
  if (requiredRole && role !== requiredRole && role !== UserRole.ADMIN) {
    return null;
  }

  // Check permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll
      ? requiredPermissions.every(permission => hasPermission(role, permission))
      : hasAnyPermission(role, requiredPermissions);

    if (!hasRequiredPermissions) {
      return null;
    }
  }

  return <>{children}</>;
}