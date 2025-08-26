// routes/newsletterRoutes.js
module.exports = (db, admin) => {
  const express = require('express');
  const router = express.Router();

  // Helper function to validate newsletter configuration
  const validateNewsletterConfig = (config) => {
    const errors = [];
    
    if (!config.settings) {
      errors.push('Newsletter settings are required');
    } else {
      if (!config.settings.senderName || config.settings.senderName.trim().length === 0) {
        errors.push('Sender name is required');
      }
      if (!config.settings.senderEmail || !config.settings.senderEmail.includes('@')) {
        errors.push('Valid sender email is required');
      }
    }
    
    if (!config.content || config.content.trim().length === 0) {
      errors.push('Newsletter content is required');
    }
    
    return errors;
  };

  // Helper function to send email (mock implementation - replace with real email service)
  const sendEmail = async (to, subject, htmlContent, senderName, senderEmail) => {
    // In production, integrate with email services like:
    // - SendGrid
    // - Mailchimp
    // - AWS SES
    // - Nodemailer with SMTP
    
    console.log(`Mock sending email to: ${to}`);
    console.log(`From: ${senderName} <${senderEmail}>`);
    console.log(`Subject: ${subject}`);
    console.log(`Content length: ${htmlContent.length} characters`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mock success rate (in production, this would be real email delivery)
    return Math.random() > 0.05; // 95% success rate
  };

  // Helper function to generate newsletter HTML template
  const generateNewsletterHTML = (config, theme) => {
    const themeColors = theme || {
      primary: '#2563eb',
      secondary: '#f8fafc',
      text: '#1e293b',
      accent: '#3b82f6'
    };

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Newsletter</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 0;
                background-color: #f5f5f5;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: ${themeColors.secondary};
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                background-color: ${themeColors.primary};
                color: white;
                padding: 30px;
                text-align: left;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .header p {
                margin: 5px 0 0 0;
                opacity: 0.9;
                font-size: 14px;
            }
            .content {
                padding: 30px;
                color: ${themeColors.text};
            }
            .content h1 {
                color: ${themeColors.primary};
                font-size: 28px;
                margin-top: 0;
            }
            .content h2 {
                color: ${themeColors.primary};
                font-size: 22px;
            }
            .content h3 {
                color: ${themeColors.primary};
                font-size: 18px;
            }
            .content p {
                margin-bottom: 16px;
            }
            .content ul, .content ol {
                margin-bottom: 16px;
                padding-left: 30px;
            }
            .content li {
                margin-bottom: 8px;
            }
            .tag-message {
                background-color: ${themeColors.accent}20;
                color: ${themeColors.accent};
                padding: 20px;
                border-radius: 8px;
                margin-top: 30px;
                font-size: 14px;
            }
            .footer {
                background-color: #f8f9fa;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #6c757d;
                border-top: 1px solid #e9ecef;
            }
            .footer p {
                margin: 5px 0;
            }
            .unsubscribe {
                color: ${themeColors.accent};
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${config.settings.senderName}</h1>
                <p>${config.settings.senderEmail}</p>
            </div>
            
            <div class="content">
                ${config.content}
                
                ${config.settings.tagMessage ? `
                <div class="tag-message">
                    ${config.settings.tagMessage}
                </div>
                ` : ''}
            </div>
            
            <div class="footer">
                <p>© ${new Date().getFullYear()} ${config.settings.senderName}. All rights reserved.</p>
                <p>You received this email because you are registered with our service.</p>
                <p>
                    <a href="#" class="unsubscribe">Unsubscribe</a> | 
                    <a href="#" class="unsubscribe">Update Preferences</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  };

  // GET newsletter configuration for a specific user
  router.get('/:userId/newsletter-config', async (req, res) => {
    const { userId } = req.params;

    try {
      console.log(`Fetching newsletter config for user: ${userId}`);
      
      const configDoc = await db.collection('Users').doc(userId).collection('Newsletter').doc('config').get();
      
      if (!configDoc.exists) {
        return res.json({
          success: true,
          config: null,
          message: 'No newsletter configuration found'
        });
      }
      
      const configData = configDoc.data();
      console.log(`Retrieved newsletter config for user: ${userId}`);
      
      res.json({
        success: true,
        config: {
          ...configData,
          createdAt: configData.createdAt?.toDate?.()?.toISOString() || configData.createdAt,
          updatedAt: configData.updatedAt?.toDate?.()?.toISOString() || configData.updatedAt
        }
      });
      
    } catch (error) {
      console.error(`Error fetching newsletter config for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch newsletter configuration',
        error: error.message
      });
    }
  });

  // POST/PUT save newsletter configuration
  router.post('/:userId/newsletter-config', async (req, res) => {
    const { userId } = req.params;
    const configData = req.body;

    try {
      console.log(`Saving newsletter config for user: ${userId}`);
      
      // Validate configuration
      const validationErrors = validateNewsletterConfig(configData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      // Prepare config document
      const now = admin.firestore.Timestamp.now();
      const configDoc = await db.collection('Users').doc(userId).collection('Newsletter').doc('config').get();
      
      const newsletterConfig = {
        settings: {
          senderName: configData.settings.senderName.trim(),
          senderEmail: configData.settings.senderEmail.trim(),
          profilePicture: configData.settings.profilePicture || '',
          tagMessage: configData.settings.tagMessage || ''
        },
        content: configData.content.trim(),
        subscribers: Array.isArray(configData.subscribers) ? configData.subscribers : [],
        theme: configData.theme || 'classic',
        updatedAt: now,
        ...(configDoc.exists ? {} : { createdAt: now })
      };

      // Save to Firestore
      await db.collection('Users').doc(userId).collection('Newsletter').doc('config').set(newsletterConfig, { merge: true });
      
      console.log(`Newsletter config saved for user: ${userId}`);
      
      res.json({
        success: true,
        message: 'Newsletter configuration saved successfully',
        config: {
          ...newsletterConfig,
          createdAt: newsletterConfig.createdAt?.toDate?.()?.toISOString(),
          updatedAt: newsletterConfig.updatedAt?.toDate?.()?.toISOString()
        }
      });
      
    } catch (error) {
      console.error(`Error saving newsletter config for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to save newsletter configuration',
        error: error.message
      });
    }
  });

  // POST send newsletter to all registered users
  router.post('/:userId/send-newsletter', async (req, res) => {
    const { userId } = req.params;
    const { subject = 'Newsletter', testMode = false, selectedTheme } = req.body;

    try {
      console.log(`Sending newsletter for user: ${userId}, testMode: ${testMode}`);
      
      // Get newsletter configuration
      const configDoc = await db.collection('Users').doc(userId).collection('Newsletter').doc('config').get();
      
      if (!configDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Newsletter configuration not found. Please save your configuration first.'
        });
      }
      
      const config = configDoc.data();
      
      // Validate configuration before sending
      const validationErrors = validateNewsletterConfig(config);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Newsletter configuration is invalid',
          errors: validationErrors
        });
      }

      let recipients = [];
      
      if (testMode) {
        // In test mode, only send to the newsletter's configured subscribers
        recipients = config.subscribers
          .filter(sub => sub.email && sub.email.includes('@') && sub.name)
          .map(sub => ({
            email: sub.email,
            name: sub.name
          }));
      } else {
        // Get all registered users from the database
        console.log('Fetching all registered users...');
        const usersSnapshot = await db.collection('Users').get();
        
        if (usersSnapshot.empty) {
          return res.status(404).json({
            success: false,
            message: 'No registered users found to send newsletter to'
          });
        }
        
        // Extract email addresses from all users
        recipients = [];
        usersSnapshot.forEach(userDoc => {
          const userData = userDoc.data();
          if (userData.profile && userData.profile.email && userData.profile.email.includes('@')) {
            recipients.push({
              email: userData.profile.email,
              name: userData.profile.name || userData.profile.firstName || 'Valued Customer'
            });
          }
        });
      }

      if (recipients.length === 0) {
        return res.status(400).json({
          success: false,
          message: testMode 
            ? 'No valid subscribers found in your newsletter configuration' 
            : 'No registered users with valid email addresses found'
        });
      }

      // Define theme colors
      const themes = {
        classic: { primary: '#2563eb', secondary: '#f8fafc', text: '#1e293b', accent: '#3b82f6' },
        modern: { primary: '#7c3aed', secondary: '#faf5ff', text: '#374151', accent: '#8b5cf6' },
        corporate: { primary: '#1f2937', secondary: '#f9fafb', text: '#111827', accent: '#4b5563' },
        vibrant: { primary: '#dc2626', secondary: '#fef2f2', text: '#1f2937', accent: '#ef4444' }
      };

      const themeColors = themes[selectedTheme || config.theme] || themes.classic;
      
      // Generate newsletter HTML
      const newsletterHTML = generateNewsletterHTML(config, themeColors);
      
      // Send emails
      const emailResults = {
        total: recipients.length,
        sent: 0,
        failed: 0,
        errors: []
      };

      console.log(`Sending newsletter to ${recipients.length} recipients...`);
      
      // Send emails in batches to avoid overwhelming the email service
      const batchSize = 50;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (recipient) => {
          try {
            const personalizedHTML = newsletterHTML.replace(
              /\{recipientName\}/g, 
              recipient.name
            );
            
            const success = await sendEmail(
              recipient.email,
              subject,
              personalizedHTML,
              config.settings.senderName,
              config.settings.senderEmail
            );
            
            if (success) {
              emailResults.sent++;
            } else {
              emailResults.failed++;
              emailResults.errors.push(`Failed to send to ${recipient.email}`);
            }
          } catch (error) {
            emailResults.failed++;
            emailResults.errors.push(`Error sending to ${recipient.email}: ${error.message}`);
          }
        });
        
        await Promise.all(batchPromises);
        
        // Small delay between batches
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Record newsletter send in database
      // Fixed: Use 'NewsletterSends' collection instead of nested collection
      const sendRecord = {
        userId,
        subject,
        sentAt: admin.firestore.Timestamp.now(),
        recipients: emailResults.total,
        successful: emailResults.sent,
        failed: emailResults.failed,
        testMode,
        theme: selectedTheme || config.theme,
        contentPreview: config.content.substring(0, 200) + '...'
      };

      const sendDocRef = await db.collection('NewsletterSends').add(sendRecord);
      
      console.log(`Newsletter send completed. Success: ${emailResults.sent}, Failed: ${emailResults.failed}`);
      
      res.json({
        success: true,
        message: `Newsletter sent successfully to ${emailResults.sent} out of ${emailResults.total} recipients`,
        results: emailResults,
        sendId: sendDocRef.id
      });
      
    } catch (error) {
      console.error(`Error sending newsletter for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to send newsletter',
        error: error.message
      });
    }
  });

  // GET newsletter send history
  router.get('/:userId/newsletter-history', async (req, res) => {
    const { userId } = req.params;
    const { limit = 10, orderBy = 'sentAt', order = 'desc' } = req.query;

    try {
      console.log(`Fetching newsletter history for user: ${userId}`);
      
      // Fixed: Query from 'NewsletterSends' collection and filter by userId
      let query = db.collection('NewsletterSends').where('userId', '==', userId);
      
      // Apply ordering and limit
      query = query.orderBy(orderBy, order).limit(parseInt(limit));
      
      const sendsSnapshot = await query.get();
      
      if (sendsSnapshot.empty) {
        return res.json({
          success: true,
          history: [],
          count: 0,
          message: 'No newsletter send history found'
        });
      }
      
      const history = [];
      sendsSnapshot.forEach(doc => {
        const sendData = doc.data();
        history.push({
          id: doc.id,
          ...sendData,
          sentAt: sendData.sentAt?.toDate?.()?.toISOString() || sendData.sentAt
        });
      });
      
      console.log(`Retrieved ${history.length} newsletter send records for user: ${userId}`);
      
      res.json({
        success: true,
        history,
        count: history.length
      });
      
    } catch (error) {
      console.error(`Error fetching newsletter history for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch newsletter history',
        error: error.message
      });
    }
  });

  // GET newsletter statistics
  router.get('/:userId/newsletter-stats', async (req, res) => {
    const { userId } = req.params;

    try {
      console.log(`Fetching newsletter statistics for user: ${userId}`);
      
      // Get configuration
      const configDoc = await db.collection('Users').doc(userId).collection('Newsletter').doc('config').get();
      const config = configDoc.exists ? configDoc.data() : null;
      
      // Get send history from NewsletterSends collection
      const sendsSnapshot = await db.collection('NewsletterSends').where('userId', '==', userId).get();
      
      let totalSends = 0;
      let totalRecipients = 0;
      let totalSuccessful = 0;
      let totalFailed = 0;
      let lastSent = null;
      
      if (!sendsSnapshot.empty) {
        sendsSnapshot.forEach(doc => {
          const data = doc.data();
          totalSends++;
          totalRecipients += data.recipients || 0;
          totalSuccessful += data.successful || 0;
          totalFailed += data.failed || 0;
          
          const sentAt = data.sentAt?.toDate?.() || new Date(data.sentAt);
          if (!lastSent || sentAt > lastSent) {
            lastSent = sentAt;
          }
        });
      }
      
      const stats = {
        configurationExists: configDoc.exists,
        subscribersCount: config?.subscribers?.length || 0,
        totalSends,
        totalRecipients,
        totalSuccessful,
        totalFailed,
        successRate: totalRecipients > 0 ? Math.round((totalSuccessful / totalRecipients) * 100) : 0,
        lastSent: lastSent?.toISOString() || null,
        currentTheme: config?.theme || null
      };
      
      console.log(`Newsletter stats for user ${userId}:`, stats);
      
      res.json({
        success: true,
        stats
      });
      
    } catch (error) {
      console.error(`Error fetching newsletter stats for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch newsletter statistics',
        error: error.message
      });
    }
  });

  // DELETE newsletter configuration
  router.delete('/:userId/newsletter-config', async (req, res) => {
    const { userId } = req.params;

    try {
      console.log(`Deleting newsletter config for user: ${userId}`);
      
      const configRef = db.collection('Users').doc(userId).collection('Newsletter').doc('config');
      const configDoc = await configRef.get();
      
      if (!configDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Newsletter configuration not found'
        });
      }
      
      await configRef.delete();
      
      console.log(`Newsletter config deleted for user: ${userId}`);
      
      res.json({
        success: true,
        message: 'Newsletter configuration deleted successfully'
      });
      
    } catch (error) {
      console.error(`Error deleting newsletter config for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete newsletter configuration',
        error: error.message
      });
    }
  });

  return router;
};