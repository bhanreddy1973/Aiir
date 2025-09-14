const express = require("express");
const fetchuser = require("../middleware/fetchUser");
const {
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
} = require("../Controllers/group_controller");

const router = express.Router();

// Create a new group
router.post("/create", fetchuser, createGroup);

// Join group by invite code
router.post("/join", fetchuser, joinGroup);

// Get user's groups
router.get("/", fetchuser, getUserGroups);

// Get group details
router.get("/:groupId", fetchuser, getGroupDetails);

// Create channel in group
router.post("/:groupId/channels", fetchuser, createChannel);

// Get channel messages
router.get("/:groupId/channels/:channelId/messages", fetchuser, getChannelMessages);

// Send message to group channel
router.post("/:groupId/channels/:channelId/messages", fetchuser, sendGroupMessage);

// Generate new invite code for group
router.post("/:groupId/invite/generate", fetchuser, generateInviteCode);

// Get invite details (public endpoint)
router.get("/invite/:inviteCode", getInviteDetails);

// Disable invite code
router.delete("/:groupId/invite", fetchuser, disableInviteCode);

module.exports = router;