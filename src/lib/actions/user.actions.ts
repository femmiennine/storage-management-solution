import { account, avatars, databases, ID } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite-config';
import { Models } from 'appwrite';

export interface CreateUserParams {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginUserParams {
  email: string;
  password: string;
}

export async function createAccount({ email, password, fullName }: CreateUserParams) {
  try {
    const newAccount = await account.create(ID.unique(), email, password, fullName);
    
    if (!newAccount) throw new Error('Account creation failed');
    
    const session = await account.createEmailPasswordSession(email, password);
    
    const avatarUrl = avatars.getInitials(fullName);
    
    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email,
        fullName,
        avatar: avatarUrl,
      }
    );
    
    return { account: newAccount, user: newUser };
  } catch (error) {
    console.error('Account creation error:', error);
    throw error;
  }
}

export async function loginUser({ email, password }: LoginUserParams) {
  try {
    // Check if there's already an active session
    try {
      const currentSession = await account.getSession('current');
      if (currentSession) {
        // Delete the existing session first
        await account.deleteSession('current');
      }
    } catch (error) {
      // No active session, continue with login
    }
    
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const currentAccount = await account.get();
    
    if (!currentAccount) return null;
    
    const user = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      []
    );
    
    const currentUser = user.documents.find(doc => doc.accountId === currentAccount.$id);
    
    if (!currentUser) return null;
    
    return currentUser;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function logoutUser() {
  try {
    await account.deleteSession('current');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}