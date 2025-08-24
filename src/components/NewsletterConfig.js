import React, { useState } from "react";
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
  Type
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
      {/* Toolbar */}
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

      {/* Editor */}
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

function NewsletterConfig({ darkMode = true }) {
  const [activeTab, setActiveTab] = useState('guide');
  const [showPreview, setShowPreview] = useState(false);

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
  const [subscribers, setSubscribers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
    { id: 4, name: 'Alice Brown', email: 'alice@example.com' },
    { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com' },
    { id: 6, name: 'Diana Davis', email: 'diana@example.com' },
    { id: 7, name: 'Eva Garcia', email: 'eva@example.com' },
    { id: 8, name: 'Frank Miller', email: 'frank@example.com' },
    { id: 9, name: 'Grace Lee', email: 'grace@example.com' },
    { id: 10, name: 'Henry Taylor', email: 'henry@example.com' },
    { id: 11, name: 'Ivy Chen', email: 'ivy@example.com' },
    { id: 12, name: 'Jack Anderson', email: 'jack@example.com' }
  ]);

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
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Subscriber functions
  const addSubscriber = () => {
    const newSubscriber = {
      id: Math.max(...subscribers.map(s => s.id), 0) + 1,
      name: '',
      email: ''
    };
    // Add to the beginning of the array
    setSubscribers([newSubscriber, ...subscribers]);
    // Reset to first page to show the new subscriber
    setCurrentPage(1);
    setSearchTerm(''); // Clear search to ensure new subscriber is visible
  };


  const removeSubscriber = (id) => {
    setSubscribers(subscribers.filter(sub => sub.id !== id));
    
    // Adjust current page if needed after deletion
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


  const handleSave = () => {
    const configData = {
      settings: newsletterSettings,
      content: newsletterContent,
      subscribers,
      theme: selectedTheme,
      lastUpdated: new Date().toISOString()
    };
    
    const jsonData = JSON.stringify(configData, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert("Newsletter configuration saved successfully!");
  };

  const handleSendNewsletter = () => {
    const validSubscribers = subscribers.filter(sub => sub.email && sub.email.includes('@'));
    
    if (validSubscribers.length === 0) {
      alert('Please add at least one subscriber with a valid email address.');
      return;
    }

    if (!newsletterContent || newsletterContent.trim() === '') {
      alert('Please add some content to your newsletter before sending.');
      return;
    }

    const confirmMessage = `Are you sure you want to send this newsletter to ${validSubscribers.length} subscriber(s)?`;
    
    if (window.confirm(confirmMessage)) {
      // In a real application, this would integrate with an email service
      alert(`Newsletter would be sent to ${validSubscribers.length} subscribers!\n\nIn a production environment, this would integrate with email services like SendGrid, Mailchimp, or AWS SES.`);
    }
  };

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

      {/* Search Bar */}
      <div className="relative">
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          placeholder="Search subscribers by name or email..."
          className={`w-full pl-10 pr-4 py-3 rounded-lg border transition-colors ${
            darkMode 
              ? 'bg-zinc-900/50 border-gray-600 text-white' 
              : 'bg-gray-50 border-gray-200 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20`}
        />
      </div>

      {/* Subscribers List */}
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
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl text-white font-bold">Newsletter Manager</h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                Create and manage your email newsletters
              </p>
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
                  className={`flex items-center px-4 py-3 rounded-xl font-medium transition-all hover:text-yellow-400 hover:scale-105 duration-300 ease-in-out
                    ${activeTab === tab.id 
                      ? 'text-yellow-400' 
                      : darkMode 
                        ? 'hover:text-yellow-400 text-gray-300' 
                        : 'hover:text-yellow-400 text-gray-600'
                    }`}
                >
                  <IconComponent size={18} className="mr-2" />
                  <span>{tab.label}</span>
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
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center px-6 py-3 bg-gray-400/20 hover:bg-gray-400/50 text-white border rounded-xl hover:bg-gray-700 transition-colors font-semibold"
          >
            <Eye size={18} className="mr-2" />
            Preview Newsletter
          </button>
          
          <div className="flex space-x-4">
            <button
              onClick={handleSave}
              className="flex items-center px-6 py-3 bg-green-500/20 border border-green-400 text-green-400 rounded-lg hover:bg-green-500/50 hover:text-green-300 transition-colors font-semibold duration-300"
            >
              <Save size={18} className="mr-2" />
              Save Configuration
            </button>
            
            <button
              onClick={handleSendNewsletter}
              className="flex items-center px-6 py-3 bg-yellow-500/20 border border-yellow-400 text-yellow-400 font-semibold rounded-lg  hover:bg-yellow-500/50 hover:text-yellow-300 transition-colors duration-300"
            >
              <Send size={18} className="mr-2" />
              Send Newsletter
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && renderPreview()}
    </div>
  );
}

export default NewsletterConfig;