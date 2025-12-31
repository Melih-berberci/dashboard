# 🏗️ Discord Dashboard + Bot Mimarisi

## 📐 Teknik Diyagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              MONOREPO YAPISI                                 │
│                         (Tek GitHub Repository)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────────┐              ┌────────────────────────┐        │
│   │     📱 DASHBOARD        │              │      🤖 BOT             │        │
│   │     (Next.js)          │              │     (Discord.js)        │        │
│   │                        │              │                         │        │
│   │  • Vercel'de çalışır   │              │  • Railway'de çalışır  │        │
│   │  • OAuth2 ile giriş    │              │  • 7/24 aktif          │        │
│   │  • Ayarları YAZAR      │              │  • Ayarları OKUR       │        │
│   │                        │              │                         │        │
│   │  Root: /               │              │  Root: /bot             │        │
│   └───────────┬────────────┘              └───────────┬─────────────┘        │
│               │                                       │                      │
│               │         ┌─────────────────┐           │                      │
│               │         │                 │           │                      │
│               └────────►│   🗄️ MongoDB    │◄──────────┘                      │
│                  YAZAR  │   (Atlas)       │   OKUR                           │
│                         │                 │                                  │
│                         │  GuildSettings  │                                  │
│                         │  UserLevels     │                                  │
│                         │  Users          │                                  │
│                         └─────────────────┘                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ⬇️ AKIŞ ⬇️

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  1️⃣ Kullanıcı Dashboard'a giriş yapar (Discord OAuth2)                      │
│                              ⬇️                                              │
│  2️⃣ Kendi sunucularını görür (yetki kontrolü)                               │
│                              ⬇️                                              │
│  3️⃣ Bir sunucu seçip ayarları değiştirir                                    │
│                              ⬇️                                              │
│  4️⃣ Dashboard bu ayarları MongoDB'ye YAZAR                                  │
│                              ⬇️                                              │
│  5️⃣ Bot MongoDB'den ayarları OKUR (cache ile)                               │
│                              ⬇️                                              │
│  6️⃣ Bot ayarlara göre çalışır (hoşgeldin, seviye, moderasyon vb.)          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📁 Klasör Yapısı

```
project/
├── 📁 app/                    # Next.js App Router
│   ├── api/
│   │   └── guilds/
│   │       └── [guildId]/
│   │           ├── route.ts           # Sunucu bilgileri
│   │           ├── settings/
│   │           │   └── route.ts       # Ayarları GET/PUT/PATCH
│   │           └── modules/
│   │               └── [moduleName]/
│   │                   └── route.ts   # Tekil modül güncelleme
│   ├── dashboard/
│   ├── servers/
│   └── auth/
│
├── 📁 bot/                    # Discord Bot (Railway'e deploy)
│   ├── src/
│   │   ├── index.js           # Ana giriş noktası
│   │   ├── models/
│   │   │   ├── GuildSettings.js
│   │   │   └── UserLevel.js
│   │   └── handlers/
│   │       ├── welcome.js
│   │       ├── moderation.js
│   │       ├── leveling.js
│   │       ├── logging.js
│   │       └── commands.js
│   ├── package.json
│   ├── railway.json
│   └── .env.example
│
├── 📁 components/             # React components
├── 📁 lib/                    # Utilities
├── package.json               # Dashboard dependencies
├── vercel.json                # Vercel config
└── ARCHITECTURE.md            # Bu dosya
```

## 🚀 Deploy Rehberi

### 1. Vercel'e Dashboard Deploy

```bash
# Vercel CLI ile
vercel

# Veya Vercel Dashboard'dan:
# 1. GitHub repo'yu bağla
# 2. Root Directory: / (boş bırak)
# 3. Framework: Next.js
# 4. Environment Variables ekle
```

**Environment Variables (Vercel):**
```
MONGODB_URI=mongodb+srv://...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_BOT_TOKEN=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.vercel.app
```

### 2. Railway'e Bot Deploy

```bash
# Railway Dashboard'dan:
# 1. New Project > GitHub Repo
# 2. Root Directory: bot
# 3. Start Command: npm start
# 4. Environment Variables ekle
```

**Environment Variables (Railway):**
```
DISCORD_BOT_TOKEN=...
MONGODB_URI=mongodb+srv://...  (Dashboard ile AYNI!)
```

