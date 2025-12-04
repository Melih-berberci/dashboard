# Discord Bot Dashboard

Modern ve güçlü Discord bot yönetim paneli. Next.js, Express.js ve MongoDB ile oluşturulmuştur.

## Özellikler

- **Discord OAuth2 Entegrasyonu**: Güvenli giriş sistemi
- **Sunucu Seçimi**: Yönetici yetkisine sahip olduğunuz sunucuları görüntüleme
- **Modül Yönetimi**:
  - Moderasyon (Oto-moderasyon, Log sistemi)
  - Karşılama (Hoşgeldin mesajları, Otomatik rol)
  - Seviye Sistemi (XP kazanma, Seviye atlamalart)
  - Bilet Sistemi (Destek talepleri)
- **Gerçek Zamanlı Senkronizasyon**: WebSocket ile anlık güncellemeler
- **Detaylı Loglama**: Tüm sunucu olaylarının kaydı
- **Dark/Light Mode**: Kullanıcı tercihine göre tema
- **Responsive Tasarım**: Mobil uyumlu arayüz

## Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Ortam Değişkenlerini Ayarlayın

`.env.example` dosyasını `.env` olarak kopyalayın ve değerleri doldurun:

```bash
cp .env.example .env
```




### 3. Discord Developer Portal Ayarları

1. [Discord Developer Portal](https://discord.com/developers/applications)'a gidin
2. Yeni bir uygulama oluşturun veya mevcut uygulamanızı seçin
3. **OAuth2** sekmesinde:
   - Client ID ve Client Secret'ı kopyalayın
   - Redirects kısmına `http://localhost:3000/api/auth/callback/discord` ekleyin
4. **Bot** sekmesinde:
   - Bot token'ı kopyalayın

### 4. Uygulamayı Başlatın

**Development modunda:**

```bash
# Frontend ve Backend'i aynı anda başlatmak için:
npm run dev:all

# Veya ayrı ayrı:
npm run dev        # Frontend (port 3000)
npm run server     # Backend (port 5000)
```

**Production build:**

```bash
npm run build
npm start
```

## Proje Yapısı

```
dashboard/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   └── auth/             # NextAuth endpoints
│   ├── auth/                 # Auth sayfaları
│   │   └── login/            # Giriş sayfası
│   ├── dashboard/            # Dashboard sayfaları
│   │   └── [guildId]/        # Sunucu yönetim sayfası
│   ├── servers/              # Sunucu listesi
│   ├── globals.css           # Global stiller
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Ana sayfa
├── components/               # React bileşenleri
│   ├── providers/            # Context providers
│   │   ├── session-provider.tsx
│   │   └── theme-provider.tsx
│   └── ui/                   # UI bileşenleri
├── lib/                      # Utility fonksiyonları
│   ├── auth.ts               # Auth helpers
│   └── utils.ts              # Genel utilities
├── server/                   # Express backend
│   └── index.js              # API server
├── .env.example              # Ortam değişkenleri örneği
├── next.config.js            # Next.js config
├── package.json              # Dependencies
├── tailwind.config.ts        # Tailwind config
└── tsconfig.json             # TypeScript config
```

## API Endpoints

### Backend API (Port 5000)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/health` | Sunucu sağlık kontrolü |
| GET | `/api/guilds/:guildId/settings` | Sunucu ayarlarını getir |
| PUT | `/api/guilds/:guildId/settings` | Sunucu ayarlarını güncelle |
| PATCH | `/api/guilds/:guildId/modules/:moduleName` | Modül ayarlarını güncelle |
| GET | `/api/guilds/:guildId/logs` | Log kayıtlarını getir |
| POST | `/api/guilds/:guildId/logs` | Yeni log ekle |
| POST | `/api/bot/stats` | Bot istatistiklerini gönder |

## Teknolojiler

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: TailwindCSS, shadcn/ui
- **Authentication**: NextAuth.js (Discord OAuth2)
- **Backend**: Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.io
- **State Management**: Zustand

## Bot Entegrasyonu

Dashboard, Discord botunuzla iletişim kurmak için REST API ve WebSocket kullanır. Botunuzda aşağıdaki entegrasyonu yapmanız gerekir:

```javascript
// Bot tarafında ayarları almak için:
const response = await fetch(`${DASHBOARD_API}/api/guilds/${guildId}/settings`);
const settings = await response.json();

// Ayar değişikliklerini dinlemek için (WebSocket):
const socket = io(DASHBOARD_API);
socket.on('settings-update', ({ guildId, settings }) => {
  // Ayarları güncelle
});
```

## Katkıda Bulunma

1. Bu repo'yu fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.
