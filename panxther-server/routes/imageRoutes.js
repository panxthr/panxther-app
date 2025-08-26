// routes/imageRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Helper function to convert timestamps (you'll need to import this or define it here)
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate().toISOString();
  if (timestamp._seconds) return new Date(timestamp._seconds * 1000).toISOString();
  return timestamp;
};

// Image upload routes
module.exports = (db, admin) => {
  
  // POST endpoint for image upload
  router.post('/:id/upload-image', upload.single('profileImage'), async (req, res) => {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No image file provided'
        });
      }

      console.log(`Uploading image for user: ${id}`);
      
      // Check if user exists
      const userDocRef = db.collection('Users').doc(id);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Convert buffer to base64 string
      const imageBuffer = req.file.buffer;
      const base64Image = imageBuffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUrl = `data:${mimeType};base64,${base64Image}`;

      // Store image data in Firestore under users/userid/images/profile
      const imageDocRef = db.collection('Users').doc(id).collection('images').doc('profile');
      
      await imageDocRef.set({
        imageData: base64Image,
        mimeType: mimeType,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
        dataUrl: dataUrl
      });

      // Update user profile with image reference
      const userData = userDoc.data();
      const updatedProfile = {
        ...userData.profile,
        profilePicture: dataUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await userDocRef.set({ profile: updatedProfile }, { merge: true });

      console.log(`Image uploaded successfully for user: ${id}`);

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: dataUrl,
        fileInfo: {
          originalName: req.file.originalname,
          size: req.file.size,
          mimeType: mimeType
        }
      });

    } catch (error) {
      console.error('Error uploading image:', error);
      
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 5MB.'
        });
      }
      
      if (error.message === 'Only image files are allowed') {
        return res.status(400).json({
          success: false,
          message: 'Only image files (JPEG, JPG, PNG, GIF, WebP) are allowed.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error.message
      });
    }
  });

  // GET endpoint to retrieve user image
  router.get('/:id/image', async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`Fetching image for user: ${id}`);
      
      const imageDocRef = db.collection('Users').doc(id).collection('images').doc('profile');
      const imageDoc = await imageDocRef.get();
      
      if (!imageDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }
      
      const imageData = imageDoc.data();
      
      res.json({
        success: true,
        imageUrl: imageData.dataUrl,
        fileInfo: {
          fileName: imageData.fileName,
          fileSize: imageData.fileSize,
          mimeType: imageData.mimeType,
          uploadedAt: convertTimestamp(imageData.uploadedAt)
        }
      });
      
    } catch (error) {
      console.error('Error fetching image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch image',
        error: error.message
      });
    }
  });

  // DELETE endpoint to remove user image
  router.delete('/:id/image', async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`Deleting image for user: ${id}`);
      
      const imageDocRef = db.collection('Users').doc(id).collection('images').doc('profile');
      const imageDoc = await imageDocRef.get();
      
      if (!imageDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Image not found'
        });
      }
      
      // Delete image document
      await imageDocRef.delete();
      
      // Update user profile to remove image reference
      const userDocRef = db.collection('Users').doc(id);
      const userDoc = await userDocRef.get();
      
      if (userDoc.exists && userDoc.data().profile) {
        const updatedProfile = {
          ...userDoc.data().profile,
          profilePicture: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        await userDocRef.set({ profile: updatedProfile }, { merge: true });
      }
      
      console.log(`Image deleted successfully for user: ${id}`);
      
      res.json({
        success: true,
        message: 'Image deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete image',
        error: error.message
      });
    }
  });

  return router;
};