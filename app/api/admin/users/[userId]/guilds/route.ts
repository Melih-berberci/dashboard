export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB, getUserModel } from "@/lib/db";
import { verifyAdmin, unauthorizedResponse } from "@/lib/admin-auth";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// POST - Add guild to user
export async function POST(request: NextRequest, { params }: RouteParams) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    const { userId } = await params;
    const body = await request.json();
    const { guildId, guildName, guildIcon, permissions } = body;

    if (!guildId) {
      return NextResponse.json({ error: "Guild ID gerekli" }, { status: 400 });
    }

    await connectDB();
    const User = getUserModel();

    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Check if guild already exists
    const existingGuild = user.guilds.find((g: any) => g.guildId === guildId);
    if (existingGuild) {
      return NextResponse.json({ error: "Bu sunucu zaten ekli" }, { status: 400 });
    }

    // Add guild with permissions
    user.guilds.push({
      guildId,
      guildName: guildName || `Sunucu ${guildId}`,
      guildIcon: guildIcon || null,
      permissions: permissions || {
        dashboard: true,
        logs: false,
        moderation: false,
        welcome: false,
        leveling: false,
        tickets: false,
        commands: false,
        settings: false,
      },
    });

    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({ message: "Sunucu eklendi", guilds: user.guilds });
  } catch (error: any) {
    console.error("Add guild error:", error);
    return NextResponse.json({ error: "Sunucu eklenirken hata oluştu" }, { status: 500 });
  }
}
