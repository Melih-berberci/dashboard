import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import crypto from "crypto";

// MongoDB User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  avatar: { type: String, default: null },
  role: { type: String, default: "user" },
});

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Get or create User model
const User = mongoose.models.User || mongoose.model("User", userSchema);

// Connect to MongoDB
async function connectDB() {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log("MongoDB already connected");
      return;
    }
    
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }
    
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri, {
      dbName: "cyberpanel", // Specify database name
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password } = body;

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Tüm alanlar zorunludur" },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Geçerli bir email adresi giriniz" },
        { status: 400 }
      );
    }

    // Password validation
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Şifre en az 8 karakter olmalıdır" },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(password)) {
      return NextResponse.json(
        { message: "Şifre en az bir büyük harf içermelidir" },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(password)) {
      return NextResponse.json(
        { message: "Şifre en az bir küçük harf içermelidir" },
        { status: 400 }
      );
    }

    if (!/\d/.test(password)) {
      return NextResponse.json(
        { message: "Şifre en az bir rakam içermelidir" },
        { status: 400 }
      );
    }

    // Username validation
    if (username.length < 3) {
      return NextResponse.json(
        { message: "Kullanıcı adı en az 3 karakter olmalıdır" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { message: "Bu email adresi zaten kullanılıyor" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return NextResponse.json(
        { message: "Bu kullanıcı adı zaten kullanılıyor" },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = hashPassword(password);
    
    const user = new User({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await user.save();

    return NextResponse.json(
      { 
        message: "Kayıt başarılı",
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Register error:", error);
    
    // Handle MongoDB connection errors
    if (error.message?.includes("MONGODB_URI")) {
      return NextResponse.json(
        { message: "Veritabanı bağlantısı yapılandırılmamış" },
        { status: 500 }
      );
    }

    // Handle connection errors
    if (error.name === "MongoNetworkError" || error.message?.includes("connect")) {
      return NextResponse.json(
        { message: "Veritabanına bağlanılamadı. Lütfen daha sonra tekrar deneyin." },
        { status: 500 }
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { message: "Bu email veya kullanıcı adı zaten kullanılıyor" },
        { status: 400 }
      );
    }

    // Handle validation errors
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { message: "Geçersiz veri formatı" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: `Bir hata oluştu: ${error.message || "Bilinmeyen hata"}` },
      { status: 500 }
    );
  }
}
