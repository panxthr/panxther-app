import React, { useState, useEffect } from "react";
import { 
  Search,
  ChevronLeft,
  ChevronRight,
  Mail, 
  User, 
  Settings, 
  Eye, 
  Plus, 
  X, 
  Save, 
  Send, 
  Users, 
  Image as ImageIcon, 
  Info,
  Palette,
  FileText,
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  ListOrdered,
  Link,
  Type,
  CheckCircle,
  AlertCircle,
  Clock,
  BarChart
} from "lucide-react";

// Rich Text Editor Component (simplified version)
const RichTextEditor = ({ value, onChange, placeholder = 'Start writing...' }) => {
  const editorRef = React.useRef(null);

  const handleCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
    handleContentChange();
  };

  const handleContentChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  React.useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const ToolbarButton = ({ onClick, children, title }) => (
    <button
      onClick={onClick}
      className="p-2 rounded hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
      title={title}
      type="button"
    >
      {children}
    </button>
  );

  return (
    <div className="w-full bg-white border border-gray-300 rounded-lg shadow-sm">
      <div className="flex flex-wrap items-center gap-1 p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <ToolbarButton onClick={() => handleCommand('bold')} title="Bold">
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => handleCommand('italic')} title="Italic">
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => handleCommand('underline')} title="Underline">
            <Underline size={16} />
          </ToolbarButton>
        </div>
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
          <ToolbarButton onClick={() => handleCommand('justifyLeft')} title="Align Left">
            <AlignLeft size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => handleCommand('justifyCenter')} title="Align Center">
            <AlignCenter size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => handleCommand('justifyRight')} title="Align Right">
            <AlignRight size={16} />
          </ToolbarButton>
        </div>
        <div className="flex items-center gap-1">
          <ToolbarButton onClick={() => handleCommand('insertUnorderedList')} title="Bullet List">
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => handleCommand('insertOrderedList')} title="Numbered List">
            <ListOrdered size={16} />
          </ToolbarButton>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        className="min-h-[400px] p-4 outline-none overflow-y-auto focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
        style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
        onInput={handleContentChange}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style jsx>{`
        [contenteditable]:empty::before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        
        [contenteditable] h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; }
        [contenteditable] h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0; }
        [contenteditable] ul, [contenteditable] ol { margin: 1em 0; padding-left: 2em; }
        [contenteditable] li { margin: 0.5em 0; }
      `}</style>
    </div>
  );
};

