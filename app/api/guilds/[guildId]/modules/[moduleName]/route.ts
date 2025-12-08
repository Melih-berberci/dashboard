import { NextRequest, NextResponse } from "next/server";
import { connectDB, mongoose } from "@/lib/db";

// GuildSettings model'i al
function getGuildSettingsModel(): any {
  if (mongoose.models.GuildSettings) {
    return mongoose.models.GuildSettings;
  }
  
  // Schema basit tutuldu - ana settings route'da tanımlı
  const schema = new mongoose.Schema({}, { strict: false });
  return mongoose.model("GuildSettings", schema);
}

// GET - Belirli bir modülün ayarlarını getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string; moduleName: string }> }
) {
  try {
    const { guildId, moduleName } = await params;
    
    await connectDB();
    const GuildSettings = getGuildSettingsModel();
    
    const settings = await GuildSettings.findOne({ guildId });
    
    if (!settings) {
      return NextResponse.json(
        { error: "Sunucu ayarları bulunamadı" },
        { status: 404 }
      );
    }
    
    const moduleSettings = settings[moduleName];
    
    if (moduleSettings === undefined) {
      return NextResponse.json(
        { error: "Modül bulunamadı" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      guildId,
      module: moduleName,
      settings: moduleSettings,
    });
  } catch (error) {
    console.error("Module GET error:", error);
    return NextResponse.json(
      { error: "Modül ayarları alınırken hata oluştu" },
      { status: 500 }
    );
  }
}

// PUT - Modül ayarlarını güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string; moduleName: string }> }
) {
  try {
    const { guildId, moduleName } = await params;
    const body = await request.json();
    
    await connectDB();
    const GuildSettings = getGuildSettingsModel();
    
    const updateQuery: Record<string, any> = {
      updatedAt: new Date(),
    };
    
    // Modül ayarlarını güncelle
    Object.keys(body).forEach((key) => {
      updateQuery[`${moduleName}.${key}`] = body[key];
    });
    
    const settings = await GuildSettings.findOneAndUpdate(
      { guildId },
      { $set: updateQuery },
      { new: true, upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      guildId,
      module: moduleName,
      settings: settings[moduleName],
    });
  } catch (error) {
    console.error("Module PUT error:", error);
    return NextResponse.json(
      { error: "Modül güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}

// PATCH - Modülü aktif/pasif yap (toggle)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ guildId: string; moduleName: string }> }
) {
  try {
    const { guildId, moduleName } = await params;
    const body = await request.json();
    const { enabled } = body;
    
    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        { error: "enabled parametresi boolean olmalı" },
        { status: 400 }
      );
    }
    
    await connectDB();
    const GuildSettings = getGuildSettingsModel();
    
    const settings = await GuildSettings.findOneAndUpdate(
      { guildId },
      { 
        $set: { 
          [`${moduleName}.enabled`]: enabled,
          updatedAt: new Date(),
        }
      },
      { new: true, upsert: true }
    );
    
    return NextResponse.json({
      success: true,
      guildId,
      module: moduleName,
      enabled: settings[moduleName]?.enabled,
    });
  } catch (error) {
    console.error("Module PATCH error:", error);
    return NextResponse.json(
      { error: "Modül durumu güncellenirken hata oluştu" },
      { status: 500 }
    );
  }
}
