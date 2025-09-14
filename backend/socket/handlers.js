const Conversation = require("../Models/Conversation.js");
const User = require("../Models/User.js");
const Group = require("../Models/Group.js");
const GroupMessage = require("../Models/GroupMessage.js");
const {
  getAiResponse,
  sendMessageHandler,
  deleteMessageHandler,
} = require("../Controllers/message_controller.js");

module.exports = (io, socket) => {
  let currentUserId = null;

  // Setup user in a room
  socket.on("setup", async (id) => {
    currentUserId = id;
    socket.join(id);
    console.log("User joined personal room", id);
    socket.emit("user setup", id);

    // change isOnline to true
    await User.findByIdAndUpdate(id, { isOnline: true });

    const conversations = await Conversation.find({
      members: { $in: [id] },
    });

    conversations.forEach((conversation) => {
      const sock = io.sockets.adapter.rooms.get(conversation.id);
      if (sock) {
        console.log("Other user is online is sent to: ", id);
        io.to(conversation.id).emit("receiver-online", {});
      }
    });
  });

  // Join group room
  socket.on("join-group", async (data) => {
    const { groupId, userId } = data;
    
    try {
      console.log("User joined group room", groupId);
      const group = await Group.findById(groupId);
      
      if (group) {
        // Check if user is a member
        const isMember = group.members.some(member => 
          member.user.toString() === userId
        );
        
        if (isMember) {
          socket.join(`group_${groupId}`);
          io.to(`group_${groupId}`).emit("user-joined-group", { userId, groupId });
        }
      }
    } catch (error) {
      console.error("Error joining group:", error);
    }
  });

  // Leave group room
  socket.on("leave-group", (data) => {
    const { groupId } = data;
    socket.leave(`group_${groupId}`);
  });

  // Join chat room
  socket.on("join-chat", async (data) => {
    const { roomId, userId } = data;

    console.log("User joined chat room", roomId);
    const conv = await Conversation.findById(roomId);
    socket.join(roomId);

    // set joined user unread to 0
    conv.unreadCounts = conv.unreadCounts.map((unread) => {
      if (unread.userId == userId) {
        unread.count = 0;
      }
      return unread;
    });
    await conv.save({ timestamps: false });

    io.to(roomId).emit("user-joined-room", userId);
  });

  // Leave chat room
  socket.on("leave-chat", (room) => {
    socket.leave(room);
  });

  const handleSendMessage = async (data) => {
    console.log("Received message: ", data);

    try {
      var isSentToBot = false;

      const { conversationId, senderId, text, imageUrl } = data;
      
      if (!conversationId || !senderId) {
        console.error("Missing required fields: conversationId or senderId");
        return;
      }

      const conversation = await Conversation.findById(conversationId).populate(
        "members"
      );

      if (!conversation) {
        console.error("Conversation not found:", conversationId);
        return;
      }

    // processing for AI chatbot
    conversation.members.forEach(async (member) => {
      if (member._id != senderId && member.email.endsWith("bot")) {
        // this member is a bot
        isSentToBot = true;
        // send typing event
        io.to(conversationId).emit("typing", { typer: member._id.toString() });
        // generating AI response

        const mockUserMessage = {
          id_: Date.now().toString(),
          conversationId: conversationId,
          senderId: senderId,
          text: text,
          seenBy: [
            {
              user: member._id.toString(),
              seenAt: new Date(),
            },
          ],
          imageUrl: imageUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        io.to(conversationId).emit("receive-message", mockUserMessage);

        const responseMessage = await getAiResponse(
          text,
          senderId,
          conversationId
        );

        if (responseMessage == -1) {
          return;
        }

        io.to(conversationId).emit("receive-message", responseMessage);
        io.to(conversationId).emit("stop-typing", {
          typer: member._id.toString(),
        });
      }
    });

    if (isSentToBot) {
      return;
    }

    // processing for personal chat
    const receiverId = conversation.members.find(
      (member) => member._id != senderId
    )._id;

    const receiverPersonalRoom = io.sockets.adapter.rooms.get(
      receiverId.toString()
    );

    let isReceiverInsideChatRoom = false;

    if (receiverPersonalRoom) {
      const receiverSid = Array.from(receiverPersonalRoom)[0];
      const conversationRoom = io.sockets.adapter.rooms.get(conversationId);
      if (conversationRoom && receiverSid) {
        isReceiverInsideChatRoom = conversationRoom.has(receiverSid);
      }
    }

    const message = await sendMessageHandler({
      text,
      imageUrl,
      senderId,
      conversationId,
      receiverId,
      isReceiverInsideChatRoom,
    });

    io.to(conversationId).emit("receive-message", message);

    // sending notification to receiver
    if (!isReceiverInsideChatRoom) {
      console.log("Emitting new message to: ", receiverId.toString());
      io.to(receiverId.toString()).emit("new-message-notification", message);
    }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      socket.emit("message-error", { error: "Failed to send message" });
    }
  };

  // Send group message
  const handleSendGroupMessage = async (data) => {
    console.log("Received group message:", data);
    
    try {
      const { groupId, channelId, senderId, text, fileAttachment, mentions } = data;
      
      if (!groupId || !channelId || !senderId) {
        console.error("Missing required fields for group message");
        return;
      }

      const group = await Group.findById(groupId);
      if (!group) {
        console.error("Group not found:", groupId);
        return;
      }

      // Check if user is a member
      const isMember = group.members.some(member => 
        member.user.toString() === senderId
      );
      if (!isMember) {
        console.error("User not a member of group:", senderId, groupId);
        return;
      }

      // Check if channel exists
      const channel = group.channels.id(channelId);
      if (!channel) {
        console.error("Channel not found:", channelId);
        return;
      }

      const message = new GroupMessage({
        groupId,
        channelId,
        senderId,
        text,
        fileAttachment,
        mentions: mentions || [],
      });

      await message.save();

      const populatedMessage = await GroupMessage.findById(message._id)
        .populate('senderId', 'name profilePic email')
        .populate('mentions.user', 'name profilePic');

      // Emit to all group members
      io.to(`group_${groupId}`).emit("receive-group-message", {
        ...populatedMessage.toObject(),
        channelId
      });

      // Send notifications to mentioned users
      if (mentions && mentions.length > 0) {
        mentions.forEach(mention => {
          io.to(mention.user.toString()).emit("group-mention-notification", {
            message: populatedMessage,
            groupId,
            channelId,
            groupName: group.name,
            channelName: channel.name
          });
        });
      }

    } catch (error) {
      console.error("Error in handleSendGroupMessage:", error);
      socket.emit("group-message-error", { error: "Failed to send group message" });
    }
  };

  socket.on("send-group-message", handleSendGroupMessage);

  const handleDeleteMessage = async (data) => {
    const { messageId, deleteFrom, conversationId } = data;
    const deleted = await deleteMessageHandler({ messageId, deleteFrom });
    if (deleted && deleteFrom.length > 1) {
      io.to(conversationId).emit("message-deleted", data);
    }
  };

  // Send message
  socket.on("send-message", handleSendMessage);
  socket.on("delete-message", handleDeleteMessage);

  // Typing indicator
  socket.on("typing", (data) => {
    io.to(data.conversationId).emit("typing", data);
  });

  // Stop typing indicator
  socket.on("stop-typing", (data) => {
    io.to(data.conversationId).emit("stop-typing", data);
  });

  // Disconnect
  socket.on("disconnect", async () => {
    console.log("A user disconnected", currentUserId, socket.id);
    try {
      if (currentUserId) {
        await User.findByIdAndUpdate(currentUserId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        const conversations = await Conversation.find({
          members: { $in: [currentUserId] },
        });

        conversations.forEach((conversation) => {
          const sock = io.sockets.adapter.rooms.get(conversation.id);
          if (sock) {
            console.log("Other user is offline is sent to: ", currentUserId);
            io.to(conversation.id).emit("receiver-offline", {});
          }
        });
      }
    } catch (error) {
      console.error("Error updating user status on disconnect:", error);
    }
  });
};
