export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB, getUserModel } from "@/lib/db";

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
    console.error("Setup GET error:", error);
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

    let body = {};
    try {
      body = await request.json();
    } catch {
      // Empty body is OK, we'll use defaults
    }

    const { username, email, password } = body as any;
    
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
