require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { a } = require('@react-spring/three');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
let db;
try {
  // For local development, use service account key
  const serviceAccount = require('./serviceAccountKey.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'panxther-46b15',
  });
  
  db = admin.firestore();
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  console.error('💡 Make sure serviceAccountKey.json is in your project root');
  process.exit(1);
}

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Request logging for development
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    firebase: 'connected'
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: "Welcome to User Profile API with Firebase Admin SDK 🚀",
    version: "2.0.0",
    environment: process.env.NODE_ENV || 'development',
    server: `http://localhost:${PORT}`,
    endpoints: {
      "GET /health": "Health check",
      "GET /api/users": "Get all user profiles",
      "GET /api/users/search/:term": "Search users by name or email",
      "GET /api/users/:id": "Get specific user profile",
      "GET /api/users/:id/profile": "Get user profile (alternative endpoint)",
      "POST /api/users/:id/profile": "Create/Update user profile",
      "PUT /api/users/:id/profile": "Update user profile",
      "DELETE /api/users/:id": "Delete user and profile",
      "DELETE /api/users/:id/profile": "Delete user profile only",
      "POST /api/users/bulk-create": "Bulk create users",
      "GET /api/admin/stats": "Get user statistics",
      "GET /api/users/:userId/analytics": "Get user analytics",
      "GET /api/users/:userId/settings/refs": "Get user refs"
    }
  });
});

// Import and use route modules
const imageRoutes = require('./routes/imageRoutes')(db, admin);
const profileRoutes = require('./routes/profileRoutes')(db, admin);
const chatbotRoutes = require('./routes/chatbotRoutes')(db, admin);
const blogRoutes = require('./routes/blogRoutes')(db, admin);
const newsletterRoutes = require('./routes/newsletterRoutes')(db, admin);
const publicProfileRoutes = require('./routes/publicProfileRoutes')(db, admin);
const dashboardRoutes = require('./routes/dashboardRoutes')(db, admin);



// Mount route modules
app.use('/api/users', imageRoutes);
app.use('/api/users', profileRoutes);
app.use('/api/users', chatbotRoutes);
app.use('/api/users', blogRoutes);
app.use('/api/users', newsletterRoutes);
app.use('/api/users', publicProfileRoutes);
app.use('/api/admin', dashboardRoutes);

// GET user statistics (admin endpoint)
app.get('/api/admin/stats', async (req, res) => {
  try {
    console.log('Fetching user statistics...');
    
    const usersSnapshot = await db.collection('Users').count().get();
    const totalUsers = usersSnapshot.data().count;
    
    const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    const recentUsersSnapshot = await db.collection('Users')
      .where('profile.createdAt', '>=', sevenDaysAgo)
      .count()
      .get();
    
    const recentUsers = recentUsersSnapshot.data().count;
    
    console.log(`Stats: ${totalUsers} total users, ${recentUsers} recent users`);
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        recentUsers,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    availableEndpoints: {
      "GET /": "API documentation",
      "GET /health": "Health check",
      "GET /api/users": "Get all users"
    }
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
🚀 Server running at http://localhost:${PORT}
📚 API docs: http://localhost:${PORT}
💚 Health check: http://localhost:${PORT}/health
🔥 Environment: ${process.env.NODE_ENV || 'development'}
📊 Admin stats: http://localhost:${PORT}/api/admin/stats

Ready to accept requests! 🎉
  `);
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`\n🔄 Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('✅ HTTP server closed');
    admin.app().delete().then(() => {
      console.log('✅ Firebase connection closed');
      process.exit(0);
    });
  });
}

module.exports = app;