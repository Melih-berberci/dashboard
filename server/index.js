const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const http = require('http');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// MongoDB Connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ MongoDB bağlantısı başarılı');
    } else {
      console.log('⚠️ MongoDB URI bulunamadı, veritabanı bağlantısı atlandı');
    }
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error.message);
  }
};

connectDB().then(() => {
  createInitialSuperAdmin();
});

// Guild Settings Schema
const guildSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  guildName: { type: String, default: '' },
  guildIcon: { type: String, default: null },
  prefix: { type: String, default: '!' },
  language: { type: String, default: 'tr' },
  modules: {
    welcome: {
      enabled: { type: Boolean, default: false },
      channelId: { type: String, default: '' },
      message: { type: String, default: 'Hoşgeldin {user}!' },
      leaveMessage: { type: String, default: '{user} sunucudan ayrıldı.' },
      autoRole: { type: String, default: '' },
    },
    moderation: {
      enabled: { type: Boolean, default: false },
      logChannelId: { type: String, default: '' },
      antiLink: { type: Boolean, default: false },
      antiSpam: { type: Boolean, default: false },
      badWords: [{ type: String }],
      modRoles: [{ type: String }],
    },
    leveling: {
      enabled: { type: Boolean, default: false },
      channelId: { type: String, default: '' },
      xpRate: { type: Number, default: 1 },
    },
    tickets: {
      enabled: { type: Boolean, default: false },
      categoryId: { type: String, default: '' },
      supportRoles: [{ type: String }],
    },
  },
  updatedAt: { type: Date, default: Date.now },
});

const GuildSettings = mongoose.model('GuildSettings', guildSettingsSchema);

// Log Schema
const logSchema = new mongoose.Schema({
  guildId: { type: String, required: true, index: true },
  type: { type: String, required: true },
  userId: { type: String },
  username: { type: String },
  action: { type: String },
  details: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
});

const Log = mongoose.model('Log', logSchema);

// User Schema with Roles and Permissions
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['super_admin', 'admin', 'user'], 
    default: 'user' 
  },
  // Discord bağlantısı (opsiyonel)
  discordId: { type: String, unique: true, sparse: true },
  discordUsername: { type: String },
  avatar: { type: String },
  // Kullanıcının erişebildiği sunucular
  guilds: [{
    guildId: { type: String, required: true },
    guildName: { type: String },
    guildIcon: { type: String },
    // Bu kullanıcının bu sunucuda görebildiği modüller
    permissions: {
      dashboard: { type: Boolean, default: true },
      logs: { type: Boolean, default: false },
      moderation: { type: Boolean, default: false },
      welcome: { type: Boolean, default: false },
      leveling: { type: Boolean, default: false },
      tickets: { type: Boolean, default: false },
      commands: { type: Boolean, default: false },
      settings: { type: Boolean, default: false },
    }
  }],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Şifre hash'leme
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Şifre kontrol metodu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// İlk Süper Admin oluştur (eğer yoksa)
const createInitialSuperAdmin = async () => {
  try {
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (!existingSuperAdmin) {
      const superAdmin = new User({
        username: process.env.SUPER_ADMIN_USERNAME || 'admin',
        email: process.env.SUPER_ADMIN_EMAIL || 'admin@localhost.com',
        password: process.env.SUPER_ADMIN_PASSWORD || 'admin123',
        role: 'super_admin',
        isActive: true,
      });
      await superAdmin.save();
      console.log('✅ Süper Admin oluşturuldu:', superAdmin.username);
    }
  } catch (error) {
    if (error.code !== 11000) { // Duplicate key hatası değilse
      console.error('Süper Admin oluşturma hatası:', error.message);
    }
  }
};

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token bulunamadı' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Geçersiz token' });
    }
    req.user = user;
    next();
  });
};

// Süper Admin kontrolü
const requireSuperAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Süper Admin yetkisi gerekli' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Yetki kontrolü hatası' });
  }
};

// Admin veya Süper Admin kontrolü
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      return res.status(403).json({ error: 'Admin yetkisi gerekli' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Yetki kontrolü hatası' });
  }
};

// Discord Bot Integration
const discordBot = require('./discord-bot');

// Set dependencies for Discord bot
discordBot.setDependencies(io, Log);

