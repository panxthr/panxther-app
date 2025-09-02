// routes/newsletterRoutes.js
const nodemailer = require('nodemailer');

module.exports = (db, admin) => {
  const express = require('express');
  const router = express.Router();

  // Create reusable transporter object using the default SMTP transport
  const createTransporter = () => {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS  // Your Gmail App Password
      }
    });
  };

  // Alternative configuration for other email providers
  const createCustomTransporter = () => {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  };

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

  // Updated helper function to send email using Nodemailer
  const sendEmail = async (to, subject, htmlContent, senderName, senderEmail) => {
    try {
      // Validate environment variables
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
      }

      const transporter = createTransporter();

      console.log("Sending email to ", to);

      // Verify SMTP connection configuration
      await transporter.verify();

      const mailOptions = {
        from: {
          name: senderName,
          address: process.env.EMAIL_USER // Always use the authenticated email as sender
        },
        to: to,
        subject: subject,
        html: htmlContent,
        replyTo: senderEmail, // Allow replies to go to the newsletter owner's email
        headers: {
          'X-Mailer': 'Newsletter Service',
          'X-Priority': '3'
        }
      };

      console.log(`Sending email to: ${to} via Nodemailer`);
      
      const result = await transporter.sendMail(mailOptions);
      
      console.log(`Email sent successfully to ${to}. Message ID: ${result.messageId}`);
      return true;

    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error.message);
      
      // Log specific error types for debugging
      if (error.code === 'EAUTH') {
        console.error('Authentication failed. Check your email credentials.');
      } else if (error.code === 'ECONNECTION') {
        console.error('Connection failed. Check your internet connection and SMTP settings.');
      } else if (error.responseCode === 550) {
        console.error('Email rejected by recipient server. The email address may be invalid.');
      }
      
      return false;
    }
  };

  // Test email configuration endpoint
  router.post('/:userId/test-email-config', async (req, res) => {
    const { userId } = req.params;
    const { testEmail } = req.body;

    try {
      if (!testEmail || !testEmail.includes('@')) {
        return res.status(400).json({
          success: false,
          message: 'Valid test email address is required'
        });
      }

      console.log(`Testing email configuration for user: ${userId}`);

      const testSubject = 'Newsletter System - Configuration Test';
      const testContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Email Configuration Test</h2>
          <p>This is a test email to verify that your newsletter email configuration is working correctly.</p>
          <p><strong>Test successful!</strong> Your newsletter system is ready to send emails.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">This test was initiated from your newsletter dashboard.</p>
        </div>
      `;

      const success = await sendEmail(
        testEmail,
        testSubject,
        testContent,
        'Newsletter System',
        testEmail
      );

      if (success) {
        res.json({
          success: true,
          message: `Test email sent successfully to ${testEmail}`
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send test email. Please check your email configuration.'
        });
      }

    } catch (error) {
      console.error(`Error testing email config for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to test email configuration',
        error: error.message
      });
    }
  });

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
            @media only screen and (max-width: 600px) {
                .container {
                    width: 100% !important;
                    margin: 0 !important;
                }
                .header, .content {
                    padding: 20px !important;
                }
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
      
      // Send emails in smaller batches to avoid rate limits
      const batchSize = 10; // Reduced batch size for Gmail
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
        
        // Longer delay between batches to respect Gmail rate limits
        if (i + batchSize < recipients.length) {
          console.log(`Batch ${Math.floor(i/batchSize) + 1} completed. Waiting before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
        }
      }

      // Record newsletter send in database
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