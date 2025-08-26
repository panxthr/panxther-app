import React, { useState, useEffect, useRef } from 'react';

const Chatbot = ({ config, messages, setMessages, profileData, theme }) => {
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentFlow, setCurrentFlow] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Extract config data
  const { faqs = [], wikiEntries = [], behaviorFlow = [], userInfo = {}, enabled = false } = config || {};

  // Generate quick actions based on config
  const generateQuickActions = () => {
    const actions = [];
    
    // Add FAQ questions as quick actions
    faqs.slice(0, 3).forEach(faq => {
      actions.push(faq.question);
    });
    
    // Add common insurance questions
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
      const welcomeText = greetingFlow?.response || 
        `Hi! I'm ${userInfo.businessName || profileData?.firstName || 'your'}'s AI assistant specializing in ${userInfo.primaryServices || 'services'}. How can I help you today?`;
      
      const welcomeMessage = {
        id: Date.now(),
        text: welcomeText,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [config, messages.length, setMessages, enabled, behaviorFlow, userInfo, profileData]);

  // Function to call Gemini API
  const callGeminiAPI = async (userMessage, context) => {
    try {
      const API_KEY = process.env.PANXTHER_GEMINI_API_KEY || process.env.PANXTHER_GEMINI_API_KEY;
      
      // Check if API key exists
      if (!API_KEY) {
        console.warn('Gemini API key not found in environment variables');
        throw new Error('API key not configured');
      }
      
      // Correct Gemini API URL
      const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
      
      // Build context from config
      const businessContext = `
Business Information:
- Name: ${userInfo.businessName || 'N/A'}
- Type: ${userInfo.businessType || 'N/A'}  
- Primary Services: ${userInfo.primaryServices || 'N/A'}
- Target Audience: ${userInfo.targetAudience || 'N/A'}
- Unique Selling Points: ${userInfo.uniqueSellingPoints || 'N/A'}
- Description: ${userInfo.description || 'N/A'}

Available FAQs:
${faqs.length > 0 ? faqs.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n') : 'No FAQs available'}

Knowledge Base:
${wikiEntries.length > 0 ? wikiEntries.map(entry => `${entry.title}: ${entry.content}`).join('\n\n') : 'No wiki entries available'}

Behavior Guidelines:
${behaviorFlow.length > 0 ? behaviorFlow.map(flow => `When ${flow.condition || flow.trigger}: ${flow.response}`).join('\n') : 'Use general helpful responses'}
      `;

      const prompt = `You are a professional AI assistant representing ${userInfo.businessName || 'this business'}. 

${businessContext}

Current conversation context: ${context}
User's question: "${userMessage}"

Instructions:
1. Respond as a knowledgeable representative of ${userInfo.businessName || 'the business'}
2. Use the FAQs to provide direct answers when relevant
3. Reference knowledge base information when applicable
4. Stay professional and focused on ${userInfo.primaryServices || 'business services'}
5. If unsure, recommend contacting the business directly
6. Keep responses helpful but concise (2-3 sentences max)
7. Be friendly and conversational

Please provide a helpful response:`;

      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
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
      
      // Check if the response has the expected structure
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
      
      // Return different messages based on error type
      if (error.message.includes('API key')) {
        return "I'm currently unavailable due to configuration issues. Please contact us directly for assistance.";
      } else if (error.message.includes('quota')) {
        return "I'm temporarily unavailable due to high demand. Please try again later or contact us directly.";
      } else if (error.message.includes('404') || error.message.includes('model not found')) {
        return "I'm experiencing technical difficulties with my AI service. Please contact us directly for help.";
      } else if (error.message.includes('400') || error.message.includes('Invalid request')) {
        return "I had trouble understanding that request. Could you please rephrase your question?";
      } else {
        return "I'm having temporary connectivity issues. Please try again in a moment or contact us directly.";
      }
    }
  };

  const generateBotResponse = async (userMessage) => {
    // If chatbot is disabled, return a simple message
    if (!enabled) {
      return "The chatbot is currently offline. Please contact us directly for assistance.";
    }

    const message = userMessage.toLowerCase().trim();
    
    // Check for direct FAQ matches first
    const matchedFAQ = faqs.find(faq => {
      const faqLower = faq.question.toLowerCase();
      return message.includes(faqLower) || 
             faqLower.includes(message) ||
             message.split(' ').some(word => word.length > 3 && faqLower.includes(word));
    });
    
    if (matchedFAQ) {
      return matchedFAQ.answer;
    }

    // Check behavior flows
    let matchedFlow = null;
    
    // Check for greeting patterns
    const greetingWords = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'];
    if (greetingWords.some(greeting => message.includes(greeting))) {
      matchedFlow = behaviorFlow.find(flow => flow.trigger === 'greeting' || flow.trigger === 'hello');
    }
    
    // Check for quote requests
    const quoteWords = ['quote', 'price', 'cost', 'how much', 'pricing', 'estimate'];
    if (quoteWords.some(word => message.includes(word))) {
      matchedFlow = behaviorFlow.find(flow => flow.trigger === 'quote_request' || flow.trigger === 'pricing');
    }
    
    // Check for contact requests
    const contactWords = ['contact', 'reach', 'phone', 'email', 'address'];
    if (contactWords.some(word => message.includes(word))) {
      matchedFlow = behaviorFlow.find(flow => flow.trigger === 'contact' || flow.trigger === 'contact_info');
    }
    
    if (matchedFlow) {
      setCurrentFlow(matchedFlow);
      return matchedFlow.response;
    }

    // Check wiki entries for relevant content
    const relevantWikiEntry = wikiEntries.find(entry => {
      const titleLower = entry.title.toLowerCase();
      const contentLower = entry.content.toLowerCase();
      const tags = entry.tags || [];
      
      return message.includes(titleLower) ||
             titleLower.includes(message) ||
             contentLower.includes(message) ||
             tags.some(tag => message.includes(tag.toLowerCase())) ||
             message.split(' ').some(word => word.length > 3 && (titleLower.includes(word) || contentLower.includes(word)));
    });
    
    if (relevantWikiEntry) {
      return `Here's what I know about ${relevantWikiEntry.title}: ${relevantWikiEntry.content}`;
    }

    // Use Gemini API for more complex responses
    const context = currentFlow ? `Current conversation flow: ${currentFlow.trigger}` : 'General inquiry';
    
    try {
      const geminiResponse = await callGeminiAPI(userMessage, context);
      return geminiResponse;
    } catch (error) {
      console.error('Error in generateBotResponse:', error);
      
      // Fallback responses based on keywords
      if (contactWords.some(word => message.includes(word))) {
        return `You can contact ${userInfo.businessName || 'us'} directly. Check the contact information on the profile page or call for immediate assistance.`;
      }
      
      if (message.includes('service') || message.includes('offer') || message.includes('do')) {
        return `${userInfo.businessName || 'We'} specialize in ${userInfo.primaryServices || 'professional services'}. ${userInfo.description || 'We\'re here to help with your needs.'} Would you like to know more about any specific service?`;
      }
      
      // Default fallback
      return `Thank you for your question! ${userInfo.businessName || 'We'} would be happy to help you with ${userInfo.primaryServices || 'your needs'}. For detailed information, please contact us directly or let me know if you have any specific questions I can help with.`;
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
        text: "I'm sorry, I'm having trouble responding right now. Please try again or contact us directly.",
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