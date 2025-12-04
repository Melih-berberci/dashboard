"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import {
  Bot,
  Shield,
  Zap,
  BarChart3,
  Users,
  Settings,
  ArrowRight,
  CheckCircle,
  Cpu,
  Terminal,
  Database,
  Wifi,
  Lock,
  Sparkles,
  ChevronRight,
  Globe,
  Activity,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Güçlü Güvenlik",
    description: "256-bit şifreleme ve gelişmiş koruma protokolleri",
    color: "primary",
  },
  {
    icon: Database,
    title: "Veri Yönetimi",
    description: "Gerçek zamanlı veri senkronizasyonu ve yedekleme",
    color: "secondary",
  },
  {
    icon: Activity,
    title: "Canlı Monitoring",
    description: "Sunucu aktivitesi ve bot performansı izleme",
    color: "primary",
  },
  {
    icon: Settings,
    title: "Tam Kontrol",
    description: "Tüm ayarları tek panelden yönetin",
    color: "secondary",
  },
];

const stats = [
  { value: "99.9%", label: "Uptime", icon: Wifi },
  { value: "50ms", label: "Yanıt Süresi", icon: Zap },
  { value: "256-bit", label: "Şifreleme", icon: Lock },
  { value: "24/7", label: "Destek", icon: Globe },
];

