import { useState, useEffect} from "react";
import { Bot, User, HelpCircle, Book, Settings, Plus, X, Save, Power, MessageSquare, ArrowRight, ArrowDown, Trash2, Edit3, Info ,MessageCircle, Mail, TrendingUp} from "lucide-react";



function ChatbotConfig({ darkMode = true }) {


  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [userId] = useState('user_12345'); // Replace with actual user ID from auth context
  const API_BASE_URL = 'http://localhost:5000/api/users';  
  const [faqCurrentPage, setFaqCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [currentPage, setCurrentPage] = useState(1);


  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/chatbot-config`);
      const result = await response.json();

      if (response.ok && result.success) {
        const config = result.config;
        setChatbotEnabled(config.enabled || false);
        setSelectedMode(config.selectedMode || 'FAQ');
        setUserInfo(config.userInfo || {
          businessName: "",
          businessType: "",
          description: "",
          primaryServices: "",
          targetAudience: "",
          uniqueSellingPoints: ""
        });
        setFaqs(config.faqs || []);
        setWikiEntries(config.wikiEntries || []);
        setBehaviorFlow(config.behaviorFlow || []);
        setSaveStatus({ type: 'success', message: 'Configuration loaded successfully!' });
      } else if (response.status === 404) {
        setSaveStatus({ type: 'info', message: 'No saved configuration found. Using defaults.' });
      } else {
        throw new Error(result.message || 'Failed to load configuration');
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      setSaveStatus({ type: 'error', message: `Failed to load: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus(null);
    
    const configData = {
      enabled: chatbotEnabled,
      selectedMode,
      userInfo,
      faqs,
      wikiEntries,
      behaviorFlow
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/chatbot-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData)
      });

      const result = await response.json();

  
    } catch (error) {
      console.error('Error saving configuration:', error);
      setSaveStatus({ type: 'error', message: `Failed to save: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  //   const handleSave = () => {
  //   const configData = {
  //     enabled: chatbotEnabled,
  //     userInfo,
  //     faqs,
  //     wikiEntries,
  //     behaviorFlow,
  //     lastUpdated: new Date().toISOString()
  //   };
    
  //   const jsonData = JSON.stringify(configData, null, 2);
  //   const blob = new Blob([jsonData], { type: "application/json" });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement("a");
  //   a.href = url;
  //   a.download = "chatbot-config.json";
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);

  //   alert("Chatbot configuration saved successfully!");
  // };

  // Load configuration on component mount
  useEffect(() => {
    loadConfiguration();
  }, []);
  


  // Wiki/Context State

  const [wikiEntries, setWikiEntries] = useState([
    {
      id: 1,
      title: "Auto Insurance Basics",
      content: "Auto insurance provides financial protection against physical damage or bodily injury resulting from traffic collisions. Required minimums vary by state.",
      tags: ["auto", "basics", "required"]
    },
    {
      id: 2,
      title: "Home Insurance Coverage Types",
      content: "Home insurance typically includes dwelling coverage, personal property protection, liability coverage, and additional living expenses coverage.",
      tags: ["home", "coverage", "protection"]
    }
  ]);

  const [userInfo, setUserInfo] = useState({
    businessName: "John's Insurance Services",
    businessType: "Insurance Agency",
    description: "Full-service insurance agency specializing in auto, home, and life insurance with over 15 years of experience.",
    primaryServices: "Auto Insurance, Home Insurance, Life Insurance, Business Insurance",
    targetAudience: "Individuals and families seeking comprehensive insurance coverage",
    uniqueSellingPoints: "Personalized service, competitive rates, 24/7 claims support"
  });

  // FAQ State
  const [faqs, setFaqs] = useState([
    {
      id: 1,
      onboardedOnly: true,
      question: "What types of insurance do you offer?",
      answer: "We offer auto, home, life, and business insurance with competitive rates and comprehensive coverage options."
    },
    {
      id: 2,
      onboardedOnly: true,
      question: "How can I get a quote?",
      answer: "You can get a quote by calling us, visiting our website, or speaking with me here. I'll need some basic information to provide you with an accurate estimate."
    },
    {
      id: 3,
      onboardedOnly: false,
      question: "Do you offer discounts?",
      answer: "Yes! We offer various discounts including multi-policy, safe driver, home security, and loyalty discounts. Let me know your situation and I can identify potential savings."
    }
  ]);

  // Wiki/Context State


  // Chatbot Behavior Flow State
  const [behaviorFlow, setBehaviorFlow] = useState([
    {
      id: 1,
      trigger: "greeting",
      condition: "User says hello/hi/hey",
      response: "Hello! I'm here to help you with all your insurance needs. What can I assist you with today?",
      nextActions: ["ask_insurance_type", "provide_quote", "answer_questions"]
    },
    {
      id: 2,
      trigger: "quote_request",
      condition: "User asks for quote/price/cost",
      response: "I'd be happy to help you get a quote! What type of insurance are you looking for? Auto, home, life, or business insurance?",
      nextActions: ["collect_details", "schedule_call"]
    },
    {
      id: 3,
      trigger: "no_response",
      condition: "User doesn't respond for 2 minutes",
      response: "I'm still here if you have any questions about insurance! Feel free to ask about quotes, coverage options, or any concerns you might have.",
      nextActions: ["wait", "offer_callback"]
    }
  ]);
  
  // Calculate pagination
  const totalPages = Math.ceil(wikiEntries.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEntries = wikiEntries.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page) => {
    setCurrentPage(page);
  };


  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('guide');
  const [selectedMode, setSelectedMode] = useState('FAQ');

  const modes = {
    FAQ: {
      icon: HelpCircle,
      title: 'FAQ Mode',
      description: 'Automatically responds to user queries with predefined answers',
      features: [
        'Instant responses to common questions',
        'Knowledge base integration',
        'Self-service support',
        'Reduces support workload'
      ],
      color: 'blue'
    },
    SALES: {
      icon: TrendingUp,
      title: 'Sales Mode',
      description: 'Captures leads and sends them directly to your inbox and email',
      features: [
        'Lead capture and qualification',
        'Email notifications for new leads',
        'Contact information collection',
        'CRM integration ready'
      ],
      color: 'green'
    }
  };

  const renderModeCard = (modeKey, mode) => {
    const Icon = mode.icon;
    const isSelected = selectedMode === modeKey;
    
    return (
      <div
        key={modeKey}
        onClick={() => setSelectedMode(modeKey)}
        className={`
          relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300
          ${isSelected 
            ? `border-${mode.color}-500 ${darkMode ? 'bg-zinc-800' : 'bg-white'} shadow-lg` 
            : `${darkMode ? 'border-gray-600 bg-zinc-900 hover:border-gray-500' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`
          }
        `}
      >
        {isSelected && (
          <div className={`absolute top-4 right-4 w-4 h-4 rounded-full bg-${mode.color}-500`}>
            <div className="w-2 h-2 bg-white rounded-full absolute top-1 left-1"></div>
          </div>
        )}
        
        <div className="flex items-start space-x-4">
          <div className={`
            p-3 rounded-lg 
            ${isSelected 
              ? `bg-${mode.color}-100 text-${mode.color}-600` 
              : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`
            }
          `}>
            <Icon size={24} />
          </div>
          
          <div className="flex-1">
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {mode.title}
            </h3>
            <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {mode.description}
            </p>
            
            <ul className="space-y-2">
              {mode.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <div className={`w-1.5 h-1.5 rounded-full mr-3 ${
                    isSelected ? `bg-${mode.color}-500` : `${darkMode ? 'bg-gray-600' : 'bg-gray-400'}`
                  }`}></div>
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };
  
  // User Guide State
  

  const tabs = [
    { id: 'guide', label: 'User Guide', icon: User },
    { id: 'faq', label: 'FAQ Management', icon: HelpCircle },
    { id: 'wiki', label: 'Context Wiki', icon: Book },
    { id: 'behavior', label: 'Behaviour', icon: Settings }
  ];

  // FAQ Functions
  const addFaq = () => {
    const newFaq = {
      id: Date.now(),
      question: "",
      answer: ""
    };
    setFaqs([...faqs, newFaq]);
  };

  const removeFaq = (id) => {
    setFaqs(faqs.filter(faq => faq.id !== id));
  };

  const updateFaq = (id, field, value) => {
    setFaqs(faqs.map(faq => 
      faq.id === id ? { ...faq, [field]: value } : faq
    ));
  };

  // Wiki Functions
  const addWikiEntry = () => {
    const newEntry = {
      id: Date.now(),
      title: "",
      content: "",
      tags: []
    };
    setWikiEntries([...wikiEntries, newEntry]);
  };

  const removeWikiEntry = (id) => {
    setWikiEntries(wikiEntries.filter(entry => entry.id !== id));
  };

  const updateWikiEntry = (id, field, value) => {
    setWikiEntries(wikiEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  // Behavior Flow Functions
  const addBehaviorRule = () => {
    const newRule = {
      id: Date.now(),
      trigger: "",
      condition: "",
      response: "",
      nextActions: []
    };
    setBehaviorFlow([...behaviorFlow, newRule]);
  };

  const removeBehaviorRule = (id) => {
    setBehaviorFlow(behaviorFlow.filter(rule => rule.id !== id));
  };

  const updateBehaviorRule = (id, field, value) => {
    setBehaviorFlow(behaviorFlow.map(rule => 
      rule.id === id ? { ...rule, [field]: value } : rule
    ));
  };



  const renderUserGuide = () => (
    <div className="space-y-6">
      <div className={`${darkMode ? ' border-yellow-400' : ' border-blue-200'} border rounded-xl p-6`}>
        <div className="flex items-start space-x-3">
          <Info size={20} className={`mt-1 ${darkMode ? 'text-yellow-400' : 'text-blue-600'}`} />
          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-yellow-300' : 'text-blue-800'}`}>
              Getting Started Guide
            </h3>
            <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-yellow-700'} leading-relaxed`}>
              Fill out your business information below to help the chatbot provide personalized responses to your customers. 
              The more detailed and accurate this information is, the better your chatbot will perform.
            </p>
          </div>
        </div>
      </div>

      {Object.entries({
        businessName: "Business Name",
        businessType: "Business Type", 
        description: "Business Description",
        primaryServices: "Primary Services",
        targetAudience: "Target Audience",
        uniqueSellingPoints: "Unique Selling Points"
      }).map(([key, label]) => (
        <div key={key}>
          <label className="block text-sm font-medium mb-2">{label}</label>
          {key === 'description' ? (
            <textarea
              value={userInfo[key]}
              onChange={(e) => setUserInfo(prev => ({...prev, [key]: e.target.value}))}
              rows={3}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-zinc-900/50 border-gray-600 ' 
                  : 'bg-gray-50 border-gray-200 '
              } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
            />
          ) : (
            <input
              type="text"
              value={userInfo[key]}
              onChange={(e) => setUserInfo(prev => ({...prev, [key]: e.target.value}))}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-zinc-900/50 border-zinc-600 ' 
                  : 'bg-gray-50 border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const FAQ_ITEMS_PER_PAGE = 10;
  
  // Ensure faqs is initialized
  if (!faqs) {
    return <div>Loading...</div>;
  }


  // Calculate pagination
  const faqTotalPages = Math.ceil(faqs.length / FAQ_ITEMS_PER_PAGE);
  const faqStartIndex = (faqCurrentPage - 1) * FAQ_ITEMS_PER_PAGE;
  const faqEndIndex = faqStartIndex + FAQ_ITEMS_PER_PAGE;
  const currentFaqEntries = faqs.slice(faqStartIndex, faqEndIndex);

  const goToNextFaqPage = () => {
    if (faqCurrentPage < faqTotalPages) {
      setFaqCurrentPage(faqCurrentPage + 1);
    }
  };

  const goToPrevFaqPage = () => {
    if (faqCurrentPage > 1) {
      setFaqCurrentPage(faqCurrentPage - 1);
    }
  };

  const goToFaqPage = (page) => {
    setFaqCurrentPage(page);
  };    


  const renderFaqManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Frequently Asked Questions</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Manage common questions and answers for your chatbot
          </p>
        </div>
        <button
          onClick={addFaq}
          className="flex items-center text-white-100 hover:text-yellow-400 text-white rounded-lg transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add FAQ
        </button>
      </div>

      {/* Pagination Info */}
      {faqs.length > 0 && (
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing {faqStartIndex + 1}-{Math.min(faqEndIndex, faqs.length)} of {faqs.length} FAQs
        </div>
      )}

      <div className="space-y-4">
        {currentFaqEntries.map((faq) => (
          <div key={faq.id} className={`${
            darkMode ? '' : 'bg-white border-gray-200'
          } rounded-xl pt-6`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <h4 className="font-medium">FAQ</h4>
              </div>
              <div className="flex items-center space-x-3">
                {/* Onboarded Only Switch */}
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Onboarded Only
                  </span>
                  <button
                    onClick={() => updateFaq(faq.id, 'onboardedOnly', !faq.onboardedOnly)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      faq.onboardedOnly
                        ? 'bg-blue-600'
                        : darkMode
                        ? 'bg-gray-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        faq.onboardedOnly ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <button
                  onClick={() => removeFaq(faq.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:text-red-400 text-white-400' : 'hover:bg-gray-100 text-red-500'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Question</label>
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => updateFaq(faq.id, 'question', e.target.value)}
                  placeholder="Enter the question customers might ask..."
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-zinc-900/50 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Answer</label>
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateFaq(faq.id, 'answer', e.target.value)}
                  rows={3}
                  placeholder="Enter the response the chatbot should give..."
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-zinc-900/50 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {faqTotalPages > 1 && (
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevFaqPage}
              disabled={faqCurrentPage === 1}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                faqCurrentPage === 1
                  ? darkMode
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : darkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(faqTotalPages)].map((_, index) => {
                const page = index + 1;
                const isActive = page === faqCurrentPage;
                
                return (
                  <button
                    key={page}
                    onClick={() => goToFaqPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={goToNextFaqPage}
              disabled={faqCurrentPage === faqTotalPages}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                faqCurrentPage === faqTotalPages
                  ? darkMode
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : darkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Next
            </button>
          </div>
          
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Page {faqCurrentPage} of {faqTotalPages}
          </div>
        </div>
      )}

      {/* Empty State */}
      {faqs.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="text-lg mb-2">No FAQs yet</div>
          <div className="text-sm">Click "Add FAQ" to create your first frequently asked question</div>
        </div>
      )}
    </div>
  );

  const renderWikiManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Knowledge Base</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Add context and background information to make your chatbot more knowledgeable
          </p>
        </div>
        <button
          onClick={addWikiEntry}
          className="flex items-center py-2 text-white rounded-lg hover:text-yellow-400 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add Entry
        </button>
      </div>

      {/* Pagination Info */}
      {wikiEntries.length > 0 && (
        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Showing {startIndex + 1}-{Math.min(endIndex, wikiEntries.length)} of {wikiEntries.length} entries
        </div>
      )}

      <div className="space-y-4">
        {currentEntries.map((entry) => (
          <div key={entry.id} className={`${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          } pt-12`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <h4 className="font-medium">Knowledge Entry</h4>
              </div>
              <div className="flex items-center space-x-3">
                {/* Onboarded Only Switch */}
                <div className="flex items-center space-x-2">
                  <span className={`text-xs font-medium ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Onboarded Only
                  </span>
                  <button
                    onClick={() => updateWikiEntry(entry.id, 'onboardedOnly', !entry.onboardedOnly)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      entry.onboardedOnly
                        ? 'bg-blue-600'
                        : darkMode
                        ? 'bg-gray-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        entry.onboardedOnly ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <button
                  onClick={() => removeWikiEntry(entry.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:text-red-400 text-white' : 'hover:bg-gray-100 text-red-500'
                  }`}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={entry.title}
                  onChange={(e) => updateWikiEntry(entry.id, 'title', e.target.value)}
                  placeholder="Enter a descriptive title..."
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-zinc-900/50 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={entry.content}
                  onChange={(e) => updateWikiEntry(entry.id, 'content', e.target.value)}
                  rows={4}
                  placeholder="Enter detailed information about this topic..."
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-zinc-900/50 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={entry.tags.join(', ')}
                  onChange={(e) => updateWikiEntry(entry.id, 'tags', e.target.value.split(',').map(tag => tag.trim()))}
                  placeholder="insurance, auto, coverage, etc."
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-zinc-900/50 border-gray-600' 
                      : 'bg-gray-50 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 1
                  ? darkMode
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : darkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                const isActive = page === currentPage;
                
                return (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : darkMode
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? darkMode
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : darkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Next
            </button>
          </div>
          
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      {/* Empty State */}
      {wikiEntries.length === 0 && (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="text-lg mb-2">No knowledge entries yet</div>
          <div className="text-sm">Click "Add Entry" to create your first knowledge base entry</div>
        </div>
      )}
    </div>
  );

  const renderBehaviorFlow = () => (
    <div className={` ${darkMode ? ' text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className=" mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-lg text-justify font-bold mb-2">Chatbot Configuration</h1>
            <p className={`${darkMode ? 'text-gray-400 text-sm' : 'text-gray-600'}`}>
              Choose how you want your chatbot to handle user interactions. Information provided from the FAQ Management and Context Wiki will be used to inform the chatbot's responses.
            </p>
          </div>

        </div>

        {/* Mode Selection */}
        <div className="space-y-6 mb-8">
          <h2 className="text-lg font-semibold">Select Chatbot Mode</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(modes).map(([modeKey, mode]) => 
              renderModeCard(modeKey, mode)
            )}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className={`p-6 rounded-xl ${darkMode ? 'bg-zinc-900 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <h3 className="text-lg font-semibold mb-4">
            {modes[selectedMode].title} Configuration
          </h3>
          
          {selectedMode === 'FAQ' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Knowledge Base Source</label>
                <select className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-zinc-800 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}>
                  <option>Upload Documents</option>
                  <option>Website Scraping</option>
                  <option>Manual Entry</option>
                  <option>API Integration</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Default Response</label>
                <textarea
                  rows={3}
                  placeholder="What should the bot say when it doesn't know the answer?"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-zinc-800 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                />
              </div>
            </div>
          )}

          {selectedMode === 'SALES' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email Address for Leads</label>
                <input
                  type="email"
                  placeholder="sales@company.com"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-zinc-800 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Lead Qualification Questions</label>
                <textarea
                  rows={4}
                  placeholder="What questions should the bot ask to qualify leads? (e.g., company size, budget, timeline)"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-zinc-800 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Thank You Message</label>
                <textarea
                  rows={2}
                  placeholder="Thank you for your interest! Our team will contact you within 24 hours."
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-zinc-800 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-green-500`}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );

  return (
    <div className={`min-h-screen pb-40 transition-colors duration-300 ${darkMode ? 'text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto ">
        {/* Header with Enable/Disable Toggle */}
        <div className="mb-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
            
              <div>
                <h1 className="text-3xl font-bold">Sales Chatbot Configuration</h1>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  Configure your AI-powered sales assistant
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Power size={20} className={chatbotEnabled ? 'text-green-500' : 'text-gray-400'} />
                <span className="font-medium">
                  {chatbotEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={() => setChatbotEnabled(!chatbotEnabled)}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    chatbotEnabled ? 'bg-green-500' : (darkMode ? 'bg-gray-600' : 'bg-gray-300')
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    chatbotEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`${
          darkMode ? 'bg-gray-200/5 border-gray-700' : 'bg-white/30 border-gray-200'
        } backdrop-blur-md rounded-2xl border p-2 mb-8`}>
          <div className="flex justify-between">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-colors hover:text-yellow-400 hover:scale-105 transition-transform duration-300 ease-in-out
                    ${activeTab === tab.id 
                      ? 'text-yellow-400' 
                      : darkMode 
                        ? 'hover:text-yellow-400 text-gray-300' 
                        : 'hover:text-yellow-400 text-gray-600'
                    }`}
                >
                  <IconComponent size={18} className="mr-2" />
                  <span
                    className={`relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-yellow-400 after:transition-transform after:duration-300 after:origin-center
                      ${activeTab === tab.id ? 'after:scale-x-100' : 'after:scale-x-0 group-hover:after:scale-x-100'}
                    `}
                  >
                    {tab.label}
                  </span>
                </button>



              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`${
          darkMode ? 'bg-gray-200/5 border-gray-700' : 'bg-white/30 border-gray-200'
        } backdrop-blur-md rounded-2xl border p-8 mb-8`}>
          {activeTab === 'guide' && renderUserGuide()}
          {activeTab === 'faq' && renderFaqManagement()}
          {activeTab === 'wiki' && renderWikiManagement()}
          {activeTab === 'behavior' && renderBehaviorFlow()}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center px-6 py-3 bg-green-500/20 border border-green-400 text-green-400 rounded-lg hover:bg-green-500/50 hover:text-green-300 transition-colors font-semibold duration-300"
          >
            <Save size={20} className="mr-2" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatbotConfig;