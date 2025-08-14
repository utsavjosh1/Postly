import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { config } from "./env";
import { UserService } from "../services/user.service";

// Extend Express User interface for TypeScript using global augmentation
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: string;
      email: string;
      name?: string | null;
      avatar?: string | null;
    }
  }
}

// Serialize user for session
passport.serializeUser((user: Express.User, done) => {
  console.log("🔒 Serializing user:", user.id);
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    console.log("🔓 Deserializing user ID:", id);
    const user = await UserService.findById(id);
    if (!user) {
      return done(new Error("User not found"), null);
    }
    console.log("✅ Deserialized user:", user.email);
    done(null, user);
  } catch (error) {
    console.error("❌ Deserialize error:", error);
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL,
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("🔍 Google OAuth Profile:", {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
        });

        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error("No email provided by Google"), false);
        }

        // Find or create user
        const user = await UserService.findOrCreateGoogleUser({
          googleId: profile.id,
          email,
          name: profile.displayName,
          avatar: profile.photos?.[0]?.value,
          accessToken,
          refreshToken,
        });

        return done(null, user);
      } catch (error) {
        console.error("❌ Google OAuth Error:", error);
        return done(error, false);
      }
    },
  ),
);

export default passport;
