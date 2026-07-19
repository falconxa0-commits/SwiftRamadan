// OAuth provider configuration for NextAuth.js
// In production, set these environment variables:
// GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
// APPLE_CLIENT_ID, APPLE_CLIENT_SECRET

export const googleOAuthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  authorization: {
    params: {
      prompt: 'consent',
      access_type: 'offline',
      response_type: 'code',
    },
  },
};

export const appleOAuthConfig = {
  clientId: process.env.APPLE_CLIENT_ID || '',
  clientSecret: process.env.APPLE_CLIENT_SECRET || '',
  scope: 'name email',
};

export function isOAuthConfigured(provider: 'google' | 'apple'): boolean {
  if (provider === 'google') {
    return !!(googleOAuthConfig.clientId && googleOAuthConfig.clientSecret);
  }
  if (provider === 'apple') {
    return !!(appleOAuthConfig.clientId && appleOAuthConfig.clientSecret);
  }
  return false;
}
