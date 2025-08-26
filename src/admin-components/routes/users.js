const express = require("express");
const router = express.Router();

// PUT /api/users/:id/profile
router.put("/:id/profile", async (req, res) => {
  try {
    const userId = req.params.id;
    const profileData = req.body;

    // Firestore (db is passed from server.js)
    const db = req.app.locals.db;
    await db.collection("users").doc(userId).set(profileData, { merge: true });

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: profileData,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
});

module.exports = router;
