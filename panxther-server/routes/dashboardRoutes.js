
const express = require('express');

module.exports = (db, admin) => {
  const router = express.Router();

  // Get user dashboard analytics
  router.get('/:userId/analytics', async (req, res) => {
    try {
      const { userId } = req.params;
      const { timeframe = '30d', includeSessions = false } = req.query;

      console.log(`Fetching analytics for user: ${userId}, timeframe: ${timeframe}`);

      // Define date ranges based on timeframe
      const getDateRange = (timeframe) => {
        const now = Date.now();
        let startTime;

        switch (timeframe) {
          case '1h':
            startTime = now - (1 * 60 * 60 * 1000); 
            break;
          case '24h':
            startTime = now - (24 * 60 * 60 * 1000); 
            break;
          case '7d':
            startTime = now - (7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startTime = now - (30 * 24 * 60 * 60 * 1000);
            break;
          case '90d':
            startTime = now - (90 * 24 * 60 * 60 * 1000);
            break;
          case '1y':
            startTime = now - (365 * 24 * 60 * 60 * 1000);
            break;
          default:
            startTime = now - (30 * 24 * 60 * 60 * 1000);
        }

        return {
          start: Math.floor(startTime / 1000), // Convert to Unix timestamp
          end: Math.floor(now / 1000)
        };
      };

      const dateRange = getDateRange(timeframe);
      const analyticsRef = db.collection('Users').doc(userId).collection('Analytics');

      // Get all documents in the Analytics collection
      console.log('Fetching analytics documents...');
      const snapshot = await analyticsRef.get();
      
      if (snapshot.empty) {
        console.log('No analytics documents found');
        return res.json({
          success: true,
          data: {
            userId,
            timeframe,
            totalSessions: 0,
            totalDocuments: 0,
            sessionDocuments: [],
            summaryDocuments: [],
            summary: {
              totalInteractions: 0,
              totalChatTime: 0,
              totalMessages: 0,
              chatbotSessions: 0,
              pageViews: 0,
              engagementScore: 0,
              topHours: [],
              interactionBreakdown: {}
            }
          }
        });
      }

      console.log(`Found ${snapshot.size} analytics documents`);
      
      const sessionDocuments = [];
      const summaryDocuments = [];
      let totalInteractions = 0;
      let totalChatTime = 0;
      let totalMessages = 0;
      let totalPageViews = 0;
      let totalEngagementScore = 0;
      let chatbotSessions = 0;
      const hourlyStats = {};
      const interactionBreakdown = {
        chatbotInteractions: 0,
        blogViews: 0,
        contactClicks: 0,
        enquiries: 0,
        linkClicks: 0,
        totalClicks: 0
      };

      // Process each document
      snapshot.forEach(doc => {
        const docId = doc.id;
        const data = doc.data();
        
        console.log(`Processing document: ${docId}`);
        console.log('Document data keys:', Object.keys(data));

        // Check if document is within date range
        const docTimestamp = data.timestamp || data.sessionStartTime || data.startTimestamp || data.hourStart;
        if (docTimestamp && (docTimestamp < dateRange.start || docTimestamp > dateRange.end)) {
          console.log(`Skipping document ${docId} - outside date range`);
          return;
        }

        if (docId.includes('_summary')) {
          // Handle summary documents
          console.log(`Found summary document: ${docId}`);
          summaryDocuments.push({
            id: docId,
            timestamp: docTimestamp,
            ...data
          });
          
        } else if (docId.includes('_session_')) {
          // Handle session documents
          console.log(`Found session document: ${docId}`);
          
          const sessionInfo = {
            id: docId,
            sessionId: data.sessionId || docId.split('_session_')[1]?.split('_')[0],
            startTime: data.sessionStartTime || data.startTimestamp || data.timestamp,
            endTime: data.endTimestamp,
            duration: data.duration || 0,
            engagementScore: data.engagementScore || 0,
            pageViews: data.pageViews || 0,
            interactions: data.interactions || {},
            chatbot: data.chatbot || {},
            ref: data.ref,
            userAgent: data.userAgent,
            viewport: data.viewport,
            scrollDepth: data.scrollDepth,
            sectionViews: data.sectionViews,
            hourStart: data.hourStart,
            isActiveSession: data.isActiveSession,
            lastActivity: data.lastActivity
          };

          // Include full event log if requested
          if (includeSessions && data.eventLog) {
            sessionInfo.eventLog = data.eventLog;
          }

          sessionDocuments.push(sessionInfo);

          // Aggregate session data
          totalPageViews += data.pageViews || 0;
          totalEngagementScore += data.engagementScore || 0;

          // Process interactions
          if (data.interactions && typeof data.interactions === 'object') {
            Object.keys(interactionBreakdown).forEach(key => {
              if (data.interactions[key] && typeof data.interactions[key] === 'number') {
                interactionBreakdown[key] += data.interactions[key];
                if (key === 'totalClicks') {
                  totalInteractions += data.interactions[key];
                }
              }
            });
          }

          // Process chatbot data
          if (data.chatbot && typeof data.chatbot === 'object') {
            totalChatTime += data.chatbot.totalChatTime || 0;
            totalMessages += data.chatbot.totalMessages || 0;
            chatbotSessions += data.chatbot.sessionsOpened || 0;
          }

          // Track hourly activity
          const sessionStart = data.sessionStartTime || data.startTimestamp || data.hourStart;
          if (sessionStart) {
            try {
              // Handle both Unix timestamp (seconds) and milliseconds
              const timestamp = sessionStart > 1000000000000 ? sessionStart : sessionStart * 1000;
              const hour = new Date(timestamp).getHours();
              hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
            } catch (error) {
              console.warn('Error processing timestamp for hourly stats:', sessionStart);
            }
          }
        }
      });

      // Convert hourly stats to sorted array
      const topHours = Object.entries(hourlyStats)
        .map(([hour, count]) => ({ hour: parseInt(hour), sessions: count }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10);

      // Calculate averages
      const avgEngagementScore = sessionDocuments.length > 0 ? 
        Math.round(totalEngagementScore / sessionDocuments.length) : 0;

      const summary = {
        totalSessions: sessionDocuments.length,
        totalSummaries: summaryDocuments.length,
        totalInteractions,
        totalChatTime,
        totalMessages,
        chatbotSessions,
        pageViews: totalPageViews,
        avgEngagementScore,
        topHours,
        interactionBreakdown
      };

      console.log('Analytics summary:', summary);

      res.json({
        success: true,
        data: {
          userId,
          timeframe,
          totalDocuments: snapshot.size,
          totalSessions: sessionDocuments.length,
          totalSummaries: summaryDocuments.length,
          sessions: sessionDocuments.slice(0, 50), // Limit sessions returned
          summaries: summaryDocuments,
          summary,
          dateRange
        }
      });

    } catch (error) {
      console.error('Error fetching user analytics:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics',
        error: error.message
      });
    }
  });

  // Get specific session data by document ID or session ID
  router.get('/:userId/analytics/session/:sessionId', async (req, res) => {
    try {
      const { userId, sessionId } = req.params;
      
      console.log(`Fetching session: ${sessionId} for user: ${userId}`);
      
      const analyticsRef = db.collection('Users').doc(userId).collection('Analytics');
      
      // Try to get document by exact ID first
      let sessionDoc = null;
      try {
        const doc = await analyticsRef.doc(sessionId).get();
        if (doc.exists) {
          sessionDoc = {
            id: doc.id,
            ...doc.data()
          };
        }
      } catch (error) {
        console.log('Document not found by exact ID, searching all documents...');
      }

      // If not found by exact ID, search through all documents
      if (!sessionDoc) {
        const snapshot = await analyticsRef.get();
        snapshot.forEach(doc => {
          const data = doc.data();
          if (doc.id === sessionId || 
              doc.id.includes(sessionId) || 
              data.sessionId === sessionId) {
            sessionDoc = {
              id: doc.id,
              ...data
            };
          }
        });
      }

      if (!sessionDoc) {
        return res.status(404).json({
          success: false,
          message: 'Session not found',
          searchedId: sessionId
        });
      }

      console.log(`Found session document: ${sessionDoc.id}`);

      res.json({
        success: true,
        data: {
          userId,
          sessionId,
          session: sessionDoc
        }
      });

    } catch (error) {
      console.error('Error fetching session data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch session data',
        error: error.message
      });
    }
  });

  // Get real-time analytics (active sessions from last hour)
  router.get('/:userId/analytics/realtime', async (req, res) => {
    try {
      const { userId } = req.params;
      
      console.log(`Fetching real-time analytics for user: ${userId}`);
      
      const oneHourAgo = Math.floor((Date.now() - (60 * 60 * 1000)) / 1000);
      const analyticsRef = db.collection('Users').doc(userId).collection('Analytics');
      
      const snapshot = await analyticsRef.get();
      
      if (snapshot.empty) {
        return res.json({
          success: true,
          data: {
            userId,
            activeUsers: 0,
            activeSessions: [],
            topActivePages: [],
            activeInteractions: {
              chatbotInteractions: 0,
              totalClicks: 0,
              pageViews: 0
            },
            timestamp: Math.floor(Date.now() / 1000)
          }
        });
      }

      const activeSessions = [];
      let totalActiveUsers = 0;
      const activePages = {};
      const activeInteractions = {
        chatbotInteractions: 0,
        totalClicks: 0,
        pageViews: 0
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        const lastActivity = data.lastActivity || data.timestamp || data.sessionStartTime;
        
        // Check if session is recent and active
        if (lastActivity && lastActivity >= oneHourAgo && 
           (data.isActiveSession || doc.id.includes('_session_'))) {
          
          activeSessions.push({
            id: doc.id,
            sessionId: data.sessionId || doc.id.split('_session_')[1]?.split('_')[0],
            lastActivity,
            duration: data.duration || 0,
            interactions: data.interactions || {},
            ref: data.ref,
            engagementScore: data.engagementScore || 0,
            pageViews: data.pageViews || 0
          });

          totalActiveUsers++;

          // Track active pages
          if (data.ref) {
            activePages[data.ref] = (activePages[data.ref] || 0) + 1;
          }

          // Sum active interactions
          if (data.interactions && typeof data.interactions === 'object') {
            Object.keys(activeInteractions).forEach(key => {
              if (data.interactions[key] && typeof data.interactions[key] === 'number') {
                activeInteractions[key] += data.interactions[key];
              }
            });
          }

          // Add page views
          if (data.pageViews) {
            activeInteractions.pageViews += data.pageViews;
          }
        }
      });

      const topActivePages = Object.entries(activePages)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([page, count]) => ({ page, activeUsers: count }));

      console.log(`Found ${totalActiveUsers} active users`);

      res.json({
        success: true,
        data: {
          userId,
          activeUsers: totalActiveUsers,
          activeSessions: activeSessions.slice(0, 20),
          topActivePages,
          activeInteractions,
          timestamp: Math.floor(Date.now() / 1000)
        }
      });

    } catch (error) {
      console.error('Error fetching realtime analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch realtime analytics',
        error: error.message
      });
    }
  });

  // Get analytics by interaction type
  router.get('/:userId/analytics/interactions/:type', async (req, res) => {
    try {
      const { userId, type } = req.params;
      const { limit = 50 } = req.query;

      console.log(`Fetching ${type} interactions for user: ${userId}`);

      const analyticsRef = db.collection('Users').doc(userId).collection('Analytics');
      const snapshot = await analyticsRef.get();

      if (snapshot.empty) {
        return res.json({
          success: true,
          data: {
            userId,
            interactionType: type,
            totalCount: 0,
            totalSessions: 0,
            sessions: []
          }
        });
      }

      const filteredSessions = [];
      let totalCount = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        
        if (data.interactions && 
            typeof data.interactions === 'object' && 
            data.interactions[type] && 
            data.interactions[type] > 0) {
          
          filteredSessions.push({
            id: doc.id,
            sessionId: data.sessionId || doc.id.split('_session_')[1]?.split('_')[0],
            startTime: data.sessionStartTime || data.startTimestamp,
            duration: data.duration || 0,
            [type]: data.interactions[type],
            totalInteractions: data.interactions.totalClicks || 0,
            engagementScore: data.engagementScore || 0,
            ref: data.ref,
            pageViews: data.pageViews || 0
          });
          totalCount += data.interactions[type];
        }
      });

      // Sort by interaction count (descending)
      filteredSessions.sort((a, b) => b[type] - a[type]);

      console.log(`Found ${filteredSessions.length} sessions with ${type} interactions`);

      res.json({
        success: true,
        data: {
          userId,
          interactionType: type,
          totalCount,
          totalSessions: filteredSessions.length,
          sessions: filteredSessions.slice(0, parseInt(limit))
        }
      });

    } catch (error) {
      console.error('Error fetching interaction analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch interaction analytics',
        error: error.message
      });
    }
  });

  // Get chatbot analytics specifically
  router.get('/:userId/analytics/chatbot', async (req, res) => {
    try {
      const { userId } = req.params;
      const { timeframe = '30d' } = req.query;

      console.log(`Fetching chatbot analytics for user: ${userId}, timeframe: ${timeframe}`);

      const analyticsRef = db.collection('Users').doc(userId).collection('Analytics');
      const snapshot = await analyticsRef.get();

      if (snapshot.empty) {
        return res.json({
          success: true,
          data: {
            userId,
            timeframe,
            summary: {
              totalSessions: 0,
              totalChatTime: 0,
              totalMessages: 0,
              totalSessionsOpened: 0,
              avgChatTime: 0,
              avgMessages: 0,
              uniqueTopics: 0,
              topicsDiscussed: []
            },
            sessions: []
          }
        });
      }

      const chatbotSessions = [];
      let totalChatTime = 0;
      let totalMessages = 0;
      let totalSessionsOpened = 0;
      const topicsDiscussed = new Set();

      snapshot.forEach(doc => {
        const data = doc.data();
        
        if (data.chatbot && 
            typeof data.chatbot === 'object' && 
            (data.chatbot.sessionsOpened > 0 || data.chatbot.totalMessages > 0)) {
          
          const session = {
            id: doc.id,
            sessionId: data.sessionId || doc.id.split('_session_')[1]?.split('_')[0],
            startTime: data.sessionStartTime || data.startTimestamp,
            duration: data.duration || 0,
            chatTime: data.chatbot.totalChatTime || 0,
            messages: data.chatbot.totalMessages || 0,
            sessionsOpened: data.chatbot.sessionsOpened || 0,
            topics: data.chatbot.topicsDiscussed || [],
            engagementScore: data.engagementScore || 0,
            ref: data.ref
          };

          chatbotSessions.push(session);
          totalChatTime += session.chatTime;
          totalMessages += session.messages;
          totalSessionsOpened += session.sessionsOpened;

          // Collect unique topics
          if (session.topics && Array.isArray(session.topics)) {
            session.topics.forEach(topic => {
              if (topic && typeof topic === 'string') {
                topicsDiscussed.add(topic);
              }
            });
          }
        }
      });

      const avgChatTime = chatbotSessions.length > 0 ? 
        Math.round(totalChatTime / chatbotSessions.length) : 0;
      
      const avgMessages = chatbotSessions.length > 0 ? 
        Math.round(totalMessages / chatbotSessions.length) : 0;

      console.log(`Found ${chatbotSessions.length} chatbot sessions`);

      res.json({
        success: true,
        data: {
          userId,
          timeframe,
          summary: {
            totalSessions: chatbotSessions.length,
            totalChatTime,
            totalMessages,
            totalSessionsOpened,
            avgChatTime,
            avgMessages,
            uniqueTopics: topicsDiscussed.size,
            topicsDiscussed: Array.from(topicsDiscussed)
          },
          sessions: chatbotSessions.slice(0, 50)
        }
      });

    } catch (error) {
      console.error('Error fetching chatbot analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chatbot analytics',
        error: error.message
      });
    }
  });

  // Delete old analytics data (admin function)
  router.delete('/:userId/analytics/cleanup', async (req, res) => {
    try {
      const { userId } = req.params;
      const { beforeTimestamp, keepSummaries = true } = req.query;

      if (!beforeTimestamp) {
        return res.status(400).json({
          success: false,
          message: 'beforeTimestamp parameter is required (Unix timestamp in seconds)'
        });
      }

      console.log(`Cleaning up analytics data for user: ${userId} before timestamp: ${beforeTimestamp}`);

      const analyticsRef = db.collection('Users').doc(userId).collection('Analytics');
      const snapshot = await analyticsRef.get();

      if (snapshot.empty) {
        return res.json({
          success: true,
          message: 'No analytics documents found to cleanup',
          deletedCount: 0
        });
      }

      const batch = db.batch();
      let deleteCount = 0;
      const beforeTime = parseInt(beforeTimestamp);

      snapshot.forEach(doc => {
        const data = doc.data();
        const docTime = data.timestamp || data.sessionStartTime || data.startTimestamp || data.hourStart;
        
        // Skip if it's a summary document and we want to keep summaries
        if (keepSummaries === 'true' && doc.id.includes('_summary')) {
          console.log(`Keeping summary document: ${doc.id}`);
          return;
        }

        if (docTime && docTime < beforeTime) {
          console.log(`Marking for deletion: ${doc.id} (timestamp: ${docTime})`);
          batch.delete(doc.ref);
          deleteCount++;
        }
      });

      if (deleteCount > 0) {
        await batch.commit();
        console.log(`Deleted ${deleteCount} analytics documents for user ${userId}`);
      } else {
        console.log('No documents matched cleanup criteria');
      }

      res.json({
        success: true,
        message: `Successfully processed cleanup - ${deleteCount} documents deleted`,
        deletedCount,
        beforeTimestamp: beforeTime,
        totalDocuments: snapshot.size
      });

    } catch (error) {
      console.error('Error cleaning up analytics data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cleanup analytics data',
        error: error.message
      });
    }
  });

  // Debug endpoint to inspect document structure
  router.get('/:userId/analytics/debug', async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 5 } = req.query;
      
      console.log(`Debug: Inspecting analytics structure for user: ${userId}`);
      
      const analyticsRef = db.collection('Users').doc(userId).collection('Analytics');
      const snapshot = await analyticsRef.limit(parseInt(limit)).get();
      
      if (snapshot.empty) {
        return res.json({
          success: true,
          message: 'No analytics documents found',
          documents: []
        });
      }

      const documents = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        documents.push({
          id: doc.id,
          keys: Object.keys(data),
          sampleData: {
            timestamp: data.timestamp,
            sessionStartTime: data.sessionStartTime,
            startTimestamp: data.startTimestamp,
            interactions: data.interactions ? Object.keys(data.interactions) : null,
            chatbot: data.chatbot ? Object.keys(data.chatbot) : null,
            hasEventLog: !!data.eventLog,
            dataSize: JSON.stringify(data).length
          }
        });
      });

      res.json({
        success: true,
        userId,
        totalDocuments: snapshot.size,
        documents
      });

    } catch (error) {
      console.error('Error in debug endpoint:', error);
      res.status(500).json({
        success: false,
        message: 'Debug endpoint failed',
        error: error.message
      });
    }
  });

  // UPDATED: Get user's social media refs - moved to settings pattern
  router.get('/:userId/settings/refs', async (req, res) => {
    try {
      const { userId } = req.params;

      console.log(`Fetching refs for user: ${userId}`);

      const refsRef = db.collection('Users').doc(userId).collection('settings').doc('refs');
      const doc = await refsRef.get();

      if (!doc.exists) {
        return res.json({
          success: true,
          data: {
            userId,
            refs: {},
            totalRefs: 0
          }
        });
      }

      const refsData = doc.data();
      console.log(`Found refs data for user: ${userId}`);

      res.json({
        success: true,
        data: {
          userId,
          refs: refsData,
          totalRefs: Object.keys(refsData || {}).length,
          lastUpdated: refsData.lastUpdated || null
        }
      });

    } catch (error) {
      console.error('Error fetching refs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch refs',
        error: error.message
      });
    }
  });

  // UPDATED: Create or update user's social media refs - moved to settings pattern
  router.post('/:userId/settings/refs', async (req, res) => {
    try {
      const { userId } = req.params;
      const refsData = req.body;

      console.log(`Updating refs for user: ${userId}`);

      // Validate that the request body contains ref data
      if (!refsData || typeof refsData !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Invalid refs data provided'
        });
      }

      // Add timestamp for tracking updates
      const updatedRefsData = {
        ...refsData,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: Date.now()
      };

      const refsRef = db.collection('Users').doc(userId).collection('settings').doc('refs');
      
      // Use merge: true to update existing fields and add new ones
      await refsRef.set(updatedRefsData, { merge: true });

      console.log(`Successfully updated refs for user: ${userId}`);

      res.json({
        success: true,
        message: 'Refs updated successfully',
        data: {
          userId,
          updatedRefs: Object.keys(refsData),
          totalRefs: Object.keys(refsData).length
        }
      });

    } catch (error) {
      console.error('Error updating refs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update refs',
        error: error.message
      });
    }
  });

  // Update specific ref field
  router.put('/:userId/settings/refs/:refName', async (req, res) => {
    try {
      const { userId, refName } = req.params;
      const { value } = req.body;

      console.log(`Updating ref ${refName} for user: ${userId}`);

      if (value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Value is required'
        });
      }

      const refsRef = db.collection('Users').doc(userId).collection('settings').doc('refs');
      
      const updateData = {
        [refName]: value,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: Date.now()
      };

      await refsRef.set(updateData, { merge: true });

      console.log(`Successfully updated ref ${refName} for user: ${userId}`);

      res.json({
        success: true,
        message: `Ref ${refName} updated successfully`,
        data: {
          userId,
          refName,
          value,
          updatedAt: Date.now()
        }
      });

    } catch (error) {
      console.error('Error updating specific ref:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update ref',
        error: error.message
      });
    }
  });

  // Delete specific ref field
  router.delete('/:userId/settings/refs/:refName', async (req, res) => {
    try {
      const { userId, refName } = req.params;

      console.log(`Deleting ref ${refName} for user: ${userId}`);

      const refsRef = db.collection('Users').doc(userId).collection('settings').doc('refs');
      
      const updateData = {
        [refName]: admin.firestore.FieldValue.delete(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: Date.now()
      };

      await refsRef.update(updateData);

      console.log(`Successfully deleted ref ${refName} for user: ${userId}`);

      res.json({
        success: true,
        message: `Ref ${refName} deleted successfully`,
        data: {
          userId,
          deletedRef: refName,
          deletedAt: Date.now()
        }
      });

    } catch (error) {
      console.error('Error deleting specific ref:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete ref',
        error: error.message
      });
    }
  });

  // Get analytics summary with ref tracking
  router.get('/:userId/settings/refs/summary', async (req, res) => {
    try {
      const { userId } = req.params;
      const { timeframe = '30d' } = req.query;

      console.log(`Fetching ref summary for user: ${userId}, timeframe: ${timeframe}`);

      // Get the refs configuration
      const refsRef = db.collection('Users').doc(userId).collection('settings').doc('refs');
      const refsDoc = await refsRef.get();
      
      const refs = refsDoc.exists ? refsDoc.data() : {};
      
      // Get analytics data to see which refs are being used
      const analyticsRef = db.collection('Users').doc(userId).collection('Analytics');
      const snapshot = await analyticsRef.get();
      
      const refStats = {};
      let totalSessions = 0;
      
      // Initialize ref stats
      Object.keys(refs).forEach(refName => {
        if (refName !== 'lastUpdated' && refName !== 'updatedAt') {
          refStats[refName] = {
            value: refs[refName],
            sessions: 0,
            clicks: 0,
            lastSeen: null
          };
        }
      });

      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.ref && doc.id.includes('_session_')) {
          totalSessions++;
          
          // Track ref usage
          Object.keys(refStats).forEach(refName => {
            if (data.ref && data.ref.toLowerCase().includes(refName.toLowerCase())) {
              refStats[refName].sessions++;
              
              // Track clicks if available
              if (data.interactions && data.interactions.linkClicks) {
                refStats[refName].clicks += data.interactions.linkClicks;
              }
              
              // Update last seen timestamp
              const sessionTime = data.sessionStartTime || data.startTimestamp || data.timestamp;
              if (sessionTime && (!refStats[refName].lastSeen || sessionTime > refStats[refName].lastSeen)) {
                refStats[refName].lastSeen = sessionTime;
              }
            }
          });
        }
      });

      console.log(`Found ${totalSessions} total sessions, ref stats:`, refStats);

      res.json({
        success: true,
        data: {
          userId,
          timeframe,
          totalSessions,
          totalRefs: Object.keys(refStats).length,
          refStats,
          summary: {
            mostUsedRef: Object.entries(refStats).reduce((max, [name, stats]) => 
              stats.sessions > (refStats[max]?.sessions || 0) ? name : max, null),
            totalRefSessions: Object.values(refStats).reduce((sum, stats) => sum + stats.sessions, 0),
            totalRefClicks: Object.values(refStats).reduce((sum, stats) => sum + stats.clicks, 0)
          }
        }
      });

    } catch (error) {
      console.error('Error fetching ref summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ref summary',
        error: error.message
      });
    }
  });

  return router;
};