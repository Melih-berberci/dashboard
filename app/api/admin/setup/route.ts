import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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

// GET - Check if super admin exists
export async function GET() {
  try {
    await connectDB();
    const User = getUserModel();
    
    const superAdmin = await User.findOne({ role: "super_admin" });
    
    return NextResponse.json({
      exists: !!superAdmin,
      message: superAdmin ? "Süper admin mevcut" : "Süper admin bulunamadı",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create initial super admin
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const User = getUserModel();
    
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: "super_admin" });
    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: "Süper admin zaten mevcut" },
        { status: 400 }
      );
    }
    
    const { username, email, password } = await request.json();
    
    // Use environment variables as defaults
    const finalUsername = username || process.env.SUPER_ADMIN_USERNAME || "admin";
    const finalEmail = email || process.env.SUPER_ADMIN_EMAIL || "admin@localhost.com";
    const finalPassword = password || process.env.SUPER_ADMIN_PASSWORD || "admin123";
    
    const hashedPassword = await bcrypt.hash(finalPassword, 12);
    
    const superAdmin = new User({
      username: finalUsername,
      email: finalEmail,
      password: hashedPassword,
      role: "super_admin",
      isActive: true,
    });
    
    await superAdmin.save();
    
    return NextResponse.json({
      success: true,
      message: "Süper admin oluşturuldu",
      username: finalUsername,
    });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
