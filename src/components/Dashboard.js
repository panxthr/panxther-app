import React, { useState } from 'react';
import {
  User,
  Bot,
  FileText,
  Eye,
  Settings,
  Save,
  Plus,
  Edit3,
  Trash2,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Star,
  Calendar
} from 'lucide-react';


const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPreview, setShowPreview] = useState(false);

  // Profile state
  const [profile, setProfile] = useState({
    name: 'John Smith',
    title: 'Senior Insurance Agent',
    company: 'Premier Insurance Group',
    email: 'john.smith@premier.com',
    phone: '+1 (555) 123-4567',
    location: 'New York, NY',
    bio:
      "With over 15 years of experience in the insurance industry, I specialize in helping families and businesses find the perfect coverage for their needs.",
    avatar:
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    specialties: ['Life Insurance', 'Auto Insurance', 'Home Insurance', 'Business Insurance'],
    certifications: ['Licensed Insurance Agent', 'CPCU Certified', 'Risk Management Specialist'],
    experience: '15+ years',
    languages: ['English', 'Spanish']
  });

  // Chatbot state
  const [chatbot, setChatbot] = useState({
    name: "John's Assistant",
    greeting: "Hi! I'm John's AI assistant. I can help you learn about insurance options and schedule a consultation with John.",
    personality: 'professional and helpful',
    knowledgeBase: 'Insurance products, coverage options, claim processes, and general industry information',
    responses: {
      aboutAgent:
        'John Smith is a senior insurance agent with over 15 years of experience specializing in life, auto, home, and business insurance.',
      services:
        'We offer comprehensive insurance solutions including life insurance, auto coverage, homeowners insurance, and commercial policies.',
      scheduling:
        'I can help you schedule a consultation with John. Would you prefer a phone call or in-person meeting?',
      contact: 'You can reach John directly at john.smith@premier.com or call (555) 123-4567.'
    }
  });

  // Blog state
  const [blogPosts, setBlogPosts] = useState([
    {
      id: 1,
      title: '5 Essential Tips for First-Time Home Insurance Buyers',
      excerpt:
        'Buying your first home insurance policy can be overwhelming. Here are the key things you need to know...',
      content:
        "When purchasing your first home insurance policy, it's important to understand the different types of coverage available...",
      date: '2024-08-10',
      status: 'published',
      readTime: '5 min read'
    },
    {
      id: 2,
      title: 'Understanding Life Insurance: Term vs Whole Life',
      excerpt:
        'Learn the key differences between term and whole life insurance to make the best choice for your family.',
      content: "Life insurance is one of the most important financial decisions you'll make...",
      date: '2024-08-05',
      status: 'published',
      readTime: '7 min read'
    }
  ]);

  const [newPost, setNewPost] = useState({
    title: '',
    excerpt: '',
    content: '',
    status: 'draft'
  });

  const [editingPost, setEditingPost] = useState(null);

  // Chat simulation state
  const [chatMessages, setChatMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleProfileUpdate = (field, value) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleChatbotUpdate = (field, value) => {
    setChatbot((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddBlogPost = () => {
    if (newPost.title && newPost.excerpt && newPost.content) {
      const post = {
        ...newPost,
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        readTime: Math.ceil(newPost.content.split(' ').length / 200) + ' min read'
      };
      setBlogPosts((prev) => [post, ...prev]);
      setNewPost({ title: '', excerpt: '', content: '', status: 'draft' });
    }
  };

  const handleEditBlogPost = (post) => {
    setEditingPost(post);
    setNewPost(post);
  };

  const handleUpdateBlogPost = () => {
    if (!editingPost) return;
    setBlogPosts((prev) =>
      prev.map((post) =>
        post.id === editingPost.id
          ? { ...newPost, readTime: Math.ceil(newPost.content.split(' ').length / 200) + ' min read' }
          : post
      )
    );
    setEditingPost(null);
    setNewPost({ title: '', excerpt: '', content: '', status: 'draft' });
  };

  const handleDeleteBlogPost = (id) => {
    setBlogPosts((prev) => prev.filter((post) => post.id !== id));
  };

  const simulateChatResponse = (message) => {
    const responses = {
      hello: chatbot.greeting,
      hi: chatbot.greeting,
      about: chatbot.responses.aboutAgent,
      services: chatbot.responses.services,
      schedule: chatbot.responses.scheduling,
      contact: chatbot.responses.contact
    };

    const lowerMessage = message.toLowerCase();
    let response =
      "I'm here to help! You can ask me about John's services, schedule a consultation, or get his contact information.";

    for (const [key, value] of Object.entries(responses)) {
      if (lowerMessage.includes(key)) {
        response = value;
        break;
      }
    }

    return response;
  };

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;

    const userMessage = { type: 'user', content: currentMessage };
    setChatMessages((prev) => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = { type: 'bot', content: simulateChatResponse(currentMessage) };
      setChatMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1200);
  };

  const PreviewPage = () => (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-sky-500/10 to-indigo-700/8">
      {/* Header */}
      <div className="bg-gradient-to-r from-white/6 to-white/3 backdrop-blur-md border border-white/6 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center gap-6">
            <div className="w-28 h-28 rounded-full overflow-hidden ring-1 ring-white/10">
              <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white/95">{profile.name}</h1>
              <p className="text-lg text-white/80">{profile.title} • {profile.company}</p>
              <div className="flex flex-wrap gap-3 mt-3 text-sm text-white/75">
                <span className="inline-flex items-center gap-2 bg-white/6 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </span>
                <span className="inline-flex items-center gap-2 bg-white/6 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Phone className="w-4 h-4" />
                  {profile.phone}
                </span>
                <span className="inline-flex items-center gap-2 bg-white/6 px-3 py-1 rounded-full backdrop-blur-sm">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl p-6 backdrop-blur-md bg-white/6 border border-white/6 shadow-lg">
            <h2 className="text-2xl font-semibold text-white/95 mb-3">About Me</h2>
            <p className="text-white/80 leading-relaxed">{profile.bio}</p>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white/85 mb-2">Specialties</h3>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.map((specialty, idx) => (
                  <span
                    key={idx}
                    className="text-sm px-3 py-1 rounded-full bg-gradient-to-r from-white/8 to-white/4 backdrop-blur-sm"
                  >
                    {specialty}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-6 backdrop-blur-md bg-white/6 border border-white/6 shadow-lg">
            <h2 className="text-2xl font-semibold text-white/95 mb-4">Latest Articles</h2>
            <div className="space-y-6">
              {blogPosts.filter((p) => p.status === 'published').map((post) => (
                <article key={post.id} className="border-b border-white/8 pb-5 last:border-b-0">
                  <h3 className="text-xl font-semibold text-white/95 mb-1">{post.title}</h3>
                  <p className="text-white/70 mb-2">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.date).toLocaleDateString()}
                    </span>
                    <span>{post.readTime}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl p-5 backdrop-blur-md bg-white/6 border border-white/6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-5 h-5 text-white/90" />
              <h3 className="text-lg font-semibold text-white/95">Chat with {chatbot.name}</h3>
            </div>
            <div className="flex flex-col h-72 rounded-md overflow-hidden border border-white/6">
              <div className="flex-1 p-4 overflow-y-auto bg-white/3">
                {chatMessages.length === 0 && (
                  <div className="text-white/70 text-sm">{chatbot.greeting}</div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`mb-3 ${msg.type === 'user' ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`inline-block px-3 py-2 rounded-lg text-sm ${
                        msg.type === 'user' ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white' : 'bg-white/6 text-white/90'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="text-left mb-3">
                    <div className="inline-block px-3 py-2 rounded-lg text-sm bg-white/6 text-white/90">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-white/6 bg-white/3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 rounded-lg text-sm bg-transparent border border-white/8 focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 text-white text-sm hover:opacity-95"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl p-5 backdrop-blur-md bg-white/6 border border-white/6 shadow-lg">
            <h3 className="text-lg font-semibold text-white/95 mb-3">Quick Info</h3>
            <div className="space-y-3 text-sm text-white/85">
              <div>
                <span className="font-medium">Experience:</span>
                <span className="ml-2">{profile.experience}</span>
              </div>
              <div>
                <span className="font-medium">Languages:</span>
                <span className="ml-2">{profile.languages.join(', ')}</span>
              </div>
              <div>
                <span className="font-medium">Certifications:</span>
                <div className="mt-1 space-y-1">
                  {profile.certifications.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-white/85">
                      <Star className="w-3 h-3" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );

  /* -- MAIN RENDER (Editor + Controls) -- */
  if (showPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-600/10 via-indigo-700/6 to-black/2">
        <div className="bg-white/4 backdrop-blur-md border border-white/6 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <h1 className="text-xl font-semibold text-white/95">Portfolio Preview</h1>
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 bg-white/6 text-white rounded-lg hover:bg-white/8 flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Back to Editor
            </button>
          </div>
        </div>
        <PreviewPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50">
      {/* Decorative background blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 w-96 h-96 rounded-full bg-gradient-to-tr from-sky-300/30 to-indigo-300/20 blur-3xl" />
        <div className="absolute -right-40 -bottom-40 w-96 h-96 rounded-full bg-gradient-to-tr from-pink-300/20 to-yellow-200/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30">
        <div className="backdrop-blur-md bg-white/40 border-b border-white/10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-md px-3 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white font-semibold shadow-sm">
                Agent Dashboard
              </div>
              <div className="text-sm text-gray-600">Manage portfolio, chatbot & blog</div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(true)}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:opacity-95 flex items-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview Portfolio
              </button>
              <button className="px-3 py-2 rounded-lg border border-white/8 bg-white/6 backdrop-blur-sm">
                <Settings className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-72 p-6">
          <nav className="space-y-4">
            <div
              className="rounded-2xl p-4 backdrop-blur-md bg-white/6 border border-white/6 shadow"
              aria-hidden
            >
              <div className="text-sm text-white/90 font-medium">Navigation</div>
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white'
                      : 'text-gray-700 bg-white/6 hover:bg-white/8'
                  }`}
                >
                  <User className="w-5 h-5" />
                  Profile Settings
                </button>

                <button
                  onClick={() => setActiveTab('chatbot')}
                  className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition ${
                    activeTab === 'chatbot'
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white'
                      : 'text-gray-700 bg-white/6 hover:bg-white/8'
                  }`}
                >
                  <Bot className="w-5 h-5" />
                  AI Chatbot
                </button>

                <button
                  onClick={() => setActiveTab('blog')}
                  className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition ${
                    activeTab === 'blog'
                      ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white'
                      : 'text-gray-700 bg-white/6 hover:bg-white/8'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  Blog Management
                </button>
              </div>
            </div>

            <div className="rounded-2xl p-4 backdrop-blur-md bg-white/6 border border-white/6 shadow">
              <h4 className="text-sm font-semibold text-white/95">Quick Profile</h4>
              <div className="mt-3 flex items-center gap-3">
                <img src={profile.avatar} alt="avatar" className="w-12 h-12 rounded-full object-cover ring-1 ring-white/10" />
                <div>
                  <div className="font-semibold text-white/95">{profile.name}</div>
                  <div className="text-sm text-white/80">{profile.title}</div>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 max-w-7xl mx-auto">
          {activeTab === 'profile' && (
            <section className="space-y-6">
              <div className="rounded-2xl p-6 backdrop-blur-md bg-white/6 border border-white/6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <User className="w-6 h-6" />
                  Profile Settings
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleProfileUpdate('name', e.target.value)}
                      className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title</label>
                    <input
                      type="text"
                      value={profile.title}
                      onChange={(e) => handleProfileUpdate('title', e.target.value)}
                      className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
                    <input
                      type="text"
                      value={profile.company}
                      onChange={(e) => handleProfileUpdate('company', e.target.value)}
                      className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleProfileUpdate('email', e.target.value)}
                      className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleProfileUpdate('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={profile.location}
                      onChange={(e) => handleProfileUpdate('location', e.target.value)}
                      className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Bio</label>
                  <textarea
                    rows="4"
                    value={profile.bio}
                    onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                    className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                  />
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialties (comma-separated)</label>
                    <input
                      type="text"
                      value={profile.specialties.join(', ')}
                      onChange={(e) => handleProfileUpdate('specialties', e.target.value.split(',').map(s => s.trim()))}
                      className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                    <input
                      type="text"
                      value={profile.experience}
                      onChange={(e) => handleProfileUpdate('experience', e.target.value)}
                      className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <button className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-lg shadow hover:opacity-95 flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Profile
                  </button>
                  <button
                    onClick={() => setShowPreview(true)}
                    className="px-4 py-2 border border-white/8 rounded-lg bg-white/6"
                  >
                    Preview
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'chatbot' && (
            <section className="space-y-6">
              <div className="rounded-2xl p-6 backdrop-blur-md bg-white/6 border border-white/6 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Bot className="w-6 h-6" />
                  AI Chatbot Configuration
                </h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Chatbot Name</label>
                    <input
                      type="text"
                      value={chatbot.name}
                      onChange={(e) => handleChatbotUpdate('name', e.target.value)}
                      className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Greeting Message</label>
                    <textarea
                      rows="3"
                      value={chatbot.greeting}
                      onChange={(e) => handleChatbotUpdate('greeting', e.target.value)}
                      className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Personality Description</label>
                      <input
                        type="text"
                        value={chatbot.personality}
                        onChange={(e) => handleChatbotUpdate('personality', e.target.value)}
                        className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Knowledge Base</label>
                      <textarea
                        rows="2"
                        value={chatbot.knowledgeBase}
                        onChange={(e) => handleChatbotUpdate('knowledgeBase', e.target.value)}
                        className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Predefined Responses</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">About Agent Response</label>
                        <textarea
                          rows="3"
                          value={chatbot.responses.aboutAgent}
                          onChange={(e) =>
                            handleChatbotUpdate('responses', { ...chatbot.responses, aboutAgent: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Services Response</label>
                        <textarea
                          rows="3"
                          value={chatbot.responses.services}
                          onChange={(e) =>
                            handleChatbotUpdate('responses', { ...chatbot.responses, services: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Scheduling Response</label>
                        <textarea
                          rows="3"
                          value={chatbot.responses.scheduling}
                          onChange={(e) =>
                            handleChatbotUpdate('responses', { ...chatbot.responses, scheduling: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Response</label>
                        <textarea
                          rows="3"
                          value={chatbot.responses.contact}
                          onChange={(e) =>
                            handleChatbotUpdate('responses', { ...chatbot.responses, contact: e.target.value })
                          }
                          className="w-full px-3 py-2 border border-white/8 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white/6"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button className="px-6 py-3 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-lg shadow flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Chatbot Settings
                  </button>
                  <button onClick={() => setShowPreview(true)} className="px-4 py-2 border rounded-lg bg-white/6">
                    Preview
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeTab === 'blog' && (
            <section className="space-y-6">
              <div className="rounded-2xl overflow-hidden backdrop-blur-md bg-white/6 border border-white/6 shadow-lg">
                <div className="p-6 border-b border-white/8">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Blog Management
                  </h2>
                </div>

                <div className="p-6">
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4">{editingPost ? 'Edit Post' : 'Create New Post'}</h3>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                        <input
                          type="text"
                          value={newPost.title}
                          onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-white/8 rounded-lg bg-white/6 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          placeholder="Enter post title..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
                        <textarea
                          rows="2"
                          value={newPost.excerpt}
                          onChange={(e) => setNewPost((prev) => ({ ...prev, excerpt: e.target.value }))}
                          className="w-full px-3 py-2 border border-white/8 rounded-lg bg-white/6 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          placeholder="Brief description of your post..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                        <textarea
                          rows="8"
                          value={newPost.content}
                          onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                          className="w-full px-3 py-2 border border-white/8 rounded-lg bg-white/6 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          placeholder="Write your blog post content here..."
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                          <select
                            value={newPost.status}
                            onChange={(e) => setNewPost((prev) => ({ ...prev, status: e.target.value }))}
                            className="px-3 py-2 border border-white/8 rounded-lg bg-white/6 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                          </select>
                        </div>

                        <div className="flex gap-2">
                          {editingPost && (
                            <button
                              onClick={() => {
                                setEditingPost(null);
                                setNewPost({ title: '', excerpt: '', content: '', status: 'draft' });
                              }}
                              className="px-4 py-2 border border-white/8 rounded-lg bg-white/6"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            onClick={editingPost ? handleUpdateBlogPost : handleAddBlogPost}
                            className="px-6 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-lg flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            {editingPost ? 'Update Post' : 'Add Post'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Existing Posts</h3>

                    {blogPosts.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No blog posts yet. Create your first post above!</p>
                    ) : (
                      <div className="space-y-4">
                        {blogPosts.map((post) => (
                          <div key={post.id} className="border border-white/8 rounded-lg p-4 backdrop-blur-sm bg-white/6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-lg">{post.title}</h4>
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {post.status}
                                  </span>
                                </div>
                                <p className="text-gray-600 mb-2">{post.excerpt}</p>
                                <div className="text-sm text-gray-500">
                                  {new Date(post.date).toLocaleDateString()} • {post.readTime}
                                </div>
                              </div>

                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => handleEditBlogPost(post)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Edit post"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteBlogPost(post.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Delete post"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div> 
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
