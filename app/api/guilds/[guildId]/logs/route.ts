/**
 * Guild Logs API
 * Bot'un MongoDB'ye yazdığı logları dashboard'a sunar
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB, mongoose } from "@/lib/db";

// Log Schema
const logSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    enum: ['member_join', 'member_leave', 'message_delete', 'message_edit', 'voice_join', 'voice_leave', 'voice_move', 'ban', 'unban', 'kick', 'mute', 'warn', 'role_add', 'role_remove'],
    required: true 
  },
  userId: { type: String },
  username: { type: String },
  userAvatar: { type: String },
  targetId: { type: String },
  targetUsername: { type: String },
  channelId: { type: String },
  channelName: { type: String },
  content: { type: String },
  oldContent: { type: String },
  newContent: { type: String },
  reason: { type: String },
  moderatorId: { type: String },
  moderatorUsername: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now, index: true }
}, { 
  timestamps: true,
  collection: 'guildlogs'
});

// Compound index for efficient queries
logSchema.index({ guildId: 1, timestamp: -1 });
logSchema.index({ guildId: 1, type: 1, timestamp: -1 });

function getLogModel() {
  return mongoose.models.GuildLog || mongoose.model("GuildLog", logSchema);
}

/**
 * GET - Guild loglarını getir
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;
    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const type = searchParams.get('type');
    const before = searchParams.get('before'); // timestamp for pagination
    
    await connectDB();
    const GuildLog = getLogModel();
    
    // Build query
    const query: Record<string, unknown> = { guildId };
    
    if (type && type !== 'all') {
      query.type = type;
    }
    
    if (before) {
      query.timestamp = { $lt: new Date(before) };
    }
    
    const logs = await GuildLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    return NextResponse.json({
      logs,
      count: logs.length,
      hasMore: logs.length === limit
    });
  } catch (error) {
    console.error("[Logs GET] Error:", error);
    return NextResponse.json(
      { error: "Loglar alınırken hata oluştu", logs: [] },
      { status: 500 }
    );
  }
}

/**
 * POST - Yeni log ekle (Bot tarafından çağrılır)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;
    const body = await request.json();
    
    // Basic validation
    if (!body.type) {
      return NextResponse.json(
        { error: "Log type gerekli" },
        { status: 400 }
      );
    }
    
    await connectDB();
    const GuildLog = getLogModel();
    
    const log = new GuildLog({
      guildId,
      ...body,
      timestamp: body.timestamp || new Date()
    });
    
    await log.save();
    
    return NextResponse.json({
      success: true,
      logId: log._id
    });
  } catch (error) {
    console.error("[Logs POST] Error:", error);
    return NextResponse.json(
      { error: "Log kaydedilirken hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Logları temizle (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;
    const { searchParams } = new URL(request.url);
    
    const olderThan = searchParams.get('olderThan'); // days
    
    await connectDB();
    const GuildLog = getLogModel();
    
    const query: Record<string, unknown> = { guildId };
    
    if (olderThan) {
      const date = new Date();
      date.setDate(date.getDate() - parseInt(olderThan));
      query.timestamp = { $lt: date };
    }
    
    const result = await GuildLog.deleteMany(query);
    
    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("[Logs DELETE] Error:", error);
    return NextResponse.json(
      { error: "Loglar silinirken hata oluştu" },
      { status: 500 }
    );
  }
}
