import React, { useState, useEffect, useRef} from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, orderBy, where, addDoc, serverTimestamp, updateDoc, increment, setDoc } from 'firebase/firestore';
import { db } from './firebase'; // Adjust the import path as needed
import Chatbot from './user-components/Chatbot'; 
import BlogModal from './user-components/BlogModal';


// Enhanced Analytics tracking service with timestamp-based document IDs
class AnalyticsTracker {
  constructor(userId, ref) {
    this.userId = userId;
    this.ref = ref || null; // Optional ref parameter
    this.sessionId = this.generateSessionId();
    
    // Unix timestamps (seconds since epoch)
    this.sessionStartTime = Math.floor(Date.now() / 1000);
    this.currentHourTimestamp = Math.floor(this.sessionStartTime / 3600) * 3600; // Round to nearest hour
    
    // Track processed events within this session to prevent duplicates
    this.sessionProcessedEvents = new Set();
    this.lastSaveTime = 0;
    this.saveThrottleMs = 10000; // Minimum 10 seconds between major saves
    
    // Session tracking data
    this.sessionData = {
      ref: this.ref,
      sessionId: this.sessionId,
      startTimestamp: this.sessionStartTime,
      hourTimestamp: this.currentHourTimestamp,
      endTimestamp: null,
      duration: 0,
      
      // Interactivity metrics
      scrollDepth: {
        maxPercentage: 0,
        totalScrollEvents: 0,
        timeSpentScrolling: 0,
        lastScrollTime: 0
      },
      
      // User engagement
      interactions: {
        totalClicks: 0,
        blogViews: 0,
        contactClicks: 0,
        linkClicks: 0,
        chatbotInteractions: 0,
        enquiries: 0
      },
      
      // Section engagement
      sectionViews: {},
      
      // Chatbot specific
      chatbot: {
        sessionsOpened: 0,
        totalMessages: 0,
        totalChatTime: 0,
        topicsDiscussed: []
      },
      
      // Page metrics
      pageViews: 0,
      
      // Device/browser info
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      
      // Individual interaction events for detailed tracking
      eventLog: []
    };
    
    // Interaction tracking
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.chatbotSessionStart = null;
    this.lastActivityTime = this.sessionStartTime;
    
    // Initialize session
    this.initializeSession();
    this.startActivityTracking();
  }

  generateSessionId() {
    const timestamp = Math.floor(Date.now() / 1000);
    const randomStr = Math.random().toString(36).substr(2, 9);
    return `session_${timestamp}_${randomStr}`;
  }

