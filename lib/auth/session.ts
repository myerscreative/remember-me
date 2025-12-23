import { getServerSession } from 'next-auth';
import { authOptions } from './auth-options';

/**
 * Get the current session server-side
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the user's access token
 */
export async function getAccessToken(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.accessToken || null;
}

/**
 * Require authentication - throw error if not authenticated
 */
export async function requireAuth() {
  const session = await getCurrentSession();
  
  if (!session || !session.user) {
    throw new Error('Unauthorized - please sign in');
  }
  
  return session;
}
