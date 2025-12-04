import { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials";
import mongoose from "mongoose";

const DISCORD_SCOPES = ["identify", "guilds", "email"].join(" ");

// MongoDB User Schema for credentials auth (server-side only)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  avatar: { type: String, default: null },
  role: { type: String, default: "user" },
});

// Get User model (server-side only)
function getUserModel() {
  if (typeof window !== "undefined") {
    throw new Error("Cannot access User model on client side");
  }
  return mongoose.models?.User || mongoose.model("User", userSchema);
}

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  const crypto = require("crypto");
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Connect to MongoDB
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI not defined");
  }
  
  await mongoose.connect(uri);
}

export const authOptions: NextAuthOptions = {
  providers: [
    // Only add Discord provider if credentials are set
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET ? [
      DiscordProvider({
        clientId: process.env.DISCORD_CLIENT_ID,
        clientSecret: process.env.DISCORD_CLIENT_SECRET,
        authorization: {
          params: {
            scope: DISCORD_SCOPES,
          },
        },
      }),
    ] : []),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email ve şifre gerekli");
        }

        try {
          await connectDB();
          
          const User = getUserModel();
          const user = await User.findOne({ 
            email: credentials.email.toLowerCase() 
          });

          if (!user) {
            throw new Error("Kullanıcı bulunamadı");
          }

          const hashedPassword = hashPassword(credentials.password);
          
          if (user.password !== hashedPassword) {
            throw new Error("Şifre hatalı");
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.username,
            username: user.username,
            image: user.avatar,
          };
        } catch (error: any) {
          throw new Error(error.message || "Giriş başarısız");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // For Discord provider
      if (account?.provider === "discord") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.provider = "discord";
      }
      if (profile) {
        token.id = profile.id;
        token.username = profile.username;
        token.discriminator = profile.discriminator;
        token.avatar = profile.avatar;
        token.banner = profile.banner;
      }
      // For Credentials provider
      if (account?.provider === "credentials" && user) {
        token.id = user.id;
        token.username = (user as any).username || user.name;
        token.email = user.email;
        token.provider = "credentials";
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string || "";
      session.user = {
        ...session.user,
        id: token.id as string || token.sub as string,
        username: token.username as string || session.user?.name || "",
        discriminator: token.discriminator as string || "0000",
        avatar: token.avatar as string || "",
        banner: token.banner as string,
      };
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production",
};

// Discord API functions
export async function getDiscordGuilds(accessToken: string) {
  const response = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch guilds");
  }

  return response.json();
}

export async function getGuildDetails(guildId: string, botToken: string) {
  const response = await fetch(`https://discord.com/api/guilds/${guildId}?with_counts=true`, {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function getGuildChannels(guildId: string, botToken: string) {
  const response = await fetch(`https://discord.com/api/guilds/${guildId}/channels`, {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export async function getGuildRoles(guildId: string, botToken: string) {
  const response = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
    headers: {
      Authorization: `Bot ${botToken}`,
    },
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

// Check if user has admin permission in a guild
export function hasAdminPermission(permissions: string): boolean {
  const ADMINISTRATOR = BigInt(0x8);
  const MANAGE_GUILD = BigInt(0x20);
  
  const perms = BigInt(permissions);
  return (perms & ADMINISTRATOR) === ADMINISTRATOR || (perms & MANAGE_GUILD) === MANAGE_GUILD;
}

// Type declarations
declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username: string;
      discriminator: string;
      avatar: string;
      banner?: string;
    };
  }

  interface Profile {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    banner?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    id?: string;
    username?: string;
    discriminator?: string;
    avatar?: string;
    banner?: string;
  }
}
