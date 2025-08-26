const express = require('express');
const router = express.Router();

module.exports = (db, admin) => {
  // Helper functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const generateUserId = () => {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  };

  const convertTimestamp = (timestamp) => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate().toISOString();
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000).toISOString();
    return timestamp;
  };

  // Search users by name or email (MUST come before /:id route)
  router.get('/search/:term', async (req, res) => {
    try {
      const { term } = req.params;
      const { limit = 20 } = req.query;
      const searchTerm = term.toLowerCase();
      
      console.log(`Searching users for term: "${term}"`);
      
      const snapshot = await db.collection('Users').limit(parseInt(limit) * 3).get();
      const matchedUsers = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.profile && matchedUsers.length < parseInt(limit)) {
          const profile = data.profile;
          const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.toLowerCase();
          const email = (profile.email || '').toLowerCase();
          
          if (fullName.includes(searchTerm) || email.includes(searchTerm)) {
            matchedUsers.push({
              id: doc.id,
              profile: {
                ...profile,
                createdAt: convertTimestamp(profile.createdAt),
                updatedAt: convertTimestamp(profile.updatedAt)
              }
            });
          }
        }
      });
      
      console.log(`Found ${matchedUsers.length} matching users`);
      
      res.json({
        success: true,
        searchTerm: term,
        count: matchedUsers.length,
        users: matchedUsers
      });
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search users',
        error: error.message
      });
    }
  });

  // GET all users with their profiles
  router.get('/', async (req, res) => {
    try {
      const { limit = 50, sortBy = 'createdAt', page = 1 } = req.query;
      const pageSize = Math.min(parseInt(limit), 100);
      const offset = (parseInt(page) - 1) * pageSize;
      
      console.log(`Fetching users: page=${page}, limit=${pageSize}, sortBy=${sortBy}`);
      
      let query = db.collection('Users');
      
      if (sortBy === 'name') {
        query = query.orderBy('profile.firstName', 'asc');
      } else if (sortBy === 'email') {
        query = query.orderBy('profile.email', 'asc');
      } else {
        query = query.orderBy('profile.createdAt', 'desc');
      }
      
      query = query.limit(pageSize).offset(offset);
      
      const snapshot = await query.get();
      const users = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.profile) {
          users.push({
            id: doc.id,
            profile: {
              ...data.profile,
              createdAt: convertTimestamp(data.profile.createdAt),
              updatedAt: convertTimestamp(data.profile.updatedAt)
            }
          });
        }
      });
      
      console.log(`Found ${users.length} users`);
      
      res.json({
        success: true,
        count: users.length,
        page: parseInt(page),
        pageSize: pageSize,
        users: users
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  });

  // GET specific user profile by ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Fetching user: ${id}`);
      
      const userDocRef = db.collection('Users').doc(id);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const userData = userDoc.data();
      
      if (!userData.profile) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found'
        });
      }
      
      res.json({
        success: true,
        user: {
          id: userDoc.id,
          profile: {
            ...userData.profile,
            createdAt: convertTimestamp(userData.profile.createdAt),
            updatedAt: convertTimestamp(userData.profile.updatedAt)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: error.message
      });
    }
  });

  // GET user profile (alternative endpoint)
  router.get('/:id/profile', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Fetching profile for user: ${id}`);
      
      const userDocRef = db.collection('Users').doc(id);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      const userData = userDoc.data();
      
      if (!userData.profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }
      
      res.json({
        success: true,
        profile: {
          ...userData.profile,
          createdAt: convertTimestamp(userData.profile.createdAt),
          updatedAt: convertTimestamp(userData.profile.updatedAt)
        }
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch profile',
        error: error.message
      });
    }
  });

  // POST - Create/Update user profile
  router.post('/:id/profile', async (req, res) => {
    try {
      const { id } = req.params;
      const profileData = req.body;
      
      console.log(`Creating/updating profile for user: ${id}`);
      
      if (!profileData.email || !validateEmail(profileData.email)) {
        return res.status(400).json({
          success: false,
          message: 'Valid email is required'
        });
      }
      
      if (!profileData.firstName || !profileData.lastName) {
        return res.status(400).json({
          success: false,
          message: 'First name and last name are required'
        });
      }
      
      const userDocRef = db.collection('Users').doc(id);
      const existingUser = await userDocRef.get();
      const isUpdate = existingUser.exists && existingUser.data().profile;
      
      const profile = {
        ...profileData,
        ...(isUpdate
          ? { updatedAt: admin.firestore.FieldValue.serverTimestamp() }
          : {
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            })
      };
      
      if (isUpdate && existingUser.data().profile.createdAt) {
        profile.createdAt = existingUser.data().profile.createdAt;
      }
      
      await userDocRef.set({ profile }, { merge: true });
      
      console.log(`Profile ${isUpdate ? 'updated' : 'created'} successfully for user: ${id}`);
      
      res.status(isUpdate ? 200 : 201).json({
        success: true,
        message: isUpdate ? 'Profile updated successfully' : 'Profile created successfully',
        userId: id,
        profile: {
          ...profile,
          createdAt: profile.createdAt ? new Date().toISOString() : null,
          updatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save profile',
        error: error.message
      });
    }
  });

  // PUT - Update user profile (partial update)
  router.put('/:id/profile', async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const userDocRef = db.collection('Users').doc(id);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Merge update with existing profile
      const updatedProfile = {
        ...userDoc.data().profile,
        ...updateData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await userDocRef.set({ profile: updatedProfile }, { merge: true });

      res.json({ success: true, message: 'Profile updated successfully', profile: updatedProfile });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    }
  });

  // DELETE user and profile
  router.delete('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Deleting user: ${id}`);
      
      const userDocRef = db.collection('Users').doc(id);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      await userDocRef.delete();
      console.log(`User deleted successfully: ${id}`);
      
      res.json({
        success: true,
        message: 'User and profile deleted successfully',
        deletedUserId: id
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  });

  // DELETE user profile only
  router.delete('/:id/profile', async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Deleting profile for user: ${id}`);
      
      const userDocRef = db.collection('Users').doc(id);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      if (!userDoc.data().profile) {
        return res.status(404).json({
          success: false,
          message: 'Profile not found'
        });
      }
      
      await userDocRef.update({
        profile: admin.firestore.FieldValue.delete()
      });
      
      res.json({
        success: true,
        message: 'Profile deleted successfully',
        userId: id
      });
    } catch (error) {
      console.error('Error deleting profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete profile',
        error: error.message
      });
    }
  });

  // Bulk create users
  router.post('/bulk-create', async (req, res) => {
    try {
      const { users } = req.body;
      
      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Users array is required'
        });
      }
      
      if (users.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 100 users per batch operation'
        });
      }
      
      const results = [];
      const errors = [];
      const batchSize = 10;
      
      console.log(`Bulk creating ${users.length} users...`);
      
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = db.batch();
        const currentBatch = users.slice(i, i + batchSize);
        
        for (let j = 0; j < currentBatch.length; j++) {
          const globalIndex = i + j;
          try {
            const userData = currentBatch[j];
            const userId = userData.id || generateUserId();
            
            if (!userData.firstName || !userData.lastName || !userData.email) {
              errors.push({
                index: globalIndex,
                error: 'Missing required fields (firstName, lastName, email)',
                userData
              });
              continue;
            }
            
            if (!validateEmail(userData.email)) {
              errors.push({
                index: globalIndex,
                error: 'Invalid email format',
                userData
              });
              continue;
            }
            
            const profile = {
              firstName: userData.firstName.trim(),
              lastName: userData.lastName.trim(),
              email: userData.email.trim().toLowerCase(),
              phone: userData.phone || null,
              dateOfBirth: userData.dateOfBirth || null,
              gender: userData.gender || null,
              address: userData.address || {},
              bio: userData.bio || null,
              website: userData.website || null,
              socialMedia: userData.socialMedia || {},
              preferences: userData.preferences || {
                newsletter: false,
                notifications: true,
                privacy: 'public'
              },
              profilePicture: userData.profilePicture || null,
              occupation: userData.occupation || null,
              company: userData.company || null,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            
            const userDocRef = db.collection('Users').doc(userId);
            batch.set(userDocRef, { profile });
            
            results.push({
              index: globalIndex,
              userId,
              status: 'queued'
            });
            
          } catch (error) {
            errors.push({
              index: globalIndex,
              error: error.message,
              userData: currentBatch[j]
            });
          }
        }
        
        if (results.filter(r => r.status === 'queued').length > 0) {
          await batch.commit();
          results.forEach(r => {
            if (r.status === 'queued') r.status = 'success';
          });
        }
      }
      
      console.log(`Bulk create completed: ${results.length} success, ${errors.length} errors`);
      
      res.json({
        success: true,
        message: `Bulk operation completed. ${results.length} users created, ${errors.length} errors`,
        results: {
          successful: results,
          errors: errors,
          summary: {
            total: users.length,
            successful: results.length,
            failed: errors.length
          }
        }
      });
    } catch (error) {
      console.error('Error in bulk create:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create users in bulk',
        error: error.message
      });
    }
  });

  return router;
};