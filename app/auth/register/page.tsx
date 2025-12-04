"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  UserPlus,
  CheckCircle2,
  XCircle,
  Shield
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDiscordLogin = () => {
    signIn("discord", { callbackUrl: "/servers" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const passwordRequirements = [
    { label: "En az 8 karakter", met: formData.password.length >= 8 },
    { label: "Büyük harf içermeli", met: /[A-Z]/.test(formData.password) },
    { label: "Küçük harf içermeli", met: /[a-z]/.test(formData.password) },
    { label: "Rakam içermeli", met: /\d/.test(formData.password) },
  ];

  const isPasswordValid = passwordRequirements.every((req) => req.met);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword !== "";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!isPasswordValid) {
      setError("Şifre gereksinimleri karşılanmıyor");
      setIsLoading(false);
      return;
    }

    if (!passwordsMatch) {
      setError("Şifreler eşleşmiyor");
      setIsLoading(false);
      return;
    }

    try {
      // API call to register user
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Kayıt işlemi başarısız oldu");
        return;
      }

      // Auto login after registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        router.push("/auth/login");
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
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5" />
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "1s" }} />
      </div>

      {/* Scanlines overlay */}
      <div className="absolute inset-0 pointer-events-none scanlines opacity-50" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <img src="/logo.png" alt="Chatsubo" className="h-20 w-20 rounded-2xl object-cover animate-neon-pulse-pink" />
              <div className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full animate-ping" />
            </div>
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight font-cyber">
              <span className="text-secondary neon-text-pink">CHAT</span><span className="text-primary neon-text">SUBO</span>
            </h1>
            <p className="text-muted-foreground mt-2 tracking-wide">
              // YENİ KULLANICI OLUŞTURMA PROTOKOLü
            </p>
          </div>
        </div>

        {/* Register Card */}
        <Card className="border border-secondary/30 bg-card/80 backdrop-blur-xl cyber-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-secondary flex items-center justify-center gap-2">
              <UserPlus className="h-5 w-5" />
              <span className="tracking-wider">KAYIT OL</span>
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Sistem kaydı başlatılıyor...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Register Form */}
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-secondary/80 text-xs uppercase tracking-wider flex items-center gap-2">
                  <User className="h-3 w-3" />
                  Kullanıcı Adı
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="cyberuser"
                  value={formData.username}
                  onChange={handleChange}
                  autoComplete="username"
                  className="bg-background/50 border-secondary/30 focus:border-secondary focus:shadow-[0_0_10px_hsl(320_100%_60%/0.3)] transition-all placeholder:text-muted-foreground/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-secondary/80 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Mail className="h-3 w-3" />
                  Email Adresi
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="cyber@panel.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  className="bg-background/50 border-secondary/30 focus:border-secondary focus:shadow-[0_0_10px_hsl(320_100%_60%/0.3)] transition-all placeholder:text-muted-foreground/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-secondary/80 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  Şifre
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className="bg-background/50 border-secondary/30 focus:border-secondary focus:shadow-[0_0_10px_hsl(320_100%_60%/0.3)] transition-all pr-10 placeholder:text-muted-foreground/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {formData.password && (
                  <div className="mt-2 p-2 rounded-lg bg-background/50 border border-secondary/10">
                    <div className="grid grid-cols-2 gap-1">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center gap-1 text-[10px]">
                          {req.met ? (
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                          ) : (
                            <XCircle className="h-3 w-3 text-destructive" />
                          )}
                          <span className={req.met ? "text-green-500" : "text-muted-foreground"}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-secondary/80 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Lock className="h-3 w-3" />
                  Şifre Tekrar
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                    className={`bg-background/50 border-secondary/30 focus:border-secondary focus:shadow-[0_0_10px_hsl(320_100%_60%/0.3)] transition-all pr-10 placeholder:text-muted-foreground/50 ${
                      formData.confirmPassword && (passwordsMatch ? "border-green-500" : "border-destructive")
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-secondary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-[10px] text-destructive flex items-center gap-1">
                    <XCircle className="h-3 w-3" />
                    Şifreler eşleşmiyor
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
                  <span className="animate-pulse">⚠</span>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="cyberPink"
                size="lg"
                className="w-full"
                disabled={isLoading || !isPasswordValid || !passwordsMatch}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">◌</span>
                    İŞLENİYOR...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    KAYIT OL
                  </span>
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-secondary/20" />
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
              Discord ile Kayıt Ol
            </Button>

            {/* Security Note */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <Shield className="h-4 w-4 text-primary" />
              <p className="text-[10px] text-muted-foreground">
                Tüm veriler 256-bit şifreleme ile korunmaktadır
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Login Link */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Zaten hesabınız var mı?{" "}
            <Link href="/auth/login" className="text-secondary hover:text-secondary/80 transition-colors font-medium hover:underline">
              Giriş Yap
            </Link>
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Kayıt olarak{" "}
            <a href="#" className="underline hover:text-secondary transition-colors">
              Kullanım Şartları
            </a>{" "}
            ve{" "}
            <a href="#" className="underline hover:text-secondary transition-colors">
              Gizlilik Politikası
            </a>
            &apos;nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  );
}
