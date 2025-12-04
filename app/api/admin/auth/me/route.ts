import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production";
const MONGODB_URI = process.env.MONGODB_URI || "";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["super_admin", "admin", "user"], default: "user" },
  discordId: { type: String, unique: true, sparse: true },
  discordUsername: { type: String },
  avatar: { type: String },
  guilds: [{
    guildId: { type: String, required: true },
    guildName: { type: String },
    guildIcon: { type: String },
    permissions: {
      dashboard: { type: Boolean, default: true },
      logs: { type: Boolean, default: false },
      moderation: { type: Boolean, default: false },
      welcome: { type: Boolean, default: false },
      leveling: { type: Boolean, default: false },
      tickets: { type: Boolean, default: false },
      commands: { type: Boolean, default: false },
      settings: { type: Boolean, default: false },
    },
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

function getUserModel() {
  return mongoose.models.User || mongoose.model("User", userSchema);
}

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  if (!MONGODB_URI) throw new Error("MONGODB_URI not defined");
  await mongoose.connect(MONGODB_URI);
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return NextResponse.json({ error: "Token bulunamadı" }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    await connectDB();
    const User = getUserModel();
    
    const user = await User.findById(decoded.userId).select("-password");
    
    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      guilds: user.guilds,
      avatar: user.avatar,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    });
  } catch (error: any) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Geçersiz token" }, { status: 403 });
  }
}