  // Generate event hash for duplicate detection within the same session
  generateSessionEventHash(type, data) {
    const hashData = {
      type,
      sessionId: this.sessionId,
      ...data
    };
    return btoa(JSON.stringify(hashData)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  // Check if event was already processed in this session
  isSessionEventProcessed(eventHash) {
    return this.sessionProcessedEvents.has(eventHash);
  }

  // Mark event as processed in this session
  markSessionEventProcessed(eventHash) {
    this.sessionProcessedEvents.add(eventHash);
  }

  // Throttle saves to prevent too frequent updates
  shouldSave() {
    const currentTime = Date.now();
    if (currentTime - this.lastSaveTime < this.saveThrottleMs) {
      return false;
    }
    this.lastSaveTime = currentTime;
    return true;
  }

  async initializeSession() {
    try {
      console.log('Initializing analytics session:', {
        userId: this.userId,
        sessionId: this.sessionId,
        startTime: this.sessionStartTime,
        hourTimestamp: this.currentHourTimestamp
      });

      // Track page view
      this.sessionData.pageViews = 1;
      this.updateLastActivity();

      // Store initial session data using timestamp + session ID as document ID
      await this.saveSessionData('session_start');
      
    } catch (error) {
      console.error('Error initializing analytics session:', error);
    }
  }

  updateLastActivity() {
    this.lastActivityTime = Math.floor(Date.now() / 1000);
  }

  // Activity tracking to detect user engagement
  startActivityTracking() {
    // Track mouse movements, clicks, keyboard events
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateLastActivity();
        if (event === 'mousedown' || event === 'touchstart') {
          this.sessionData.interactions.totalClicks++;
        }
      }, { passive: true });
    });

    // Periodic session updates every 30 seconds
    this.activityInterval = setInterval(() => {
      this.updateSessionDuration();
      if (this.shouldSave()) {
        this.saveSessionData('session_active');
      }
    }, 30000);

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveSessionData('page_hidden');
      } else {
        this.updateLastActivity();
        this.saveSessionData('page_visible');
      }
    });
  }

  updateSessionDuration() {
    const currentTime = Math.floor(Date.now() / 1000);
    this.sessionData.duration = currentTime - this.sessionStartTime;
  }

  // Add event to session log with deduplication
  addEventToLog(eventType, eventData) {
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Create event hash for deduplication within session
    const eventHash = this.generateSessionEventHash(eventType, {
      ...eventData,
      timestamp: currentTime
    });
    
    // Check if this exact event was already processed in this session
    if (this.isSessionEventProcessed(eventHash)) {
      console.log(`Duplicate ${eventType} event detected in session, skipping`);
      return false;
    }
    
    // Add to event log
    this.sessionData.eventLog.push({
      timestamp: currentTime,
      type: eventType,
      data: eventData,
      eventHash: eventHash
    });
    
    this.markSessionEventProcessed(eventHash);
    return true;
  }

  // Scroll tracking with Unix timestamps
  trackScroll(scrollY, maxScroll) {
    const currentTime = Math.floor(Date.now() / 1000);
    const scrollPercentage = Math.round((scrollY / maxScroll) * 100);
    
    // Only track significant scroll changes (every 10%)
    const significantChange = Math.floor(scrollPercentage / 10) * 10;
    
    const eventAdded = this.addEventToLog('scroll', {
      scrollPercentage: significantChange,
      maxScroll: maxScroll
    });
    
    if (!eventAdded) return; // Skip if duplicate
    
    if (scrollPercentage > this.sessionData.scrollDepth.maxPercentage) {
      this.sessionData.scrollDepth.maxPercentage = scrollPercentage;
    }

    this.sessionData.scrollDepth.totalScrollEvents++;

    if (!this.isScrolling) {
      this.isScrolling = true;
      this.sessionData.scrollDepth.lastScrollTime = currentTime;
    }

    // Debounced scroll end detection
    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      const scrollEndTime = Math.floor(Date.now() / 1000);
      this.sessionData.scrollDepth.timeSpentScrolling += 
        scrollEndTime - this.sessionData.scrollDepth.lastScrollTime;
      this.isScrolling = false;
    }, 150);

    this.updateLastActivity();
  }

  // Section view tracking
  trackSectionView(sectionName, viewDuration) {
    const eventAdded = this.addEventToLog('section_view', {
      sectionName,
      viewDuration
    });
    
    if (!eventAdded) return; // Skip if duplicate
    
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (!this.sessionData.sectionViews[sectionName]) {
      this.sessionData.sectionViews[sectionName] = {
        viewCount: 0,
        totalTime: 0,
        firstViewed: currentTime,
        lastViewed: currentTime
      };
    }

    this.sessionData.sectionViews[sectionName].viewCount++;
    this.sessionData.sectionViews[sectionName].totalTime += viewDuration;
    this.sessionData.sectionViews[sectionName].lastViewed = currentTime;

    this.updateLastActivity();
  }

  // Blog interaction tracking
  async trackBlogInteraction(blogId, action, metadata = {}) {
    const eventAdded = this.addEventToLog('blog_interaction', {
      blogId,
      action,
      metadata
    });
    
    if (!eventAdded) return; // Skip if duplicate
    
    try {
      this.sessionData.interactions.blogViews++;
      this.updateLastActivity();

      console.log('Blog interaction tracked:', { blogId, action, timestamp: Math.floor(Date.now() / 1000) });
    } catch (error) {
      console.error('Error tracking blog interaction:', error);
    }
  }

  // Contact interaction tracking
  async trackContactClick(contactType, value) {
    const eventAdded = this.addEventToLog('contact_interaction', {
      contactType,
      value
    });
    
    if (!eventAdded) return; // Skip if duplicate
    
    try {
      this.sessionData.interactions.contactClicks++;
      this.updateLastActivity();

      console.log('Contact interaction tracked:', { contactType, timestamp: Math.floor(Date.now() / 1000) });
    } catch (error) {
      console.error('Error tracking contact interaction:', error);
    }
  }

  // Link click tracking
  async trackLinkClick(linkType, url, label) {
    const eventAdded = this.addEventToLog('link_interaction', {
      linkType,
      url,
      label
    });
    
    if (!eventAdded) return; // Skip if duplicate
    
    try {
      this.sessionData.interactions.linkClicks++;
      this.updateLastActivity();

      console.log('Link interaction tracked:', { linkType, url, timestamp: Math.floor(Date.now() / 1000) });
    } catch (error) {
      console.error('Error tracking link interaction:', error);
    }
  }

  // Chatbot interaction tracking
  async trackChatbotInteraction(action, metadata = {}) {
    const currentTime = Math.floor(Date.now() / 1000);
    
    const eventAdded = this.addEventToLog('chatbot_interaction', {
      action,
      metadata,
      messageCount: this.sessionData.chatbot.totalMessages
    });
    
    if (!eventAdded) return; // Skip if duplicate
    
    try {
      this.sessionData.interactions.chatbotInteractions++;

      if (action === 'open') {
        this.sessionData.chatbot.sessionsOpened++;
        this.chatbotSessionStart = currentTime;
      } else if (action === 'close' && this.chatbotSessionStart) {
        this.sessionData.chatbot.totalChatTime += currentTime - this.chatbotSessionStart;
        this.chatbotSessionStart = null;
      } else if (action === 'send_message' || action === 'receive_message') {
        this.sessionData.chatbot.totalMessages++;
      }

      this.updateLastActivity();

      console.log('Chatbot interaction tracked:', { action, timestamp: currentTime });
    } catch (error) {
      console.error('Error tracking chatbot interaction:', error);
    }
  }

  // Enquiry tracking
  async trackEnquiry(method, metadata = {}) {
    const eventAdded = this.addEventToLog('enquiry', {
      method,
      metadata
    });
    
    if (!eventAdded) return; // Skip if duplicate
    
    try {
      this.sessionData.interactions.enquiries++;
      this.updateLastActivity();

      console.log('Enquiry tracked:', { method, timestamp: Math.floor(Date.now() / 1000) });
    } catch (error) {
      console.error('Error tracking enquiry:', error);
    }
  }

  // Save session data with timestamp-based document ID
  async saveSessionData(updateType) {
    const currentTime = Math.floor(Date.now() / 1000);
    this.updateSessionDuration();

    try {
      // Create document ID: hourTimestamp_sessionId for uniqueness
      const docId = `${this.currentHourTimestamp}_${this.sessionId}`;
      const sessionRef = doc(db, 'Users', this.userId, 'Analytics', docId);

      const sessionDocument = {
        // Document metadata
        hourTimestamp: this.currentHourTimestamp,
        hourStart: new Date(this.currentHourTimestamp * 1000).toISOString(),
        documentType: 'session_data',
        
        // Session identification
        sessionId: this.sessionId,
        userId: this.userId,
        updateType,
        
        // Timestamps
        timestamp: currentTime,
        sessionStartTime: this.sessionStartTime,
        lastActivity: this.lastActivityTime,
        
        // Complete session data
        ...this.sessionData,
        
        // Calculated metrics
        engagementScore: this.calculateEngagementScore(),
        isActiveSession: (currentTime - this.lastActivityTime) < 300, // Active if activity within 5 minutes
        
        // Firestore timestamps
        lastUpdated: serverTimestamp(),
        created: this.sessionData.endTimestamp ? undefined : serverTimestamp() // Only set on first save
      };

      // Remove created field if this is an update
      if (updateType !== 'session_start') {
        delete sessionDocument.created;
      }

      // Use setDoc with merge to update existing document or create new one
      await setDoc(sessionRef, sessionDocument, { merge: true });
      
      console.log(`Session data saved with timestamp-based ID: ${docId}`, {
        updateType,
        sessionId: this.sessionId,
        duration: this.sessionData.duration,
        timestamp: currentTime,
        totalEvents: this.sessionData.eventLog.length
      });

    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }

  // Calculate engagement score based on interactions
  calculateEngagementScore() {
    const weights = {
      duration: 0.3,
      scrollDepth: 0.2,
      interactions: 0.25,
      sectionViews: 0.15,
      chatbot: 0.1
    };

    let score = 0;

    // Duration score (up to 10 minutes = 100%)
    score += Math.min(this.sessionData.duration / 600, 1) * weights.duration * 100;

    // Scroll depth score
    score += (this.sessionData.scrollDepth.maxPercentage / 100) * weights.scrollDepth * 100;

    // Interactions score
    const totalInteractions = Object.values(this.sessionData.interactions).reduce((a, b) => a + b, 0);
    score += Math.min(totalInteractions / 10, 1) * weights.interactions * 100;

    // Section views score
    const sectionCount = Object.keys(this.sessionData.sectionViews).length;
    score += Math.min(sectionCount / 5, 1) * weights.sectionViews * 100;

    // Chatbot score
    if (this.sessionData.chatbot.totalMessages > 0) {
      score += Math.min(this.sessionData.chatbot.totalMessages / 5, 1) * weights.chatbot * 100;
    }

    return Math.round(score);
  }

  // End session and save final data
  async endSession() {
    const currentTime = Math.floor(Date.now() / 1000);
    this.sessionData.endTimestamp = currentTime;
    this.updateSessionDuration();

    // Clean up intervals
    if (this.activityInterval) {
      clearInterval(this.activityInterval);
    }

    // Final session save
    await this.saveSessionData('session_end');

    // Also create/update hourly summary document
    await this.updateHourlySummary();

    console.log('Analytics session ended:', {
      sessionId: this.sessionId,
      duration: this.sessionData.duration,
      engagementScore: this.calculateEngagementScore(),
      hourTimestamp: this.currentHourTimestamp,
      totalEvents: this.sessionData.eventLog.length
    });
  }

  // Create or update hourly summary document
  async updateHourlySummary() {
    try {
      // Create summary document ID: hourTimestamp_summary
      const summaryDocId = `${this.currentHourTimestamp}_summary`;
      const summaryRef = doc(db, 'Users', this.userId, 'Analytics', summaryDocId);

      const summaryData = {
        hourTimestamp: this.currentHourTimestamp,
        hourStart: new Date(this.currentHourTimestamp * 1000).toISOString(),
        documentType: 'hourly_summary',
        
        // Aggregate metrics (using increment for concurrent updates)
        totalSessions: increment(1),
        totalDuration: increment(this.sessionData.duration),
        totalPageViews: increment(this.sessionData.pageViews),
        totalInteractions: increment(Object.values(this.sessionData.interactions).reduce((a, b) => a + b, 0)),
        totalScrollEvents: increment(this.sessionData.scrollDepth.totalScrollEvents),
        totalChatbotMessages: increment(this.sessionData.chatbot.totalMessages),
        totalChatbotSessions: increment(this.sessionData.chatbot.sessionsOpened),
        
        // Max values (these need special handling)
        lastUpdated: serverTimestamp()
      };

      // For max values, we need to read current document first
      try {
        const currentDoc = await getDoc(summaryRef);
        if (currentDoc.exists()) {
          const currentData = currentDoc.data();
          summaryData.maxScrollDepth = Math.max(
            currentData.maxScrollDepth || 0, 
            this.sessionData.scrollDepth.maxPercentage
          );
          summaryData.maxEngagementScore = Math.max(
            currentData.maxEngagementScore || 0,
            this.calculateEngagementScore()
          );
        } else {
          // First document for this hour
          summaryData.maxScrollDepth = this.sessionData.scrollDepth.maxPercentage;
          summaryData.maxEngagementScore = this.calculateEngagementScore();
          summaryData.created = serverTimestamp();
        }

        await setDoc(summaryRef, summaryData, { merge: true });
        console.log(`Hourly summary updated: ${summaryDocId}`);
        
      } catch (error) {
        // If document doesn't exist, create it
        summaryData.maxScrollDepth = this.sessionData.scrollDepth.maxPercentage;
        summaryData.maxEngagementScore = this.calculateEngagementScore();
        summaryData.created = serverTimestamp();
        
        await setDoc(summaryRef, summaryData, { merge: true });
        console.log(`Hourly summary created: ${summaryDocId}`);
      }

    } catch (error) {
      console.error('Error updating hourly summary:', error);
    }
  }
}

