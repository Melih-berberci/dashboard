/**
 * Guild Toggle API Endpoint
 * 
 * Sadece ilgili guild'in botEnabled durumunu değiştirir.
 * ❌ Diğer guild'lere DOKUNMAZ
 * ❌ Global flag KULLANILMAZ
 * ✅ Sadece ilgili guildId için işlem yapar
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB, mongoose } from "@/lib/db";

// Minimal schema - sadece toggle için gerekli field'lar
const guildToggleSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  botEnabled: { type: Boolean, default: true },
}, { 
  timestamps: true,
  strict: false // Diğer field'ları korumak için
});

function getGuildSettingsModel() {
  return mongoose.models.GuildSettings || mongoose.model("GuildSettings", guildToggleSchema);
}

/**
 * GET - Guild'in aktif/pasif durumunu getir
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;
    
    await connectDB();
    const GuildSettings = getGuildSettingsModel();
    
    const settings = await GuildSettings.findOne(
      { guildId },
      { botEnabled: 1, guildId: 1, updatedAt: 1 }
    ).lean() as { botEnabled?: boolean; updatedAt?: Date } | null;
    
    return NextResponse.json({
      guildId,
      enabled: settings?.botEnabled !== false, // default true
      updatedAt: settings?.updatedAt || null
    });
  } catch (error) {
    console.error("[Toggle GET] Error:", error);
    return NextResponse.json(
      { error: "Durum alınırken hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * POST - Guild'i aktif/pasif yap
 * 
 * Body: { enabled: boolean }
 * 
 * ÖNEMLİ: Sadece ilgili guild'in botEnabled field'ını günceller.
 * Diğer guild'lere ve diğer field'lara DOKUNMAZ.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;
    const body = await request.json();
    const { enabled } = body;
    
    // Validation
    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled field boolean olmalı" },
        { status: 400 }
      );
    }
    
    await connectDB();
    const GuildSettings = getGuildSettingsModel();
    
    // Sadece botEnabled field'ını güncelle - atomik işlem
    const result = await GuildSettings.updateOne(
      { guildId },
      { 
        $set: { 
          botEnabled: enabled,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log(`[Toggle] Guild ${guildId} set to ${enabled ? 'ENABLED' : 'DISABLED'}`);
    
    return NextResponse.json({
      success: true,
      guildId,
      enabled,
      message: enabled 
        ? "Bot bu sunucu için aktifleştirildi" 
        : "Bot bu sunucu için pasifleştirildi",
      // Diğer sunucular ETKİLENMEZ
      affectedGuilds: [guildId], // Sadece bu guild
      globalChange: false // Global değişiklik YOK
    });
  } catch (error) {
    console.error("[Toggle POST] Error:", error);
    return NextResponse.json(
      { error: "Durum güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Toggle (mevcut durumun tersini yap)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string }> }
) {
  try {
    const { guildId } = await params;
    
    await connectDB();
    const GuildSettings = getGuildSettingsModel();
    
    // Mevcut durumu al
    const current = await GuildSettings.findOne(
      { guildId },
      { botEnabled: 1 }
    ).lean() as { botEnabled?: boolean } | null;
    
    const currentEnabled = current?.botEnabled !== false;
    const newEnabled = !currentEnabled;
    
    // Toggle yap - atomik işlem
    await GuildSettings.updateOne(
      { guildId },
      { 
        $set: { 
          botEnabled: newEnabled,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log(`[Toggle] Guild ${guildId} toggled: ${currentEnabled} -> ${newEnabled}`);
    
    return NextResponse.json({
      success: true,
      guildId,
      previousState: currentEnabled,
      enabled: newEnabled,
      message: newEnabled 
        ? "Bot bu sunucu için aktifleştirildi" 
        : "Bot bu sunucu için pasifleştirildi"
    });
  } catch (error) {
    console.error("[Toggle PATCH] Error:", error);
    return NextResponse.json(
      { error: "Toggle işlemi başarısız" },
      { status: 500 }
    );
  }
}
