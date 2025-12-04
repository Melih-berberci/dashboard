import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

// User Schema - shared across all API routes
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["super_admin", "admin", "user"],
    default: "user",
  },
  discordId: { type: String, unique: true, sparse: true },
  discordUsername: { type: String },
  avatar: { type: String, default: null },
  guilds: [
    {
      guildId: { type: String, required: true },
      guildName: { type: String },
      guildIcon: { type: String },
      permissions: {
        dashboard: { type: Boolean, default: true },
        logs: { type: Boolean, default: false },
        moderation: { type: Boolean, default: false },
        welcome: { type: Boolean, default: false },
        leveling: { type: Boolean, default: false },
        tickets: { type: Boolean, default: false },
        commands: { type: Boolean, default: false },
        settings: { type: Boolean, default: false },
      },
    },
  ],
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Connect to MongoDB
export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

// Get User model
export function getUserModel() {
  return mongoose.models.User || mongoose.model("User", userSchema);
}

export { mongoose };
