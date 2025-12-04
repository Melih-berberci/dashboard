export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB, getUserModel } from "@/lib/db";

// GET - Get user's saved guilds
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }

    await connectDB();
    const User = getUserModel();

    // Find user by discordId or by session id
    let user = await User.findOne({ discordId: session.user.id });
    
    if (!user) {
      // Try to find by email
      user = await User.findOne({ email: session.user.email });
    }

    if (!user) {
      return NextResponse.json({ guilds: [] });
    }

    return NextResponse.json({ guilds: user.guilds || [] });
  } catch (error: any) {
    console.error("Get user guilds error:", error);
    return NextResponse.json({ error: "Sunucular alınırken hata oluştu" }, { status: 500 });
  }
}

// POST - Add guild to user's list
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }

    const body = await request.json();
    const { guildId, guildName, guildIcon } = body;

    if (!guildId) {
      return NextResponse.json({ error: "Sunucu ID gerekli" }, { status: 400 });
    }

    await connectDB();
    const User = getUserModel();

    // Find or create user
    let user = await User.findOne({ discordId: session.user.id });
    
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }

    // If user doesn't exist, create one
    if (!user) {
      user = await User.create({
        username: session.user.username || session.user.name || "User",
        email: session.user.email || `${session.user.id}@discord.user`,
        password: "oauth-user-no-password",
        discordId: session.user.id,
        discordUsername: session.user.username,
        avatar: session.user.avatar,
        role: "user",
        guilds: [],
        isActive: true,
      });
    }

    // Check if guild already exists
    const existingGuild = user.guilds?.find((g: any) => g.guildId === guildId);
    if (existingGuild) {
      return NextResponse.json({ error: "Bu sunucu zaten ekli" }, { status: 400 });
    }

    // Add guild with full permissions for self-added guilds
    user.guilds = user.guilds || [];
    user.guilds.push({
      guildId,
      guildName: guildName || `Sunucu ${guildId}`,
      guildIcon: guildIcon || null,
      permissions: {
        dashboard: true,
        logs: true,
        moderation: true,
        welcome: true,
        leveling: true,
        tickets: true,
        commands: true,
        settings: true,
      },
    });

    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({ 
      message: "Sunucu eklendi",
      guild: user.guilds[user.guilds.length - 1]
    });
  } catch (error: any) {
    console.error("Add user guild error:", error);
    return NextResponse.json({ error: "Sunucu eklenirken hata oluştu" }, { status: 500 });
  }
}

// DELETE - Remove guild from user's list
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get("guildId");

    if (!guildId) {
      return NextResponse.json({ error: "Sunucu ID gerekli" }, { status: 400 });
    }

    await connectDB();
    const User = getUserModel();

    let user = await User.findOne({ discordId: session.user.id });
    
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Remove guild
    const guildIndex = user.guilds?.findIndex((g: any) => g.guildId === guildId);
    if (guildIndex === -1 || guildIndex === undefined) {
      return NextResponse.json({ error: "Sunucu bulunamadı" }, { status: 404 });
    }

    user.guilds.splice(guildIndex, 1);
    user.updatedAt = new Date();
    await user.save();

    return NextResponse.json({ message: "Sunucu kaldırıldı" });
  } catch (error: any) {
    console.error("Remove user guild error:", error);
    return NextResponse.json({ error: "Sunucu kaldırılırken hata oluştu" }, { status: 500 });
  }
}
