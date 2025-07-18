"use client";

import { usePermissions } from '@/hooks/usePermissions';
import { Permission } from '@/types/roles';

interface PermissionGateProps {
  children: React.ReactNode;
  permissions: Permission | Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGate({ 
  children, 
  permissions, 
  requireAll = false,
  fallback = null 
}: PermissionGateProps) {
  const { can, canAny, canAll } = usePermissions();

  const hasPermission = Array.isArray(permissions)
    ? requireAll ? canAll(permissions) : canAny(permissions)
    : can(permissions);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}