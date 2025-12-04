"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, User, getAuthHeader } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  Users,
  Server,
  Activity,
  FileText,
  Settings,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  Eye,
  LogOut,
  Loader2,
  Crown,
  UserCog,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface AdminUser extends User {
  _id: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalGuilds: number;
  totalLogs: number;
  recentLogs: number;
  recentUsers: AdminUser[];
  roleStats: { _id: string; count: number }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, logout, fetchUser, token } = useAuthStore();

  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "guilds" | "settings">("dashboard");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Create/Edit User Dialog
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "user" as "super_admin" | "admin" | "user",
  });
  const [saving, setSaving] = useState(false);

  // Permission Dialog
  const [permissionDialogOpen, setPermissionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedGuildId, setSelectedGuildId] = useState("");
  const [guildForm, setGuildForm] = useState({
    guildId: "",
    guildName: "",
    permissions: {
      dashboard: true,
      logs: false,
      moderation: false,
      welcome: false,
      leveling: false,
      tickets: false,
      commands: false,
      settings: false,
    },
  });

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/admin/login");
      return;
    }

    if (user.role !== "super_admin") {
      toast.error("Bu sayfaya erişim yetkiniz yok");
      router.push("/servers");
      return;
    }

    loadData();
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Veriler yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!userForm.username || !userForm.email || (!editingUser && !userForm.password)) {
      toast.error("Tüm alanları doldurun");
      return;
    }

    setSaving(true);
    try {
      const url = editingUser
        ? `${API_URL}/api/admin/users/${editingUser._id}`
        : `${API_URL}/api/admin/users`;

      const body: any = {
        username: userForm.username,
        email: userForm.email,
        role: userForm.role,
      };

      if (userForm.password) {
        body.password = userForm.password;
      }

      const response = await fetch(url, {
        method: editingUser ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingUser ? "Kullanıcı güncellendi" : "Kullanıcı oluşturuldu");
        setUserDialogOpen(false);
        resetUserForm();
        loadData();
      } else {
        const data = await response.json();
        toast.error(data.error || "İşlem başarısız");
      }
    } catch (error) {
      toast.error("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Bu kullanıcıyı silmek istediğinize emin misiniz?")) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Kullanıcı silindi");
        loadData();
      } else {
        const data = await response.json();
        toast.error(data.error || "Silme başarısız");
      }
    } catch (error) {
      toast.error("Bağlantı hatası");
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        toast.success(currentStatus ? "Kullanıcı devre dışı bırakıldı" : "Kullanıcı aktifleştirildi");
        loadData();
      }
    } catch (error) {
      toast.error("Bağlantı hatası");
    }
  };

  const handleAddGuildToUser = async () => {
    if (!selectedUser || !guildForm.guildId) {
      toast.error("Sunucu ID gerekli");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${selectedUser._id}/guilds`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          guildId: guildForm.guildId,
          guildName: guildForm.guildName || `Sunucu ${guildForm.guildId}`,
          permissions: guildForm.permissions,
        }),
      });

      if (response.ok) {
        toast.success("Sunucu eklendi");
        setPermissionDialogOpen(false);
        resetGuildForm();
        loadData();
      } else {
        const data = await response.json();
        toast.error(data.error || "Ekleme başarısız");
      }
    } catch (error) {
      toast.error("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGuildPermissions = async (userId: string, guildId: string, permissions: any) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/guilds/${guildId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions }),
      });

      if (response.ok) {
        toast.success("İzinler güncellendi");
        loadData();
      }
    } catch (error) {
      toast.error("Bağlantı hatası");
    }
  };

  const handleRemoveGuildFromUser = async (userId: string, guildId: string) => {
    if (!confirm("Bu sunucuyu kullanıcıdan kaldırmak istediğinize emin misiniz?")) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/guilds/${guildId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success("Sunucu kaldırıldı");
        loadData();
      }
    } catch (error) {
      toast.error("Bağlantı hatası");
    }
  };

  const resetUserForm = () => {
    setUserForm({ username: "", email: "", password: "", role: "user" });
    setEditingUser(null);
  };

  const resetGuildForm = () => {
    setGuildForm({
      guildId: "",
      guildName: "",
      permissions: {
        dashboard: true,
        logs: false,
        moderation: false,
        welcome: false,
        leveling: false,
        tickets: false,
        commands: false,
        settings: false,
      },
    });
    setSelectedUser(null);
  };

  const openEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      password: "",
      role: user.role,
    });
    setUserDialogOpen(true);
  };

  const openPermissionDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setPermissionDialogOpen(true);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "super_admin":
        return <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500"><Crown className="w-3 h-3 mr-1" />Süper Admin</Badge>;
      case "admin":
        return <Badge className="bg-gradient-to-r from-purple-500 to-blue-500"><UserCog className="w-3 h-3 mr-1" />Admin</Badge>;
      default:
        return <Badge variant="secondary"><UserIcon className="w-3 h-3 mr-1" />Kullanıcı</Badge>;
    }
  };

  const formatDate = (date?: string) => {
    if (!date) return "Hiç";
    return new Date(date).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg">Admin Panel</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Yenile
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/servers")}>
                  <Server className="mr-2 h-4 w-4" />
                  Sunuculara Git
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { logout(); router.push("/admin/login"); }}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 border-r min-h-[calc(100vh-4rem)] p-4 hidden md:block">
          <nav className="space-y-2">
            <Button
              variant={activeTab === "dashboard" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("dashboard")}
            >
              <Activity className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === "users" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("users")}
            >
              <Users className="mr-2 h-4 w-4" />
              Kullanıcılar
            </Button>
            <Button
              variant={activeTab === "guilds" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("guilds")}
            >
              <Server className="mr-2 h-4 w-4" />
              Sunucular
            </Button>
            <Button
              variant={activeTab === "settings" ? "secondary" : "ghost"}
              className="w-full justify-start"
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="mr-2 h-4 w-4" />
              Ayarlar
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && stats && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>

              {/* Stats Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">{stats.totalUsers}</p>
                        <p className="text-sm text-muted-foreground">Toplam Kullanıcı</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">{stats.activeUsers}</p>
                        <p className="text-sm text-muted-foreground">Aktif Kullanıcı</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Server className="h-6 w-6 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">{stats.totalGuilds}</p>
                        <p className="text-sm text-muted-foreground">Toplam Sunucu</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-3xl font-bold">{stats.totalLogs}</p>
                        <p className="text-sm text-muted-foreground">Toplam Log</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Users */}
              <Card>
                <CardHeader>
                  <CardTitle>Son Kayıt Olan Kullanıcılar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.recentUsers.map((u) => (
                      <div key={u._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{u.username}</p>
                            <p className="text-sm text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRoleBadge(u.role)}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(u.createdAt)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Role Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Rol Dağılımı</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {stats.roleStats.map((role) => (
                      <div key={role._id} className="flex-1 p-4 rounded-lg bg-muted/50 text-center">
                        <p className="text-2xl font-bold">{role.count}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {role._id === "super_admin" ? "Süper Admin" : role._id === "admin" ? "Admin" : "Kullanıcı"}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
                <Dialog open={userDialogOpen} onOpenChange={(open) => { setUserDialogOpen(open); if (!open) resetUserForm(); }}>
                  <DialogTrigger asChild>
                    <Button>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Yeni Kullanıcı
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı"}</DialogTitle>
                      <DialogDescription>
                        {editingUser ? "Kullanıcı bilgilerini güncelleyin" : "Yeni bir kullanıcı hesabı oluşturun"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Kullanıcı Adı</Label>
                        <Input
                          value={userForm.username}
                          onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                          placeholder="kullanici"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          placeholder="kullanici@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{editingUser ? "Yeni Şifre (boş bırakılırsa değişmez)" : "Şifre"}</Label>
                        <Input
                          type="password"
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Rol</Label>
                        <Select
                          value={userForm.role}
                          onValueChange={(value: any) => setUserForm({ ...userForm, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Kullanıcı</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Süper Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setUserDialogOpen(false); resetUserForm(); }}>
                        İptal
                      </Button>
                      <Button onClick={handleCreateUser} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {editingUser ? "Güncelle" : "Oluştur"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Search */}
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Kullanıcı ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Users List */}
              <Card>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <div className="divide-y">
                      {filteredUsers.map((u) => (
                        <div key={u._id} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback>{u.username.charAt(0).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{u.username}</p>
                                  {getRoleBadge(u.role)}
                                  {u.isActive ? (
                                    <Badge variant="outline" className="text-green-500 border-green-500">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Aktif
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-red-500 border-red-500">
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Devre Dışı
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{u.email}</p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Son giriş: {formatDate(u.lastLogin)}
                                  </span>
                                  <span>{u.guilds?.length || 0} sunucu</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openPermissionDialog(u)}
                              >
                                <Server className="h-4 w-4 mr-1" />
                                Sunucular
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openEditUser(u)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Düzenle
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleToggleUserStatus(u._id, u.isActive ?? true)}>
                                    {u.isActive ? (
                                      <>
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Devre Dışı Bırak
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Aktifleştir
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-500"
                                    onClick={() => handleDeleteUser(u._id)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Sil
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          {/* User's Guilds */}
                          {u.guilds && u.guilds.length > 0 && (
                            <div className="mt-3 pl-14">
                              <p className="text-xs font-medium text-muted-foreground mb-2">Erişebildiği Sunucular:</p>
                              <div className="flex flex-wrap gap-2">
                                {u.guilds.map((guild) => (
                                  <div
                                    key={guild.guildId}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-sm"
                                  >
                                    <Server className="h-3 w-3" />
                                    <span>{guild.guildName || guild.guildId}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => handleRemoveGuildFromUser(u._id, guild.guildId)}
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Guilds Tab */}
          {activeTab === "guilds" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Sunucu Yönetimi</h1>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">
                    Sunucu yönetimi için kullanıcılara sunucu ekleyin ve izinlerini düzenleyin.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Ayarlar</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Sistem Ayarları</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Sistem ayarları yakında eklenecek.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Permission Dialog */}
      <Dialog open={permissionDialogOpen} onOpenChange={(open) => { setPermissionDialogOpen(open); if (!open) resetGuildForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sunucu Ekle - {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Kullanıcıya yeni bir sunucu ekleyin ve izinlerini ayarlayın
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Sunucu ID</Label>
              <Input
                value={guildForm.guildId}
                onChange={(e) => setGuildForm({ ...guildForm, guildId: e.target.value })}
                placeholder="123456789012345678"
              />
            </div>
            <div className="space-y-2">
              <Label>Sunucu Adı (Opsiyonel)</Label>
              <Input
                value={guildForm.guildName}
                onChange={(e) => setGuildForm({ ...guildForm, guildName: e.target.value })}
                placeholder="My Discord Server"
              />
            </div>
            <div className="space-y-3">
              <Label>İzinler</Label>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(guildForm.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <span className="text-sm capitalize">{key}</span>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) =>
                        setGuildForm({
                          ...guildForm,
                          permissions: { ...guildForm.permissions, [key]: checked },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPermissionDialogOpen(false); resetGuildForm(); }}>
              İptal
            </Button>
            <Button onClick={handleAddGuildToUser} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
