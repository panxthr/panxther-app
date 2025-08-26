const admin = require('firebase-admin');
const path = require('path');

const initializeFirebase = () => {
  try {
    // For local development, use service account key
    if (process.env.NODE_ENV === 'development') {
      const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID || 'panxther-46b15',
      });
    } else {
      // For production, use environment variables
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
    }
    
    console.log('✅ Firebase Admin initialized successfully');
    return admin.firestore();
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    process.exit(1);
  }
};

module.exports = { initializeFirebase };