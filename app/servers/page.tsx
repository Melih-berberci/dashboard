"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Settings, 
  Search, 
  Bot, 
  Crown, 
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  Plus,
  Server,
  Loader2
} from "lucide-react";
import { signOut } from "next-auth/react";
import { hasAdminPermission } from "@/lib/auth";
import { getGuildIconUrl } from "@/lib/utils";
import { useTheme } from "@/components/providers/theme-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
  botPresent?: boolean;
}

export default function ServersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [serverIdInput, setServerIdInput] = useState("");
  const [addingServer, setAddingServer] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualServers, setManualServers] = useState<Guild[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchGuilds() {
      // Fetch user's saved guilds from database
      try {
        const savedGuildsRes = await fetch("/api/user/guilds");
        if (savedGuildsRes.ok) {
          const data = await savedGuildsRes.json();
          const savedGuilds = (data.guilds || []).map((g: any) => ({
            id: g.guildId,
            name: g.guildName || `Sunucu ${g.guildId}`,
            icon: g.guildIcon,
            owner: false,
            permissions: "0",
            features: [],
            botPresent: false,
          }));
          setManualServers(savedGuilds);
        }
      } catch (error) {
        console.error("Failed to fetch saved guilds:", error);
      }

      // If using Discord OAuth, fetch user's guilds
      if (session?.accessToken) {
        try {
          const response = await fetch("https://discord.com/api/users/@me/guilds", {
            headers: {
              Authorization: `Bearer ${session.accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            // Filter guilds where user has admin permission
            const adminGuilds = data.filter((guild: Guild) => 
              hasAdminPermission(guild.permissions)
            );
            setGuilds(adminGuilds);
          }
        } catch (error) {
          console.error("Failed to fetch guilds:", error);
        }
      }
      // Always set loading to false (for both Discord and Credentials auth)
      setLoading(false);
    }

    if (status === "authenticated") {
      fetchGuilds();
    }
  }, [session, status]);

  // Combine user's Discord guilds with manually added servers
  const allGuilds = [...guilds, ...manualServers];
  
  const filteredGuilds = allGuilds.filter((guild) =>
    guild.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // State for server name input
  const [serverNameInput, setServerNameInput] = useState("");

  // Function to add server by ID
  const handleAddServerById = async () => {
    if (!serverIdInput.trim()) {
      toast.error("Lütfen bir sunucu ID'si girin");
      return;
    }

    // Check if server already exists
    if (allGuilds.some(g => g.id === serverIdInput.trim())) {
      toast.error("Bu sunucu zaten listede");
      return;
    }

    setAddingServer(true);
    try {
      // Save to database directly without requiring bot
      const response = await fetch("/api/user/guilds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId: serverIdInput.trim(),
          guildName: serverNameInput.trim() || `Sunucu ${serverIdInput.trim()}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Sunucu eklenemedi");
        return;
      }

      const newGuild: Guild = {
        id: serverIdInput.trim(),
        name: serverNameInput.trim() || `Sunucu ${serverIdInput.trim()}`,
        icon: null,
        owner: false,
        permissions: "0",
        features: [],
        botPresent: false,
      };

      setManualServers(prev => [...prev, newGuild]);
      setServerIdInput("");
      setServerNameInput("");
      setDialogOpen(false);
      toast.success(`${newGuild.name} sunucusu eklendi!`);
    } catch (error) {
      toast.error("Sunucu eklenirken bir hata oluştu");
    } finally {
      setAddingServer(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-discord flex items-center justify-center">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl hidden sm:block">Dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={`https://cdn.discordapp.com/avatars/${session?.user?.id}/${session?.user?.avatar}.png`}
                    />
                    <AvatarFallback>
                      {session?.user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block">{session?.user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/auth/login" })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Title and Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Sunucularınız</h1>
              <p className="text-muted-foreground mt-1">
                Yönetici yetkisine sahip olduğunuz sunucuları seçin
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sunucu ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setServerIdInput(""); setServerNameInput(""); } }}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">Sunucu Ekle</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sunucu Ekle</DialogTitle>
                    <DialogDescription>
                      Sunucu ID'sini ve adını girerek sunucuyu dashboard'a ekleyebilirsiniz.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sunucu ID</label>
                      <Input
                        placeholder="123456789012345678"
                        value={serverIdInput}
                        onChange={(e) => setServerIdInput(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Discord'da sunucuya sağ tıklayıp "Sunucu ID'sini Kopyala" seçeneğini kullanabilirsiniz.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Sunucu Adı</label>
                      <Input
                        placeholder="Benim Sunucum"
                        value={serverNameInput}
                        onChange={(e) => setServerNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddServerById()}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      İptal
                    </Button>
                    <Button onClick={handleAddServerById} disabled={addingServer}>
                      {addingServer ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Ekleniyor...
                        </>
                      ) : (
                        <>
                          <Server className="mr-2 h-4 w-4" />
                          Sunucuyu Ekle
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Guilds Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-2xl" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredGuilds.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Sunucu Bulunamadı</h3>
                    <p className="text-muted-foreground mt-1">
                      {searchTerm
                        ? "Arama kriterinize uygun sunucu bulunamadı"
                        : "Yönetici yetkisine sahip olduğunuz sunucu bulunmuyor"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGuilds.map((guild) => (
                <Card
                  key={guild.id}
                  className="group hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/${guild.id}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      {guild.icon ? (
                        <Image
                          src={getGuildIconUrl(guild.id, guild.icon) || ""}
                          alt={guild.name}
                          width={64}
                          height={64}
                          className="rounded-2xl"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                          <span className="text-2xl font-bold text-muted-foreground">
                            {guild.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{guild.name}</h3>
                          {guild.owner && (
                            <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {guild.botPresent ? (
                            <Badge variant="success" className="text-xs">
                              Bot Aktif
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Bot Yok
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
