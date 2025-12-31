"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Activity,
  MessageSquare,
  Shield,
  Bell,
  Settings,
  Home,
  Bot,
  ChevronLeft,
  Search,
  Moon,
  Sun,
  LogOut,
  Zap,
  Clock,
  Server,
  Hash,
  UserPlus,
  UserMinus,
  Gavel,
  FileText,
  Star,
  Ticket,
  Music,
  Terminal,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Loader2,
  Volume2,
  Image as ImageIcon,
  AtSign,
  Link,
  Ban,
  UserX,
  Edit,
  Mic,
  MicOff,
  Circle,
  ArrowRight,
  Smile,
  LinkIcon,
  Filter,
  Pause,
  Play,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "@/components/providers/theme-provider";
import { getGuildIconUrl } from "@/lib/utils";
import { toast } from "sonner";
import { useAuthStore, hasGuildPermission } from "@/lib/auth-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface GuildData {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  onlineCount: number;
  channels: Channel[];
  roles: Role[];
  bots: BotInfo[];
  members: MemberInfo[];
}

interface Channel {
  id: string;
  name: string;
  type: number;
  parentId?: string;
}

interface Role {
  id: string;
  name: string;
  color: number;
  position: number;
}

interface BotInfo {
  id: string;
  username: string;
  avatar: string | null;
  discriminator: string;
}

interface MemberInfo {
  id: string;
  username: string;
  avatar: string | null;
  nickname: string | null;
  roles: string[];
  joinedAt: string;
  isBot: boolean;
}

interface Command {
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  cooldown: number;
  permissions: string[];
}

interface ModuleSettings {
  welcome: {
    enabled: boolean;
    channelId: string;
    message: string;
    leaveMessage: string;
    autoRole: string;
  };
  moderation: {
    enabled: boolean;
    logChannelId: string;
    antiLink: boolean;
    antiSpam: boolean;
    badWords: string[];
    modRoles: string[];
  };
  leveling: {
    enabled: boolean;
    channelId: string;
    xpRate: number;
  };
  tickets: {
    enabled: boolean;
    categoryId: string;
    supportRoles: string[];
  };
}

// Log Entry Interface
interface LogEntry {
  _id?: string;
  guildId: string;
  type: string;
  userId?: string;
  username?: string;
  action: string;
  details: Record<string, any>;
  createdAt: string | Date;
}

