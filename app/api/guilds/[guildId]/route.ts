import { NextRequest, NextResponse } from "next/server";

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  const { guildId } = await params;

  if (!BOT_TOKEN) {
    console.error("DISCORD_BOT_TOKEN is not configured");
    return NextResponse.json(
      { error: "Bot token yapılandırılmamış" },
      { status: 500 }
    );
  }

  console.log("Fetching guild:", guildId);

  try {
    // Fetch guild info
    const guildResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}?with_counts=true`,
      {
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
        },
      }
    );

    if (!guildResponse.ok) {
      if (guildResponse.status === 404) {
        return NextResponse.json(
          { error: "Sunucu bulunamadı veya bot bu sunucuda değil" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Sunucu bilgileri alınamadı" },
        { status: guildResponse.status }
      );
    }

    const guildData = await guildResponse.json();

    // Fetch channels
    const channelsResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/channels`,
      {
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
        },
      }
    );

    let channels = [];
    if (channelsResponse.ok) {
      channels = await channelsResponse.json();
    }

    // Fetch roles
    const rolesResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/roles`,
      {
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
        },
      }
    );

    let roles = [];
    if (rolesResponse.ok) {
      roles = await rolesResponse.json();
    }

    // Fetch members (limited)
    const membersResponse = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members?limit=100`,
      {
        headers: {
          Authorization: `Bot ${BOT_TOKEN}`,
        },
      }
    );

    let members = [];
    if (membersResponse.ok) {
      members = await membersResponse.json();
    }

    // Fetch bots in the server
    const bots = members.filter((m: any) => m.user?.bot);

    return NextResponse.json({
      id: guildData.id,
      name: guildData.name,
      icon: guildData.icon,
      banner: guildData.banner,
      description: guildData.description,
      memberCount: guildData.approximate_member_count || members.length,
      onlineCount: guildData.approximate_presence_count || 0,
      ownerId: guildData.owner_id,
      features: guildData.features,
      channels: channels.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        parentId: c.parent_id,
        position: c.position,
      })),
      roles: roles.map((r: any) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        position: r.position,
        permissions: r.permissions,
      })),
      bots: bots.map((b: any) => ({
        id: b.user.id,
        username: b.user.username,
        avatar: b.user.avatar,
        discriminator: b.user.discriminator,
      })),
      members: members.slice(0, 50).map((m: any) => ({
        id: m.user.id,
        username: m.user.username,
        avatar: m.user.avatar,
        nickname: m.nick,
        roles: m.roles,
        joinedAt: m.joined_at,
        isBot: m.user.bot || false,
      })),
    });
  } catch (error) {
    console.error("Guild fetch error:", error);
    return NextResponse.json(
      { error: "Sunucu bilgileri alınırken bir hata oluştu" },
      { status: 500 }
    );
  }
}
