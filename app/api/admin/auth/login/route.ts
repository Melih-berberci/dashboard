import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production";
const MONGODB_URI = process.env.MONGODB_URI || "";

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["super_admin", "admin", "user"],
    default: "user",
  },
  discordId: { type: String, unique: true, sparse: true },
  discordUsername: { type: String },
  avatar: { type: String },
  guilds: [
    {
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
    },
  ],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Password hash middleware
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

function getUserModel() {
  return mongoose.models.User || mongoose.model("User", userSchema);
}

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  if (!MONGODB_URI) throw new Error("MONGODB_URI not defined");
  await mongoose.connect(MONGODB_URI);
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Kullanıcı adı ve şifre gerekli" },
        { status: 400 }
      );
    }

    await connectDB();
    const User = getUserModel();

    // Find user by username or email
    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { error: "Kullanıcı bulunamadı" },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Hesap devre dışı" },
        { status: 401 }
      );
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Şifre hatalı" }, { status: 401 });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        guilds: user.guilds,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: error.message || "Giriş başarısız" },
      { status: 500 }
    );
  }
}
