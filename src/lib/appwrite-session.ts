import { Client, Account } from 'appwrite';
import { appwriteConfig } from './appwrite-config';
import type { NextRequest } from 'next/server';

export async function createSessionClient(request: NextRequest) {
  const client = new Client()
    .setEndpoint(appwriteConfig.endpoint)
    .setProject(appwriteConfig.projectId);

  // Get session from cookie - try multiple possible cookie names
  const projectId = appwriteConfig.projectId;
  const session = request.cookies.get(`a_session_${projectId}`) ||
                 request.cookies.get(`a_session_${projectId}_legacy`) ||
                 request.cookies.get('appwrite-session');
  
  if (!session) {
    throw new Error('No session found');
  }

  // Set the session in the client
  client.setSession(session.value);

  return {
    client,
    account: new Account(client),
  };
}