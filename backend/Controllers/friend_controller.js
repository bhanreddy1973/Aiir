const User = require("../Models/User");
const Conversation = require("../Models/Conversation");

// Send friend request by friend code
const sendFriendRequest = async (req, res) => {
  try {
    console.log("🚀 sendFriendRequest called");
    console.log("📝 Request body:", req.body);
    console.log("👤 User from token:", req.user);
    
  let { friendCode, friendId } = req.body;
  const senderId = req.user.id;

    console.log("🔍 Searching for user with friend code:", friendCode);

    // Normalize: allow friendId as fallback for backward compatibility
    let targetUser;
    if (friendCode) {
      // Find user by friend code
      targetUser = await User.findOne({ friendCode });
    } else if (friendId) {
      targetUser = await User.findById(friendId);
    }
    if (!targetUser) {
      console.log("❌ User not found with friend code:", friendCode);
      return res.status(404).json({ error: "User not found with this friend code" });
    }

    console.log("✅ Target user found:", targetUser.name, targetUser._id);

    // Ensure targetUser has a friendCode (for legacy users)
    if (!targetUser.friendCode) {
      const generateFriendCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      let newFriendCode;
      let codeExists = true;
      
      while (codeExists) {
        newFriendCode = generateFriendCode();
        const existingUser = await User.findOne({ friendCode: newFriendCode });
        if (!existingUser) {
          codeExists = false;
        }
      }

      targetUser.friendCode = newFriendCode;
    }

    // Check if trying to add yourself
    if (targetUser._id.toString() === senderId) {
      return res.status(400).json({ error: "You cannot add yourself as a friend" });
    }

    // Check if already friends
    if (targetUser.friends.includes(senderId)) {
      return res.status(400).json({ error: "You are already friends with this user" });
    }

    // Check if friend request already exists
    const existingRequest = targetUser.friendRequests.find(
      req => req.from.toString() === senderId && req.status === 'pending'
    );
    
    if (existingRequest) {
      return res.status(400).json({ error: "Friend request already sent" });
    }

    // Add friend request
    targetUser.friendRequests.push({
      from: senderId,
      status: 'pending'
    });

    await targetUser.save();

    res.json({ 
      success: true, 
      message: `Friend request sent to ${targetUser.name}`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        profilePic: targetUser.profilePic
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Accept friend request
const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    
    // Ensure user has a friendCode (for legacy users)
    if (!user.friendCode) {
      const generateFriendCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      let newFriendCode;
      let codeExists = true;
      
      while (codeExists) {
        newFriendCode = generateFriendCode();
        const existingUser = await User.findOne({ friendCode: newFriendCode });
        if (!existingUser) {
          codeExists = false;
        }
      }

      user.friendCode = newFriendCode;
    }
    
    const requestIndex = user.friendRequests.findIndex(
      req => req._id.toString() === requestId && req.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    const friendRequest = user.friendRequests[requestIndex];
    const friendId = friendRequest.from;

    // Add to friends list
    user.friends.push(friendId);
    user.friendRequests[requestIndex].status = 'accepted';

    // Add current user to friend's friends list
    await User.findByIdAndUpdate(friendId, {
      $push: { friends: userId }
    });

    await user.save();

    // Create conversation between friends
    const conversation = new Conversation({
      members: [userId, friendId]
    });
    await conversation.save();

    const friend = await User.findById(friendId).select('name profilePic friendCode');

    res.json({ 
      success: true, 
      message: "Friend request accepted",
      friend,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Decline friend request
const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    
    // Ensure user has a friendCode (for legacy users)
    if (!user.friendCode) {
      const generateFriendCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      let newFriendCode;
      let codeExists = true;
      
      while (codeExists) {
        newFriendCode = generateFriendCode();
        const existingUser = await User.findOne({ friendCode: newFriendCode });
        if (!existingUser) {
          codeExists = false;
        }
      }

      user.friendCode = newFriendCode;
    }
    
    const requestIndex = user.friendRequests.findIndex(
      req => req._id.toString() === requestId && req.status === 'pending'
    );

    if (requestIndex === -1) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    user.friendRequests[requestIndex].status = 'declined';
    await user.save();

    res.json({ success: true, message: "Friend request declined" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get pending friend requests
const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('friendRequests.from', 'name profilePic friendCode')
      .select('friendRequests');

    const pendingRequests = user.friendRequests.filter(req => req.status === 'pending');

    res.json(pendingRequests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get friends list
const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('friends', 'name profilePic friendCode isOnline lastSeen')
      .select('friends');

    res.json(user.friends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Search user by friend code
const searchByFriendCode = async (req, res) => {
  try {
    const { friendCode } = req.params;
    const userId = req.user.id;

    const user = await User.findOne({ friendCode })
      .select('name profilePic friendCode about');

    if (!user) {
      return res.status(404).json({ error: "User not found with this friend code" });
    }

    // Don't return self
    if (user._id.toString() === userId) {
      return res.status(400).json({ error: "This is your own friend code" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  searchByFriendCode,
};