// Start Discord Bot
if (process.env.DISCORD_BOT_TOKEN) {
  discordBot.login(process.env.DISCORD_BOT_TOKEN);
} else {
  console.log('⚠️ DISCORD_BOT_TOKEN bulunamadı, Discord bot başlatılmadı');
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ==================== AUTH ROUTES ====================

// Register (sadece super_admin yeni kullanıcı oluşturabilir veya ilk kayıt)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Kullanıcı adı veya email zaten kullanılıyor' });
    }
    
    // Determine role (only super_admin can create admins)
    let userRole = 'user';
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const requestingUser = await User.findById(decoded.userId);
        if (requestingUser?.role === 'super_admin' && role) {
          userRole = role;
        }
      } catch (e) {}
    }
    
    const user = new User({
      username,
      email,
      password,
      role: userRole,
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Kayıt başarılı',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Kayıt hatası' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ 
      $or: [{ username }, { email: username }] 
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ error: 'Hesabınız devre dışı bırakılmış' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Giriş başarılı',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        guilds: user.guilds,
        avatar: user.avatar,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Giriş hatası' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı bilgisi alınamadı' });
  }
});

// ==================== SUPER ADMIN ROUTES ====================

// Get all users (super_admin only)
app.get('/api/admin/users', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcılar alınamadı' });
  }
});

// Get single user
app.get('/api/admin/users/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı alınamadı' });
  }
});

// Create user (super_admin only)
app.post('/api/admin/users', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Kullanıcı adı veya email zaten kullanılıyor' });
    }
    
    const user = new User({
      username,
      email,
      password,
      role: role || 'user',
    });
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.status(201).json(userResponse);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Kullanıcı oluşturulamadı' });
  }
});

// Update user (super_admin only)
app.put('/api/admin/users/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { username, email, password, role, isActive } = req.body;
    
    const updateData = { updatedAt: new Date() };
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    
    // Şifre değişikliği varsa hash'le
    if (password) {
      updateData.password = await bcrypt.hash(password, 12);
    }
    
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updateData,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Kullanıcı güncellenemedi' });
  }
});

// Delete user (super_admin only)
app.delete('/api/admin/users/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    // Kendini silemez
    if (user._id.toString() === req.user.userId) {
      return res.status(400).json({ error: 'Kendinizi silemezsiniz' });
    }
    
    await User.findByIdAndDelete(req.params.userId);
    res.json({ message: 'Kullanıcı silindi' });
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı silinemedi' });
  }
});

// Add guild to user (super_admin only)
app.post('/api/admin/users/:userId/guilds', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { guildId, guildName, guildIcon, permissions } = req.body;
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    // Check if guild already exists for this user
    const existingGuild = user.guilds.find(g => g.guildId === guildId);
    if (existingGuild) {
      return res.status(400).json({ error: 'Bu sunucu zaten eklenmiş' });
    }
    
    // Create or update GuildSettings (sunucuyu sisteme kaydet)
    let guildSettings = await GuildSettings.findOne({ guildId });
    if (!guildSettings) {
      guildSettings = new GuildSettings({
        guildId,
        guildName: guildName || `Sunucu ${guildId}`,
        guildIcon: guildIcon || null,
      });
      await guildSettings.save();
      console.log(`✅ Yeni sunucu kaydedildi: ${guildName || guildId}`);
    }
    
    // Add guild to user
    user.guilds.push({
      guildId,
      guildName: guildName || guildSettings.guildName,
      guildIcon: guildIcon || guildSettings.guildIcon,
      permissions: permissions || {
        dashboard: true,
        logs: false,
        moderation: false,
        welcome: false,
        leveling: false,
        tickets: false,
        commands: false,
        settings: false,
      }
    });
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    console.error('Add guild error:', error);
    res.status(500).json({ error: 'Sunucu eklenemedi' });
  }
});

// Update user guild permissions (super_admin only)
app.put('/api/admin/users/:userId/guilds/:guildId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { permissions } = req.body;
    
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    const guildIndex = user.guilds.findIndex(g => g.guildId === req.params.guildId);
    if (guildIndex === -1) {
      return res.status(404).json({ error: 'Sunucu bulunamadı' });
    }
    
    user.guilds[guildIndex].permissions = {
      ...user.guilds[guildIndex].permissions,
      ...permissions
    };
    
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ error: 'İzinler güncellenemedi' });
  }
});

// Remove guild from user (super_admin only)
app.delete('/api/admin/users/:userId/guilds/:guildId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    user.guilds = user.guilds.filter(g => g.guildId !== req.params.guildId);
    await user.save();
    
    const userResponse = user.toObject();
    delete userResponse.password;
    
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ error: 'Sunucu kaldırılamadı' });
  }
});

