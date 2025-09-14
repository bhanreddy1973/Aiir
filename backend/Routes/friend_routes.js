const express = require("express");
const fetchuser = require("../middleware/fetchUser");
const {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  searchByFriendCode,
} = require("../Controllers/friend_controller");

const router = express.Router();

// Send friend request by friend code
router.post("/request", fetchuser, sendFriendRequest);

// Accept friend request
router.post("/accept", fetchuser, acceptFriendRequest);

// Decline friend request  
router.post("/decline", fetchuser, declineFriendRequest);

// Get pending friend requests
router.get("/requests", fetchuser, getFriendRequests);

// Get friends list
router.get("/", fetchuser, getFriends);

// Search user by friend code
router.get("/search/:friendCode", fetchuser, searchByFriendCode);

module.exports = router;