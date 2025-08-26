const express = require('express');
const router = express.Router();

// Helper function to convert timestamps
const convertTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate().toISOString();
  if (timestamp._seconds) return new Date(timestamp._seconds * 1000).toISOString();
  return timestamp;
};

// Validate chatbot configuration data
const validateChatbotConfig = (config) => {
  const errors = [];
  
  if (!config) {
    errors.push('Configuration data is required');
    return errors;
  }

  // Validate user info
  if (!config.userInfo || typeof config.userInfo !== 'object') {
    errors.push('User info is required and must be an object');
  } else {
    const requiredFields = ['businessName', 'businessType', 'description'];
    requiredFields.forEach(field => {
      if (!config.userInfo[field] || typeof config.userInfo[field] !== 'string') {
        errors.push(`userInfo.${field} is required and must be a string`);
      }
    });
  }

  // Validate FAQs
  if (config.faqs && Array.isArray(config.faqs)) {
    config.faqs.forEach((faq, index) => {
      if (!faq.question || typeof faq.question !== 'string') {
        errors.push(`FAQ ${index + 1}: question is required and must be a string`);
      }
      if (!faq.answer || typeof faq.answer !== 'string') {
        errors.push(`FAQ ${index + 1}: answer is required and must be a string`);
      }
    });
  }

  // Validate wiki entries
  if (config.wikiEntries && Array.isArray(config.wikiEntries)) {
    config.wikiEntries.forEach((entry, index) => {
      if (!entry.title || typeof entry.title !== 'string') {
        errors.push(`Wiki entry ${index + 1}: title is required and must be a string`);
      }
      if (!entry.content || typeof entry.content !== 'string') {
        errors.push(`Wiki entry ${index + 1}: content is required and must be a string`);
      }
    });
  }

  return errors;
};

module.exports = (db, admin) => {
  
  // POST endpoint to save chatbot configuration
  router.post('/:id/chatbot-config', async (req, res) => {
    try {
      const { id } = req.params;
      const config = req.body;
      
      console.log(`Saving chatbot config for user: ${id}`);
      
      // Validate configuration data
      const validationErrors = validateChatbotConfig(config);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      // Check if user exists
      const userDocRef = db.collection('Users').doc(id);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prepare configuration data with timestamps
      const configData = {
        enabled: Boolean(config.enabled),
        selectedMode: config.selectedMode || 'FAQ',
        userInfo: {
          businessName: config.userInfo.businessName,
          businessType: config.userInfo.businessType,
          description: config.userInfo.description,
          primaryServices: config.userInfo.primaryServices || '',
          targetAudience: config.userInfo.targetAudience || '',
          uniqueSellingPoints: config.userInfo.uniqueSellingPoints || ''
        },
        faqs: (config.faqs || []).map(faq => ({
          id: faq.id || Date.now(),
          question: faq.question,
          answer: faq.answer,
          onboardedOnly: Boolean(faq.onboardedOnly)
        })),
        wikiEntries: (config.wikiEntries || []).map(entry => ({
          id: entry.id || Date.now(),
          title: entry.title,
          content: entry.content,
          tags: Array.isArray(entry.tags) ? entry.tags : [],
          onboardedOnly: Boolean(entry.onboardedOnly)
        })),
        behaviorFlow: (config.behaviorFlow || []).map(rule => ({
          id: rule.id || Date.now(),
          trigger: rule.trigger || '',
          condition: rule.condition || '',
          response: rule.response || '',
          nextActions: Array.isArray(rule.nextActions) ? rule.nextActions : []
        })),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        version: '1.0'
      };

      // Save configuration to Firestore
      const configDocRef = db.collection('Users').doc(id).collection('chatbot').doc('config');
      await configDocRef.set(configData);

      console.log(`Chatbot config saved successfully for user: ${id}`);

      res.json({
        success: true,
        message: 'Chatbot configuration saved successfully',
        configId: 'config',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error saving chatbot config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save chatbot configuration',
        error: error.message
      });
    }
  });

  // GET endpoint to retrieve chatbot configuration
  router.get('/:id/chatbot-config', async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`Fetching chatbot config for user: ${id}`);
      
      const configDocRef = db.collection('Users').doc(id).collection('chatbot').doc('config');
      const configDoc = await configDocRef.get();
      
      if (!configDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Chatbot configuration not found'
        });
      }
      
      const configData = configDoc.data();
      
      // Convert timestamps
      const responseData = {
        ...configData,
        createdAt: convertTimestamp(configData.createdAt),
        updatedAt: convertTimestamp(configData.updatedAt)
      };
      
      res.json({
        success: true,
        config: responseData
      });
      
    } catch (error) {
      console.error('Error fetching chatbot config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chatbot configuration',
        error: error.message
      });
    }
  });

  // PUT endpoint to update chatbot configuration
  router.put('/:id/chatbot-config', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      console.log(`Updating chatbot config for user: ${id}`);
      
      // Check if configuration exists
      const configDocRef = db.collection('Users').doc(id).collection('chatbot').doc('config');
      const configDoc = await configDocRef.get();
      
      if (!configDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Chatbot configuration not found'
        });
      }

      // Validate updates
      const validationErrors = validateChatbotConfig(updates);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      // Update configuration
      const updateData = {
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await configDocRef.update(updateData);
      
      console.log(`Chatbot config updated successfully for user: ${id}`);
      
      res.json({
        success: true,
        message: 'Chatbot configuration updated successfully',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error updating chatbot config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update chatbot configuration',
        error: error.message
      });
    }
  });

  // DELETE endpoint to remove chatbot configuration
  router.delete('/:id/chatbot-config', async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`Deleting chatbot config for user: ${id}`);
      
      const configDocRef = db.collection('Users').doc(id).collection('chatbot').doc('config');
      const configDoc = await configDocRef.get();
      
      if (!configDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Chatbot configuration not found'
        });
      }
      
      // Delete configuration document
      await configDocRef.delete();
      
      console.log(`Chatbot config deleted successfully for user: ${id}`);
      
      res.json({
        success: true,
        message: 'Chatbot configuration deleted successfully'
      });
      
    } catch (error) {
      console.error('Error deleting chatbot config:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete chatbot configuration',
        error: error.message
      });
    }
  });

  // GET endpoint to retrieve chatbot configuration stats
  router.get('/:id/chatbot-stats', async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`Fetching chatbot stats for user: ${id}`);
      
      const configDocRef = db.collection('Users').doc(id).collection('chatbot').doc('config');
      const configDoc = await configDocRef.get();
      
      if (!configDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Chatbot configuration not found'
        });
      }
      
      const configData = configDoc.data();
      
      const stats = {
        enabled: configData.enabled || false,
        selectedMode: configData.selectedMode || 'FAQ',
        totalFaqs: (configData.faqs || []).length,
        totalWikiEntries: (configData.wikiEntries || []).length,
        totalBehaviorRules: (configData.behaviorFlow || []).length,
        onboardedOnlyFaqs: (configData.faqs || []).filter(faq => faq.onboardedOnly).length,
        onboardedOnlyWikiEntries: (configData.wikiEntries || []).filter(entry => entry.onboardedOnly).length,
        lastUpdated: convertTimestamp(configData.updatedAt),
        version: configData.version || '1.0'
      };
      
      res.json({
        success: true,
        stats
      });
      
    } catch (error) {
      console.error('Error fetching chatbot stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch chatbot statistics',
        error: error.message
      });
    }
  });

  return router;
};