const highlights = [
  "Discord OAuth2 ile güvenli giriş",
  "Gerçek zamanlı senkronizasyon",
  "Çoklu bot desteği",
  "Mobil uyumlu tasarım",
  "Gelişmiş analitik",
  "API erişimi",
];

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/servers");
    }
  }, [status, router]);

  const handleDiscordLogin = () => {
    signIn("discord", { callbackUrl: "/servers" });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-cyber-grid bg-cyber-grid opacity-20" />
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center animate-neon-pulse">
            <Cpu className="h-8 w-8 text-background animate-pulse" />
          </div>
          <p className="mt-4 text-primary text-sm tracking-wider animate-pulse">SİSTEM BAŞLATILIYOR...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-cyber-grid bg-cyber-grid opacity-20" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 scanlines opacity-30" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-primary/20 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Chatsubo" className="h-10 w-10 rounded-xl object-cover" />
            <span className="font-bold text-xl tracking-wider">
              <span className="text-secondary neon-text-pink">CHAT</span>
              <span className="text-primary neon-text">SUBO</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="outline" className="hidden sm:flex">
                <Terminal className="mr-2 h-4 w-4" />
                Giriş Yap
              </Button>
            </Link>
            <Button variant="cyber" onClick={handleDiscordLogin}>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span className="hidden sm:inline">Discord ile</span> Başla
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative">
        <div className="container mx-auto text-center relative z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-8 animate-pulse-glow">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="tracking-wider">SİSTEM AKTİF // v2.0.77</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 font-cyber">
            <span className="text-secondary neon-text-pink">CHAT</span>
            <span className="text-primary neon-text">SUBO</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4 tracking-wide">
            // GELİŞMİŞ DISCORD BOT YÖNETİM SİSTEMİ
          </p>
          
          <p className="text-muted-foreground max-w-xl mx-auto mb-10">
            Yapay zeka destekli analitik, gerçek zamanlı monitoring ve tam kontrol.
            Botlarınızı geleceğin teknolojisiyle yönetin.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/login">
              <Button size="xl" variant="cyber" className="w-full sm:w-auto group">
                <Sparkles className="mr-2 h-5 w-5 group-hover:animate-spin" />
                BAŞLAT
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button size="xl" variant="neonPink" onClick={handleDiscordLogin} className="w-full sm:w-auto">
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Discord ile Giriş
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all hover:shadow-[0_0_20px_hsl(180_100%_50%/0.1)] group"
              >
                <stat.icon className="h-5 w-5 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-bold text-primary neon-text">{stat.value}</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-12">
            <p className="text-primary text-sm tracking-wider mb-2">// MODÜLLER</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-cyber">
              <span className="text-primary">SİSTEM</span>{" "}
              <span className="text-secondary">ÖZELLİKLERİ</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Gelişmiş özellikler ile botlarınızı profesyonel düzeyde yönetin
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className={`border cyber-card group cursor-pointer ${
                  feature.color === "primary" 
                    ? "border-primary/20 hover:border-primary/50" 
                    : "border-secondary/20 hover:border-secondary/50"
                }`}
              >
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 ${
                    feature.color === "primary" 
                      ? "bg-primary/10 group-hover:bg-primary/20" 
                      : "bg-secondary/10 group-hover:bg-secondary/20"
                  }`}>
                    <feature.icon className={`h-6 w-6 ${
                      feature.color === "primary" ? "text-primary" : "text-secondary"
                    }`} />
                  </div>
                  <h3 className={`font-semibold text-lg mb-2 tracking-wide ${
                    feature.color === "primary" ? "text-primary" : "text-secondary"
                  }`}>
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20 px-4 relative">
        <div className="container mx-auto">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <p className="text-secondary text-sm tracking-wider mb-2">// AVANTAJLAR</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 font-cyber">
                <span className="text-secondary neon-text-pink">NEDEN</span>{" "}
                <span className="text-primary neon-text">CHATSUBO?</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                En son teknolojiler ve güvenlik protokolleri ile tasarlanmış,
                profesyonel düzeyde bot yönetim deneyimi.
              </p>
              <div className="grid gap-3">
                {highlights.map((item, index) => (
                  <div 
                    key={item} 
                    className="flex items-center gap-3 p-3 rounded-lg border border-primary/10 bg-primary/5 hover:border-primary/30 transition-all group cursor-pointer"
                  >
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-sm">{item}</span>
                    <ChevronRight className="h-4 w-4 text-primary ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-2xl bg-gradient-to-br from-primary/10 via-card to-secondary/10 border border-primary/20 flex items-center justify-center relative overflow-hidden group hover:border-primary/40 transition-all">
                <div className="absolute inset-0 bg-cyber-grid bg-cyber-grid opacity-30" />
                <div className="absolute inset-0 scanlines opacity-20" />
                <div className="text-center p-8 relative z-10">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 animate-float">
                    <Bot className="h-10 w-10 text-background" />
                  </div>
                  <p className="text-lg font-medium text-primary neon-text">Dashboard Önizleme</p>
                  <p className="text-sm text-muted-foreground">Giriş yaparak sisteme erişin</p>
                </div>
                {/* Decorative corners */}
                <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-primary/50" />
                <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-secondary/50" />
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-secondary/50" />
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-primary/50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-secondary/5" />
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-2xl mx-auto p-8 rounded-2xl border border-primary/20 bg-card/50 backdrop-blur-sm">
            <p className="text-primary text-sm tracking-wider mb-2">// ERİŞİM</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-cyber">
              <span className="text-primary neon-text">SİSTEME</span>{" "}
              <span className="text-secondary neon-text-pink">BAĞLAN</span>
            </h2>
            <p className="text-muted-foreground mb-8">
              Hemen giriş yapın ve Discord botlarınızı yönetmeye başlayın.
              Güvenli, hızlı ve ücretsiz.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" variant="cyber" className="w-full sm:w-auto">
                  <Users className="mr-2 h-5 w-5" />
                  Kayıt Ol
                </Button>
              </Link>
              <Button size="lg" variant="discord" onClick={handleDiscordLogin} className="w-full sm:w-auto">
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord ile Giriş
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-primary/20 relative">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Chatsubo" className="h-5 w-5 rounded object-cover" />
              <span className="text-sm text-muted-foreground">
                <span className="text-secondary">CHAT</span>
                <span className="text-primary">SUBO</span>
                {" "}© 2024
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Kullanım Şartları</a>
              <a href="#" className="hover:text-primary transition-colors">Gizlilik</a>
              <a href="#" className="hover:text-primary transition-colors">İletişim</a>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>Tüm sistemler çalışıyor</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
