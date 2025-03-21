import { compare } from 'bcrypt-ts';
import NextAuth, { type User, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

import { getUser, saveUser } from '@/lib/db/queries';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db/queries';

import { authConfig } from './auth.config';

interface ExtendedSession extends Session {
  user: User;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === 'development',
  ...authConfig,
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        // Verify email domain is ep.org.hk
        if (!email || !email.endsWith('@ep.org.hk')) {
          return null;
        }

        const users = await getUser(email);
        if (users.length === 0) {
          return null;
        }
        
        // Ensure password is not null/undefined before comparing
        if (!users[0].password) {
          return null;
        }
        
        const passwordsMatch = await compare(password, users[0].password);
        if (!passwordsMatch) {
          return null;
        }
        
        return users[0] as any;
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      // For credentials, verify domain
      if (account?.provider === 'credentials') {
        const email = user.email;
        if (!email || !email.endsWith('@ep.org.hk')) {
          return false;
        }
        return true;
      }
      
      // For Google authentication
      if (account?.provider === "google") {
        // Make sure we have an email from Google
        if (!profile?.email) {
          return '/login?error=AccessDenied';
        }
        
        // First, verify domain is ep.org.hk
        const isValidDomain = profile.email.endsWith('@ep.org.hk');
        
        if (!isValidDomain) {
          // Return custom error path for non-ep.org.hk domains
          return '/login?error=AccessDenied';
        }
        
        // Check if email exists with a password
        try {
          const existingUsers = await getUser(profile.email);
          
          // If user exists with a password, prevent Google login to avoid confusion
          if (existingUsers.length > 0 && existingUsers[0].password) {
            return '/login?error=AccountExists';
          }
        } catch (error) {
          // Handle error silently
        }
      }
      
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
        
        // Ensure we capture all user information
        if (user.email) {
          token.email = user.email;
        }
        
        if (user.name) {
          token.name = user.name;
        }
        
        if (user.image) {
          token.picture = user.image;
        }
      }
      
      // For Google auth, copy profile info to token if missing
      if (account?.provider === 'google' && profile) {
        if (profile.email && !token.email) {
          token.email = profile.email;
        }
        
        if (profile.name && !token.name) {
          token.name = profile.name;
        }
        
        if (profile.picture && !token.picture) {
          token.picture = profile.picture;
        }
      }

      return token;
    },
    async session({
      session,
      token,
    }: {
      session: ExtendedSession;
      token: any;
    }) {
      if (session?.user) {
        session.user.id = token.id as string;
        
        // Make sure we have all necessary user fields
        // This is especially important when using multiple providers
        if (token.email && !session.user.email) {
          session.user.email = token.email;
        }
        
        if (token.name && !session.user.name) {
          session.user.name = token.name;
        }
        
        if (token.picture && !session.user.image) {
          session.user.image = token.picture;
        }
        
        // Keep the user tables in sync for compatibility
        try {
          if (session.user.email) {
            // This will now ensure both tables have the user
            await saveUser({
              id: session.user.id,
              email: session.user.email,
            });
          }
        } catch (error) {
          // Handle error silently
        }
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Handle specific error cases
      if (url.includes('error=AccountExists')) {
        return `${baseUrl}/login?error=AccountExists`;
      }
      
      if (url.includes('error=AccessDenied')) {
        return `${baseUrl}/login?error=AccessDenied`;  
      }
      
      // If we have an OAuth callback with code, direct to home
      if (url.includes('/login?code=')) {
        return baseUrl;
      }
      
      // Allows relative callback URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Default redirect to root page
      return `${baseUrl}/`;
    },
  },
});