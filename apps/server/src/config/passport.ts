import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import type { StrategyOptions, VerifyCallback, Profile } from 'passport-google-oauth20';
import { config } from './env';
import { supabaseAdmin } from './supabase';

// Extend Express User interface for TypeScript
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      full_name?: string;
      avatar_url?: string;
      provider: 'google' | 'email';
      supabase_user_id: string;
    }
  }
}

interface GoogleProfileJson {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

/**
 * Serialize user for session storage
 * Only store minimal data in session for security and performance
 */
passport.serializeUser((user: Express.User, done) => {
  done(null, {
    id: user.id,
    supabase_user_id: user.supabase_user_id,
    provider: user.provider
  });
});

/**
 * Deserialize user from session storage
 * Fetch fresh user data from database to ensure data consistency
 */
passport.deserializeUser(async (sessionUser: any, done) => {
  try {
    // Get fresh user data from Supabase
    const { data: user, error } = await supabaseAdmin.auth.admin.getUserById(
      sessionUser.supabase_user_id
    );

    if (error || !user) {
      return done(new Error('User not found'), null);
    }

    // Get profile data
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();

    const userData: Express.User = {
      id: sessionUser.id,
      email: user.user.email!,
      full_name: profile?.full_name || user.user.user_metadata?.full_name,
      avatar_url: profile?.avatar_url || user.user.user_metadata?.avatar_url,
      provider: sessionUser.provider,
      supabase_user_id: user.user.id
    };

    done(null, userData);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

/**
 * Google OAuth Strategy Configuration
 * Handles Google OAuth 2.0 authentication flow
 * Only configured if Google OAuth credentials are provided
 */
if (config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: config.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email']
      } as StrategyOptions,
      async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
        try {
          const googleUser = profile._json as GoogleProfileJson;
          
          // Check if user already exists in Supabase by email
          const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          
          if (listError) {
            console.error('Error listing users:', listError);
            return done(new Error('Failed to check existing users'));
          }

          const existingUser = existingUsers.users.find((user) => user.email === googleUser.email);

          let supabaseUser;
          let isNewUser = false;

          if (existingUser) {
            // User exists - update their metadata if needed
            supabaseUser = existingUser;
            
            // Update user metadata with Google info if not already set
            const needsUpdate = 
              !existingUser.user_metadata?.google_id ||
              !existingUser.user_metadata?.avatar_url ||
              !existingUser.user_metadata?.full_name;

            if (needsUpdate) {
              const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                existingUser.id,
                {
                  user_metadata: {
                    ...existingUser.user_metadata,
                    google_id: googleUser.sub,
                    avatar_url: googleUser.picture,
                    full_name: existingUser.user_metadata?.full_name || googleUser.name,
                    provider: 'google',
                    email_verified: googleUser.email_verified
                  }
                }
              );

              if (updateError) {
                console.error('Error updating user metadata:', updateError);
              } else {
                supabaseUser = updatedUser.user;
              }
            }
          } else {
            // Create new user
            isNewUser = true;
            const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
              email: googleUser.email,
              email_confirm: googleUser.email_verified,
              user_metadata: {
                google_id: googleUser.sub,
                full_name: googleUser.name,
                avatar_url: googleUser.picture,
                provider: 'google',
                email_verified: googleUser.email_verified
              }
            });

            if (createError) {
              console.error('Error creating user:', createError);
              return done(new Error('Failed to create user'));
            }

            supabaseUser = newUser.user;
          }

          // Update or create profile in profiles table
          const profileData = {
            id: supabaseUser.id,
            full_name: googleUser.name,
            avatar_url: googleUser.picture,
            updated_at: new Date().toISOString()
          };

          if (isNewUser) {
            // Create new profile
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .insert(profileData);

            if (profileError) {
              console.error('Error creating profile:', profileError);
            }
          } else {
            // Update existing profile
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .update(profileData)
              .eq('id', supabaseUser.id);

            if (profileError) {
              console.error('Error updating profile:', profileError);
            }
          }

          // Create Express user object
          const userData: Express.User = {
            id: `google_${supabaseUser.id}`, // Unique identifier for session
            email: supabaseUser.email!,
            full_name: googleUser.name,
            avatar_url: googleUser.picture,
            provider: 'google',
            supabase_user_id: supabaseUser.id
          };

          return done(null, userData);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error as Error);
        }
      }
    )
  );
} else {
  console.warn('🚫 Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
}

export default passport;
