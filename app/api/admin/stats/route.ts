export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB, getUserModel } from "@/lib/db";
import { verifyAdmin, unauthorizedResponse } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return unauthorizedResponse();
  }

  try {
    await connectDB();
    const User = getUserModel();

    // Get all stats in parallel
    const [
      totalUsers,
      activeUsers,
      recentUsers,
      roleStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
    ]);

    // Calculate total guilds (unique guild IDs across all users)
    const usersWithGuilds = await User.find({ "guilds.0": { $exists: true } }).select("guilds");
    const uniqueGuildIds = new Set<string>();
    usersWithGuilds.forEach((user: any) => {
      user.guilds.forEach((guild: any) => {
        uniqueGuildIds.add(guild.guildId);
      });
    });

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalGuilds: uniqueGuildIds.size,
      totalLogs: 0, // Placeholder - implement when logs collection exists
      recentLogs: 0,
      recentUsers,
      roleStats,
    });
  } catch (error: any) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Veriler alınırken hata oluştu" }, { status: 500 });
  }
}
