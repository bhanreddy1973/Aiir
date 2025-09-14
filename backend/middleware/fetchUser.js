const jwt = require("jsonwebtoken");
const env = require("dotenv");
env.config({
  path: "./.env",
});

const JWT_SECRET = process.env.JWT_SECRET;

const fetchuser = (req, res, next) => {
  console.log("🔍 fetchuser middleware called");
  console.log("🔑 JWT_SECRET:", JWT_SECRET ? "✅ Available" : "❌ Missing");
  
  const token = req.header("auth-token");
  console.log("🎫 Token received:", token ? "✅ Present" : "❌ Missing");
  
  if (!token) {
    console.log("❌ No token provided");
    return res.status(401).json({ error: "Please authenticate using a valid token" });
  }
  
  try {
    const data = jwt.verify(token, JWT_SECRET);
    console.log("✅ Token verified successfully, user ID:", data.user.id);
    req.user = data.user;
    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    return res.status(401).json({ error: "Please authenticate using a valid token" });
  }
};

module.exports = fetchuser;
