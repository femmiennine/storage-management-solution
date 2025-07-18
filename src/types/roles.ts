export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  ADMIN = 'admin'
}

export enum Permission {
  // File permissions
  VIEW_FILES = 'view_files',
  UPLOAD_FILES = 'upload_files',
  DELETE_FILES = 'delete_files',
  SHARE_FILES = 'share_files',
  
  // Folder permissions
  CREATE_FOLDERS = 'create_folders',
  DELETE_FOLDERS = 'delete_folders',
  
  // User management (admin only)
  MANAGE_USERS = 'manage_users',
  VIEW_ALL_FILES = 'view_all_files',
  
  // System settings
  MANAGE_SETTINGS = 'manage_settings'
}

// Define which permissions each role has
export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.GUEST]: [], // No permissions for guests
  [UserRole.USER]: [
    Permission.VIEW_FILES,
    Permission.UPLOAD_FILES,
    Permission.DELETE_FILES,
    Permission.SHARE_FILES,
    Permission.CREATE_FOLDERS,
    Permission.DELETE_FOLDERS
  ],
  [UserRole.ADMIN]: [
    Permission.VIEW_FILES,
    Permission.UPLOAD_FILES,
    Permission.DELETE_FILES,
    Permission.SHARE_FILES,
    Permission.CREATE_FOLDERS,
    Permission.DELETE_FOLDERS,
    Permission.MANAGE_USERS,
    Permission.VIEW_ALL_FILES,
    Permission.MANAGE_SETTINGS
  ]
};

// Helper to check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return RolePermissions[role]?.includes(permission) ?? false;
}

// Helper to check if user has any of the required permissions
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

// Helper to check if user has all required permissions
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}