// Log type categories
const LOG_TYPE_CONFIG: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  message_create: { icon: MessageSquare, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Mesaj" },
  message_delete: { icon: Trash2, color: "text-red-500", bgColor: "bg-red-500/10", label: "Mesaj Silindi" },
  message_update: { icon: Edit, color: "text-yellow-500", bgColor: "bg-yellow-500/10", label: "Mesaj Düzenlendi" },
  member_join: { icon: UserPlus, color: "text-green-500", bgColor: "bg-green-500/10", label: "Katıldı" },
  member_leave: { icon: UserMinus, color: "text-orange-500", bgColor: "bg-orange-500/10", label: "Ayrıldı" },
  member_ban: { icon: Ban, color: "text-red-600", bgColor: "bg-red-600/10", label: "Yasaklandı" },
  member_unban: { icon: UserPlus, color: "text-green-600", bgColor: "bg-green-600/10", label: "Yasak Kaldırıldı" },
  member_kick: { icon: UserX, color: "text-orange-600", bgColor: "bg-orange-600/10", label: "Atıldı" },
  member_update: { icon: RefreshCw, color: "text-purple-500", bgColor: "bg-purple-500/10", label: "Güncellendi" },
  voice_join: { icon: Mic, color: "text-green-500", bgColor: "bg-green-500/10", label: "Ses Katıldı" },
  voice_leave: { icon: MicOff, color: "text-red-500", bgColor: "bg-red-500/10", label: "Ses Ayrıldı" },
  voice_move: { icon: ArrowRight, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Ses Taşındı" },
  channel_create: { icon: Hash, color: "text-green-500", bgColor: "bg-green-500/10", label: "Kanal Oluşturuldu" },
  channel_delete: { icon: Trash2, color: "text-red-500", bgColor: "bg-red-500/10", label: "Kanal Silindi" },
  channel_update: { icon: Edit, color: "text-yellow-500", bgColor: "bg-yellow-500/10", label: "Kanal Güncellendi" },
  role_create: { icon: Shield, color: "text-green-500", bgColor: "bg-green-500/10", label: "Rol Oluşturuldu" },
  role_delete: { icon: Trash2, color: "text-red-500", bgColor: "bg-red-500/10", label: "Rol Silindi" },
  role_update: { icon: Edit, color: "text-yellow-500", bgColor: "bg-yellow-500/10", label: "Rol Güncellendi" },
  reaction_add: { icon: Smile, color: "text-blue-500", bgColor: "bg-blue-500/10", label: "Tepki Eklendi" },
  reaction_remove: { icon: Smile, color: "text-gray-500", bgColor: "bg-gray-500/10", label: "Tepki Kaldırıldı" },
  invite_create: { icon: LinkIcon, color: "text-purple-500", bgColor: "bg-purple-500/10", label: "Davet Oluşturuldu" },
  invite_delete: { icon: LinkIcon, color: "text-red-500", bgColor: "bg-red-500/10", label: "Davet Silindi" },
  guild_update: { icon: Server, color: "text-yellow-500", bgColor: "bg-yellow-500/10", label: "Sunucu Güncellendi" },
  bot_ready: { icon: Bot, color: "text-green-500", bgColor: "bg-green-500/10", label: "Bot Bağlandı" },
  bot_error: { icon: Bot, color: "text-red-500", bgColor: "bg-red-500/10", label: "Bot Hatası" },
};

const defaultSettings: ModuleSettings = {
  welcome: {
    enabled: false,
    channelId: "",
    message: "Hoşgeldin {user}! Sunucuya katıldığın için teşekkürler!",
    leaveMessage: "{user} sunucudan ayrıldı.",
    autoRole: "",
  },
  moderation: {
    enabled: false,
    logChannelId: "",
    antiLink: false,
    antiSpam: false,
    badWords: [],
    modRoles: [],
  },
  leveling: {
    enabled: false,
    channelId: "",
    xpRate: 1,
  },
  tickets: {
    enabled: false,
    categoryId: "",
    supportRoles: [],
  },
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const guildId = params.guildId as string;
  
  // Auth store for permission checking
  const { user: authUser, isAuthenticated: isAdminAuth, fetchUser } = useAuthStore();
  
  // Check if user has permission for a module
  const canAccess = (module: string): boolean => {
    // If user is authenticated via admin system
    if (isAdminAuth && authUser) {
      // Super admin can access everything
      if (authUser.role === 'super_admin') return true;
      
      // Check specific guild permissions
      const guild = authUser.guilds?.find(g => g.guildId === guildId);
      if (!guild) return false;
      
      const permissionMap: Record<string, keyof typeof guild.permissions> = {
        overview: 'dashboard',
        logs: 'logs',
        moderation: 'moderation',
        welcome: 'welcome',
        leveling: 'leveling',
        tickets: 'tickets',
        commands: 'commands',
        settings: 'settings',
        bots: 'dashboard', // bots uses dashboard permission
      };
      
      const permission = permissionMap[module];
      return permission ? guild.permissions[permission] : false;
    }
    
    // If using Discord OAuth (NextAuth session), allow full access
    return true;
  };

  const [guildData, setGuildData] = useState<GuildData | null>(null);
  const [settings, setSettings] = useState<ModuleSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [botDialogOpen, setBotDialogOpen] = useState(false);
  const [creatingBot, setCreatingBot] = useState(false);
  const [newBot, setNewBot] = useState({ name: "", token: "", prefix: "!" });
  const [commands, setCommands] = useState<Command[]>([
    { name: "help", description: "Yardım menüsünü gösterir", category: "Genel", enabled: true, cooldown: 3, permissions: [] },
    { name: "ping", description: "Bot gecikmesini gösterir", category: "Genel", enabled: true, cooldown: 3, permissions: [] },
    { name: "ban", description: "Kullanıcıyı yasaklar", category: "Moderasyon", enabled: true, cooldown: 0, permissions: ["BAN_MEMBERS"] },
    { name: "kick", description: "Kullanıcıyı atar", category: "Moderasyon", enabled: true, cooldown: 0, permissions: ["KICK_MEMBERS"] },
    { name: "mute", description: "Kullanıcıyı susturur", category: "Moderasyon", enabled: true, cooldown: 0, permissions: ["MODERATE_MEMBERS"] },
    { name: "clear", description: "Mesajları temizler", category: "Moderasyon", enabled: true, cooldown: 5, permissions: ["MANAGE_MESSAGES"] },
    { name: "warn", description: "Kullanıcıya uyarı verir", category: "Moderasyon", enabled: true, cooldown: 0, permissions: ["MODERATE_MEMBERS"] },
    { name: "rank", description: "Seviye kartını gösterir", category: "Seviye", enabled: false, cooldown: 10, permissions: [] },
    { name: "leaderboard", description: "Lider tablosunu gösterir", category: "Seviye", enabled: false, cooldown: 15, permissions: [] },
    { name: "play", description: "Müzik çalar", category: "Müzik", enabled: false, cooldown: 3, permissions: [] },
    { name: "skip", description: "Şarkıyı atlar", category: "Müzik", enabled: false, cooldown: 2, permissions: [] },
    { name: "stop", description: "Müziği durdurur", category: "Müzik", enabled: false, cooldown: 0, permissions: [] },
  ]);

  // Log states
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState<string>("all");
  const [logsPaused, setLogsPaused] = useState(false);
  const [searchLog, setSearchLog] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // 🔒 Guild Isolation State - Bu sunucu için bot aktif/pasif
  const [botEnabled, setBotEnabled] = useState(true);
  const [togglingBot, setTogglingBot] = useState(false);

  // 🔒 Fetch guild enabled status
  useEffect(() => {
    async function fetchBotStatus() {
      try {
        const response = await fetch(`/api/guilds/${guildId}/toggle`);
        if (response.ok) {
          const data = await response.json();
          setBotEnabled(data.enabled);
        }
      } catch (error) {
        console.error("Failed to fetch bot status:", error);
      }
    }
    if (guildId) fetchBotStatus();
  }, [guildId]);

  // 🔒 Toggle bot for this guild only
  const handleToggleBot = async () => {
    setTogglingBot(true);
    try {
      const response = await fetch(`/api/guilds/${guildId}/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !botEnabled }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setBotEnabled(data.enabled);
        toast.success(data.message);
      } else {
        toast.error("Bot durumu değiştirilemedi");
      }
    } catch (error) {
      toast.error("Bir hata oluştu");
    } finally {
      setTogglingBot(false);
    }
  };

  // Socket.io connection for real-time logs
  useEffect(() => {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "";
    
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
    });

    socketRef.current.on("connect", () => {
      console.log("🔌 Socket bağlandı");
      socketRef.current?.emit("join-guild", guildId);
    });

    socketRef.current.on("new-log", (data: { guildId: string; log: LogEntry }) => {
      if (data.guildId === guildId && !logsPaused) {
        setLogs((prev) => [data.log, ...prev].slice(0, 500)); // Keep last 500 logs
      }
    });

    socketRef.current.on("disconnect", () => {
      console.log("🔌 Socket bağlantısı koptu");
    });

    return () => {
      socketRef.current?.emit("leave-guild", guildId);
      socketRef.current?.disconnect();
    };
  }, [guildId, logsPaused]);

  // Fetch existing logs
  useEffect(() => {
    async function fetchLogs() {
      if (activeTab !== "logs") return;
      
      setLogsLoading(true);
      try {
        const response = await fetch(`/api/guilds/${guildId}/logs?limit=100`);
        if (response.ok) {
          const data = await response.json();
          setLogs(data.logs || []);
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      } finally {
        setLogsLoading(false);
      }
    }

    fetchLogs();
  }, [guildId, activeTab]);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    const matchesFilter = logFilter === "all" || log.type === logFilter;
    const matchesSearch = searchLog === "" || 
      log.username?.toLowerCase().includes(searchLog.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchLog.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLog.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Format time ago
  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const logDate = new Date(date);
    const diffMs = now.getTime() - logDate.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return `${diffSec} saniye önce`;
    if (diffMin < 60) return `${diffMin} dakika önce`;
    if (diffHour < 24) return `${diffHour} saat önce`;
    return `${diffDay} gün önce`;
  };

  // Get log type config
  const getLogConfig = (type: string) => {
    return LOG_TYPE_CONFIG[type] || { icon: Activity, color: "text-gray-500", bgColor: "bg-gray-500/10", label: type };
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchGuildData() {
      try {
        // Try to fetch real data from API
        const response = await fetch(`/api/guilds/${guildId}`);
        
        if (response.ok) {
          const data = await response.json();
          setGuildData({
            id: data.id,
            name: data.name,
            icon: data.icon,
            memberCount: data.memberCount || 0,
            onlineCount: data.onlineCount || 0,
            channels: data.channels || [],
            roles: data.roles || [],
            bots: data.bots || [],
            members: data.members || [],
          });
        } else {
          // Fallback to simulated data
          setGuildData({
            id: guildId,
            name: "Sunucu",
            icon: null,
            memberCount: 1250,
            onlineCount: 342,
            channels: [
              { id: "1", name: "genel", type: 0 },
              { id: "2", name: "sohbet", type: 0 },
              { id: "3", name: "duyurular", type: 0 },
              { id: "4", name: "log-kanal", type: 0 },
            ],
            roles: [
              { id: "1", name: "@everyone", color: 0, position: 0 },
              { id: "2", name: "Admin", color: 15158332, position: 3 },
              { id: "3", name: "Moderatör", color: 3447003, position: 2 },
              { id: "4", name: "Üye", color: 10181046, position: 1 },
            ],
            bots: [],
            members: [],
          });
        }
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch guild data:", error);
        // Fallback data on error
        setGuildData({
          id: guildId,
          name: "Sunucu",
          icon: null,
          memberCount: 0,
          onlineCount: 0,
          channels: [],
          roles: [],
          bots: [],
          members: [],
        });
        setLoading(false);
      }
    }

    if (guildId) {
      fetchGuildData();
    }
  }, [guildId]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulated API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Ayarlar başarıyla kaydedildi!");
    } catch (error) {
      toast.error("Ayarlar kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (module: keyof ModuleSettings, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [key]: value,
      },
    }));
  };

  const toggleCommand = (commandName: string) => {
    setCommands(prev => 
      prev.map(cmd => 
        cmd.name === commandName ? { ...cmd, enabled: !cmd.enabled } : cmd
      )
    );
    toast.success(`${commandName} komutu ${commands.find(c => c.name === commandName)?.enabled ? 'devre dışı bırakıldı' : 'aktifleştirildi'}`);
  };

  const handleCreateBot = async () => {
    if (!newBot.name.trim() || !newBot.token.trim()) {
      toast.error("Bot adı ve token gerekli");
      return;
    }

    setCreatingBot(true);
    try {
      // Simulate bot creation - in production, this would call your backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success(`${newBot.name} botu başarıyla oluşturuldu!`);
      setBotDialogOpen(false);
      setNewBot({ name: "", token: "", prefix: "!" });
    } catch (error) {
      toast.error("Bot oluşturulurken bir hata oluştu");
    } finally {
      setCreatingBot(false);
    }
  };

  const commandCategories = Array.from(new Set(commands.map(c => c.category)));

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden lg:flex flex-col">
        <div className="p-4 border-b">
          <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/servers")}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Sunuculara Dön
          </Button>
        </div>
        
        {guildData && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              {guildData.icon ? (
                <Image
                  src={getGuildIconUrl(guildData.id, guildData.icon) || ""}
                  alt={guildData.name}
                  width={40}
                  height={40}
                  className="rounded-xl"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
                  <span className="font-bold text-muted-foreground">
                    {guildData.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="truncate">
                <h2 className="font-semibold truncate">{guildData.name}</h2>
                <p className="text-xs text-muted-foreground">{guildData.memberCount} üye</p>
              </div>
            </div>
          </div>
        )}

        <ScrollArea className="flex-1 p-2">
          <nav className="space-y-1">
            {canAccess("overview") && (
              <Button
                variant={activeTab === "overview" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("overview")}
              >
                <Home className="mr-2 h-4 w-4" />
                Genel Bakış
              </Button>
            )}
            {canAccess("moderation") && (
              <Button
                variant={activeTab === "moderation" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("moderation")}
              >
                <Shield className="mr-2 h-4 w-4" />
                Moderasyon
              </Button>
            )}
            {canAccess("welcome") && (
              <Button
                variant={activeTab === "welcome" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("welcome")}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Karşılama
              </Button>
            )}
            {canAccess("commands") && (
              <Button
                variant={activeTab === "commands" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("commands")}
              >
                <Terminal className="mr-2 h-4 w-4" />
                Komutlar
              </Button>
            )}
            {canAccess("bots") && (
              <Button
                variant={activeTab === "bots" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("bots")}
              >
                <Bot className="mr-2 h-4 w-4" />
                Botlar
              </Button>
            )}
            {canAccess("leveling") && (
              <Button
                variant={activeTab === "leveling" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("leveling")}
              >
                <Star className="mr-2 h-4 w-4" />
                Seviye Sistemi
              </Button>
            )}
            {canAccess("tickets") && (
              <Button
                variant={activeTab === "tickets" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("tickets")}
              >
                <Ticket className="mr-2 h-4 w-4" />
                Bilet Sistemi
              </Button>
            )}
            {canAccess("logs") && (
              <Button
                variant={activeTab === "logs" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("logs")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Loglar
              </Button>
            )}
            {canAccess("settings") && (
              <Button
                variant={activeTab === "settings" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Bot Ayarları
              </Button>
            )}
          </nav>
        </ScrollArea>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4 lg:hidden">
              <Button variant="ghost" size="icon" onClick={() => router.push("/servers")}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h1 className="font-semibold truncate">{guildData?.name}</h1>
            </div>
            <div className="hidden lg:block">
              <h1 className="text-xl font-bold">
                {activeTab === "overview" && "Genel Bakış"}
                {activeTab === "moderation" && "Moderasyon Modülü"}
                {activeTab === "welcome" && "Karşılama Modülü"}
                {activeTab === "commands" && "Komutlar"}
                {activeTab === "bots" && "Botlar"}
                {activeTab === "leveling" && "Seviye Sistemi"}
                {activeTab === "tickets" && "Bilet Sistemi"}
                {activeTab === "logs" && "Sunucu Logları"}
                {activeTab === "settings" && "Bot Ayarları"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
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
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{session?.user?.username}</DropdownMenuLabel>
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

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Overview Tab */}
          {activeTab === "overview" && guildData && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Üye</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{guildData.memberCount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+12 bu hafta</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Çevrimiçi</CardTitle>
                    <Activity className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{guildData.onlineCount.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">%{Math.round((guildData.onlineCount / guildData.memberCount) * 100)} aktif</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bot Durumu</CardTitle>
                    <Zap className={`h-4 w-4 ${botEnabled ? "text-yellow-500" : "text-muted-foreground"}`} />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={botEnabled ? "success" : "destructive"}>
                          {botEnabled ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                      <Switch
                        checked={botEnabled}
                        onCheckedChange={handleToggleBot}
                        disabled={togglingBot}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {botEnabled 
                        ? "Bot bu sunucuda çalışıyor" 
                        : "Bot bu sunucuda devre dışı"}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Diğer sunucular etkilenmez
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Çalışma Süresi</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">99.9%</div>
                    <p className="text-xs text-muted-foreground">Son 30 gün</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions & Recent Activity */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Hızlı Erişim</CardTitle>
                    <CardDescription>En çok kullanılan modüllere hızlı erişim</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <Button variant="outline" className="justify-start" onClick={() => setActiveTab("moderation")}>
                      <Shield className="mr-2 h-4 w-4" />
                      Moderasyon Ayarları
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => setActiveTab("welcome")}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Karşılama Mesajı
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => setActiveTab("logs")}>
                      <FileText className="mr-2 h-4 w-4" />
                      Log Kayıtları
                    </Button>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Son Aktiviteler</CardTitle>
                    <CardDescription>Son 24 saatteki olaylar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                          <UserPlus className="h-4 w-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">5 yeni üye katıldı</p>
                          <p className="text-xs text-muted-foreground">2 saat önce</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                          <Gavel className="h-4 w-4 text-red-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">1 kullanıcı susturuldu</p>
                          <p className="text-xs text-muted-foreground">5 saat önce</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">152 mesaj gönderildi</p>
                          <p className="text-xs text-muted-foreground">Bugün</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Modules */}
              <Card>
                <CardHeader>
                  <CardTitle>Aktif Modüller</CardTitle>
                  <CardDescription>Sunucunuzda aktif olan bot özellikleri</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[
                      { name: "Moderasyon", icon: Shield, enabled: settings.moderation.enabled },
                      { name: "Karşılama", icon: UserPlus, enabled: settings.welcome.enabled },
                      { name: "Seviye Sistemi", icon: Star, enabled: settings.leveling.enabled },
                      { name: "Bilet Sistemi", icon: Ticket, enabled: settings.tickets.enabled },
                    ].map((module) => (
                      <div
                        key={module.name}
                        className={`p-4 rounded-lg border ${
                          module.enabled ? "border-primary bg-primary/5" : "border-muted"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <module.icon className={`h-5 w-5 ${module.enabled ? "text-primary" : "text-muted-foreground"}`} />
                            <span className="font-medium">{module.name}</span>
                          </div>
                          <Badge variant={module.enabled ? "default" : "secondary"}>
                            {module.enabled ? "Aktif" : "Pasif"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Moderation Tab */}
          {activeTab === "moderation" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Moderasyon Modülü</CardTitle>
                      <CardDescription>Otomatik moderasyon ve log ayarları</CardDescription>
                    </div>
                    <Switch
                      checked={settings.moderation.enabled}
                      onCheckedChange={(checked) => updateSetting("moderation", "enabled", checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Log Kanalı</Label>
                      <Select
                        value={settings.moderation.logChannelId}
                        onValueChange={(value) => updateSetting("moderation", "logChannelId", value)}
                        disabled={!settings.moderation.enabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kanal seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {guildData?.channels
                            .filter((c) => c.type === 0)
                            .map((channel) => (
                              <SelectItem key={channel.id} value={channel.id}>
                                <div className="flex items-center gap-2">
                                  <Hash className="h-4 w-4" />
                                  {channel.name}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Oto-Moderasyon</h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Link Engelleme</Label>
                          <p className="text-sm text-muted-foreground">Davet ve dış linkleri engelle</p>
                        </div>
                        <Switch
                          checked={settings.moderation.antiLink}
                          onCheckedChange={(checked) => updateSetting("moderation", "antiLink", checked)}
                          disabled={!settings.moderation.enabled}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Spam Engelleme</Label>
                          <p className="text-sm text-muted-foreground">Tekrarlayan mesajları engelle</p>
                        </div>
                        <Switch
                          checked={settings.moderation.antiSpam}
                          onCheckedChange={(checked) => updateSetting("moderation", "antiSpam", checked)}
                          disabled={!settings.moderation.enabled}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Moderatör Rolleri</Label>
                      <Select disabled={!settings.moderation.enabled}>
                        <SelectTrigger>
                          <SelectValue placeholder="Rol seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {guildData?.roles
                            .filter((r) => r.name !== "@everyone")
                            .map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Welcome Tab */}
          {activeTab === "welcome" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Karşılama Modülü</CardTitle>
                      <CardDescription>Yeni üye karşılama ve ayrılma mesajları</CardDescription>
                    </div>
                    <Switch
                      checked={settings.welcome.enabled}
                      onCheckedChange={(checked) => updateSetting("welcome", "enabled", checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Karşılama Kanalı</Label>
                      <Select
                        value={settings.welcome.channelId}
                        onValueChange={(value) => updateSetting("welcome", "channelId", value)}
                        disabled={!settings.welcome.enabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kanal seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {guildData?.channels
                            .filter((c) => c.type === 0)
                            .map((channel) => (
                              <SelectItem key={channel.id} value={channel.id}>
                                <div className="flex items-center gap-2">
                                  <Hash className="h-4 w-4" />
                                  {channel.name}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Karşılama Mesajı</Label>
                      <Input
                        value={settings.welcome.message}
                        onChange={(e) => updateSetting("welcome", "message", e.target.value)}
                        disabled={!settings.welcome.enabled}
                        placeholder="Hoşgeldin {user}!"
                      />
                      <p className="text-xs text-muted-foreground">
                        Kullanılabilir değişkenler: {"{user}"}, {"{server}"}, {"{memberCount}"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Ayrılma Mesajı</Label>
                      <Input
                        value={settings.welcome.leaveMessage}
                        onChange={(e) => updateSetting("welcome", "leaveMessage", e.target.value)}
                        disabled={!settings.welcome.enabled}
                        placeholder="{user} sunucudan ayrıldı."
                      />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <Label>Otomatik Rol</Label>
                      <Select
                        value={settings.welcome.autoRole}
                        onValueChange={(value) => updateSetting("welcome", "autoRole", value)}
                        disabled={!settings.welcome.enabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Rol seçin (opsiyonel)" />
                        </SelectTrigger>
                        <SelectContent>
                          {guildData?.roles
                            .filter((r) => r.name !== "@everyone")
                            .map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Yeni üyelere otomatik olarak verilecek rol
                      </p>
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Commands Tab */}
          {activeTab === "commands" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bot Komutları</CardTitle>
                  <CardDescription>
                    Sunucunuzda kullanılabilir komutları yönetin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {commandCategories.map((category) => (
                      <div key={category}>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          {category === "Genel" && <Terminal className="h-5 w-5" />}
                          {category === "Moderasyon" && <Shield className="h-5 w-5" />}
                          {category === "Seviye" && <Star className="h-5 w-5" />}
                          {category === "Müzik" && <Music className="h-5 w-5" />}
                          {category}
                        </h3>
                        <div className="grid gap-3">
                          {commands
                            .filter((cmd) => cmd.category === category)
                            .map((command) => (
                              <div
                                key={command.name}
                                className="flex items-center justify-between p-4 rounded-lg border bg-card"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                                      /{command.name}
                                    </code>
                                    {command.permissions.length > 0 && (
                                      <Badge variant="outline" className="text-xs">
                                        {command.permissions[0]}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {command.description}
                                  </p>
                                  {command.cooldown > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Bekleme: {command.cooldown} saniye
                                    </p>
                                  )}
                                </div>
                                <Switch
                                  checked={command.enabled}
                                  onCheckedChange={() => toggleCommand(command.name)}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Bots Tab */}
          {activeTab === "bots" && (
            <div className="space-y-6">
              {/* Active Bots */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Sunucudaki Botlar</CardTitle>
                      <CardDescription>
                        Bu sunucuda aktif olan botları görüntüleyin
                      </CardDescription>
                    </div>
                    <Dialog open={botDialogOpen} onOpenChange={setBotDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Bot Ekle
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Yeni Bot Oluştur</DialogTitle>
                          <DialogDescription>
                            Sunucunuza özel bir bot oluşturun ve yapılandırın
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Bot Adı</Label>
                            <Input
                              placeholder="Örn: Yardımcı Bot"
                              value={newBot.name}
                              onChange={(e) => setNewBot({ ...newBot, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Bot Token</Label>
                            <Input
                              type="password"
                              placeholder="Discord Developer Portal'dan alın"
                              value={newBot.token}
                              onChange={(e) => setNewBot({ ...newBot, token: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                              <a
                                href="https://discord.com/developers/applications"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline"
                              >
                                Discord Developer Portal
                              </a>
                              {" "}üzerinden bot token alabilirsiniz
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Prefix</Label>
                            <Input
                              placeholder="!"
                              value={newBot.prefix}
                              onChange={(e) => setNewBot({ ...newBot, prefix: e.target.value })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setBotDialogOpen(false)}>
                            İptal
                          </Button>
                          <Button onClick={handleCreateBot} disabled={creatingBot}>
                            {creatingBot ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Oluşturuluyor...
                              </>
                            ) : (
                              <>
                                <Bot className="mr-2 h-4 w-4" />
                                Bot Oluştur
                              </>
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {guildData?.bots && guildData.bots.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {guildData.bots.map((bot) => (
                        <div
                          key={bot.id}
                          className="flex items-center gap-4 p-4 rounded-lg border bg-card"
                        >
                          <Avatar className="h-12 w-12">
                            {bot.avatar ? (
                              <AvatarImage
                                src={`https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png`}
                              />
                            ) : null}
                            <AvatarFallback>
                              <Bot className="h-6 w-6" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-semibold">{bot.username}</h4>
                            <p className="text-sm text-muted-foreground">
                              ID: {bot.id}
                            </p>
                          </div>
                          <Badge variant="success">Aktif</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold">Bot Bulunamadı</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Bu sunucuda aktif bot bulunmuyor
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Bot Templates */}
              <Card>
                <CardHeader>
                  <CardTitle>Hazır Bot Şablonları</CardTitle>
                  <CardDescription>
                    Hızlıca başlamak için bir şablon seçin
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { name: "Moderasyon Botu", icon: Shield, desc: "Ban, kick, mute ve log özellikleri" },
                      { name: "Müzik Botu", icon: Music, desc: "YouTube ve Spotify desteği" },
                      { name: "Seviye Botu", icon: Star, desc: "XP ve seviye sistemi" },
                    ].map((template) => (
                      <div
                        key={template.name}
                        className="p-4 rounded-lg border hover:border-primary cursor-pointer transition-colors"
                        onClick={() => {
                          setNewBot({ ...newBot, name: template.name });
                          setBotDialogOpen(true);
                        }}
                      >
                        <template.icon className="h-8 w-8 text-primary mb-3" />
                        <h4 className="font-semibold">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Leveling Tab */}
          {activeTab === "leveling" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Seviye Sistemi</CardTitle>
                      <CardDescription>XP ve seviye bazlı ödüller</CardDescription>
                    </div>
                    <Switch
                      checked={settings.leveling.enabled}
                      onCheckedChange={(checked) => updateSetting("leveling", "enabled", checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Seviye Atlama Bildirimi Kanalı</Label>
                      <Select
                        value={settings.leveling.channelId}
                        onValueChange={(value) => updateSetting("leveling", "channelId", value)}
                        disabled={!settings.leveling.enabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kanal seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {guildData?.channels
                            .filter((c) => c.type === 0)
                            .map((channel) => (
                              <SelectItem key={channel.id} value={channel.id}>
                                <div className="flex items-center gap-2">
                                  <Hash className="h-4 w-4" />
                                  {channel.name}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>XP Kazanma Hızı</Label>
                      <Select
                        value={settings.leveling.xpRate.toString()}
                        onValueChange={(value) => updateSetting("leveling", "xpRate", parseInt(value))}
                        disabled={!settings.leveling.enabled}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">Yavaş (0.5x)</SelectItem>
                          <SelectItem value="1">Normal (1x)</SelectItem>
                          <SelectItem value="2">Hızlı (2x)</SelectItem>
                          <SelectItem value="3">Çok Hızlı (3x)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === "tickets" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Bilet Sistemi</CardTitle>
                      <CardDescription>Destek bilet sistemi ayarları</CardDescription>
                    </div>
                    <Switch
                      checked={settings.tickets.enabled}
                      onCheckedChange={(checked) => updateSetting("tickets", "enabled", checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Bilet Kategorisi</Label>
                      <Select
                        disabled={!settings.tickets.enabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kategori seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Destek Biletleri</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Destek Rolleri</Label>
                      <Select disabled={!settings.tickets.enabled}>
                        <SelectTrigger>
                          <SelectValue placeholder="Rol seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {guildData?.roles
                            .filter((r) => r.name !== "@everyone")
                            .map((role) => (
                              <SelectItem key={role.id} value={role.id}>
                                {role.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              {/* Log Stats */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{logs.filter(l => l.type.includes('message')).length}</p>
                        <p className="text-sm text-muted-foreground">Mesaj Logu</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{logs.filter(l => l.type.includes('member')).length}</p>
                        <p className="text-sm text-muted-foreground">Üye Logu</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Mic className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{logs.filter(l => l.type.includes('voice')).length}</p>
                        <p className="text-sm text-muted-foreground">Ses Logu</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <Activity className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{logs.length}</p>
                        <p className="text-sm text-muted-foreground">Toplam Log</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Real-time Activity Logs */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Gerçek Zamanlı Loglar
                        {!logsPaused && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Sunucudaki tüm aktiviteler anlık olarak burada görünür
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={logsPaused ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLogsPaused(!logsPaused)}
                      >
                        {logsPaused ? (
                          <>
                            <Play className="h-4 w-4 mr-1" />
                            Devam Et
                          </>
                        ) : (
                          <>
                            <Pause className="h-4 w-4 mr-1" />
                            Duraklat
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogs([])}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Temizle
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Log ara... (kullanıcı adı, işlem, detay)"
                        value={searchLog}
                        onChange={(e) => setSearchLog(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={logFilter} onValueChange={setLogFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrele" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Loglar</SelectItem>
                        <SelectItem value="message_create">Mesaj Gönderildi</SelectItem>
                        <SelectItem value="message_delete">Mesaj Silindi</SelectItem>
                        <SelectItem value="message_update">Mesaj Düzenlendi</SelectItem>
                        <SelectItem value="member_join">Üye Katıldı</SelectItem>
                        <SelectItem value="member_leave">Üye Ayrıldı</SelectItem>
                        <SelectItem value="member_ban">Üye Yasaklandı</SelectItem>
                        <SelectItem value="member_unban">Yasak Kaldırıldı</SelectItem>
                        <SelectItem value="member_kick">Üye Atıldı</SelectItem>
                        <SelectItem value="member_update">Üye Güncellendi</SelectItem>
                        <SelectItem value="voice_join">Ses Katıldı</SelectItem>
                        <SelectItem value="voice_leave">Ses Ayrıldı</SelectItem>
                        <SelectItem value="voice_move">Ses Taşındı</SelectItem>
                        <SelectItem value="channel_create">Kanal Oluşturuldu</SelectItem>
                        <SelectItem value="channel_delete">Kanal Silindi</SelectItem>
                        <SelectItem value="role_create">Rol Oluşturuldu</SelectItem>
                        <SelectItem value="role_delete">Rol Silindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Logs List */}
                  {logsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredLogs.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-semibold text-lg">Henüz log yok</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {logs.length === 0 
                          ? "Sunucuda bir olay gerçekleştiğinde burada görünecek"
                          : "Filtrelere uygun log bulunamadı"}
                      </p>
                    </div>
                  ) : (
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2">
                        {filteredLogs.map((log, index) => {
                          const config = getLogConfig(log.type);
                          const LogIcon = config.icon;
                          
                          return (
                            <div
                              key={log._id || index}
                              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors animate-in slide-in-from-top-2 duration-300"
                            >
                              <div className={`h-10 w-10 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                                <LogIcon className={`h-5 w-5 ${config.color}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-sm">
                                    {log.username || "Sistem"}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {config.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                  {log.action}
                                </p>
                                {/* Log Details */}
                                {log.details && Object.keys(log.details).length > 0 && (
                                  <div className="mt-2 text-xs text-muted-foreground bg-background/50 rounded p-2 space-y-1">
                                    {log.details.content && (
                                      <p><span className="font-medium">İçerik:</span> {log.details.content.substring(0, 100)}{log.details.content.length > 100 ? '...' : ''}</p>
                                    )}
                                    {log.details.channelName && (
                                      <p><span className="font-medium">Kanal:</span> #{log.details.channelName}</p>
                                    )}
                                    {log.details.reason && (
                                      <p><span className="font-medium">Sebep:</span> {log.details.reason}</p>
                                    )}
                                    {log.details.bannedBy && (
                                      <p><span className="font-medium">Yasaklayan:</span> {log.details.bannedBy}</p>
                                    )}
                                    {log.details.kickedBy && (
                                      <p><span className="font-medium">Atan:</span> {log.details.kickedBy}</p>
                                    )}
                                    {log.details.oldContent && log.details.newContent && (
                                      <>
                                        <p><span className="font-medium">Eski:</span> {log.details.oldContent.substring(0, 50)}...</p>
                                        <p><span className="font-medium">Yeni:</span> {log.details.newContent.substring(0, 50)}...</p>
                                      </>
                                    )}
                                    {log.details.addedRoles && (
                                      <p><span className="font-medium">Eklenen Roller:</span> {log.details.addedRoles.map((r: any) => r.name).join(', ')}</p>
                                    )}
                                    {log.details.removedRoles && (
                                      <p><span className="font-medium">Kaldırılan Roller:</span> {log.details.removedRoles.map((r: any) => r.name).join(', ')}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatTimeAgo(log.createdAt)}
                              </span>
                            </div>
                          );
                        })}
                        <div ref={logsEndRef} />
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>

              {/* Quick Log Type Legend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Log Türleri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {Object.entries(LOG_TYPE_CONFIG).slice(0, 12).map(([type, config]) => {
                      const LogIcon = config.icon;
                      return (
                        <div
                          key={type}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => setLogFilter(type)}
                        >
                          <LogIcon className={`h-4 w-4 ${config.color}`} />
                          <span className="text-xs truncate">{config.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bot Ayarları</CardTitle>
                  <CardDescription>Genel bot konfigürasyonu</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bot Prefix</Label>
                    <Input defaultValue="!" placeholder="Bot komutu prefix'i" />
                  </div>
                  <div className="space-y-2">
                    <Label>Dil</Label>
                    <Select defaultValue="tr">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">Türkçe</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
