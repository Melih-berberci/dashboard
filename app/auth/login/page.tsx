"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Zap, Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDiscordLogin = () => {
    signIn("discord", { callbackUrl: "/servers" });
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email veya şifre hatalı");
      } else {
        router.push("/servers");
      }
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Cyberpunk Background */}
      <div className="absolute inset-0 bg-background">
        <div className="absolute inset-0 bg-cyber-grid bg-cyber-grid opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      {/* Scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none scanlines opacity-50" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <img src="/logo.png" alt="Chatsubo" className="h-20 w-20 rounded-2xl object-cover animate-neon-pulse" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-secondary rounded-full animate-ping" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight font-cyber">
              <span className="text-secondary neon-text-pink">CHAT</span><span className="text-primary neon-text">SUBO</span>
            </h1>
            <p className="text-muted-foreground mt-2 tracking-wide">
              // SİSTEME ERİŞİM YETKİSİ GEREKLİ
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border border-primary/30 bg-card/80 backdrop-blur-xl cyber-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-primary flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="tracking-wider">GİRİŞ YAP</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Kimlik doğrulama protokolü başlatılıyor...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email/Password Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-primary/80 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  Email Adresi
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="cyber@panel.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="bg-background/50 border-primary/30 focus:border-primary focus:shadow-[0_0_10px_hsl(180_100%_50%/0.3)] transition-all placeholder:text-muted-foreground/50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-primary/80 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  Şifre
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="bg-background/50 border-primary/30 focus:border-primary focus:shadow-[0_0_10px_hsl(180_100%_50%/0.3)] transition-all pr-10 placeholder:text-muted-foreground/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
                  <span className="animate-pulse">⚠</span>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="cyber"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">◌</span>
                    DOĞRULANIYOR...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    GİRİŞ YAP
                  </span>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-primary/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-4 text-muted-foreground tracking-wider">
                  veya
                </span>
              </div>
            </div>

            {/* Discord Login */}
            <Button
              variant="discord"
              size="lg"
              className="w-full group"
              onClick={handleDiscordLogin}
            >
              <svg
                className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Discord ile Giriş Yap
            </Button>

            {/* Features */}
            <div className="grid gap-2 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10 hover:border-primary/30 transition-colors">
                <Shield className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-medium text-primary">Güvenli Bağlantı</p>
                  <p className="text-[10px] text-muted-foreground">256-bit şifreleme aktif</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/5 border border-secondary/10 hover:border-secondary/30 transition-colors">
                <Zap className="h-4 w-4 text-secondary" />
                <div>
                  <p className="text-xs font-medium text-secondary">Anlık Senkronizasyon</p>
                  <p className="text-[10px] text-muted-foreground">Gerçek zamanlı veri akışı</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Register Link */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Hesabınız yok mu?{" "}
            <Link href="/auth/register" className="text-primary hover:text-primary/80 transition-colors font-medium hover:underline">
              Kayıt Ol
            </Link>
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Giriş yaparak{" "}
            <a href="#" className="underline hover:text-primary transition-colors">
              Kullanım Şartları
            </a>{" "}
            ve{" "}
            <a href="#" className="underline hover:text-primary transition-colors">
              Gizlilik Politikası
            </a>
            &apos;nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  );
}
