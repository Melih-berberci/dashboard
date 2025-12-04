export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB, getUserModel } from "@/lib/db";
import { verifyAdmin, unauthorizedResponse } from "@/lib/admin-auth";

// GET - List all users
export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    await connectDB();
    const User = getUserModel();

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Get users error:", error);
    return NextResponse.json({ error: "Kullanıcılar alınırken hata oluştu" }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { username, email, password, role } = body;

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Tüm alanlar gerekli" }, { status: 400 });
    }

    await connectDB();
    const User = getUserModel();

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      return NextResponse.json({ error: "Bu email veya kullanıcı adı zaten kullanılıyor" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || "user",
      guilds: [],
      isActive: true,
    });

    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      guilds: newUser.guilds,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json({ error: "Kullanıcı oluşturulurken hata oluştu" }, { status: 500 });
  }
}