// Rest of the ProfilePage component
const ProfilePage = () => {

  const {search} = useLocation();
  const queryParams = new URLSearchParams(search);

  const ref = queryParams.get('ref') || null;

  const [messages, setMessages] = useState([]);
  const { userId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [chatbotConfig, setChatbotConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataLoadingStatus, setDataLoadingStatus] = useState({
    profile: 'loading',
    blogs: 'loading',
    chatbot: 'loading'
  });
  
  const [showChatbot, setShowChatbot] = useState(false);
  const [showEnquiryEmail, setShowEnquiryEmail] = useState(false);
  
  // Blog carousel state
  const [currentBlogPage, setCurrentBlogPage] = useState(0);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [showBlogModal, setShowBlogModal] = useState(false);
  
  const BLOGS_PER_PAGE = 4;

  // Analytics tracking
  const analyticsRef = useRef(null);
  const sectionRefs = useRef({});
  const intersectionObserverRef = useRef(null);

  const saveChatbotLead = async (email) => {
  try {
    const leadData = {
      ...messages,
      email: email || null,
      createdAt: serverTimestamp(),
      sessionId: analyticsRef.current?.sessionId,
      userId: userId // Add userId to identify which user this lead belongs to
    };

    // Direct collection path with 3 segments (odd number)
    const leadsRef = collection(db, 'Users', userId, 'ChatbotLeads');
    const docRef = await addDoc(leadsRef, leadData);
    
    console.log('Lead saved successfully:', docRef.id);
    
    // Track analytics for lead generation
    if (analyticsRef.current) {
      analyticsRef.current.trackEnquiry('chatbot', {
        leadId: docRef.id,
        messageType: messages.type || 'conversation'
      });
    }
    
    return { success: true, leadId: docRef.id };
  } catch (error) {
    console.error('Error saving chatbot lead:', error);
    return { success: false, error: error.message };
  }
};

  // Calculate paginated blogs
  const totalBlogPages = Math.ceil(blogs.length / BLOGS_PER_PAGE);
  const paginatedBlogs = blogs.slice(
    currentBlogPage * BLOGS_PER_PAGE,
    (currentBlogPage + 1) * BLOGS_PER_PAGE
  );

  // Handle blog selection
  const handleBlogClick = (blog) => {
    setSelectedBlog(blog);
    setShowBlogModal(true);
    if (analyticsRef.current) {
      analyticsRef.current.trackBlogInteraction(blog.id, 'open_modal', {
        title: blog.title,
        tags: blog.tags,
        readTime: blog.readTime
      });
    }
  };

  // Initialize analytics tracking
  useEffect(() => {
    if (userId && !analyticsRef.current) {
      try {
        analyticsRef.current = new AnalyticsTracker(userId, ref);
        console.log('Analytics tracker initialized successfully');
      } catch (error) {
        console.error('Failed to initialize analytics tracker:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      if (analyticsRef.current && analyticsRef.current.endSession) {
        try {
          analyticsRef.current.endSession();
        } catch (error) {
          console.error('Error ending analytics session:', error);
        }
      }
    };
  }, [userId]);

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      if (analyticsRef.current && analyticsRef.current.trackScroll) {
        try {
          const scrollY = window.scrollY;
          const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
          analyticsRef.current.trackScroll(scrollY, maxScroll);
        } catch (error) {
          console.error('Error tracking scroll:', error);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enhanced intersection observer for section tracking
  useEffect(() => {
    if (!analyticsRef.current || !analyticsRef.current.trackSectionView) return;

    const observerOptions = {
      threshold: [0.25, 0.5, 0.75],
      rootMargin: '-10% 0px -10% 0px'
    };

    intersectionObserverRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const sectionName = entry.target.dataset.section;
        if (entry.isIntersecting && sectionName && analyticsRef.current && analyticsRef.current.trackSectionView) {
          try {
            // Calculate approximate view time based on intersection ratio
            const viewDuration = Math.floor(entry.intersectionRatio * 2); // 2 seconds max per observation
            analyticsRef.current.trackSectionView(sectionName, viewDuration);
          } catch (error) {
            console.error('Error tracking section view:', error);
          }
        }
      });
    }, observerOptions);

    // Observe all sections
    Object.values(sectionRefs.current).forEach(ref => {
      if (ref && intersectionObserverRef.current) {
        intersectionObserverRef.current.observe(ref);
      }
    });

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [profileData]);

  // Enhanced event handlers with analytics
  const handleChatbotOpen = () => {
    setShowChatbot(true);
    if (analyticsRef.current) {
      analyticsRef.current.trackChatbotInteraction('open', {
        hasConfig: !!chatbotConfig,
        profileName: profileData?.firstName
      });
    }
  };

  const handleChatbotClose = () => {
    setShowChatbot(false);
    if (analyticsRef.current && analyticsRef.current.trackChatbotInteraction) {
      analyticsRef.current.trackChatbotInteraction('close', {
        messagesInSession: messages.length
      });
    }
  };

  const handleEnquiryEmail = () => {
    if (profileData?.email) {
      const subject = encodeURIComponent(`Enquiry about ${profileData.firstName || 'your services'}`);
      const body = encodeURIComponent(`Hi ${profileData.firstName || ''},\n\nI would like to enquire about...\n\nBest regards`);
      window.open(`mailto:${profileData.email}?subject=${subject}&body=${body}`, '_blank');
      
      if (analyticsRef.current && analyticsRef.current.trackEnquiry) {
        analyticsRef.current.trackEnquiry('email', {
          email: profileData.email,
          subject: `Enquiry about ${profileData.firstName || 'your services'}`
        });
      }
    } else {
      setShowEnquiryEmail(true);
    }
  };

  const handleContactClick = (type, value) => {
    if (analyticsRef.current && analyticsRef.current.trackContactClick) {
      analyticsRef.current.trackContactClick(type, value);
    }
  };

  const handleLinkClick = (type, url, label) => {
    if (analyticsRef.current && analyticsRef.current.trackLinkClick) {
      analyticsRef.current.trackLinkClick(type, url, label);
    }
  };

  const handleBlogView = (blog) => {
    if (analyticsRef.current && analyticsRef.current.trackBlogInteraction) {
      analyticsRef.current.trackBlogInteraction(blog.id, 'view', {
        title: blog.title,
        tags: blog.tags,
        readTime: blog.readTime
      });
    }
  };

  // Original data fetching logic
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const actualUserId = userId;
        
        setDataLoadingStatus({
          profile: 'loading',
          blogs: 'loading',
          chatbot: 'loading'
        });

        // Fetch profile data
        try {
          const profileDocRef = doc(db, 'Users', actualUserId);
          const profileDocSnap = await getDoc(profileDocRef);
          
          if (!profileDocSnap.exists()) {
            setError('User not found');
            return;
          }

          const userData = profileDocSnap.data();
          const profileData = userData.profile;
          
          if (profileData) {
            setProfileData(profileData);
            setDataLoadingStatus(prev => ({ ...prev, profile: 'success' }));
            console.log('Profile data loaded:', profileData);
          } else {
            setError('Profile data not found');
            return;
          }
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          setDataLoadingStatus(prev => ({ ...prev, profile: 'error' }));
          setError('Error loading profile');
          return;
        }

        // Fetch blogs with better error handling
        try {
          const blogsCollectionRef = collection(db, 'Users', actualUserId, 'Blogs');
          
          let blogsData = [];
          try {
            const blogsQuery = query(
              blogsCollectionRef, 
              where('status', '==', 'published'),
              orderBy('createdAt', 'desc')
            );
            const blogsSnapshot = await getDocs(blogsQuery);
            blogsData = blogsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          } catch (queryError) {
            console.log('Complex query failed, trying simple query:', queryError);
            try {
              const simpleBlogsQuery = query(blogsCollectionRef, orderBy('createdAt', 'desc'));
              const blogsSnapshot = await getDocs(simpleBlogsQuery);
              blogsData = blogsSnapshot.docs
                .map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }))
                .filter(blog => blog.status === 'published');
            } catch (simpleQueryError) {
              console.log('Simple query failed, trying basic collection read:', simpleQueryError);
              const blogsSnapshot = await getDocs(blogsCollectionRef);
              blogsData = blogsSnapshot.docs
                .map(doc => ({
                  id: doc.id,
                  ...doc.data()
                }))
                .filter(blog => blog.status === 'published')
                .sort((a, b) => {
                  if (a.createdAt && b.createdAt) {
                    return b.createdAt.toDate() - a.createdAt.toDate();
                  }
                  return 0;
                });
            }
          }
          
          setBlogs(blogsData);
          setDataLoadingStatus(prev => ({ ...prev, blogs: 'success' }));
          console.log('Blogs loaded:', blogsData);
        } catch (blogError) {
          console.error('Error fetching blogs:', blogError);
          setDataLoadingStatus(prev => ({ ...prev, blogs: 'error' }));
          setBlogs([]);
        }

        // Fetch chatbot config with better error handling
        try {
          const chatbotConfigRef = doc(db, 'Users', actualUserId, 'chatbot', 'config');
          const chatbotConfigSnap = await getDoc(chatbotConfigRef);
          
          if (chatbotConfigSnap.exists()) {
            setChatbotConfig(chatbotConfigSnap.data());
            setDataLoadingStatus(prev => ({ ...prev, chatbot: 'success' }));
            console.log('Chatbot config loaded:', chatbotConfigSnap.data());
          } else {
            setDataLoadingStatus(prev => ({ ...prev, chatbot: 'not_found' }));
            console.log('Chatbot config not found');
          }
        } catch (chatbotError) {
          console.error('Error fetching chatbot config:', chatbotError);
          setDataLoadingStatus(prev => ({ ...prev, chatbot: 'error' }));
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAllData();
    }
  }, [userId]);

  const getThemeStyles = (theme) => {
    switch (theme) {
      case 'elegant':
        return {
          background: 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100',
          card: 'bg-white/90 backdrop-blur-md border border-slate-300/50 shadow-xl',
          text: 'text-slate-800',
          accent: 'text-slate-600',
          button: 'bg-slate-700 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl',
          secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
          fab: 'bg-slate-700 hover:bg-slate-800'
        };
      case 'casual':
        return {
          background: 'bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100',
          card: 'bg-white/85 backdrop-blur-md border border-blue-300/40 shadow-lg',
          text: 'text-blue-900',
          accent: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
          secondary: 'bg-blue-100 hover:bg-blue-200 text-blue-700',
          fab: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'professional':
        return {
          background: 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800',
          card: 'bg-white/15 backdrop-blur-lg border border-gray-600/50 shadow-2xl',
          text: 'text-gray-100',
          accent: 'text-gray-300',
          button: 'bg-gray-700 hover:bg-gray-600 text-white shadow-lg hover:shadow-xl',
          secondary: 'bg-gray-800 hover:bg-gray-700 text-gray-200',
          fab: 'bg-gray-700 hover:bg-gray-600'
        };
      case 'modern':
        return {
          background: 'bg-gradient-to-br from-purple-50 via-pink-50 to-rose-100',
          card: 'bg-white/85 backdrop-blur-md border border-purple-300/40 shadow-lg',
          text: 'text-purple-900',
          accent: 'text-pink-600',
          button: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl',
          secondary: 'bg-purple-100 hover:bg-purple-200 text-purple-700',
          fab: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
        };
      case 'vibrant':
        return {
          background: 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-100',
          card: 'bg-white/85 backdrop-blur-md border border-orange-300/40 shadow-lg',
          text: 'text-red-900',
          accent: 'text-orange-600',
          button: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl',
          secondary: 'bg-orange-100 hover:bg-orange-200 text-orange-700',
          fab: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
        };
      case 'minimal':
        return {
          background: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100',
          card: 'bg-white/80 backdrop-blur-sm border border-green-300/30 shadow-md',
          text: 'text-green-900',
          accent: 'text-emerald-600',
          button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg',
          secondary: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700',
          fab: 'bg-emerald-600 hover:bg-emerald-700'
        };
      default:
        return {
          background: 'bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100',
          card: 'bg-white/90 backdrop-blur-md border border-slate-300/50 shadow-xl',
          text: 'text-slate-800',
          accent: 'text-slate-600',
          button: 'bg-slate-700 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl',
          secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
          fab: 'bg-slate-700 hover:bg-slate-800'
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-slate-800 text-xl font-sans mb-4">Loading profile...</div>
          <div className="flex justify-center space-x-4 text-sm text-slate-600">
            <span className={`px-2 py-1 rounded ${dataLoadingStatus.profile === 'success' ? 'bg-green-100' : 'bg-gray-100'}`}>
              Profile: {dataLoadingStatus.profile}
            </span>
            <span className={`px-2 py-1 rounded ${dataLoadingStatus.blogs === 'success' ? 'bg-green-100' : 'bg-gray-100'}`}>
              Blogs: {dataLoadingStatus.blogs}
            </span>
            <span className={`px-2 py-1 rounded ${dataLoadingStatus.chatbot === 'success' ? 'bg-green-100' : 'bg-gray-100'}`}>
              Chatbot: {dataLoadingStatus.chatbot}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl font-sans mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-800 text-xl font-sans">Profile not found</div>
      </div>
    );
  }

  const theme = getThemeStyles(profileData.theme);
  const fullName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();

  return (
    <div className={`min-h-screen ${theme.background} font-['Poppins'] relative overflow-hidden`}>
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-pink-400/15 to-orange-400/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        
        <div className="absolute top-1/4 right-1/3 w-2 h-2 bg-current opacity-10 rounded-full"></div>
        <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-current opacity-20 rounded-full"></div>
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-current opacity-15 rounded-full"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div 
            ref={ref => sectionRefs.current.header = ref}
            data-section="header"
            className={`${theme.card} rounded-3xl p-10 mb-8 text-center relative overflow-hidden animate-fade-in`}
          >
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px'}}></div>
            </div>
            
            {/* Profile Photo */}
            <div className="mb-8 relative">
              {profileData.profilePicture ? (
                <div className="relative">
                  <img
                    src={profileData.profilePicture}
                    alt={fullName}
                    className="w-36 h-36 rounded-full mx-auto object-cover border-4 border-white/60 shadow-2xl"
                  />
                  <div className="absolute inset-0 w-36 h-36 mx-auto rounded-full border-2 border-white/30 animate-pulse"></div>
                </div>
              ) : (
                <div className="relative">
                  <div className="w-36 h-36 rounded-full mx-auto bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center border-4 border-white/60 shadow-2xl">
                    <span className="text-5xl font-bold text-white">
                      {fullName.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="absolute inset-0 w-36 h-36 mx-auto rounded-full border-2 border-white/30 animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Name and Title */}
            <div className="relative z-10">
              {fullName && (
                <h1 className={`text-5xl font-bold ${theme.text} mb-3 tracking-tight`}>
                  {fullName}
                </h1>
              )}
              
              {profileData.agentType && (
                <div className={`inline-flex items-center px-4 py-2 ${theme.secondary} rounded-full mb-4`}>
                  <span className={`text-lg font-medium ${theme.accent}`}>
                    {profileData.agentType}
                  </span>
                </div>
              )}

              {profileData.occupation && (
                <p className={`text-xl ${theme.accent} mb-6 font-medium`}>
                  {profileData.occupation}
                </p>
              )}
              
              {profileData.bio && (
                <p className={`${theme.text} opacity-80 max-w-2xl mx-auto leading-relaxed text-lg text-justify`}>
                  {profileData.bio}
                </p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          {(profileData.email || profileData.phone || profileData.address) && (
            <div 
              ref={ref => sectionRefs.current.contact = ref}
              data-section="contact"
              className={`${theme.card} rounded-3xl p-8 mb-8 animate-slide-up`} 
              style={{animationDelay: '0.1s'}}
            >
              <h2 className={`text-3xl font-bold ${theme.text} mb-8 text-center`}>
                Contact Information
              </h2>
              <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
                {profileData.email && (
                  <div className="flex items-center group">
                    <div className={`w-12 h-12 ${theme.button} rounded-xl flex items-center justify-center mr-4 transition-all duration-300 group-hover:scale-110`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`${theme.text} font-semibold text-sm`}>Email</p>
                      <a 
                        href={`mailto:${profileData.email}`}
                        onClick={() => handleContactClick('email', profileData.email)}
                        className={`${theme.accent} hover:underline transition-colors duration-200 font-medium`}
                      >
                        {profileData.email}
                      </a>
                    </div>
                  </div>
                )}

                {profileData.phone && (
                  <div className="flex items-center group">
                    <div className={`w-12 h-12 ${theme.button} rounded-xl flex items-center justify-center mr-4 transition-all duration-300 group-hover:scale-110`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`${theme.text} font-semibold text-sm`}>Phone</p>
                      <a 
                        href={`tel:${profileData.phone}`}
                        onClick={() => handleContactClick('phone', profileData.phone)}
                        className={`${theme.accent} hover:underline transition-colors duration-200 font-medium`}
                      >
                        {profileData.phone}
                      </a>
                    </div>
                  </div>
                )}

                {profileData.address && (
                  <div className="flex items-center group">
                    <div className={`w-12 h-12 ${theme.button} rounded-xl flex items-center justify-center mr-4 transition-all duration-300 group-hover:scale-110`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className={`${theme.text} font-semibold text-sm`}>Location</p>
                      <p 
                        className={`${theme.text} opacity-80 font-medium cursor-pointer`}
                        onClick={() => handleContactClick('address', profileData.address)}
                      >
                        {profileData.address}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Links Section */}
          {profileData.links && profileData.links.some(link => link.url && link.url.trim() !== '') && (
            <div 
              ref={ref => sectionRefs.current.links = ref}
              data-section="links"
              className={`${theme.card} rounded-2xl p-8 mb-8 animate-slide-up`} 
              style={{animationDelay: '0.2s'}}
            >
              <h2 className={`text-2xl font-bold ${theme.text} mb-6 text-center`}>
                Links
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {profileData.links
                  .filter(link => link.url && link.url.trim() !== '')
                  .map((link, index) => (
                    <a
                      key={index}
                      href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleLinkClick('custom', link.url, link.label)}
                      className={`${theme.button} px-6 py-4 rounded-xl text-center font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg`}
                    >
                      {link.label && link.label.trim() !== '' ? link.label : link.url}
                    </a>
                  ))}
              </div>
            </div>
          )}

          {/* Website Section */}
          {profileData.website && profileData.website.trim() !== '' && (
            <div 
              ref={ref => sectionRefs.current.website = ref}
              data-section="website"
              className={`${theme.card} rounded-2xl p-8 mb-8 animate-slide-up`} 
              style={{animationDelay: '0.3s'}}
            >
              <h2 className={`text-2xl font-bold ${theme.text} mb-6 text-center`}>
                Website
              </h2>
              <div className="text-center">
                <a
                  href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLinkClick('website', profileData.website, 'Website')}
                  className={`${theme.button} px-8 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg inline-block`}
                >
                  Visit Website
                </a>
              </div>
            </div>
          )}

          {/* Social Media Section */}
          {profileData.socialMedia?.linkedin && profileData.socialMedia.linkedin.trim() !== '' && (
            <div 
              ref={ref => sectionRefs.current.social = ref}
              data-section="social"
              className={`${theme.card} rounded-2xl p-8 mb-8 animate-slide-up`} 
              style={{animationDelay: '0.4s'}}
            >
              <h2 className={`text-2xl font-bold ${theme.text} mb-6 text-center`}>
                Social Media
              </h2>
              <div className="text-center">
                <a
                  href={profileData.socialMedia.linkedin.startsWith('http') ? profileData.socialMedia.linkedin : `https://${profileData.socialMedia.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLinkClick('social', profileData.socialMedia.linkedin, 'LinkedIn')}
                  className={`${theme.button} px-8 py-4 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 hover:shadow-lg inline-flex items-center`}
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </a>
              </div>
            </div>
          )}

          {/* Enhanced Blogs Section with Carousel */}
          <div 
            ref={ref => sectionRefs.current.blogs = ref}
            data-section="blogs"
            className={`${theme.card} rounded-3xl p-8 mb-8 animate-slide-up`} 
            style={{animationDelay: '0.5s'}}
          >
            <h2 className={`text-3xl font-bold ${theme.text} mb-8 text-center`}>
              Latest Blogs
            </h2>
            
            {dataLoadingStatus.blogs === 'loading' && (
              <div className="text-center py-8">
                <div className={`${theme.text} opacity-60`}>Loading blogs...</div>
              </div>
            )}
            
            {dataLoadingStatus.blogs === 'error' && (
              <div className="text-center py-8">
                <div className={`${theme.text} opacity-60 mb-2`}>Unable to load blogs due to permissions.</div>
                <div className="text-sm text-red-500">Check your Firestore security rules for the Blogs subcollection.</div>
              </div>
            )}

            {dataLoadingStatus.blogs === 'success' && blogs.length === 0 && (
              <div className="text-center py-8">
                <div className={`${theme.text} opacity-60`}>No published blogs found.</div>
              </div>
            )}

            {blogs && blogs.length > 0 && (
              <div className="space-y-6">
                {/* Blog Cards */}
                <div className="grid gap-6">
                  {paginatedBlogs.map((blog, index) => (
                    <div 
                      key={blog.id} 
                      className={`bg-white/20 hover:scale-[102%] rounded-2xl p-6 border border-white/30 hover:bg-white/30 transition-all duration-300 group cursor-pointer`}
                      onClick={() => handleBlogClick(blog)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className={`${theme.text} font-bold text-xl mb-2 group-hover:${theme.accent} transition-colors duration-200`}>
                            {blog.title}
                          </h3>
                          {blog.excerpt && (
                            <p className={`${theme.text} opacity-70 text-base mb-3 leading-relaxed`}>
                              {blog.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className={`${theme.accent} font-medium`}>
                              {blog.readTime || '5 min read'}
                            </span>
                            <span className={`${theme.text} opacity-60`}>
                              {blog.date || (blog.createdAt?.toDate ? new Date(blog.createdAt.toDate()).toLocaleDateString() : 'No date')}
                            </span>
                            {blog.views !== undefined && (
                              <span className={`${theme.text} opacity-60`}>
                                {blog.views} views
                              </span>
                            )}
                          </div>
                        </div>
                        {blog.featured && (
                          <div className={`${theme.secondary} px-3 py-1 rounded-full ml-4`}>
                            <span className={`text-xs font-semibold ${theme.accent}`}>
                              Featured
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Tags */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {blog.tags.slice(0, 3).map((tag, tagIndex) => (
                            <span 
                              key={tagIndex} 
                              className={`${theme.secondary} px-3 py-1 rounded-full text-xs font-medium ${theme.accent} cursor-pointer hover:opacity-80`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (analyticsRef.current) {
                                  analyticsRef.current.trackBlogInteraction(blog.id, 'click_tag', { tag });
                                }
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                          {blog.tags.length > 3 && (
                            <span className={`${theme.text} opacity-60 text-xs self-center`}>
                              +{blog.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Blog content preview */}
                      {blog.content && (
                        <p className={`${theme.text} opacity-70 text-sm line-clamp-3`}>
                          {blog.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Pagination Controls */}
                {totalBlogPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={() => setCurrentBlogPage(prev => Math.max(0, prev - 1))}
                      disabled={currentBlogPage === 0}
                      className={`p-2 rounded-full ${currentBlogPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'} transition-all duration-200`}
                    >
                      <svg className={`w-6 h-6 ${theme.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <div className="flex gap-2">
                      {Array.from({ length: totalBlogPages }, (_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentBlogPage(i)}
                          className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 ${
                            currentBlogPage === i 
                              ? `${theme.button} text-white` 
                              : `${theme.secondary} hover:bg-white/30`
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentBlogPage(prev => Math.min(totalBlogPages - 1, prev + 1))}
                      disabled={currentBlogPage === totalBlogPages - 1}
                      className={`p-2 rounded-full ${currentBlogPage === totalBlogPages - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/20'} transition-all duration-200`}
                    >
                      <svg className={`w-6 h-6 ${theme.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}
                
                {/* Total blogs indicator */}
                <div className="text-center mt-4">
                  <span className={`${theme.text} opacity-60 text-sm`}>
                    Showing {Math.min((currentBlogPage + 1) * BLOGS_PER_PAGE, blogs.length)} of {blogs.length} blogs
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Certificates Section */}
          {profileData.certificates && profileData.certificates.length > 0 && (
            <div 
              ref={ref => sectionRefs.current.certificates = ref}
              data-section="certificates"
              className={`${theme.card} rounded-3xl p-8 mb-8 animate-slide-up`} 
              style={{animationDelay: '0.6s'}}
            >
              <h2 className={`text-3xl font-bold ${theme.text} mb-8 text-center`}>
                Certificates & Qualifications
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {profileData.certificates.map((cert, index) => (
                  <div 
                    key={index} 
                    className={`bg-white/20 rounded-2xl p-6 border border-white/30 cursor-pointer hover:bg-white/30 transition-all duration-300 group relative overflow-hidden`}
                    onClick={() => {
                      if (analyticsRef.current) {
                        analyticsRef.current.trackBlogInteraction('certificate', 'view', { 
                          name: cert.name, 
                          issuer: cert.issuer 
                        });
                      }
                    }}
                  >
                    {/* Certificate icon */}
                    <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    
                    <div className="relative z-10">
                      <h3 className={`${theme.text} font-bold text-lg mb-3 pr-16 leading-tight`}>
                        {cert.name}
                      </h3>
                      
                      <div className="space-y-2">
                        {cert.issuer && (
                          <div className="flex items-center">
                            <svg className={`w-4 h-4 ${theme.accent} mr-2 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <p className={`${theme.accent} text-sm font-semibold`}>
                              {cert.issuer}
                            </p>
                          </div>
                        )}
                        
                        {cert.date && (
                          <div className="flex items-center">
                            <svg className={`w-4 h-4 ${theme.accent} mr-2 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className={`${theme.text} opacity-70 text-sm font-medium`}>
                              {cert.date}
                            </p>
                          </div>
                        )}
                        
                        {cert.credentialId && (
                          <div className="flex items-center">
                            <svg className={`w-4 h-4 ${theme.accent} mr-2 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className={`${theme.text} opacity-60 text-xs font-mono bg-white/10 px-2 py-1 rounded`}>
                              ID: {cert.credentialId}
                            </p>
                          </div>
                        )}
                        
                        {cert.validUntil && (
                          <div className="flex items-center">
                            <svg className={`w-4 h-4 ${theme.accent} mr-2 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className={`${theme.text} opacity-60 text-xs`}>
                              Valid until: {cert.validUntil}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-12 animate-slide-up" style={{animationDelay: '0.7s'}}>
            <p className={`${theme.text} opacity-50 text-sm`}>
              Powered by YourApp • Create your own profile
            </p>
          </div>
        </div>
      </div>

      {/* Blog Modal */}
      <BlogModal 
        blog={selectedBlog}
        isOpen={showBlogModal}
        onClose={() => {
          setShowBlogModal(false);
          setSelectedBlog(null);
        }}
        theme={theme}
      />

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col space-y-4 z-50">
        {/* Email Enquiry Button */}
        <button
          onClick={handleEnquiryEmail}
          className={`w-14 h-14 ${theme.fab} text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-3xl animate-bounce-in flex items-center justify-center group`}
          style={{animationDelay: '1s'}}
          title="Send Enquiry Email"
        >
          <svg className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </button>

        {/* Chatbot Button */}
        {dataLoadingStatus.chatbot === 'success' && chatbotConfig && (
          <button
            onClick={handleChatbotOpen}
            className={`w-14 h-14 ${theme.fab} text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-3xl animate-bounce-in flex items-center justify-center group`}
            style={{animationDelay: '1.2s'}}
            title="Chat with AI Assistant"
          >
            <svg className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        )}
      </div>

      {/* Email Enquiry Modal */}
      {showEnquiryEmail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className={`${theme.card} rounded-2xl p-8 max-w-md w-full animate-scale-in`}>
            <h3 className={`text-2xl font-bold ${theme.text} mb-4`}>Contact Information</h3>
            <p className={`${theme.text} opacity-80 mb-4`}>
              Email information is not available for this profile.
            </p>
            <button
              onClick={() => setShowEnquiryEmail(false)}
              className={`${theme.button} px-6 py-2 rounded-lg w-full`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Chatbot Modal with Analytics */}
      {showChatbot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 z-50 animate-fade-in">
          <div className={`${theme.card} rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl md:max-h-[80vh] h-full md:h-auto animate-slide-up-mobile md:animate-scale-in overflow-hidden flex flex-col`}>
            {/* Chatbot Header */}
            <div className={`${theme.secondary} p-4 flex items-center justify-between border-b border-white/20`}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${theme.fab} rounded-full flex items-center justify-center`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className={`font-semibold ${theme.text}`}>AI Assistant</h3>
                  <p className={`text-sm ${theme.accent}`}>Ask me anything about {profileData.firstName}</p>
                </div>
              </div>
              <button
                onClick={handleChatbotClose}
                className={`w-8 h-8 ${theme.accent} hover:${theme.text} rounded-full flex items-center justify-center transition-colors duration-200`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Enhanced Chatbot Content with Analytics */}
            <div className="flex-1 overflow-hidden">
              <Chatbot 
                config={chatbotConfig} 
                messages={messages} 
                setMessages={setMessages} 
                profileData={profileData} 
                theme={theme}
                onMessageSent={(message) => {
                  if (analyticsRef.current) {
                    analyticsRef.current.trackChatbotInteraction('send_message', {
                      messageLength: message.length,
                      timestamp: new Date().toISOString()
                    });
                  }
                }}
                onMessageReceived={(message) => {
                  if (analyticsRef.current) {
                    analyticsRef.current.trackChatbotInteraction('receive_message', {
                      messageLength: message.length,
                      timestamp: new Date().toISOString()
                    });
                  }
                }}
                
                saveChatbotLead={saveChatbotLead}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slide-up {
          from { 
            opacity: 0;
            transform: translateY(30px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-up-mobile {
          from { 
            transform: translateY(100%);
          }
          to { 
            transform: translateY(0);
          }
        }
        
        @keyframes scale-in {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) rotate(-180deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.1) rotate(-90deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-slide-up-mobile {
          animation: slide-up-mobile 0.4s ease-out forwards;
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out forwards;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .prose {
          line-height: 1.7;
        }
        
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 600;
        }
        
        .prose p {
          margin-bottom: 1em;
        }
        
        .prose ul, .prose ol {
          margin: 1em 0;
          padding-left: 1.5em;
        }
        
        .prose li {
          margin-bottom: 0.5em;
        }
        
        .prose a {
          color: inherit;
          text-decoration: underline;
        }
        
        .prose blockquote {
          border-left: 4px solid currentColor;
          padding-left: 1em;
          margin: 1.5em 0;
          opacity: 0.8;
          font-style: italic;
        }
        
        .prose img {
          max-width: 100%;
          height: auto;
          margin: 1.5em 0;
          border-radius: 0.5rem;
        }
        
        .prose code {
          background-color: rgba(0,0,0,0.1);
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.9em;
        }
        
        .prose pre {
          background-color: rgba(0,0,0,0.1);
          padding: 1em;
          border-radius: 0.5rem;
          margin: 1em 0;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;