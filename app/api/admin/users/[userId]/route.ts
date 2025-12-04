export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB, getUserModel } from "@/lib/db";
import { verifyAdmin, unauthorizedResponse } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET - Get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { userId } = await params;
    await connectDB();
    const User = getUserModel();

    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Get user error:", error);
    return NextResponse.json({ error: "Kullanıcı alınırken hata oluştu" }, { status: 500 });
  }
}

// PUT - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { userId } = await params;
    const body = await request.json();
    const { username, email, password, role, isActive } = body;

    await connectDB();
    const User = getUserModel();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Update fields
    if (username) user.username = username;
    if (email) user.email = email.toLowerCase();
    if (role) user.role = role;
    if (typeof isActive === "boolean") user.isActive = isActive;

    // Update password if provided
    if (password) {
      user.password = await bcrypt.hash(password, 12);
    }

    user.updatedAt = new Date();
    await user.save();

    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      guilds: user.guilds,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json(userResponse);
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Kullanıcı güncellenirken hata oluştu" }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { userId } = await params;
    await connectDB();
    const User = getUserModel();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Prevent deleting super_admin
    if (user.role === "super_admin" && admin._id.toString() !== userId) {
      return NextResponse.json({ error: "Süper admin silinemez" }, { status: 403 });
    }

    // Prevent self-delete
    if (admin._id.toString() === userId) {
      return NextResponse.json({ error: "Kendinizi silemezsiniz" }, { status: 403 });
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: "Kullanıcı silindi" });
  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Kullanıcı silinirken hata oluştu" }, { status: 500 });
  }
}