// Get all guilds with stats (super_admin only)
app.get('/api/admin/guilds', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const guilds = await GuildSettings.find().sort({ updatedAt: -1 });
    
    // Her guild için log sayısı ve kullanıcı sayısını al
    const guildsWithStats = await Promise.all(
      guilds.map(async (guild) => {
        const logCount = await Log.countDocuments({ guildId: guild.guildId });
        const userCount = await User.countDocuments({ 'guilds.guildId': guild.guildId });
        
        return {
          ...guild.toObject(),
          stats: {
            logCount,
            userCount
          }
        };
      })
    );
    
    res.json(guildsWithStats);
  } catch (error) {
    res.status(500).json({ error: 'Sunucular alınamadı' });
  }
});

// Get dashboard stats (super_admin only)
app.get('/api/admin/stats', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalGuilds = await GuildSettings.countDocuments();
    const totalLogs = await Log.countDocuments();
    
    // Son 24 saatteki loglar
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogs = await Log.countDocuments({ createdAt: { $gte: last24h } });
    
    // Son kayıt olan kullanıcılar
    const recentUsers = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Rol dağılımı
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalUsers,
      activeUsers,
      totalGuilds,
      totalLogs,
      recentLogs,
      recentUsers,
      roleStats,
    });
  } catch (error) {
    res.status(500).json({ error: 'İstatistikler alınamadı' });
  }
});

// Get guild settings
app.get('/api/guilds/:guildId/settings', async (req, res) => {
  try {
    const { guildId } = req.params;
    let settings = await GuildSettings.findOne({ guildId });
    
    if (!settings) {
      settings = new GuildSettings({ guildId });
      await settings.save();
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching guild settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update guild settings
app.put('/api/guilds/:guildId/settings', async (req, res) => {
  try {
    const { guildId } = req.params;
    const updates = req.body;
    
    const settings = await GuildSettings.findOneAndUpdate(
      { guildId },
      { ...updates, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    
    // Emit to connected bots
    io.emit('settings-update', { guildId, settings });
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating guild settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update specific module
app.patch('/api/guilds/:guildId/modules/:moduleName', async (req, res) => {
  try {
    const { guildId, moduleName } = req.params;
    const moduleSettings = req.body;
    
    const updateKey = `modules.${moduleName}`;
    const settings = await GuildSettings.findOneAndUpdate(
      { guildId },
      { 
        [updateKey]: moduleSettings,
        updatedAt: new Date()
      },
      { new: true, upsert: true }
    );
    
    // Emit to connected bots
    io.emit('module-update', { guildId, moduleName, settings: moduleSettings });
    
    res.json(settings);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get logs for a guild
app.get('/api/guilds/:guildId/logs', async (req, res) => {
  try {
    const { guildId } = req.params;
    const { type, limit = 50, page = 1 } = req.query;
    
    const query = { guildId };
    if (type) query.type = type;
    
    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Log.countDocuments(query);
    
    res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a log entry
app.post('/api/guilds/:guildId/logs', async (req, res) => {
  try {
    const { guildId } = req.params;
    const logData = req.body;
    
    const log = new Log({ guildId, ...logData });
    await log.save();
    
    // Emit real-time log to dashboard
    io.emit('new-log', { guildId, log });
    
    res.status(201).json(log);
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bot stats endpoint (for bot health monitoring)
app.post('/api/bot/stats', (req, res) => {
  const stats = req.body;
  
  // Emit stats to dashboard
  io.emit('bot-stats', stats);
  
  res.json({ received: true });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 Yeni bağlantı:', socket.id);
  
  socket.on('join-guild', (guildId) => {
    socket.join(`guild:${guildId}`);
    console.log(`Socket ${socket.id} joined guild:${guildId}`);
  });
  
  socket.on('leave-guild', (guildId) => {
    socket.leave(`guild:${guildId}`);
    console.log(`Socket ${socket.id} left guild:${guildId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 Bağlantı koptu:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║     Discord Dashboard Backend Server              ║
╠═══════════════════════════════════════════════════╣
║  🚀 Server running on port ${PORT}                   ║
║  📡 WebSocket ready                               ║
║  🔗 API: http://localhost:${PORT}/api               ║
╚═══════════════════════════════════════════════════╝
  `);
});

module.exports = { app, io };
