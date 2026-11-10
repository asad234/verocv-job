import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import LinkedInProvider from 'next-auth/providers/linkedin'
import GitHubProvider from 'next-auth/providers/github'
import type { NextAuthOptions } from 'next-auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import axios from 'axios'
import crypto from 'crypto'

// client-admin and client-manager users should never see the onboarding flow,
// regardless of onboardingCompleted state — their accounts are set up directly
// by an admin/business-admin, not through self-serve signup.
const isOnboardingExemptRole = (roles: unknown) =>
  roles === 'client-admin' || roles === 'client-manager'

export const authOptions: NextAuthOptions = {
  providers: [
    // Credentials provider for email/password login auth
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('🔐 Credentials login attempt:', credentials?.email)

          // Sending a POST request to your API for login
          const res = await axios.post(`${process.env.NEXTAUTH_URL}/api/users/login`, {
            email: credentials?.email,
            password: credentials?.password,
          })

          // If login is successful and a token is returned
          if (res.data?.token) {
            console.log('✅ Credentials login successful:', res.data.user.id)
            return {
              id: res.data.user.id.toString(),
              email: res.data.user.email,
              name: res.data.user.name || '',
              roles: res.data.user.roles || ['client'],
              token: res.data.token,
              isNewUser: isOnboardingExemptRole(res.data.user.roles)
                ? false
                : res.data.isNewUser || !res.data.user.onboardingCompleted, // 👈 important
            }
          }

          // Throw error if no token is received
          throw new Error('Invalid credentials')
        } catch (error: any) {
          console.error(
            '❌ Credentials login failed:',
            error.response?.data?.message || error.message,
          )
          throw new Error(error.response?.data?.message || 'Authentication failed')
        }
      },
    }),
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: 'openid email profile',
        },
      },
    }),
    // LinkedIn OAuth Provider
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      issuer: 'https://www.linkedin.com/oauth', // 👈 fixes iss mismatch
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
    }),

    // GitHub OAuth Provider
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Handle sign-in callback - this runs when user signs in
    async signIn({ user, account, profile }) {
      console.log('🔍 SignIn callback triggered:', {
        provider: account?.provider,
        email: user.email,
        name: user.name,
      })

      // For OAuth providers (Google, LinkedIn, GitHub)
      if (account?.provider !== 'credentials') {
        try {
          const payload = await getPayload({ config })

          // Ensure we have required data
          if (!user.email || !account) {
            console.error('❌ No email provided by OAuth provider or account is null')
            return false
          }

          // Check if user already exists
          const existingUser = await payload.find({
            collection: 'users',
            where: {
              email: { equals: user.email },
            },
            limit: 1,
          })

          if (existingUser.docs.length === 0) {
            // Create new user for social sign-up
            console.log('✅ Creating new social user:', user.email)

            // Generate a name from email if not provided
            const userName = user.name || user.email.split('@')[0] || 'User'

            // Determine authType safely
            const authType =
              account.provider === 'google'
                ? 'google'
                : account.provider === 'linkedin'
                  ? 'linkedin'
                  : account.provider === 'github'
                    ? 'github'
                    : 'credentials'

            // Generate a secure random password for OAuth users
            // This satisfies Payload's auth requirements but won't be used by the user
            const randomPassword = crypto.randomBytes(32).toString('hex')

            console.log('🔄 Creating user with data:', {
              email: user.email,
              name: userName,
              roles: 'client',
              authType,
              hasPassword: false,
              onboardingCompleted: false,
            })

            const newUser = await payload.create({
              collection: 'users',
              data: {
                email: user.email,
                name: userName,
                roles: 'client' as const,
                authType: authType as 'credentials' | 'google' | 'linkedin' | 'github',
                hasPassword: false,
                onboardingCompleted: false,
                password: randomPassword, // Add this to satisfy Payload's auth requirements
              },
              overrideAccess: true, // Bypass access control for OAuth user creation
            })

            console.log('✅ New social user created:', newUser.id)
            // Update the user object with the new ID and mark as new user
            user.id = newUser.id.toString()
            user.isNewUser = isOnboardingExemptRole(newUser.roles) ? false : true
          } else {
            // Existing user - safely access the first document
            const existingUserDoc = existingUser.docs[0]
            if (existingUserDoc) {
              console.log('✅ Existing social user found:', existingUserDoc.id)
              user.id = existingUserDoc.id.toString()
              user.isNewUser = isOnboardingExemptRole(existingUserDoc.roles) ? false : false
            } else {
              console.error(
                '❌ Unexpected: existingUser.docs has length > 0 but first item is undefined',
              )
              return false
            }
          }

          return true
        } catch (error) {
          console.error('❌ Error in social sign-in:', error)

          // Enhanced error logging
          if (error && typeof error === 'object' && 'data' in error) {
            console.error('❌ Payload error details:', error.data)
          }

          // Try to find if user was actually created despite the error
          if (user.email) {
            try {
              const payload = await getPayload({ config })
              const retryFind = await payload.find({
                collection: 'users',
                where: {
                  email: { equals: user.email },
                },
                limit: 1,
              })

              if (retryFind.docs.length > 0 && retryFind.docs[0]) {
                const foundUser = retryFind.docs[0]
                console.log('🔍 Found user after creation error:', foundUser.id)
                user.id = foundUser.id.toString()
                user.isNewUser = isOnboardingExemptRole(foundUser.roles)
                  ? false
                  : !foundUser.onboardingCompleted
                return true
              }
            } catch (retryError) {
              console.error('❌ Retry find also failed:', retryError)
            }
          }

          return false
        }
      }

      // For credentials provider, allow through (existing logic)
      return true
    },

    // Handle redirect callback - determines where to redirect after sign-in
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback:', { url, baseUrl })

      // If URL contains socialSignUp or newUser, redirect to dashboard with flag
      if (url.includes('socialSignUp=true') || url.includes('newUser=true')) {
        console.log('🎯 Redirecting new user to onboarding')
        return `${baseUrl}/dashboard?newUser=true`
      }

      // If it's a relative URL, make it absolute
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`
      }

      // If it's the same origin, allow it
      if (new URL(url).origin === baseUrl) {
        return url
      }

      // Default redirect for existing users
      console.log('🎯 Redirecting existing user to dashboard')
      return `${baseUrl}/dashboard`
    },

    // Handle JWT callback to store the token and additional user info in the JWT
    async jwt({ token, user, account, trigger }) {
      console.log('🔑 JWT callback:', {
        hasUser: !!user,
        provider: account?.provider,
        trigger,
        isNewUser: user?.isNewUser,
      })

      if (user) {
        // Safely assign user properties with proper null checks
        token.id = user.id || ''
        token.email = user.email || ''
        token.name = user.name || ''
        token.roles = user.roles || ['client']
        // client-admin never sees onboarding, regardless of what authorize()/signIn() computed
        token.isNewUser = isOnboardingExemptRole(token.roles) ? false : user.isNewUser || false
        console.log('🔑 JWT token updated with user data:', {
          id: token.id,
          email: token.email,
          isNewUser: token.isNewUser,
        })
      }

      // Handle session update trigger to refresh user data from database
      if (trigger === 'update' && token.id) {
        try {
          const payload = await getPayload({ config })
          const userResult = await payload.find({
            collection: 'users',
            where: {
              id: { equals: token.id },
            },
            limit: 1,
          })

          if (userResult.docs.length > 0) {
            const dbUser = userResult.docs[0]
            if (dbUser) {
              token.roles = dbUser.roles || token.roles
              token.isNewUser = isOnboardingExemptRole(dbUser.roles)
                ? false
                : !dbUser.onboardingCompleted
              console.log('🔄 JWT updated from database:', {
                id: token.id,
                onboardingCompleted: dbUser.onboardingCompleted,
                isNewUser: token.isNewUser,
              })
            }
          }
        } catch (error) {
          console.error('❌ Error updating JWT from database:', error)
        }
      }

      return token
    },

    // Handle session callback to map the user info from the JWT into the session
    async session({ session, token }) {
      if (session.user) {
        // Safely assign token properties with proper null checks
        session.user.id = (token.id as string) || ''
        session.user.email = (token.email as string) || ''
        session.user.name = (token.name as string) || ''
        session.user.roles = (token.roles as string[]) || ['client']
        // Defensive: client-admin is never treated as a new user, even if token state is stale
        session.user.isNewUser = isOnboardingExemptRole(session.user.roles)
          ? false
          : (token.isNewUser as boolean) || false
        console.log('👤 Session updated:', {
          id: session.user.id,
          email: session.user.email,
          isNewUser: session.user.isNewUser,
        })
      }
      return session
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.PAYLOAD_SECRET,
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  logger: {
    error(code, metadata) {
      console.error('🔴 NEXTAUTH ERROR', code, metadata)
    },
    warn(code) {
      console.warn('🟠 NEXTAUTH WARN', code)
    },
    debug(code, metadata) {
      console.debug('🟢 NEXTAUTH DEBUG', code, metadata)
    },
  },
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
}