// Send Modal Component
const SendModal = ({ isOpen, onClose, onSend, loading, subscriberCount }) => {
  const [subject, setSubject] = useState('Newsletter Update');
  const [testMode, setTestMode] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend({ subject, testMode, selectedTheme });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Send Newsletter</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Subject Line</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Theme (optional)</label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Use saved theme</option>
              <option value="classic">Classic</option>
              <option value="modern">Modern</option>
              <option value="corporate">Corporate</option>
              <option value="vibrant">Vibrant</option>
            </select>
          </div>

    

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              {testMode 
                ? `This will send to your ${subscriberCount} configured subscribers`
                : "This will send to all registered users in the system"}
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Clock size={16} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={16} className="mr-2" />
                  Send Newsletter
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

function NewsletterConfig({ darkMode = true, userId = 'user_12345' }) {
  const [activeTab, setActiveTab] = useState('guide');
  const [showPreview, setShowPreview] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

  // API Base URL - adjust this to match your server
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/users';

  // Newsletter settings
  const [newsletterSettings, setNewsletterSettings] = useState({
    senderName: "Your Company",
    senderEmail: "newsletter@yourcompany.com",
    profilePicture: "",
    tagMessage: "Thank you for subscribing to our newsletter!"
  });

  // Content state
  const [newsletterContent, setNewsletterContent] = useState('<h1>Welcome to Our Newsletter!</h1><p>Add your newsletter content here...</p>');

  // Subscribers state
  const [subscribers, setSubscribers] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const subscribersPerPage = 10;

  // Theme state
  const [selectedTheme, setSelectedTheme] = useState('classic');

  const themes = {
    classic: {
      name: 'Classic',
      colors: {
        primary: '#2563eb',
        secondary: '#f8fafc',
        text: '#1e293b',
        accent: '#3b82f6'
      }
    },
    modern: {
      name: 'Modern',
      colors: {
        primary: '#7c3aed',
        secondary: '#faf5ff',
        text: '#374151',
        accent: '#8b5cf6'
      }
    },
    corporate: {
      name: 'Corporate',
      colors: {
        primary: '#1f2937',
        secondary: '#f9fafb',
        text: '#111827',
        accent: '#4b5563'
      }
    },
    vibrant: {
      name: 'Vibrant',
      colors: {
        primary: '#dc2626',
        secondary: '#fef2f2',
        text: '#1f2937',
        accent: '#ef4444'
      }
    }
  };

  const tabs = [
    { id: 'guide', label: 'Getting Started', icon: Info },
    { id: 'content', label: 'Content Editor', icon: FileText },
    { id: 'subscribers', label: 'Subscribers', icon: Users },
    { id: 'design', label: 'Design & Theme', icon: Palette },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'analytics', label: 'Analytics', icon: BarChart }
  ];

  // API Functions
  const fetchNewsletterConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${userId}/newsletter-config`);
      const data = await response.json();
      
      if (data.success && data.config) {
        setNewsletterSettings(data.config.settings);
        setNewsletterContent(data.config.content);
        setSubscribers(data.config.subscribers || []);
        setSelectedTheme(data.config.theme || 'classic');
      }
    } catch (error) {
      setError('Failed to load newsletter configuration');
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveNewsletterConfig = async () => {
    try {
      setSaving(true);
      setError('');
      
      const configData = {
        settings: newsletterSettings,
        content: newsletterContent,
        subscribers,
        theme: selectedTheme
      };

      const response = await fetch(`${API_BASE_URL}/${userId}/newsletter-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Newsletter configuration saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Failed to save configuration');
      }
    } catch (error) {
      setError('Failed to save newsletter configuration');
      console.error('Error saving config:', error);
    } finally {
      setSaving(false);
    }
  };

  const sendNewsletter = async ({ subject, testMode, selectedTheme: sendTheme }) => {
    try {
      setSending(true);
      setError('');
      
      const response = await fetch(`${API_BASE_URL}/${userId}/send-newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject,
          testMode,
          selectedTheme: sendTheme
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Newsletter sent successfully to ${data.results.sent} recipients!`);
        setShowSendModal(false);
        fetchStats();
        fetchHistory();
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.message || 'Failed to send newsletter');
      }
    } catch (error) {
      setError('Failed to send newsletter');
      console.error('Error sending newsletter:', error);
    } finally {
      setSending(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/newsletter-stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/${userId}/newsletter-history?limit=10`);
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchNewsletterConfig();
    fetchStats();
    fetchHistory();
  }, [userId]);

  // Subscriber functions
  const addSubscriber = () => {
    const newSubscriber = {
      id: Math.max(...subscribers.map(s => s.id), 0) + 1,
      name: '',
      email: ''
    };
    setSubscribers([newSubscriber, ...subscribers]);
    setCurrentPage(1);
    setSearchTerm('');
  };

  const removeSubscriber = (id) => {
    setSubscribers(subscribers.filter(sub => sub.id !== id));
    
    const filteredSubs = getFilteredSubscribers().filter(sub => sub.id !== id);
    const maxPage = Math.ceil(filteredSubs.length / subscribersPerPage);
    if (currentPage > maxPage && maxPage > 0) {
      setCurrentPage(maxPage);
    }
  };

  const updateSubscriber = (id, field, value) => {
    setSubscribers(subscribers.map(sub => 
      sub.id === id ? { ...sub, [field]: value } : sub
    ));
  };

  const getFilteredSubscribers = () => {
    return subscribers.filter(subscriber => 
      subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getCurrentPageSubscribers = () => {
    const filtered = getFilteredSubscribers();
    const startIndex = (currentPage - 1) * subscribersPerPage;
    const endIndex = startIndex + subscribersPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredSubscribers().length / subscribersPerPage);

  // Notification component
  const Notification = ({ type, message }) => {
    if (!message) return null;
    
    return (
      <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center ${
        type === 'success' 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}>
        {type === 'success' ? (
          <CheckCircle size={20} className="mr-2" />
        ) : (
          <AlertCircle size={20} className="mr-2" />
        )}
        {message}
      </div>
    );
  };

  const renderAnalytics = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg text-white font-semibold mb-2">Newsletter Analytics</h3>
        <p className="text-sm text-gray-400 mb-6">
          Track your newsletter performance and engagement
        </p>
      </div>

      {stats && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Sends</p>
                <p className="text-2xl font-bold text-white">{stats.totalSends}</p>
              </div>
              <Send size={24} className="text-blue-500" />
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Recipients</p>
                <p className="text-2xl font-bold text-white">{stats.totalRecipients}</p>
              </div>
              <Users size={24} className="text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">{stats.successRate}%</p>
              </div>
              <CheckCircle size={24} className="text-yellow-500" />
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Subscribers</p>
                <p className="text-2xl font-bold text-white">{stats.subscribersCount}</p>
              </div>
              <Mail size={24} className="text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Recent History */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h4 className="font-semibold text-white mb-4">Recent Newsletter Sends</h4>
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((send) => (
              <div key={send.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">{send.subject}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(send.sentAt).toLocaleDateString()} - 
                    {send.successful} sent, {send.failed} failed
                    {send.testMode && ' (Test Mode)'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-400">
                    {Math.round((send.successful / send.recipients) * 100)}% success
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No newsletter sends yet</p>
        )}
      </div>
    </div>
  );

  const renderGuide = () => (
    <div className="space-y-6">
      <div className={`${darkMode ? 'border-yellow-400' : 'border-blue-200'} border rounded-xl p-6`}>
        <div className="flex items-start space-x-3">
          <Info size={20} className={`mt-1 ${darkMode ? 'text-yellow-400' : 'text-blue-600'}`} />
          <div>
            <h3 className={`font-semibold mb-2 ${darkMode ? 'text-yellow-300' : 'text-blue-800'}`}>
              Welcome to Newsletter Manager
            </h3>
            <p className={`text-sm ${darkMode ? 'text-yellow-400' : 'text-blue-700'} leading-relaxed `}>
              This is a comprehensive email newsletter service that allows you to create, design, and send beautiful newsletters to your subscribers. 
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className={`${darkMode ? 'bg-gray-800/50 text-white border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
          <h4 className="font-semibold mb-3 flex text-yellow-500 items-center">
            <FileText size={18} className="mr-2 text-yellow-500" />
            Content Creation
          </h4>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Use the Content Editor to create engaging newsletter content with rich text formatting, 
            images, and links.
          </p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800/50 text-white border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
          <h4 className="font-semibold text-yellow-500 mb-3 flex items-center">
            <Users size={18} className="mr-2 text-yellow-500" />
            Subscriber Management
          </h4>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Add and manage your subscribers' information including names and email addresses 
            for personalized communication.
          </p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800/50 text-yellow-500 text-white border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
          <h4 className="font-semibold mb-3 flex items-center">
            <Palette size={18} className="mr-2 text-yellow-500" />
            Theme Customization
          </h4>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Choose from professional themes or customize colors to match your brand identity 
            and create visually appealing newsletters.
          </p>
        </div>

        <div className={`${darkMode ? 'bg-gray-800/50 text-yellow-500 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
          <h4 className="font-semibold mb-3 flex items-center">
            <Eye size={18} className="mr-2 text-yellow-500" />
            Preview & Send
          </h4>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Preview your newsletter with different themes and send test emails before 
            broadcasting to your entire subscriber list.
          </p>
        </div>
      </div>

      <div className={`${darkMode ? 'bg-gradient-to-r from-blue-900/20 text-white to-purple-900/20 border-blue-700' : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'} border rounded-xl p-6`}>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white`}>
              1
            </div>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
              Create your newsletter content and customize the design
            </p>
          </div>
          <div className="text-center">
            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${darkMode ? 'bg-purple-600' : 'bg-purple-500'} text-white`}>
              2
            </div>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
              Add subscribers and configure sender settings
            </p>
          </div>
          <div className="text-center">
            <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${darkMode ? 'bg-green-600' : 'bg-green-500'} text-white`}>
              3
            </div>
            <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
              Preview and send your newsletter to all subscribers
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContentEditor = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg text-white font-semibold mb-2">Newsletter Content</h3>
        <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-600'} mb-4`}>
          Create your newsletter content using the rich text editor below
        </p>
        <RichTextEditor 
          value={newsletterContent}
          onChange={setNewsletterContent}
          placeholder="Start writing your newsletter content..."
        />
      </div>
    </div>
  );

  const renderSubscribers = () => (
    <div className="space-y-6  min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg text-white font-semibold">Subscriber Management</h3>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
            Manage your newsletter subscribers
          </p>
        </div>
        <button
          onClick={addSubscriber}
          className="flex items-center text-gray-400 hover:text-yellow-100 hover:scale-105 transition-transform transition-colors duration-300"
        >
          <Plus size={16} className="mr-2" />
          Add Subscriber
        </button>
      </div>

      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search subscribers by name or email..."
          className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
            darkMode 
              ? 'bg-zinc-900/50 border-gray-600 text-white' 
              : 'bg-gray-50 border-gray-200 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
        />
      </div>

      <div className="grid gap-3">
        {getCurrentPageSubscribers().map((subscriber) => (
          <div key={subscriber.id} className={`${
            darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
          } border rounded-lg p-4`}>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={subscriber.name}
                  onChange={(e) => updateSubscriber(subscriber.id, 'name', e.target.value)}
                  placeholder="Enter subscriber name..."
                  className={`w-full px-3 py-2 rounded-lg border transition-colors text-sm ${
                    darkMode 
                      ? 'bg-zinc-900/50 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                />
              </div>
              <div className="flex-1">
                <input
                  type="email"
                  value={subscriber.email}
                  onChange={(e) => updateSubscriber(subscriber.id, 'email', e.target.value)}
                  placeholder="Enter email address..."
                  className={`w-full px-3 py-2 rounded-lg border transition-colors text-sm ${
                    darkMode 
                      ? 'bg-zinc-900/50 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
                />
              </div>
              <button
                onClick={() => removeSubscriber(subscriber.id)}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'hover:text-red-400 text-gray-400' : 'hover:bg-gray-100 text-red-500'
                }`}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing {((currentPage - 1) * subscribersPerPage) + 1} to {Math.min(currentPage * subscribersPerPage, getFilteredSubscribers().length)} of {getFilteredSubscribers().length} subscribers
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                currentPage === 1 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'text-white hover:text-yellow-400'
              }`}
            >
              <ChevronLeft size={16} className="mr-1" />
              Previous
            </button>
            <span className="text-white px-3 py-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                currentPage === totalPages 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'text-white hover:text-yellow-400'
              }`}
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className={`${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'} border rounded-xl p-6`}>
        <h4 className="font-semibold text-white mb-2 flex items-center">
          <Info size={18} className="mr-2 text-blue-500" />
          Subscriber Statistics
        </h4>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
          Total Subscribers: <span className="font-semibold">{subscribers.length}</span>
        </p>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
          Valid Email Addresses: <span className="font-semibold">{subscribers.filter(s => s.email && s.email.includes('@')).length}</span>
        </p>
        {searchTerm && (
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Filtered Results: <span className="font-semibold">{getFilteredSubscribers().length}</span>
          </p>
        )}
      </div>
    </div>
  );

  const renderDesign = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg text-white font-semibold mb-2">Newsletter Themes</h3>
        <p className={`text-sm ${darkMode ? 'text-gray-400 ' : 'text-gray-600'} mb-6`}>
          Choose a theme for your newsletter design
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(themes).map(([themeId, theme]) => (
            <div 
              key={themeId}
              onClick={() => setSelectedTheme(themeId)}
              className={`cursor-pointer border-2 rounded-xl p-4 transition-all hover:scale-105 ${
                selectedTheme === themeId 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="mb-3">
                <div 
                  className="h-20 rounded-lg mb-2"
                  style={{ backgroundColor: theme.colors.primary }}
                ></div>
                <div 
                  className="h-6 rounded"
                  style={{ backgroundColor: theme.colors.secondary }}
                ></div>
              </div>
              <h4 className="font-medium text-white">{theme.name}</h4>
              <div className="flex space-x-1 mt-2">
                {Object.values(theme.colors).map((color, index) => (
                  <div 
                    key={index}
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: color }}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center px-6 py-3 bg-blue-600 border text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Eye size={18} className="mr-2" />
          Preview Newsletter
        </button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-white">Sender Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-400">Sender Name</label>
            <input
              type="text"
              value={newsletterSettings.senderName}
              onChange={(e) => setNewsletterSettings(prev => ({...prev, senderName: e.target.value}))}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-zinc-900/50 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 font-medium mb-2">Sender Email</label>
            <input
              type="email"
              value={newsletterSettings.senderEmail}
              onChange={(e) => setNewsletterSettings(prev => ({...prev, senderEmail: e.target.value}))}
              className={`w-full px-4 py-3 rounded-lg border transition-colors ${
                darkMode 
                  ? 'bg-zinc-900/50 border-gray-600 text-white' 
                  : 'bg-gray-50 border-gray-200 text-gray-900'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 font-medium mb-2">Profile Picture URL</label>
        <input
          type="url"
          value={newsletterSettings.profilePicture}
          onChange={(e) => setNewsletterSettings(prev => ({...prev, profilePicture: e.target.value}))}
          placeholder="https://example.com/profile.jpg"
          className={`w-full px-4 py-3 rounded-lg border transition-colors ${
            darkMode 
              ? 'bg-zinc-900/50 border-gray-600 text-white' 
              : 'bg-gray-50 border-gray-200 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 font-medium mb-2">Tag Message</label>
        <textarea
          value={newsletterSettings.tagMessage}
          onChange={(e) => setNewsletterSettings(prev => ({...prev, tagMessage: e.target.value}))}
          rows={3}
          placeholder="A personal message to include in your newsletters..."
          className={`w-full px-4 py-3 rounded-lg border transition-colors ${
            darkMode 
              ? 'bg-zinc-900/50 border-gray-600 text-white' 
              : 'bg-gray-50 border-gray-200 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
        />
      </div>
    </div>
  );

  const renderPreview = () => {
    const theme = themes[selectedTheme];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Newsletter Preview</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div 
              className="max-w-lg mx-auto rounded-lg shadow-lg overflow-hidden"
              style={{ backgroundColor: theme.colors.secondary }}
            >
              {/* Header */}
              <div 
                className="p-6 text-white"
                style={{ backgroundColor: theme.colors.primary }}
              >
                <div className="flex items-center space-x-4">
                  {newsletterSettings.profilePicture && (
                    <img 
                      src={newsletterSettings.profilePicture} 
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover"
                      onError={(e) => {e.target.style.display = 'none'}}
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{newsletterSettings.senderName}</h2>
                    <p className="text-sm opacity-90">{newsletterSettings.senderEmail}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div 
                className="p-6"
                style={{ color: theme.colors.text }}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: newsletterContent }}
                  className="prose prose-sm max-w-none"
                />
                
                {newsletterSettings.tagMessage && (
                  <div 
                    className="mt-6 p-4 rounded-lg text-sm"
                    style={{ backgroundColor: theme.colors.accent + '20', color: theme.colors.accent }}
                  >
                    {newsletterSettings.tagMessage}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 text-center text-sm text-gray-500 border-t">
                <p>© 2024 {newsletterSettings.senderName}. All rights reserved.</p>
                <p className="mt-1">You received this email because you subscribed to our newsletter.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? ' ' : 'bg-gray-50 text-gray-900'}`}>
      {/* Notifications */}
      <Notification type="success" message={success} />
      <Notification type="error" message={error} />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl text-white font-bold">Newsletter Manager</h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Create and manage your email newsletters
              </p>
            </div>
            {loading && (
              <div className="flex items-center text-gray-400">
                <Clock size={16} className="mr-2 animate-spin" />
                Loading...
              </div>
            )}
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
                  className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all hover:text-yellow-400 hover:scale-105 duration-300 ease-in-out
                    ${activeTab === tab.id 
                      ? 'text-yellow-400' 
                      : darkMode 
                        ? 'hover:text-yellow-400 text-gray-300' 
                        : 'hover:text-yellow-400 text-gray-600'
                    }`}
                >
                  <IconComponent size={18} className="mr-2" />
                  <span className="hidden sm:block">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`${
          darkMode ? 'bg-gray-200/5 border-gray-700' : 'bg-white/30 border-gray-200'
        } backdrop-blur-md rounded-2xl border p-8 mb-8`}>
          {activeTab === 'guide' && renderGuide()}
          {activeTab === 'content' && renderContentEditor()}
          {activeTab === 'subscribers' && renderSubscribers()}
          {activeTab === 'design' && renderDesign()}
          {activeTab === 'settings' && renderSettings()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center justify-center px-6 py-3 bg-gray-400/20 hover:bg-gray-400/50 text-white border rounded-xl hover:bg-gray-700 transition-colors font-semibold"
          >
            <Eye size={18} className="mr-2" />
            Preview Newsletter
          </button>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              onClick={saveNewsletterConfig}
              disabled={saving}
              className="flex items-center justify-center px-6 py-3 bg-green-500/20 border border-green-400 text-green-400 rounded-lg hover:bg-green-500/50 hover:text-green-300 transition-colors font-semibold duration-300 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Clock size={18} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Configuration
                </>
              )}
            </button>
            
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center justify-center px-6 py-3 bg-yellow-500/20 border border-yellow-400 text-yellow-400 font-semibold rounded-lg hover:bg-yellow-500/50 hover:text-yellow-300 transition-colors duration-300"
            >
              <Send size={18} className="mr-2" />
              Send Newsletter
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && renderPreview()}
      
      {/* Send Modal */}
      <SendModal 
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSend={sendNewsletter}
        loading={sending}
        subscriberCount={subscribers.filter(s => s.email && s.email.includes('@')).length}
      />
    </div>
  );
}

export default NewsletterConfig;