**Railway Settings:**
- Root Directory: `bot`
- Start Command: `npm start`
- Restart Policy: Always

## 🔗 API Endpoints

### Dashboard → MongoDB

| Endpoint | Method | Açıklama |
|----------|--------|----------|
| `/api/guilds/[id]` | GET | Sunucu bilgilerini getir |
| `/api/guilds/[id]/settings` | GET | Ayarları getir |
| `/api/guilds/[id]/settings` | PUT | Tüm ayarları güncelle |
| `/api/guilds/[id]/settings` | PATCH | Tek modülü güncelle |
| `/api/guilds/[id]/modules/[name]` | PUT | Modül ayarlarını güncelle |
| `/api/guilds/[id]/modules/[name]` | PATCH | Modülü aç/kapat |

### Örnek API Kullanımı

```typescript
// Hoşgeldin sistemini aç
await fetch(`/api/guilds/${guildId}/settings`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    module: 'welcome',
    enabled: true,
    channelId: '123456789',
    message: 'Hoşgeldin {user}!'
  })
});

// Tüm ayarları güncelle
await fetch(`/api/guilds/${guildId}/settings`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prefix: '!',
    welcome: { enabled: true, channelId: '...' },
    leveling: { enabled: true, xpPerMessage: 20 }
  })
});
```

## ⚡ Bot Özellikleri

| Modül | Açıklama |
|-------|----------|
| **Welcome** | Hoşgeldin/ayrılış mesajları, oto-rol |
| **Moderation** | Anti-spam, anti-link, küfür filtresi |
| **Leveling** | XP sistemi, seviye rolleri |
| **Logging** | Mesaj, üye, ses logları |
| **Commands** | Prefix komutları, özel komutlar |

## 🔒 Güvenlik

- Dashboard botu **ASLA** başlatmaz/durdurmaz
- Bot sadece MongoDB'den **OKUR**
- Dashboard sadece MongoDB'ye **YAZAR**
- Her sunucu kendi ayarlarını görür (OAuth2 yetki kontrolü)
- Aktif/Pasif butonları sadece `enabled: true/false` değiştirir

## 📊 Veri Akışı

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Dashboard  │     │   MongoDB    │     │     Bot      │
│   (Vercel)   │     │   (Atlas)    │     │  (Railway)   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │  PUT /settings     │                    │
       │───────────────────►│                    │
       │                    │                    │
       │                    │   getSettings()    │
       │                    │◄───────────────────│
       │                    │                    │
       │                    │   settings data    │
       │                    │───────────────────►│
       │                    │                    │
       │                    │                    │  Bot ayarları
       │                    │                    │  uygular
       │                    │                    │
```

## 🎯 Önemli Notlar

1. **MongoDB URI** her iki serviste de **AYNI** olmalı
2. Bot cache kullanır (30 saniye TTL) - anlık değişiklikler için beklemek gerekebilir
3. Dashboard'dan bot durumu görülemez (ayrı sistemler)
4. Her sunucu için ayrı GuildSettings dökümanı oluşturulur

---

## 🚂 Railway Deployment (Tek Platform)

Tüm servisler Railway üzerinde çalışır:

### Proje Yapısı
```
Railway Project: chatsubo
├── Service: dashboard
│   ├── Repo: Melih-berberci/dashboard
│   ├── Port: 8080 (otomatik)
│   └── URL: https://dashboard-xxx.railway.app
│
└── Service: discord-bot
    ├── Repo: Melih-berberci/Discord-Bot
    ├── Port: Yok (daemon)
    └── URL: Yok (bot, web değil)
```

### Environment Variables (Her iki serviste de)
```env
MONGODB_URI=mongodb+srv://...
DISCORD_BOT_TOKEN=xxx (sadece bot)
DISCORD_CLIENT_ID=xxx
DISCORD_CLIENT_SECRET=xxx (sadece dashboard)
NEXTAUTH_SECRET=xxx (sadece dashboard)
NEXTAUTH_URL=https://dashboard-xxx.railway.app (sadece dashboard)
```

### Avantajlar
- ✅ Tek platform, tek fatura
- ✅ Aynı proje altında yönetim
- ✅ Shared environment variables
- ✅ Kolay monitoring
