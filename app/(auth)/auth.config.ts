import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    newUser: '/',
    error: '/login',
  },
  providers: [
    // added later in auth.ts since it requires bcrypt which is only compatible with Node.js
    // while this file is also used in non-Node.js environments
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnRoot = nextUrl.pathname === '/';
      const isOnLogin = nextUrl.pathname.startsWith('/login');
      const isOnRegister = nextUrl.pathname.startsWith('/register');
      const isAuthCallback = nextUrl.pathname.startsWith('/api/auth');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');

      // Always allow auth callbacks to proceed
      if (isAuthCallback) {
        return true;
      }

      // Admin page restrictions - only allow process.env.ADMIN_USER
      if (isOnAdmin) {
        if (isLoggedIn && auth?.user?.email === process.env.ADMIN_USER) {
          return true;
        }
        // Redirect to login if not logged in, otherwise to home if not authorized
        return isLoggedIn
          ? Response.redirect(new URL('/', nextUrl as unknown as URL))
          : Response.redirect(new URL('/login', nextUrl as unknown as URL));
      }

      // Redirect authenticated users away from login/register
      if (isLoggedIn && (isOnLogin || isOnRegister)) {
        return Response.redirect(new URL('/', nextUrl as unknown as URL));
      }

      // Allow access to login and register pages for non-authenticated users
      if (isOnRegister || isOnLogin) {
        return true;
      }

      // For the root path and other protected routes, check authentication
      if (isLoggedIn) {
        return true;
      } else if (isOnRoot) {
        return Response.redirect(new URL('/login', nextUrl as unknown as URL));
      }

      return false;
    },
  },
} satisfies NextAuthConfig;
