import React, { useState, useEffect, useRef } from 'react';

const Chatbot = ({ config, messages, setMessages, profileData, theme, saveChatbotLead }) => {

  // saveChatbotLead - > saveChatbotLead(leadEmail) : Call to save lead email to backend
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFlow, setCurrentFlow] = useState(null);
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [awaitingEmail, setAwaitingEmail] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [salesEnquiryComplete, setSalesEnquiryComplete] = useState(false);
  const [userEngagement, setUserEngagement] = useState('low'); // Track engagement level
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Extract config data
  const { faqs = [], wikiEntries = [], behaviorFlow = [], selectedMode = "", userInfo = {}, enabled = false } = config || {};

  // Determine if we're in sales mode using selectedMode
  const isSalesMode = selectedMode === "SALES";
  const isFaqMode = selectedMode === "FAQ";

  // Generate quick actions based on config
  const generateQuickActions = () => {
    const actions = [];
    
    // Add FAQ questions as quick actions (limit to 3 most relevant)
    faqs.slice(0, 3).forEach(faq => {
      actions.push(faq.question);
    });
    
    // Add service-specific questions
    if (userInfo.primaryServices === 'insurance') {
      actions.push("Get a quote", "What coverage do you offer?", "How do I file a claim?");
    }
    
    // Add general business questions
    actions.push("Tell me about your services", "Contact information");
    
    return actions.filter(Boolean).slice(0, 6);
  };

  const quickActions = generateQuickActions();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Only add welcome message if no messages exist and chatbot is enabled
    if (messages.length === 0 && enabled) {
      // Use the first behavior flow greeting or default
      const greetingFlow = behaviorFlow.find(flow => flow.trigger === 'greeting');
      let welcomeText = greetingFlow?.response || 
        `Hi there! I'm here to help you with ${userInfo.businessName || profileData?.firstName || 'our'} ${userInfo.primaryServices || 'services'}. What can I assist you with today?`;
      
      // More natural email prompt for FAQ mode
      if (isFaqMode && !emailCaptured) {
        welcomeText += "\n\nBy the way, if you'd like me to send you some helpful resources later, just let me know your email when you're ready!";
      }
      
      const welcomeMessage = {
        id: Date.now(),
        text: welcomeText,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [config, messages.length, setMessages, enabled, behaviorFlow, userInfo, profileData, isFaqMode, emailCaptured]);

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Check if message contains email
  const extractEmail = (text) => {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex);
    return matches ? matches[0] : null;
  };

  // Enhanced engagement tracking
  const updateEngagementLevel = (userMessage) => {
    const engagementKeywords = {
      high: ['interested', 'definitely', 'sounds great', 'perfect', 'exactly', 'yes', 'absolutely'],
      medium: ['maybe', 'possibly', 'considering', 'thinking about', 'tell me more'],
      low: ['not sure', 'maybe later', 'just looking', 'browsing']
    };
    
    const messageLower = userMessage.toLowerCase();
    
    if (engagementKeywords.high.some(word => messageLower.includes(word))) {
      setUserEngagement('high');
    } else if (engagementKeywords.medium.some(word => messageLower.includes(word))) {
      setUserEngagement('medium');
    }
  };

  // Handle email capture with more natural responses
  const handleEmailCapture = async (email) => {
    console.log('Attempting to capture email:', email);
    try {
      await saveChatbotLead(email);
      setEmailCaptured(true);
      setAwaitingEmail(false);
      return true;
    } catch (error) {
      console.error('Error saving lead email:', error);
      return false;
    }
  };

  // Enhanced sales enquiry completion detection
  const checkSalesEnquiryComplete = (userMessage, botResponse) => {
  const completionKeywords = [
    'thank you', 'thanks', 'that helps', 'perfect', 'great',
    'sounds good', 'i\'ll think about it', 'let me consider'
  ];
  
  const progressKeywords = [
    'how much', 'cost', 'price', 'quote', 'coverage', 'premium',
    'interested', 'want', 'need', 'looking for'
  ];
  
  const userLower = userMessage.toLowerCase();
  
  const showingProgress = progressKeywords.some(keyword => userLower.includes(keyword));
  const showingCompletion = completionKeywords.some(keyword => userLower.includes(keyword));
  
  // Trigger email capture after showing interest (not just completion)
  return (showingProgress || showingCompletion) && messageCount >= 2;
};

  // Enhanced paraphrasing function for FAQ responses
  const paraphraseFAQResponse = (faqAnswer, userQuestion, context = {}) => {
    const conversationalStarters = [
      "Great question! ",
      "I'm happy to help with that. ",
      "Absolutely! ",
      "Here's what I can tell you about that: ",
      "That's something we get asked often. "
    ];
    
    const starter = conversationalStarters[Math.floor(Math.random() * conversationalStarters.length)];
    
    // Add context-aware modifications
    let paraphrased = faqAnswer;
    
    // Make it more conversational by replacing formal language
    paraphrased = paraphrased
      .replace(/^Our company/, `${userInfo.businessName || 'We'}`)
      .replace(/We provide/, "What we do is provide")
      .replace(/Please contact us/, "Feel free to reach out")
      .replace(/It is important to note/, "Just so you know")
      .replace(/Furthermore/, "Also");
    
    return starter + paraphrased;
  };

  // Function to call Gemini API with enhanced prompting
  const callGeminiAPI = async (userMessage, context) => {
    try {
      const API_KEY = "AIzaSyDDGsJEgOiELCN4d5ixgDmOJhSJ9RKyWvk";
      
      if (!API_KEY) {
        console.warn('Gemini API key not found in environment variables');
        throw new Error('API key not configured');
      }
      
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
      
      // Build enhanced context from config
      const businessContext = `
Business Information:
- Name: ${userInfo.businessName || 'N/A'}
- Type: ${userInfo.businessType || 'N/A'}  
- Primary Services: ${userInfo.primaryServices || 'N/A'}
- Target Audience: ${userInfo.targetAudience || 'N/A'}
- Unique Selling Points: ${userInfo.uniqueSellingPoints || 'N/A'}
- Description: ${userInfo.description || 'N/A'}

Mode: ${selectedMode || 'General'}
User Engagement Level: ${userEngagement}
Messages Exchanged: ${messageCount}

Available FAQs:
${faqs.length > 0 ? faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n') : 'No FAQs available'}

Knowledge Base:
${wikiEntries.length > 0 ? wikiEntries.map(entry => `${entry.title}: ${entry.content}`).join('\n\n') : 'No wiki entries available'}

Behavior Guidelines:
${behaviorFlow.length > 0 ? behaviorFlow.map(flow => `When ${flow.condition || flow.trigger}: ${flow.response}`).join('\n') : 'Use general helpful responses'}
      `;

      // Enhanced email capture context based on mode and engagement
      let emailContext = '';
      if (isSalesMode && !emailCaptured) {
        if (userEngagement === 'high' && messageCount >= 2) {
          emailContext = '\nNote: User seems highly engaged. This is SALES mode - suggest email sharing for personalized follow-up and detailed information.';
        } else if (messageCount >= 3) {
          emailContext = '\nNote: This is SALES mode. If the conversation is progressing well, naturally suggest email sharing for follow-up.';
        }
      } else if (isFaqMode && !emailCaptured && messageCount > 1 && messageCount % 3 === 0) {
        emailContext = '\nNote: This is FAQ mode. Occasionally and naturally suggest the user can share their email for additional resources or follow-up.';
      }

      const prompt = `You are a friendly, professional AI assistant representing ${userInfo.businessName || 'this business'} in ${selectedMode || 'general'} mode. 

      ${businessContext}

      Current conversation context: ${context}
      User's question: "${userMessage}"
      ${emailContext}

      CRITICAL INSTRUCTIONS:
      1. Always PARAPHRASE information from FAQs and knowledge base - never copy directly. Fix spelling errors and make it sound natural.
      2. Use a warm, conversational tone that feels natural and human-like
      3. When referencing FAQ content, rephrase it to sound like you're personally explaining it
      4. Make responses feel personalized to ${userInfo.businessName || 'the business'}
      5. ${isSalesMode ? 'Focus on building interest and naturally guiding toward email capture when appropriate' : 'Focus on being helpful and informative'}
      6. Keep responses concise but conversational (2-3 sentences max)
      7. Use natural conversation starters like "Great question!", "I'd be happy to help!", etc.
      8. If using knowledge base info, weave it naturally into your response rather than stating it directly
      9. Match the user's tone and energy level
      10. If you find youself or the user repeating the same info, guide toward email capture for more detailed follow-up
      11. ${emailContext ? 'If the moment feels right, naturally suggest email sharing without being pushy' : ''}

      Please provide a helpful, natural response that sounds like a real person talking:`;

      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8, // Increased for more natural responses
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 512,
          stopSequences: []
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      console.log('Calling Gemini API...');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 400) {
          throw new Error('Invalid request to Gemini API');
        } else if (response.status === 403) {
          throw new Error('API key invalid or quota exceeded');
        } else if (response.status === 404) {
          throw new Error('Gemini model not found - check model name');
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini API Response:', data);
      
      if (!data.candidates || !data.candidates[0]) {
        console.error('No candidates in API response:', data);
        throw new Error('Invalid response structure from API');
      }
      
      if (!data.candidates[0].content || !data.candidates[0].content.parts) {
        console.error('No content in API response:', data.candidates[0]);
        throw new Error('No content received from API');
      }
      
      const responseText = data.candidates[0].content.parts[0]?.text;
      
      if (!responseText) {
        console.error('No text in API response parts:', data.candidates[0].content.parts);
        throw new Error('No text received from API');
      }
      
      return responseText.trim();
      
    } catch (error) {
      console.error('Gemini API Error:', error);
      
      // More conversational error messages
      if (error.message.includes('API key')) {
        return "I'm having some technical difficulties right now. Could you try contacting us directly? We'd love to help!";
      } else if (error.message.includes('quota')) {
        return "I'm getting a lot of questions today! While I sort this out, feel free to reach out to us directly.";
      } else {
        return "Hmm, I seem to be having a small technical hiccup. Could you try asking that again, or reach out to us directly?";
      }
    }
  };

  const generateBotResponse = async (userMessage) => {
  updateEngagementLevel(userMessage);

  if (!enabled) {
    return "I'm currently offline, but we'd love to help! Please contact us directly for assistance.";
  }

  const message = userMessage.toLowerCase().trim();
  
  // Handle email capture
  const emailInMessage = extractEmail(userMessage);
  if (emailInMessage && !emailCaptured) {
    const emailSaved = await handleEmailCapture(emailInMessage);
    if (emailSaved) {
      return `Perfect! I've got your email (${emailInMessage}). Our team will reach out soon with personalised options.`;
    } else {
      return `Thanks for sharing your email! I had a small technical issue saving it, but don't worry - our team will still follow up with you.`;
    }
  }

  // Enhanced FAQ matching with better relevance scoring
  const matchedFAQ = faqs.find(faq => {
    const faqLower = faq.question.toLowerCase();
    const messageLower = message.toLowerCase();
    
    // Improved matching logic
    const faqWords = faqLower.split(' ').filter(word => word.length > 3);
    const messageWords = messageLower.split(' ').filter(word => word.length > 3);
    
    const overlap = faqWords.filter(word => messageWords.includes(word)).length;
    const overlapPercentage = overlap / Math.max(faqWords.length, messageWords.length);
    
    return overlapPercentage > 0.4 || // Increased threshold for better precision
           (messageLower.includes(faqLower) && faqLower.length > 5) ||
           (faqLower.includes(messageLower) && messageLower.length > 5);
  });
  
  if (matchedFAQ) {
    let response = paraphraseFAQResponse(matchedFAQ.answer, userMessage, { mode: selectedMode });
    
    // Add contextual follow-up questions
    if (isSalesMode && !emailCaptured && messageCount >= 1) {
      response += "\n\nWould you like me to have someone from our team reach out with more detailed information? Just share your email address!";
    }
    
    return response;
  }

  // Enhanced behavior flow matching with insurance-specific patterns
  let matchedFlow = null;
  
  // Insurance-specific quote patterns
  const quotePatterns = [
    /how much/i, /cost/i, /price/i, /quote/i, /premium/i, /rate/i,
    /\$/, /dollar/i, /cheap/i, /affordable/i, /expensive/i
  ];
  
  const insuranceTypes = [
    /life insurance/i, /health insurance/i, /auto insurance/i, /car insurance/i,
    /home insurance/i, /business insurance/i, /travel insurance/i
  ];
  
  if (quotePatterns.some(pattern => pattern.test(message))) {
    matchedFlow = behaviorFlow.find(flow => 
      flow.trigger === 'quote_request' || 
      flow.trigger === 'pricing' ||
      flow.condition?.toLowerCase().includes('quote')
    );
  }
  
  // Check for specific insurance type mentions
  const mentionedInsuranceType = insuranceTypes.find(pattern => pattern.test(message));
  if (mentionedInsuranceType && !matchedFAQ) {
    // Generate insurance-specific response
    const insuranceType = message.match(mentionedInsuranceType)[0];
    let response = `Great choice! ${insuranceType} is really important for your financial security. `;
    
    if (message.includes('how much') || message.includes('cost') || message.includes('price')) {
      response += `To give you an accurate quote for ${insuranceType}, I'll need a few details. `;
      
      if (isSalesMode && messageCount >= 1) {
        response += `Would you like me to have one of our insurance specialists reach out to you with personalized options? Just share your email address!`;
        setAwaitingEmail(true);
      }
    } else {
      response += `What specific aspects of ${insuranceType} would you like to know about?`;
    }
    
    return response;
  }

  if (matchedFlow) {
    setCurrentFlow(matchedFlow);
    let response = matchedFlow.response;
    
    // Add sales-specific email capture for quote requests
    if (isSalesMode && (matchedFlow.trigger === 'quote_request' || matchedFlow.trigger === 'pricing') && !emailCaptured) {
      response += "\n\nI'd love to have one of our specialists put together a personalized quote for you. Could you share your email address so they can follow up?";
      setAwaitingEmail(true);
    }
    
    return response;
  }

  // Use Gemini API with improved prompting
  const context = `
Current conversation context:
- User engagement: ${userEngagement}
- Message count: ${messageCount}
- Sales mode: ${isSalesMode}
- Email captured: ${emailCaptured}
- Awaiting email: ${awaitingEmail}
- Previous flow: ${currentFlow?.trigger || 'none'}
`;
  
  try {
    const geminiResponse = await callGeminiAPI(userMessage, context);
    let finalResponse = geminiResponse;
    
    // Strategic email capture for sales mode
    if (isSalesMode && !emailCaptured && messageCount >= 2) {
      const hasInterest = /interested|want|need|looking for|tell me about|how much|cost|price|quote/i.test(userMessage);
      
      if (hasInterest) {
        setAwaitingEmail(true);
        finalResponse += "\n\nI'd love to connect you with one of our insurance specialists who can give you personalized recommendations. Could you share your email address?";
      }
    }
    
    return finalResponse;
    
  } catch (error) {
    console.error('Error in generateBotResponse:', error);
    
    // Better fallback responses for insurance context
    if (message.includes('insurance') || message.includes('coverage') || message.includes('policy')) {
      let response = `I'd be happy to help you with insurance! We offer comprehensive coverage options designed to protect what matters most to you. `;
      
      if (message.includes('how much') || message.includes('cost') || message.includes('price')) {
        response += `For accurate pricing, I'll need to understand your specific needs better. `;
        
        if (isSalesMode && !emailCaptured) {
          response += `Would you like one of our insurance experts to reach out with personalized quotes? Just share your email address!`;
          setAwaitingEmail(true);
        }
      } else {
        response += `What type of insurance coverage are you most interested in?`;
      }
      
      return response;
    }
    
    // Generic fallback
    let response = `Thanks for reaching out! I'm here to help you with all your insurance needs. `;
    
    if (isSalesMode && !emailCaptured && messageCount >= 1) {
      response += `To give you the best assistance, would you like me to have one of our specialists reach out? Just share your email address!`;
    } else {
      response += `What specific information can I help you with today?`;
    }
    
    return response;
  }
};

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);
    setMessageCount(prev => prev + 1);

    try {
      const botResponseText = await generateBotResponse(messageToSend);
      
      // Simulate typing delay for better UX
      setTimeout(() => {
        setIsTyping(false);
        
        const botMessage = {
          id: Date.now() + 1,
          text: botResponseText,
          sender: 'bot',
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMessage]);
      }, 1500); // 1.5 second typing delay
      
    } catch (error) {
      console.error('Error in handleSend:', error);
      setIsTyping(false);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: "Oops, I'm having a bit of trouble right now. Could you try again, or feel free to contact us directly - we'd love to help!",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action) => {
    setInputValue(action);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTimestamp = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Show disabled state if chatbot is not enabled
  if (!enabled) {
    return (
      <div className="flex flex-col h-full max-h-[700px] items-center justify-center p-8 text-center">
        <div className="bg-gray-100 rounded-full p-4 mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat Currently Unavailable</h3>
        <p className="text-gray-600 mb-4">The chatbot is currently offline. Please use the contact information below to get in touch.</p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Contact Directly
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[700px]">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-black/5 chatbot-messages">
        {/* Mode Indicator */}
        {selectedMode && (
          <div className="text-center mb-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              isSalesMode 
                ? 'bg-green-100 text-green-800' 
                : isFaqMode 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {selectedMode} Mode {userEngagement !== 'low' && isSalesMode && `• ${userEngagement} engagement`}
            </span>
          </div>
        )}

        {/* Quick Actions - Show only initially */}
        {messages.length <= 1 && quickActions.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-3 font-medium">
              Quick questions you can ask:
            </p>
            <div className="flex flex-wrap gap-2">
              {quickActions.slice(0, 4).map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className={`px-3 py-2 ${theme?.secondary || 'bg-gray-100'} hover:${theme?.button || 'bg-gray-200'} rounded-full text-sm transition-all duration-200 hover:scale-105 text-gray-800 font-medium`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-message-in`}
          >
            <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              {/* Avatar */}
              <div className={`flex items-end space-x-2 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === 'user' 
                    ? theme?.fab || 'bg-blue-600' 
                    : theme?.secondary || 'bg-gray-300'
                }`}>
                  {message.sender === 'user' ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1C14.6 0.4 13.8 0.4 13.4 1L7 7V9C7 10 7.9 11 9 11V16L7 21H9L10.5 18L12 21H14L12.5 18L14 21H16L14 16V11C15.1 11 16 10 16 9V7H21Z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,2A2,2 0 0,1 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4A2,2 0 0,1 12,2ZM12,15C12.39,15 12.76,15.1 13.1,15.28L14.5,16.64C14.8,16.97 14.8,17.5 14.5,17.83C14.17,18.16 13.64,18.16 13.31,17.83L12,16.5C11.61,16.5 11.24,16.4 10.9,16.22L9.5,17.64C9.17,17.97 8.64,17.97 8.31,17.64C7.98,17.31 7.98,16.78 8.31,16.45L9.69,15.07C9.28,14.6 9,14 9,13.34V10.66C9,9.19 10.19,8 11.66,8H12.34C13.81,8 15,9.19 15,10.66V13.34C15,13.95 14.76,14.5 14.38,14.91L15.83,16.36C16.16,16.69 16.16,17.22 15.83,17.55C15.5,17.88 14.97,17.88 14.64,17.55L13.26,16.17C12.89,16.39 12.46,16.5 12,16.5V15Z"/>
                    </svg>
                  )}
                </div>
                
                {/* Message Bubble */}
                <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                  message.sender === 'user'
                    ? `${theme?.fab || 'bg-blue-600'} text-white`
                    : `bg-white border border-gray-200 ${message.isError ? 'bg-red-50 border-red-300' : ''}`
                }`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-line font-medium ${
                    message.sender === 'user'
                      ? 'text-white'
                      : message.isError 
                        ? 'text-red-800'
                        : 'text-gray-900'
                  }`}>
                    {message.text}
                  </p>
                  <p className={`text-xs mt-2 opacity-80 font-medium ${
                    message.sender === 'user' 
                      ? 'text-white/80' 
                      : message.isError
                        ? 'text-red-600'
                        : 'text-gray-600'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start animate-message-in">
            <div className="flex items-end space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme?.secondary || 'bg-gray-300'}`}>
                <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2A2,2 0 0,1 14,4C14,5.1 13.1,6 12,6C10.9,6 10,5.1 10,4A2,2 0 0,1 12,2Z"/>
                </svg>
              </div>
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-200">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`border-t ${theme?.secondary ? 'border-white/20' : 'border-gray-300'} p-4`}>
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask me about ${userInfo.businessName || userInfo.primaryServices || 'our services'}...`}
              className={`w-full px-4 py-3 pr-12 rounded-2xl border resize-none focus:outline-none focus:ring-2 transition-all duration-200 font-medium ${
                theme?.background === 'bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800'
                  ? 'bg-white/10 border-white/20 text-white placeholder-white/60 focus:ring-white/30'
                  : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-600 focus:ring-blue-400'
              }`}
              rows="1"
              maxLength="500"
              disabled={isLoading}
              style={{
                minHeight: '50px',
                maxHeight: '120px'
              }}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-500 font-medium">
              {inputValue.length}/500
            </div>
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
              theme?.fab || 'bg-blue-600 hover:bg-blue-700'
            } text-white shadow-lg hover:shadow-xl`}
          >
            {isLoading ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Character count warning */}
        {inputValue.length > 400 && (
          <p className="text-xs text-orange-600 mt-2 font-medium">
            {500 - inputValue.length} characters remaining
          </p>
        )}
        
        {/* Engagement indicator for sales mode */}
        {isSalesMode && userEngagement !== 'low' && messageCount > 1 && !emailCaptured && (
          <div className="flex items-center justify-center mt-2">
            <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
              Great conversation! 🎯
            </span>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes message-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .animate-message-in {
            animation: message-in 0.3s ease-out;
          }
          
          /* Custom scrollbar */
          .chatbot-messages::-webkit-scrollbar {
            width: 4px;
          }
          
          .chatbot-messages::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .chatbot-messages::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 2px;
          }
          
          .chatbot-messages::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.3);
          }
        `}
      </style>
    </div>
  );
};

export default Chatbot;