import { useState } from "react";
import { Bot, User, HelpCircle, Book, Settings, Plus, X, Save, Power, MessageSquare, ArrowRight, ArrowDown, Trash2, Edit3, Info } from "lucide-react";



function ChatbotConfig({ darkMode = true }) {
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('guide');
  
  // User Guide State
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
      question: "What types of insurance do you offer?",
      answer: "We offer auto, home, life, and business insurance with competitive rates and comprehensive coverage options."
    },
    {
      id: 2,
      question: "How can I get a quote?",
      answer: "You can get a quote by calling us, visiting our website, or speaking with me here. I'll need some basic information to provide you with an accurate estimate."
    },
    {
      id: 3,
      question: "Do you offer discounts?",
      answer: "Yes! We offer various discounts including multi-policy, safe driver, home security, and loyalty discounts. Let me know your situation and I can identify potential savings."
    }
  ]);

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

  const tabs = [
    { id: 'guide', label: 'User Guide', icon: User },
    { id: 'faq', label: 'FAQ Management', icon: HelpCircle },
    { id: 'wiki', label: 'Context Wiki', icon: Book },
    { id: 'behavior', label: 'Behavior Flow', icon: Settings }
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

  const handleSave = () => {
    const configData = {
      enabled: chatbotEnabled,
      userInfo,
      faqs,
      wikiEntries,
      behaviorFlow,
      lastUpdated: new Date().toISOString()
    };
    
    const jsonData = JSON.stringify(configData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chatbot-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("Chatbot configuration saved successfully!");
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
          className="flex items-center  text-white-100 hover:text-yellow-400  text-white rounded-lg  transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add FAQ
        </button>
      </div>

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className={`${
            darkMode ? ' ' : 'bg-white border-gray-200'
          } rounded-xl pt-6`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <MessageSquare size={20} className="mr-2 text-blue-500" />
                <h4 className="font-medium">FAQ #{faq.id}</h4>
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
                      ? 'bg-zinc-900/50 border-gray-600 ' 
                      : 'bg-gray-50 border-gray-200'
                  } focus:outline-none focus:ring-2  focus:ring-opacity-20`}
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
                      ? 'bg-zinc-900/50 border-gray-600 ' 
                      : 'bg-gray-50 border-gray-200 '
                  } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
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
          className="flex items-center py-2  text-white rounded-lg hover:text-yellow-400 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add Entry
        </button>
      </div>

      <div className="space-y-4">
        {wikiEntries.map((entry) => (
          <div key={entry.id} className={`${
            darkMode ? ' border-gray-600' : ' border-gray-200'
          } pt-12`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Book size={20} className="mr-2 text-green-500" />
                <h4 className="font-medium">Knowledge Entry</h4>
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
                      ? 'bg-zinc-900/50 border-gray-600 ' 
                      : 'bg-gray-50 border-gray-200'
                  } focus:outline-none focus:ring-2  focus:ring-opacity-20`}
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
                      ? 'bg-zinc-900/50 border-gray-600 ' 
                      : 'bg-gray-50 border-gray-200 '
                  } focus:outline-none focus:ring-2  focus:ring-opacity-20`}
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
                      : 'bg-gray-50 border-gray-200 '
                  } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBehaviorFlow = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Chatbot Behavior Flow</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Define how your chatbot responds to different situations and user inputs
          </p>
        </div>
        <button
          onClick={addBehaviorRule}
          className="flex items-center px-4 py-2  text-white rounded-lg hover:text-yellow-400 transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add Rule
        </button>
      </div>

      <div className="space-y-4">
        {behaviorFlow.map((rule, index) => (
          <div key={rule.id} className={`${
            darkMode ? '-border-gray-600' : 'bg-white border-gray-200'
          } rounded-xl pt-8`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Settings size={20} className="mr-2 text-yellow-00" />
                <h4 className="font-medium">Rule #{index + 1}</h4>
              </div>
              <button
                onClick={() => removeBehaviorRule(rule.id)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:text-red-400 text-white' : 'hover:bg-gray-100 text-red-500'
                }`}
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Trigger Name</label>
                <input
                  type="text"
                  value={rule.trigger}
                  onChange={(e) => updateBehaviorRule(rule.id, 'trigger', e.target.value)}
                  placeholder="e.g., greeting, quote_request"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-zinc-900 border-gray-600' 
                      : 'bg-gray-50 border-gray-200 '
                  } focus:outline-none focus:ring-2  focus:ring-opacity-20`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Condition</label>
                <input
                  type="text"
                  value={rule.condition}
                  onChange={(e) => updateBehaviorRule(rule.id, 'condition', e.target.value)}
                  placeholder="When should this trigger activate?"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-zinc-900 border-gray-600 ' 
                      : 'bg-gray-50 border-gray-200'
                  } focus:outline-none focus:ring-2  focus:ring-opacity-20`}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Response</label>
              <textarea
                value={rule.response}
                onChange={(e) => updateBehaviorRule(rule.id, 'response', e.target.value)}
                rows={3}
                placeholder="What should the chatbot say?"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-zinc-900 border-gray-600 ' 
                    : 'bg-gray-50 border-gray-200 '
                } focus:outline-none focus:ring-2  focus:ring-opacity-20`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Next Actions (comma-separated)</label>
              <input
                type="text"
                value={rule.nextActions.join(', ')}
                onChange={(e) => updateBehaviorRule(rule.id, 'nextActions', e.target.value.split(',').map(action => action.trim()))}
                placeholder="ask_for_details, schedule_call, provide_info"
                className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                  darkMode 
                    ? 'bg-zinc-900 border-gray-600' 
                    : 'bg-gray-50 border-gray-200'
                } focus:outline-none focus:ring-2  focus:ring-opacity-20`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'text-white' : 'bg-gray-50 text-gray-900'}`}>
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
            className="flex items-center px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg shadow-lg hover:shadow-xl"
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