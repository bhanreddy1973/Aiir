const Group = require("../Models/Group");
const GroupMessage = require("../Models/GroupMessage");
const User = require("../Models/User");

// Create a new group
const createGroup = async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;
    const ownerId = req.user.id;

    // Generate unique invite code
    let inviteCode;
    let codeExists = true;
    
    while (codeExists) {
      inviteCode = Array.from({ length: 8 }, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
          .charAt(Math.floor(Math.random() * 62))
      ).join('');
      
      const existingGroup = await Group.findOne({ inviteCode });
      if (!existingGroup) {
        codeExists = false;
      }
    }

    // Create default channels
    const defaultChannels = [
      {
        name: "general",
        type: "text",
        description: "General discussion",
        position: 0,
        isDefault: true,
      },
      {
        name: "announcements",
        type: "announcement",
        description: "Important announcements",
        position: 1,
      }
    ];

    const group = new Group({
      name,
      description,
      owner: ownerId,
      inviteCode,
      isPublic,
      members: [{
        user: ownerId,
        role: "owner",
        permissions: {
          canInvite: true,
          canKick: true,
          canBan: true,
          canManageChannels: true,
          canManageRoles: true,
          canDeleteMessages: true,
        }
      }],
      channels: defaultChannels,
    });

    await group.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name profilePic email')
      .populate('owner', 'name profilePic email');

    res.json({ 
      success: true, 
      message: "Group created successfully",
      group: populatedGroup
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Join group by invite code
const joinGroup = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;

    const group = await Group.findOne({ inviteCode });
    if (!group) {
      return res.status(404).json({ error: "Invalid invite code" });
    }

    // Check if user is banned
    const isBanned = group.bannedUsers.some(ban => 
      ban.user.toString() === userId
    );
    if (isBanned) {
      return res.status(403).json({ error: "You are banned from this group" });
    }

    // Check if already a member
    const isMember = group.members.some(member => 
      member.user.toString() === userId
    );
    if (isMember) {
      return res.status(400).json({ error: "You are already a member of this group" });
    }

    // Check member limit
    if (group.members.length >= group.maxMembers) {
      return res.status(400).json({ error: "Group has reached maximum member limit" });
    }

    // Add user as member
    group.members.push({
      user: userId,
      role: "member",
    });

    await group.save();

    // Create system message for join
    const defaultChannel = group.getDefaultChannel();
    if (defaultChannel) {
      const systemMessage = new GroupMessage({
        groupId: group._id,
        channelId: defaultChannel._id,
        senderId: userId,
        messageType: "join",
        text: "joined the group",
        systemData: {
          action: "user_joined",
          target: userId
        }
      });
      await systemMessage.save();
    }

    const populatedGroup = await Group.findById(group._id)
      .populate('members.user', 'name profilePic email')
      .populate('owner', 'name profilePic email');

    res.json({ 
      success: true, 
      message: "Successfully joined the group",
      group: populatedGroup
    });
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user's groups
const getUserGroups = async (req, res) => {
  try {
    const userId = req.user.id;

    const groups = await Group.find({
      "members.user": userId
    })
    .populate('members.user', 'name profilePic email isOnline lastSeen')
    .populate('owner', 'name profilePic email')
    .sort({ updatedAt: -1 });

    res.json(groups);
  } catch (error) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get group details
const getGroupDetails = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId)
      .populate('members.user', 'name profilePic email isOnline lastSeen')
      .populate('owner', 'name profilePic email');

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is a member
    const isMember = group.members.some(member => 
      member.user._id.toString() === userId
    );
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    res.json(group);
  } catch (error) {
    console.error("Error fetching group details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Create channel in group
const createChannel = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, type, description } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check permissions
    if (!group.hasPermission(userId, 'canManageChannels')) {
      return res.status(403).json({ error: "You don't have permission to manage channels" });
    }

    const newChannel = {
      name,
      type: type || 'text',
      description: description || '',
      position: group.channels.length,
    };

    group.channels.push(newChannel);
    await group.save();

    res.json({ 
      success: true, 
      message: "Channel created successfully",
      channel: group.channels[group.channels.length - 1]
    });
  } catch (error) {
    console.error("Error creating channel:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get channel messages
const getChannelMessages = async (req, res) => {
  try {
    const { groupId, channelId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is a member
    const isMember = group.members.some(member => 
      member.user.toString() === userId
    );
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Check if channel exists
    const channel = group.channels.id(channelId);
    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const messages = await GroupMessage.find({
      groupId,
      channelId,
      deletedBy: { $not: { $elemMatch: { user: userId } } }
    })
    .populate('senderId', 'name profilePic email')
    .populate('mentions.user', 'name profilePic')
    .populate('replyTo')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    res.json(messages.reverse());
  } catch (error) {
    console.error("Error fetching channel messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Send message to group channel
const sendGroupMessage = async (req, res) => {
  try {
    const { groupId, channelId } = req.params;
    const { text, mentions, replyTo } = req.body;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user is a member
    const isMember = group.members.some(member => 
      member.user.toString() === userId
    );
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this group" });
    }

    // Check if channel exists
    const channel = group.channels.id(channelId);
    if (!channel) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const message = new GroupMessage({
      groupId,
      channelId,
      senderId: userId,
      text,
      mentions: mentions || [],
      replyTo: replyTo || null,
    });

    await message.save();

    const populatedMessage = await GroupMessage.findById(message._id)
      .populate('senderId', 'name profilePic email')
      .populate('mentions.user', 'name profilePic')
      .populate('replyTo');

    res.json({ 
      success: true, 
      message: populatedMessage
    });
  } catch (error) {
    console.error("Error sending group message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Generate new invite code for group
const generateInviteCode = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user has permission to generate invite codes
    if (!group.hasPermission(userId, 'canInvite') && group.owner.toString() !== userId) {
      return res.status(403).json({ error: "You don't have permission to generate invite codes" });
    }

    // Generate new unique invite code
    let newInviteCode;
    let codeExists = true;
    
    while (codeExists) {
      newInviteCode = Array.from({ length: 8 }, () => 
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
          .charAt(Math.floor(Math.random() * 62))
      ).join('');
      
      const existingGroup = await Group.findOne({ inviteCode: newInviteCode });
      if (!existingGroup) {
        codeExists = false;
      }
    }

    group.inviteCode = newInviteCode;
    await group.save();

    res.json({ 
      success: true, 
      message: "New invite code generated successfully",
      inviteCode: newInviteCode
    });
  } catch (error) {
    console.error("Error generating invite code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get group invite details
const getInviteDetails = async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const group = await Group.findOne({ inviteCode })
      .populate('owner', 'name profilePic')
      .select('name description avatar owner members inviteCode isPublic maxMembers');

    if (!group) {
      return res.status(404).json({ error: "Invalid invite code" });
    }

    // Return public info about the group
    const inviteDetails = {
      groupName: group.name,
      description: group.description,
      avatar: group.avatar,
      owner: group.owner,
      memberCount: group.members.length,
      maxMembers: group.maxMembers,
      isPublic: group.isPublic,
      inviteCode: group.inviteCode
    };

    res.json(inviteDetails);
  } catch (error) {
    console.error("Error fetching invite details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Disable invite code
const disableInviteCode = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if user has permission
    if (!group.hasPermission(userId, 'canInvite') && group.owner.toString() !== userId) {
      return res.status(403).json({ error: "You don't have permission to manage invite codes" });
    }

    group.inviteCode = null;
    await group.save();

    res.json({ 
      success: true, 
      message: "Invite code disabled successfully"
    });
  } catch (error) {
    console.error("Error disabling invite code:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createGroup,
  joinGroup,
  getUserGroups,
  getGroupDetails,
  createChannel,
  getChannelMessages,
  sendGroupMessage,
  generateInviteCode,
  getInviteDetails,
  disableInviteCode,
};