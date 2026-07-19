// NextAuth v4 Configuration — SwiftRamadan Authentication
// Credentials provider (email+password), Google, Apple OAuth
// JWT session strategy with user role + id in session

import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import AppleProvider from 'next-auth/providers/apple';
import { googleOAuthConfig, appleOAuthConfig, isOAuthConfigured } from '@/lib/oauth';
import { verifyPassword } from '@/lib/auth-utils';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  secret: (() => {
    if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Auth] WARNING: Using development-only secret. Set NEXTAUTH_SECRET for production.');
      return 'swift-ramadan-dev-secret-for-development-only';
    }
    // During Next.js build (next build), NODE_ENV is 'production' but the app
    // isn't actually running — it's just collecting page data. Allow build to
    // proceed with a placeholder; the real check happens at runtime via the
    // startup validation in scripts/start-production.sh
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return 'build-time-placeholder-do-not-use-in-runtime';
    }
    throw new Error('NEXTAUTH_SECRET environment variable is required in production');
  })(),

  // Custom sign-in page
  pages: {
    signIn: '/',
    error: '/',
  },

  // JWT session strategy
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  providers: [
    // Credentials provider — email + password using bcrypt verify
    CredentialsProvider({
      id: 'credentials',
      name: 'SwiftRamadan',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'your@email.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            throw new Error('No account found with this email');
          }

          // Check if the user has a real password
          if (!user.password || user.password.length === 0) {
            throw new Error('This account uses OTP login. Please sign in with your phone number.');
          }

          const isValid = await verifyPassword(credentials.password, user.password);

          if (!isValid) {
            throw new Error('Incorrect password');
          }

          // Return user object for JWT token
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          // Re-throw known errors, wrap unknown ones
          if (error instanceof Error) throw error;
          throw new Error('Authentication failed. Please try again.');
        }
      },
    }),

    // Google provider — only add if configured
    ...(isOAuthConfigured('google')
      ? [
          GoogleProvider({
            clientId: googleOAuthConfig.clientId,
            clientSecret: googleOAuthConfig.clientSecret,
            authorization: googleOAuthConfig.authorization,
          }),
        ]
      : []),

    // Apple provider — only add if configured
    ...(isOAuthConfigured('apple')
      ? [
          AppleProvider({
            clientId: appleOAuthConfig.clientId,
            clientSecret: appleOAuthConfig.clientSecret,
          }),
        ]
      : []),
  ],

  callbacks: {
    // JWT callback — include user role + id in the token
    async jwt({ token, user, account }) {
      // On first sign-in, add user data to the token
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'customer';
      }

      // For OAuth providers, look up or create the user in the database
      if (account?.provider === 'google' || account?.provider === 'apple') {
        try {
          const existingUser = await db.user.findUnique({
            where: { email: token.email! },
          });

          if (existingUser) {
            token.id = existingUser.id;
            token.role = existingUser.role;
          }
          // If user doesn't exist, they'll need to sign up first
          // The JWT will still have the email from OAuth but no role/id
        } catch (error) {
          console.error('[Auth] OAuth user lookup error:', error);
        }
      }

      return token;
    },

    // Session callback — include user role + id in the session
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },

  // Debug in development
  debug: process.env.NODE_ENV === 'development',
};
