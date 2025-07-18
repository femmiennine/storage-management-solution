"use client";

import { useUser } from '@/contexts/UserContext';
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '@/types/roles';

export function usePermissions() {
  const { role } = useUser();

  return {
    can: (permission: Permission) => hasPermission(role, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(role, permissions),
    canAll: (permissions: Permission[]) => hasAllPermissions(role, permissions),
    role
  };
}