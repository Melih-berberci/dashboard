const { Client, GatewayIntentBits, Events, AuditLogEvent, EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');

// Discord Bot with all intents for comprehensive logging
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Reference to io and Log model (will be set from index.js)
let io = null;
let Log = null;

// Set external dependencies
function setDependencies(socketIo, logModel) {
  io = socketIo;
  Log = logModel;
}

// Log types for categorization
const LOG_TYPES = {
  MESSAGE_CREATE: 'message_create',
  MESSAGE_DELETE: 'message_delete',
  MESSAGE_UPDATE: 'message_update',
  MEMBER_JOIN: 'member_join',
  MEMBER_LEAVE: 'member_leave',
  MEMBER_BAN: 'member_ban',
  MEMBER_UNBAN: 'member_unban',
  MEMBER_KICK: 'member_kick',
  MEMBER_UPDATE: 'member_update',
  ROLE_CREATE: 'role_create',
  ROLE_DELETE: 'role_delete',
  ROLE_UPDATE: 'role_update',
  CHANNEL_CREATE: 'channel_create',
  CHANNEL_DELETE: 'channel_delete',
  CHANNEL_UPDATE: 'channel_update',
  VOICE_JOIN: 'voice_join',
  VOICE_LEAVE: 'voice_leave',
  VOICE_MOVE: 'voice_move',
  REACTION_ADD: 'reaction_add',
  REACTION_REMOVE: 'reaction_remove',
  INVITE_CREATE: 'invite_create',
  INVITE_DELETE: 'invite_delete',
  EMOJI_CREATE: 'emoji_create',
  EMOJI_DELETE: 'emoji_delete',
  GUILD_UPDATE: 'guild_update',
  BOT_READY: 'bot_ready',
  BOT_ERROR: 'bot_error',
};

// Helper function to create and save log
async function createLog(guildId, type, data) {
  const logEntry = {
    guildId,
    type,
    userId: data.userId || null,
    username: data.username || null,
    action: data.action || type,
    details: data.details || {},
    createdAt: new Date(),
  };

  try {
    if (Log) {
      const log = new Log(logEntry);
      await log.save();
      logEntry._id = log._id;
    }

    // Emit to dashboard via Socket.io
    if (io) {
      io.to(`guild:${guildId}`).emit('new-log', { guildId, log: logEntry });
      io.emit('new-log', { guildId, log: logEntry }); // Also emit globally
    }

    console.log(`📝 [${type}] Guild: ${guildId} - ${data.action || type}`);
  } catch (error) {
    console.error('Error creating log:', error);
  }
}

// ==================== BOT READY ====================
client.once(Events.ClientReady, (c) => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║     Discord Bot Connected                         ║
╠═══════════════════════════════════════════════════╣
║  🤖 Logged in as: ${c.user.tag.padEnd(29)}║
║  📊 Serving ${String(c.guilds.cache.size).padEnd(3)} servers                       ║
║  👥 Watching ${String(c.users.cache.size).padEnd(5)} users                        ║
╚═══════════════════════════════════════════════════╝
  `);

  // Log bot ready for all guilds
  c.guilds.cache.forEach((guild) => {
    createLog(guild.id, LOG_TYPES.BOT_READY, {
      action: 'Bot bağlandı',
      details: {
        botName: c.user.tag,
        guildName: guild.name,
        memberCount: guild.memberCount,
      },
    });
  });
});

// ==================== MESSAGE EVENTS ====================
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  await createLog(message.guild.id, LOG_TYPES.MESSAGE_CREATE, {
    userId: message.author.id,
    username: message.author.tag,
    action: 'Mesaj gönderildi',
    details: {
      channelId: message.channel.id,
      channelName: message.channel.name,
      content: message.content.substring(0, 500), // Limit content length
      attachments: message.attachments.map((a) => a.url),
      messageId: message.id,
    },
  });
});

client.on(Events.MessageDelete, async (message) => {
  if (!message.guild) return;

  await createLog(message.guild.id, LOG_TYPES.MESSAGE_DELETE, {
    userId: message.author?.id,
    username: message.author?.tag || 'Bilinmiyor',
    action: 'Mesaj silindi',
    details: {
      channelId: message.channel.id,
      channelName: message.channel.name,
      content: message.content?.substring(0, 500) || 'İçerik alınamadı',
      messageId: message.id,
    },
  });
});

client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
  if (!newMessage.guild) return;
  if (oldMessage.content === newMessage.content) return;
  if (newMessage.author?.bot) return;

  await createLog(newMessage.guild.id, LOG_TYPES.MESSAGE_UPDATE, {
    userId: newMessage.author?.id,
    username: newMessage.author?.tag || 'Bilinmiyor',
    action: 'Mesaj düzenlendi',
    details: {
      channelId: newMessage.channel.id,
      channelName: newMessage.channel.name,
      oldContent: oldMessage.content?.substring(0, 500) || 'İçerik alınamadı',
      newContent: newMessage.content?.substring(0, 500) || 'İçerik alınamadı',
      messageId: newMessage.id,
    },
  });
});

// ==================== MEMBER EVENTS ====================
client.on(Events.GuildMemberAdd, async (member) => {
  await createLog(member.guild.id, LOG_TYPES.MEMBER_JOIN, {
    userId: member.user.id,
    username: member.user.tag,
    action: 'Sunucuya katıldı',
    details: {
      accountCreated: member.user.createdAt,
      isBot: member.user.bot,
      avatarUrl: member.user.displayAvatarURL(),
    },
  });
});

client.on(Events.GuildMemberRemove, async (member) => {
  // Check if it was a kick by looking at audit logs
  let wasKicked = false;
  let kickReason = null;
  let kickedBy = null;

  try {
    const auditLogs = await member.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberKick,
    });
    const kickLog = auditLogs.entries.first();

    if (kickLog && kickLog.target.id === member.user.id) {
      const timeDiff = Date.now() - kickLog.createdTimestamp;
      if (timeDiff < 5000) {
        // Within 5 seconds
        wasKicked = true;
        kickReason = kickLog.reason || 'Sebep belirtilmedi';
        kickedBy = kickLog.executor?.tag || 'Bilinmiyor';
      }
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error);
  }

  if (wasKicked) {
    await createLog(member.guild.id, LOG_TYPES.MEMBER_KICK, {
      userId: member.user.id,
      username: member.user.tag,
      action: 'Sunucudan atıldı (kick)',
      details: {
        reason: kickReason,
        kickedBy: kickedBy,
        roles: member.roles.cache.map((r) => r.name),
      },
    });
  } else {
    await createLog(member.guild.id, LOG_TYPES.MEMBER_LEAVE, {
      userId: member.user.id,
      username: member.user.tag,
      action: 'Sunucudan ayrıldı',
      details: {
        roles: member.roles.cache.map((r) => r.name),
        joinedAt: member.joinedAt,
      },
    });
  }
});

client.on(Events.GuildBanAdd, async (ban) => {
  let bannedBy = 'Bilinmiyor';
  let reason = 'Sebep belirtilmedi';

  try {
    const auditLogs = await ban.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanAdd,
    });
    const banLog = auditLogs.entries.first();

    if (banLog && banLog.target.id === ban.user.id) {
      bannedBy = banLog.executor?.tag || 'Bilinmiyor';
      reason = banLog.reason || 'Sebep belirtilmedi';
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error);
  }

  await createLog(ban.guild.id, LOG_TYPES.MEMBER_BAN, {
    userId: ban.user.id,
    username: ban.user.tag,
    action: 'Sunucudan yasaklandı (ban)',
    details: {
      reason: reason,
      bannedBy: bannedBy,
    },
  });
});

client.on(Events.GuildBanRemove, async (ban) => {
  let unbannedBy = 'Bilinmiyor';

  try {
    const auditLogs = await ban.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanRemove,
    });
    const unbanLog = auditLogs.entries.first();

    if (unbanLog && unbanLog.target.id === ban.user.id) {
      unbannedBy = unbanLog.executor?.tag || 'Bilinmiyor';
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error);
  }

  await createLog(ban.guild.id, LOG_TYPES.MEMBER_UNBAN, {
    userId: ban.user.id,
    username: ban.user.tag,
    action: 'Yasağı kaldırıldı (unban)',
    details: {
      unbannedBy: unbannedBy,
    },
  });
});

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
  // Check for role changes
  const addedRoles = newMember.roles.cache.filter((r) => !oldMember.roles.cache.has(r.id));
  const removedRoles = oldMember.roles.cache.filter((r) => !newMember.roles.cache.has(r.id));

  if (addedRoles.size > 0) {
    await createLog(newMember.guild.id, LOG_TYPES.MEMBER_UPDATE, {
      userId: newMember.user.id,
      username: newMember.user.tag,
      action: 'Rol eklendi',
      details: {
        addedRoles: addedRoles.map((r) => ({ name: r.name, color: r.hexColor })),
      },
    });
  }

  if (removedRoles.size > 0) {
    await createLog(newMember.guild.id, LOG_TYPES.MEMBER_UPDATE, {
      userId: newMember.user.id,
      username: newMember.user.tag,
      action: 'Rol kaldırıldı',
      details: {
        removedRoles: removedRoles.map((r) => ({ name: r.name, color: r.hexColor })),
      },
    });
  }

  // Check for nickname changes
  if (oldMember.nickname !== newMember.nickname) {
    await createLog(newMember.guild.id, LOG_TYPES.MEMBER_UPDATE, {
      userId: newMember.user.id,
      username: newMember.user.tag,
      action: 'Takma ad değiştirildi',
      details: {
        oldNickname: oldMember.nickname || 'Yok',
        newNickname: newMember.nickname || 'Yok',
      },
    });
  }
});

// ==================== VOICE EVENTS ====================
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  const member = newState.member || oldState.member;
  if (!member) return;

  // Joined a voice channel
  if (!oldState.channel && newState.channel) {
    await createLog(newState.guild.id, LOG_TYPES.VOICE_JOIN, {
      userId: member.user.id,
      username: member.user.tag,
      action: 'Ses kanalına katıldı',
      details: {
        channelId: newState.channel.id,
        channelName: newState.channel.name,
      },
    });
  }
  // Left a voice channel
  else if (oldState.channel && !newState.channel) {
    await createLog(oldState.guild.id, LOG_TYPES.VOICE_LEAVE, {
      userId: member.user.id,
      username: member.user.tag,
      action: 'Ses kanalından ayrıldı',
      details: {
        channelId: oldState.channel.id,
        channelName: oldState.channel.name,
      },
    });
  }
  // Moved to another voice channel
  else if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
    await createLog(newState.guild.id, LOG_TYPES.VOICE_MOVE, {
      userId: member.user.id,
      username: member.user.tag,
      action: 'Ses kanalı değiştirdi',
      details: {
        fromChannelId: oldState.channel.id,
        fromChannelName: oldState.channel.name,
        toChannelId: newState.channel.id,
        toChannelName: newState.channel.name,
      },
    });
  }
});

// ==================== CHANNEL EVENTS ====================
client.on(Events.ChannelCreate, async (channel) => {
  if (!channel.guild) return;

  await createLog(channel.guild.id, LOG_TYPES.CHANNEL_CREATE, {
    action: 'Kanal oluşturuldu',
    details: {
      channelId: channel.id,
      channelName: channel.name,
      channelType: ChannelType[channel.type],
    },
  });
});

client.on(Events.ChannelDelete, async (channel) => {
  if (!channel.guild) return;

  await createLog(channel.guild.id, LOG_TYPES.CHANNEL_DELETE, {
    action: 'Kanal silindi',
    details: {
      channelId: channel.id,
      channelName: channel.name,
      channelType: ChannelType[channel.type],
    },
  });
});

client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
  if (!newChannel.guild) return;

  const changes = [];
  if (oldChannel.name !== newChannel.name) {
    changes.push({ field: 'name', old: oldChannel.name, new: newChannel.name });
  }
  if (oldChannel.topic !== newChannel.topic) {
    changes.push({ field: 'topic', old: oldChannel.topic, new: newChannel.topic });
  }

  if (changes.length > 0) {
    await createLog(newChannel.guild.id, LOG_TYPES.CHANNEL_UPDATE, {
      action: 'Kanal güncellendi',
      details: {
        channelId: newChannel.id,
        channelName: newChannel.name,
        changes: changes,
      },
    });
  }
});

// ==================== ROLE EVENTS ====================
client.on(Events.GuildRoleCreate, async (role) => {
  await createLog(role.guild.id, LOG_TYPES.ROLE_CREATE, {
    action: 'Rol oluşturuldu',
    details: {
      roleId: role.id,
      roleName: role.name,
      roleColor: role.hexColor,
    },
  });
});

client.on(Events.GuildRoleDelete, async (role) => {
  await createLog(role.guild.id, LOG_TYPES.ROLE_DELETE, {
    action: 'Rol silindi',
    details: {
      roleId: role.id,
      roleName: role.name,
    },
  });
});

client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
  const changes = [];
  if (oldRole.name !== newRole.name) {
    changes.push({ field: 'name', old: oldRole.name, new: newRole.name });
  }
  if (oldRole.hexColor !== newRole.hexColor) {
    changes.push({ field: 'color', old: oldRole.hexColor, new: newRole.hexColor });
  }

  if (changes.length > 0) {
    await createLog(newRole.guild.id, LOG_TYPES.ROLE_UPDATE, {
      action: 'Rol güncellendi',
      details: {
        roleId: newRole.id,
        roleName: newRole.name,
        changes: changes,
      },
    });
  }
});

// ==================== REACTION EVENTS ====================
client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (user.bot) return;
  if (!reaction.message.guild) return;

  await createLog(reaction.message.guild.id, LOG_TYPES.REACTION_ADD, {
    userId: user.id,
    username: user.tag,
    action: 'Tepki ekledi',
    details: {
      emoji: reaction.emoji.name,
      messageId: reaction.message.id,
      channelId: reaction.message.channel.id,
      channelName: reaction.message.channel.name,
    },
  });
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (user.bot) return;
  if (!reaction.message.guild) return;

  await createLog(reaction.message.guild.id, LOG_TYPES.REACTION_REMOVE, {
    userId: user.id,
    username: user.tag,
    action: 'Tepki kaldırdı',
    details: {
      emoji: reaction.emoji.name,
      messageId: reaction.message.id,
      channelId: reaction.message.channel.id,
      channelName: reaction.message.channel.name,
    },
  });
});

// ==================== INVITE EVENTS ====================
client.on(Events.InviteCreate, async (invite) => {
  if (!invite.guild) return;

  await createLog(invite.guild.id, LOG_TYPES.INVITE_CREATE, {
    userId: invite.inviter?.id,
    username: invite.inviter?.tag || 'Bilinmiyor',
    action: 'Davet linki oluşturuldu',
    details: {
      code: invite.code,
      channelId: invite.channel?.id,
      channelName: invite.channel?.name,
      maxUses: invite.maxUses || 'Sınırsız',
      expiresAt: invite.expiresAt,
    },
  });
});

client.on(Events.InviteDelete, async (invite) => {
  if (!invite.guild) return;

  await createLog(invite.guild.id, LOG_TYPES.INVITE_DELETE, {
    action: 'Davet linki silindi',
    details: {
      code: invite.code,
      channelId: invite.channel?.id,
      channelName: invite.channel?.name,
    },
  });
});

// ==================== GUILD UPDATE ====================
client.on(Events.GuildUpdate, async (oldGuild, newGuild) => {
  const changes = [];

  if (oldGuild.name !== newGuild.name) {
    changes.push({ field: 'name', old: oldGuild.name, new: newGuild.name });
  }
  if (oldGuild.icon !== newGuild.icon) {
    changes.push({ field: 'icon', old: 'Eski ikon', new: 'Yeni ikon' });
  }

  if (changes.length > 0) {
    await createLog(newGuild.id, LOG_TYPES.GUILD_UPDATE, {
      action: 'Sunucu ayarları güncellendi',
      details: {
        changes: changes,
      },
    });
  }
});

// ==================== ERROR HANDLING ====================
client.on(Events.Error, (error) => {
  console.error('Discord client error:', error);
});

client.on(Events.Warn, (warning) => {
  console.warn('Discord client warning:', warning);
});

// Login function
async function login(token) {
  if (!token) {
    console.error('❌ DISCORD_BOT_TOKEN is not defined');
    return false;
  }

  try {
    await client.login(token);
    return true;
  } catch (error) {
    console.error('❌ Failed to login to Discord:', error.message);
    return false;
  }
}

// Export
module.exports = {
  client,
  login,
  setDependencies,
  LOG_TYPES,
};
