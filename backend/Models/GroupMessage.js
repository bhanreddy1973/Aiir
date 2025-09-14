const mongoose = require("mongoose");

const GroupMessageSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    channelId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: function () {
        return !this.fileAttachment && !this.imageUrl;
      },
    },
    imageUrl: {
      type: String,
    },
    fileAttachment: {
      url: { type: String },
      fileName: { type: String },
      fileSize: { type: Number },
      mimeType: { type: String },
      publicId: { type: String }
    },
    mentions: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      displayName: { type: String }
    }],
    reactions: [{
      emoji: { type: String, required: true },
      users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      count: { type: Number, default: 0 }
    }],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GroupMessage",
      default: null,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    editHistory: [{
      text: { type: String },
      editedAt: { type: Date, default: Date.now }
    }],
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pinnedAt: {
      type: Date,
    },
    deletedBy: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deletedAt: { type: Date, default: Date.now }
    }],
    messageType: {
      type: String,
      enum: ["message", "system", "join", "leave", "announcement"],
      default: "message",
    },
    systemData: {
      action: { type: String },
      target: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      metadata: { type: mongoose.Schema.Types.Mixed }
    }
  },
  {
    timestamps: true,
  }
);

// Index for better performance
GroupMessageSchema.index({ groupId: 1, channelId: 1, createdAt: -1 });
GroupMessageSchema.index({ senderId: 1 });
GroupMessageSchema.index({ mentions: 1 });

const GroupMessage = mongoose.model("GroupMessage", GroupMessageSchema);
module.exports = GroupMessage;