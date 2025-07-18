import { account, avatars, databases, ID, Query } from '@/lib/appwrite';
import { appwriteConfig } from '@/lib/appwrite-config';

export interface GoogleUserInfo {
  email: string;
  name: string;
  sub: string; // Google user ID
  picture?: string;
}

export async function signInWithGoogle(googleUserInfo: GoogleUserInfo) {
  try {
    // First, check if user exists in our database
    const existingUsers = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.usersCollectionId,
      [Query.equal('email', googleUserInfo.email)]
    );

    if (existingUsers.documents.length > 0) {
      // User exists, try to create a session
      const user = existingUsers.documents[0];
      
      // For Google OAuth, we need to use a different approach
      // Create a custom token or use Appwrite's OAuth directly
      // For now, we'll create a magic URL session
      const token = await account.createMagicURLToken(
        ID.unique(),
        googleUserInfo.email,
        `${window.location.origin}/auth/callback`
      );
      
      return { user, token };
    } else {
      // User doesn't exist, create new user
      // First create an anonymous session to get permissions
      await account.createAnonymousSession();
      
      // Create user document
      const avatarUrl = googleUserInfo.picture || avatars.getInitials(googleUserInfo.name);
      
      const newUser = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        ID.unique(),
        {
          accountId: googleUserInfo.sub,
          email: googleUserInfo.email,
          fullName: googleUserInfo.name,
          avatar: avatarUrl,
          provider: 'google'
        }
      );
      
      // Create magic URL for the new user
      const token = await account.createMagicURLToken(
        ID.unique(),
        googleUserInfo.email,
        `${window.location.origin}/auth/callback`
      );
      
      return { user: newUser, token, isNewUser: true };
    }
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export async function createGoogleSession(userId: string, secret: string) {
  try {
    const session = await account.updateMagicURLSession(userId, secret);
    return session;
  } catch (error) {
    console.error('Session creation error:', error);
    throw error;
  }
}