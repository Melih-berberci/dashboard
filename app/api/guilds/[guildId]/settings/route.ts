import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB, mongoose } from "@/lib/db";

// GuildSettings Schema - Bot ile aynı schema
const guildSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  guildName: { type: String, default: "" },
  guildIcon: { type: String, default: null },
  ownerId: { type: String, default: null },
  prefix: { type: String, default: "!" },
  language: { type: String, default: "tr" },
  timezone: { type: String, default: "Europe/Istanbul" },
  botEnabled: { type: Boolean, default: true },

  welcome: {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: "" },
    message: { type: String, default: "🎉 Hoşgeldin {user}! Sunucumuza katıldığın için teşekkürler." },
    embedEnabled: { type: Boolean, default: true },
    embedColor: { type: String, default: "#5865F2" },
    embedTitle: { type: String, default: "Yeni Üye!" },
    embedThumbnail: { type: Boolean, default: true },
    dmEnabled: { type: Boolean, default: false },
    dmMessage: { type: String, default: "" },
  },

  leave: {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: "" },
    message: { type: String, default: "👋 {user} sunucudan ayrıldı." },
    embedEnabled: { type: Boolean, default: false },
    embedColor: { type: String, default: "#ED4245" },
  },

  autorole: {
    enabled: { type: Boolean, default: false },
    roles: [{ type: String }],
    botRoles: [{ type: String }],
    delay: { type: Number, default: 0 },
  },

  moderation: {
    enabled: { type: Boolean, default: false },
    logChannelId: { type: String, default: "" },
    modRoles: [{ type: String }],
    antiSpam: {
      enabled: { type: Boolean, default: false },
      maxMessages: { type: Number, default: 5 },
      interval: { type: Number, default: 5000 },
      action: { type: String, default: "warn" },
      muteDuration: { type: Number, default: 300 },
    },
    antiLink: {
      enabled: { type: Boolean, default: false },
      allowedDomains: [{ type: String }],
      whitelistedRoles: [{ type: String }],
      whitelistedChannels: [{ type: String }],
      action: { type: String, default: "delete" },
    },
    badWords: {
      enabled: { type: Boolean, default: false },
      words: [{ type: String }],
      action: { type: String, default: "delete" },
      whitelistedRoles: [{ type: String }],
      whitelistedChannels: [{ type: String }],
    },
    antiCaps: {
      enabled: { type: Boolean, default: false },
      percentage: { type: Number, default: 70 },
      minLength: { type: Number, default: 10 },
      action: { type: String, default: "delete" },
    },
  },

  leveling: {
    enabled: { type: Boolean, default: false },
    channelId: { type: String, default: "" },
    xpPerMessage: { type: Number, default: 15 },
    xpCooldown: { type: Number, default: 60 },
    levelUpMessage: { type: String, default: "🎉 Tebrikler {user}! **{level}** seviyesine ulaştın!" },
    roleRewards: [{
      level: { type: Number },
      roleId: { type: String },
      removeOnLevelUp: { type: Boolean, default: false },
    }],
    ignoredChannels: [{ type: String }],
    ignoredRoles: [{ type: String }],
    multiplierRoles: [{
      roleId: { type: String },
      multiplier: { type: Number, default: 1.5 },
    }],
  },

  tickets: {
    enabled: { type: Boolean, default: false },
    categoryId: { type: String, default: "" },
    logChannelId: { type: String, default: "" },
    supportRoles: [{ type: String }],
    maxTicketsPerUser: { type: Number, default: 3 },
    namingFormat: { type: String, default: "ticket-{number}" },
    welcomeMessage: { type: String, default: "Merhaba {user}! Destek ekibimiz size yardımcı olacaktır." },
    closeConfirmation: { type: Boolean, default: true },
    transcriptEnabled: { type: Boolean, default: true },
    categories: [{
      name: { type: String },
      description: { type: String },
      emoji: { type: String, default: "📩" },
      supportRoles: [{ type: String }],
    }],
  },

  logging: {
    enabled: { type: Boolean, default: false },
    messages: {
      enabled: { type: Boolean, default: false },
      channelId: { type: String, default: "" },
      logEdits: { type: Boolean, default: true },
      logDeletes: { type: Boolean, default: true },
      ignoredChannels: [{ type: String }],
    },
    members: {
      enabled: { type: Boolean, default: false },
      channelId: { type: String, default: "" },
      logJoins: { type: Boolean, default: true },
      logLeaves: { type: Boolean, default: true },
      logBans: { type: Boolean, default: true },
      logRoleChanges: { type: Boolean, default: true },
      logNicknameChanges: { type: Boolean, default: true },
    },
    voice: {
      enabled: { type: Boolean, default: false },
      channelId: { type: String, default: "" },
      logJoins: { type: Boolean, default: true },
      logLeaves: { type: Boolean, default: true },
      logMoves: { type: Boolean, default: true },
    },
    server: {
      enabled: { type: Boolean, default: false },
      channelId: { type: String, default: "" },
      logChannelChanges: { type: Boolean, default: true },
      logRoleChanges: { type: Boolean, default: true },
      logEmojiChanges: { type: Boolean, default: true },
    },
  },

  games: {
    enabled: { type: Boolean, default: false },
    allowedChannels: [{ type: String }],
    cooldown: { type: Number, default: 30 },
  },

  music: {
    enabled: { type: Boolean, default: false },
    djRoles: [{ type: String }],
    defaultVolume: { type: Number, default: 50 },
    maxQueueSize: { type: Number, default: 100 },
    allowPlaylists: { type: Boolean, default: true },
    voteSkipEnabled: { type: Boolean, default: true },
    voteSkipPercentage: { type: Number, default: 50 },
  },

  customCommands: [{
    name: { type: String },
    response: { type: String },
    description: { type: String, default: "" },
    enabled: { type: Boolean, default: true },
    allowedRoles: [{ type: String }],
    allowedChannels: [{ type: String }],
    cooldown: { type: Number, default: 0 },
  }],

  disabledCommands: [{ type: String }],
  protectedChannels: [{ type: String }],
  protectedRoles: [{ type: String }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

function getGuildSettingsModel() {
  return mongoose.models.GuildSettings || mongoose.model("GuildSettings", guildSettingsSchema);
}

// GET - Sunucu ayarlarını getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;
    
    await connectDB();
    const GuildSettings = getGuildSettingsModel();
    
    let settings = await GuildSettings.findOne({ guildId });
    
    // Ayarlar yoksa oluştur
    if (!settings) {
      settings = new GuildSettings({ guildId });
      await settings.save();
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings GET error:", error);
    return NextResponse.json(
      { error: "Ayarlar alınırken hata oluştu" },
      { status: 500 }
    );
  }
}

// PUT - Sunucu ayarlarını güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;
    const body = await request.json();
    
    await connectDB();
    const GuildSettings = getGuildSettingsModel();
    
    const settings = await GuildSettings.findOneAndUpdate(
      { guildId },
      { 
        ...body, 
        updatedAt: new Date() 
      },
      { new: true, upsert: true }
    );
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings PUT error:", error);
    return NextResponse.json(
      { error: "Ayarlar güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}

// PATCH - Belirli bir modülü güncelle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;
    const body = await request.json();
    const { module: moduleName, ...moduleSettings } = body;
    
    if (!moduleName) {
      return NextResponse.json(
        { error: "Modül adı gerekli" },
        { status: 400 }
      );
    }
    
    await connectDB();
    const GuildSettings = getGuildSettingsModel();
    
    const updateKey = moduleName;
    const settings = await GuildSettings.findOneAndUpdate(
      { guildId },
      { 
        [updateKey]: moduleSettings,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings PATCH error:", error);
    return NextResponse.json(
      { error: "Modül güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}
