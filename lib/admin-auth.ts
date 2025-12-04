import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, getUserModel } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-in-production";

export interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: "super_admin" | "admin" | "user";
  guilds: any[];
  isActive: boolean;
}

export async function verifyAdmin(request: NextRequest): Promise<AdminUser | null> {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    await connectDB();
    const User = getUserModel();

    const user = await User.findById(decoded.userId).select("-password");

    if (!user || user.role !== "super_admin") {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
}
