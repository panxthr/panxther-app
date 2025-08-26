
module.exports = (db, admin) => {
  const express = require('express');
  const router = express.Router();

  // GET profile by username/slug
  router.get('/profile/:username', async (req, res) => {
    const { username } = req.params;
    
    try {
      console.log(`Fetching public profile for username: ${username}`);
      
      // Query Firestore to find user by username field
      const usersRef = db.collection('Users');
      
      // First try to find by username field
      let querySnapshot = await usersRef.where('profile.username', '==', username).get();
      
      if (querySnapshot.empty) {
        // If no username field, try searching by slug
        querySnapshot = await usersRef.where('profile.slug', '==', username).get();
      }
      
      if (querySnapshot.empty) {
        // Try searching by firstName + lastName combination (case insensitive)
        const allUsersSnapshot = await usersRef.get();
        let foundUser = null;
        
        allUsersSnapshot.forEach(doc => {
          const userData = doc.data();
          const profile = userData.profile || {};
          
          // Create potential username from name
          const firstName = (profile.firstName || '').toLowerCase();
          const lastName = (profile.lastName || '').toLowerCase();
          const fullName = `${firstName}${lastName}`.replace(/\s+/g, '');
          const firstNameOnly = firstName;
          
          if (fullName === username.toLowerCase() || 
              firstNameOnly === username.toLowerCase() ||
              profile.customSlug?.toLowerCase() === username.toLowerCase()) {
            foundUser = { id: doc.id, data: userData };
          }
        });
        
        if (!foundUser) {
          return res.status(404).json({
            success: false,
            message: 'Profile not found'
          });
        }
        
        console.log(`Profile found for username: ${username} (by name matching)`);
        
        return res.json({
          success: true,
          userId: foundUser.id,
          profile: foundUser.data.profile || {},
          message: 'Profile retrieved successfully'
        });
      }
      
      // Found user by username or slug
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      
      console.log(`Profile found for username: ${username}`);
      
      res.json({
        success: true,
        userId: userDoc.id,
        profile: userData.profile || {},
        message: 'Profile retrieved successfully'
      });
      
    } catch (error) {
      console.error(`Error fetching profile for username ${username}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message
      });
    }
  });

  // GET check username availability
  router.get('/check-username/:username', async (req, res) => {
    const { username } = req.params;
    
    try {
      console.log(`Checking username availability: ${username}`);
      
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return res.json({
          success: false,
          available: false,
          message: 'Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores'
        });
      }
      
      // Check reserved usernames
      const reservedUsernames = [
        'admin', 'api', 'www', 'mail', 'ftp', 'localhost', 'dashboard', 
        'settings', 'profile', 'login', 'register', 'signup', 'signin',
        'about', 'contact', 'help', 'support', 'terms', 'privacy',
        'blog', 'news', 'app', 'mobile', 'web', 'site', 'home'
      ];
      
      if (reservedUsernames.includes(username.toLowerCase())) {
        return res.json({
          success: false,
          available: false,
          message: 'This username is reserved'
        });
      }
      
      // Query Firestore to check if username exists
      const usersRef = db.collection('Users');
      
      const usernameQuery = await usersRef.where('profile.username', '==', username).get();
      const slugQuery = await usersRef.where('profile.slug', '==', username).get();
      
      const isAvailable = usernameQuery.empty && slugQuery.empty;
      
      res.json({
        success: true,
        available: isAvailable,
        message: isAvailable ? 'Username is available' : 'Username is already taken'
      });
      
    } catch (error) {
      console.error(`Error checking username availability ${username}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to check username availability',
        error: error.message
      });
    }
  });

  // POST update username for a user
  router.post('/:userId/update-username', async (req, res) => {
    const { userId } = req.params;
    const { username } = req.body;
    
    try {
      console.log(`Updating username for user: ${userId} to: ${username}`);
      
      // Validate username format
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          success: false,
          message: 'Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores'
        });
      }
      
      // Check if username is available
      const usersRef = db.collection('Users');
      const existingUser = await usersRef.where('profile.username', '==', username).get();
      
      if (!existingUser.empty) {
        const existingUserId = existingUser.docs[0].id;
        if (existingUserId !== userId) {
          return res.status(400).json({
            success: false,
            message: 'Username is already taken'
          });
        }
      }
      
      // Update user's profile with the new username
      const userRef = db.collection('Users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const userData = userDoc.data();
      const updatedProfile = {
        ...userData.profile,
        username: username,
        updatedAt: admin.firestore.Timestamp.now()
      };
      
      await userRef.update({ profile: updatedProfile });
      
      console.log(`Username updated successfully for user: ${userId}`);
      
      res.json({
        success: true,
        message: 'Username updated successfully',
        username: username
      });
      
    } catch (error) {
      console.error(`Error updating username for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to update username',
        error: error.message
      });
    }
  });

  return router;
};