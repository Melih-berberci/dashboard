const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

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

connectDB();

// Guild Settings Schema
const guildSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
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

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
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
