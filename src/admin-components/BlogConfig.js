import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  Clock,
  Search,
  Filter,
  Save,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image,
  Video,
  Link,
  Type,
  ArrowLeft,
  Settings,
  Tag,
  Upload,
  Loader,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import RichTextEditor from './helper-components/Richtext';

const BlogConfig = ({ userId = "user_12345" }) => {
  const [activeView, setActiveView] = useState('catalog'); // 'catalog', 'editor'
  const [editingPost, setEditingPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Blog posts state
  const [blogPosts, setBlogPosts] = useState([]);

  // Editor state
  const [editorContent, setEditorContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postTags, setPostTags] = useState('');

  const editorRef = useRef(null);

  // API Base URL - adjust this to match your server
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch blogs from server
  const fetchBlogs = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/blogs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setBlogPosts(data.blogs || []);
      } else {
        throw new Error(data.message || 'Failed to fetch blogs');
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
      setError('Failed to load blog posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load blogs when component mounts
  useEffect(() => {
    fetchBlogs();
  }, [userId]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Filter and sort posts
  const filteredPosts = blogPosts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
        case 'oldest':
          return new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt);
        case 'views':
          return (b.views || 0) - (a.views || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  // CRUD operations
  const createNewPost = () => {
    setEditingPost(null);
    setPostTitle('');
    setPostExcerpt('');
    setEditorContent('');
    setPostTags('');
    setActiveView('editor');
    setError('');
    setSuccess('');
  };

  const editPost = (post) => {
    setEditingPost(post);
    setPostTitle(post.title);
    setPostExcerpt(post.excerpt || '');
    setEditorContent(post.content);
    setPostTags(post.tags ? post.tags.join(', ') : '');
    setActiveView('editor');
    setError('');
    setSuccess('');
  };

  const savePost = async (status = 'draft') => {
    if (!postTitle.trim()) {
      setError('Post title is required');
      return;
    }

    if (!editorContent.trim()) {
      setError('Post content is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const postData = {
        title: postTitle.trim(),
        excerpt: postExcerpt.trim(),
        content: editorContent.trim(),
        status: status,
        tags: postTags.split(',').map(tag => tag.trim()).filter(tag => tag),
        featured: false,
        author: 'John Smith', // You might want to get this from user context
        date: editingPost ? editingPost.date : new Date().toISOString().split('T')[0]
      };

      const url = editingPost 
        ? `${API_BASE_URL}/api/users/${userId}/blogs/${editingPost.id}`
        : `${API_BASE_URL}/api/users/${userId}/blogs`;
      
      const method = editingPost ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Blog post ${editingPost ? 'updated' : 'created'} successfully!`);
        
        // Update local state
        if (editingPost) {
          setBlogPosts(prev => prev.map(post => 
            post.id === editingPost.id ? { ...post, ...data.blog } : post
          ));
        } else {
          setBlogPosts(prev => [data.blog, ...prev]);
        }
        
        setTimeout(() => {
          setActiveView('catalog');
        }, 1500);
      } else {
        throw new Error(data.message || 'Failed to save blog post');
      }
    } catch (err) {
      console.error('Error saving blog post:', err);
      setError(err.message || 'Failed to save blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setBlogPosts(prev => prev.filter(post => post.id !== id));
        setSuccess('Blog post deleted successfully!');
      } else {
        throw new Error(data.message || 'Failed to delete blog post');
      }
    } catch (err) {
      console.error('Error deleting blog post:', err);
      setError('Failed to delete blog post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Message component
  const MessageBar = ({ type, message }) => {
    if (!message) return null;
    
    const isError = type === 'error';
    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        isError ? 'bg-red-500/90 text-white' : 'bg-green-500/90 text-white'
      } flex items-center gap-2 backdrop-blur-md`}>
        {isError ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
        {message}
      </div>
    );
  };

  // Render catalog view
  const renderCatalog = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Blog Management</h1>
          <p className="text-gray-400 mt-1">Manage your blog posts and create engaging content</p>
        </div>
        <button
          onClick={createNewPost}
          disabled={loading}
          className="py-3 hover:text-yellow-400 hover:scale-105 transition-transform duration-300 ease-in-out text-white rounded-lg hover:opacity-95 flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          New Post
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-200/5 border-gray-700 backdrop-blur-md rounded-2xl border p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative flex-1 max-w-md rounded-lg shadow-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 focus:outline-none pr-4 py-2 bg-field text-white border border-fieldBorder rounded-lg"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-field text-white border border-fieldBorder rounded-lg"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-field text-white border border-fieldBorder rounded-lg"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="views">Most Views</option>
              <option value="title">Title A-Z</option>
            </select>
            
            <button
              onClick={fetchBlogs}
              disabled={loading}
              className="p-2 text-white hover:text-yellow-400 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh blogs"
            >
              <Loader className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <Loader className="w-8 h-8 text-gray-300 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading blog posts...</p>
        </div>
      )}

      {/* Posts Grid */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => editPost(post)}
              className="cursor-pointer hover:scale-105 hover:shadow-lg bg-gray-200/5 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden transition-transform duration-300 ease-in-out"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      post.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {post.status}
                    </span>
                    {post.featured && (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                        Featured
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePost(post.id);
                      }}
                      className="p-1.5 text-white hover:text-red-300 rounded-lg transition-colors"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-lg text-gray-100 mb-2 line-clamp-2">{post.title}</h3>
                <p className="text-gray-200 text-sm mb-4 line-clamp-3">{post.excerpt}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.date || post.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {post.views || 0}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.tags && post.tags.slice(0, 3).map((tag, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 bg-sky-100 text-sky-800 rounded-full">
                      {tag}
                    </span>
                  ))}
                  {post.tags && post.tags.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      +{post.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {!loading && filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No posts found</p>
          <p className="text-gray-500 mb-6">Try adjusting your search or filters</p>
          <button
            onClick={createNewPost}
            className="px-4 py-2 bg-gradient-to-r text-white rounded-lg hover:scale-105 hover:text-yellow-400 transition-transform duration-300"
          >
            Create your first post
          </button>
        </div>
      )}
    </div>
  );

  // Render editor view
  const renderEditor = () => (
    <div className="space-y-6">
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('catalog')}
            className="p-2 text-white hover:text-yellow-400 hover:scale-105 transition-transform duration-300 ease-in-out rounded-lg flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalog
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => savePost('draft')}
            disabled={loading}
            className="px-6 py-2 bg-green-500/20 border border-green-400 text-green-400 rounded-lg hover:bg-green-500/50 hover:text-green-300 transition-colors font-semibold duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button
            onClick={() => savePost('published')}
            disabled={loading}
            className="px-6 py-2 bg-yellow-500/20 border border-yellow-400 text-yellow-400 font-semibold rounded-lg hover:bg-yellow-500/50 hover:text-yellow-300 transition-colors duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Publish
          </button>
        </div>
      </div>

      {/* Main Editor - Full Width */}
      <div className="space-y-6">
        {/* Post Details */}
        <div className="bg-gray-200/5 border-gray-700 backdrop-blur-md rounded-2xl border p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Post Title</label>
              <input
                type="text"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                placeholder="Enter your post title..."
                className="w-full px-4 py-3 rounded-lg border text-white transition-colors bg-zinc-900/50 border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">Post Excerpt</label>
              <textarea
                value={postExcerpt}
                onChange={(e) => setPostExcerpt(e.target.value)}
                placeholder="Brief description of your post..."
                rows="3"
                className="w-full px-4 py-3 rounded-lg border text-white transition-colors bg-zinc-900/50 border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Tags (comma-separated)</label>
              <input
                type="text"
                value={postTags}
                onChange={(e) => setPostTags(e.target.value)}
                placeholder="Insurance, Home, Guide"
                className="w-full px-4 py-3 rounded-lg border text-white transition-colors bg-zinc-900/50 border-zinc-600 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-20"
              />
            </div>
          </div>
        </div>

        {/* Rich Text Editor */}
        <div className="backdrop-blur-sm rounded-xl overflow-hidden">
          <RichTextEditor 
            initialContent={editorContent}
            onChange={setEditorContent}
            placeholder="Start writing your blog post content..."
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <MessageBar type="error" message={error} />
      <MessageBar type="success" message={success} />
      
      <div className="max-w-7xl mx-auto">
        {activeView === 'catalog' ? renderCatalog() : renderEditor()}
      </div>
    </div>
  );
};

export default BlogConfig;