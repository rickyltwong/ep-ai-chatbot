'use server';

import { auth } from '@/app/(auth)/auth';
import { saveUserWithPassword } from '@/lib/db/queries';
import { generateUUID } from '@/lib/utils';

// These imports are safe in a server component/action
import { db } from '@/lib/db/queries';
import { user, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RegisterResult {
  status: 'success' | 'user_exists' | 'unauthorized' | 'failed';
}

export async function registerUser({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name?: string;
}): Promise<RegisterResult> {
  try {
    // Security check - only admin can register users
    const session = await auth();

    if (!session?.user || session.user.email !== process.env.ADMIN_USER) {
      console.warn('Unauthorized attempt to register user:', email);
      return { status: 'unauthorized' };
    }

    // Validate email domain
    if (!email.endsWith('@ep.org.hk')) {
      console.warn('Invalid email domain for registration:', email);
      return { status: 'failed' };
    }

    // Check if user already exists in either table
    const appUsers = await db.select().from(user).where(eq(user.email, email));
    const authUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    if (appUsers.length > 0 || authUsers.length > 0) {
      return { status: 'user_exists' };
    }

    // Register the user with a generated ID
    const userId = generateUUID();
    await saveUserWithPassword({
      id: userId,
      email,
      password,
      name,
    });

    console.log('User registered successfully:', email);
    return { status: 'success' };
  } catch (error) {
    console.error('Error registering user:', error);
    return { status: 'failed' };
  }
}

export async function getAllUsers() {
  try {
    // Security check - only admin can view all users
    const session = await auth();

    if (!session?.user || session.user.email !== process.env.ADMIN_USER) {
      console.warn('Unauthorized attempt to view all users');
      return { status: 'unauthorized', users: [] };
    }

    // Get users from both tables
    const appUsers = await db.select().from(user);
    const authUsers = await db.select().from(users);

    // Combine and deduplicate users based on email
    const combinedUsers = [
      ...appUsers,
      ...authUsers.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name || undefined,
      })),
    ];

    // Deduplicate by email
    const uniqueUsers = Array.from(
      new Map(combinedUsers.map((user) => [user.email, user])).values(),
    );

    return {
      status: 'success',
      users: uniqueUsers.sort((a, b) => a.email.localeCompare(b.email)),
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { status: 'failed', users: [] };
  }
}
