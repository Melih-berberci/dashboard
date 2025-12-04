export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB, getUserModel } from "@/lib/db";
import { verifyAdmin, unauthorizedResponse } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ userId: string; guildId: string }>;
}

// PUT - Update guild permissions
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { userId, guildId } = await params;
    const body = await request.json();
    const { permissions, guildName, guildIcon } = body;

    await connectDB();
    const User = getUserModel();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Find guild
    const guildIndex = user.guilds.findIndex((g: any) => g.guildId === guildId);
    if (guildIndex === -1) {
      return NextResponse.json({ error: "Sunucu bulunamadı" }, { status: 404 });
    }

    // Update guild
    if (permissions) {
      user.guilds[guildIndex].permissions = {
        ...user.guilds[guildIndex].permissions,
        ...permissions,
      };
    }
    if (guildName) user.guilds[guildIndex].guildName = guildName;
    if (guildIcon) user.guilds[guildIndex].guildIcon = guildIcon;

    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({ message: "İzinler güncellendi", guild: user.guilds[guildIndex] });
  } catch (error: any) {
    console.error("Update guild error:", error);
    return NextResponse.json({ error: "İzinler güncellenirken hata oluştu" }, { status: 500 });
  }
}

// DELETE - Remove guild from user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { userId, guildId } = await params;

    await connectDB();
    const User = getUserModel();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Remove guild
    const guildIndex = user.guilds.findIndex((g: any) => g.guildId === guildId);
    if (guildIndex === -1) {
      return NextResponse.json({ error: "Sunucu bulunamadı" }, { status: 404 });
    }

    user.guilds.splice(guildIndex, 1);
    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({ message: "Sunucu kaldırıldı" });
  } catch (error: any) {
    console.error("Remove guild error:", error);
    return NextResponse.json({ error: "Sunucu kaldırılırken hata oluştu" }, { status: 500 });
  }
}
