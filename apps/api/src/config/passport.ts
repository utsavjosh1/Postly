import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { userQueries } from "@postly/database";
import { User } from "@postly/shared-types";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const API_URL = process.env.API_URL || "http://localhost:3000";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn(
    "⚠️ Google OAuth credentials missing. Google Auth will not work.",
  );
}

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID || "missing",
      clientSecret: GOOGLE_CLIENT_SECRET || "missing",
      callbackURL: `${API_URL}/api/v1/auth/google/callback`,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) {
          return done(new Error("No email found directly from Google"));
        }

        // Check if user exists
        let user: User | null = await userQueries.findByEmail(email);

        if (!user) {
          // Create new user (social login users have no password)
          user = await userQueries.create({
            email,
            full_name: profile.displayName,
            password_hash: "", // No password for social login
            role: "job_seeker", // Default role
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

export default passport;
