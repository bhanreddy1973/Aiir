const mongoose = require("mongoose");

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: "",
    },
    avatar: {
      type: String,
      default: "https://ui-avatars.com/api/?name=Group&background=7c3aed&color=fff&bold=true",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      role: {
        type: String,
        enum: ["owner", "admin", "moderator", "member"],
        default: "member",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      permissions: {
        canInvite: { type: Boolean, default: false },
        canKick: { type: Boolean, default: false },
        canBan: { type: Boolean, default: false },
        canManageChannels: { type: Boolean, default: false },
        canManageRoles: { type: Boolean, default: false },
        canDeleteMessages: { type: Boolean, default: false },
      }
    }],
    channels: [{
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50,
      },
      type: {
        type: String,
        enum: ["text", "voice", "announcement"],
        default: "text",
      },
      description: {
        type: String,
        maxlength: 500,
        default: "",
      },
      position: {
        type: Number,
        default: 0,
      },
      permissions: {
        viewChannel: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        sendMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        manageMessages: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
      isDefault: {
        type: Boolean,
        default: false,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      }
    }],
    inviteCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    maxMembers: {
      type: Number,
      default: 500,
    },
    settings: {
      allowInvites: { type: Boolean, default: true },
      requireApproval: { type: Boolean, default: false },
      allowFileUploads: { type: Boolean, default: true },
      maxFileSize: { type: Number, default: 100 * 1024 * 1024 }, // 100MB
      allowedFileTypes: [{ type: String }], // MIME types
    },
    bannedUsers: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reason: { type: String, maxlength: 500 },
      bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      bannedAt: { type: Date, default: Date.now },
    }],
    categories: [{
      name: { type: String, required: true, maxlength: 50 },
      position: { type: Number, default: 0 },
      channels: [{ type: mongoose.Schema.Types.ObjectId }], // References to channel IDs
    }]
  },
  {
    timestamps: true,
  }
);

// Generate unique invite code
GroupSchema.methods.generateInviteCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Check if user has permission
GroupSchema.methods.hasPermission = function(userId, permission) {
  const member = this.members.find(m => m.user.toString() === userId.toString());
  if (!member) return false;
  
  // Owner and admins have all permissions
  if (member.role === 'owner' || member.role === 'admin') return true;
  
  // Check specific permission
  return member.permissions[permission] || false;
};

// Get default channel
GroupSchema.methods.getDefaultChannel = function() {
  return this.channels.find(c => c.isDefault) || this.channels[0];
};

const Group = mongoose.model("Group", GroupSchema);
module.exports = Group;