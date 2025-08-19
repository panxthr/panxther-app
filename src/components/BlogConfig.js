import React, { useState, useRef } from 'react';
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
  Upload
} from 'lucide-react';
import RichTextEditor from './helper-components/Richtext';

const BlogConfig = () => {
  const [activeView, setActiveView] = useState('catalog'); // 'catalog', 'editor'
  const [editingPost, setEditingPost] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Blog posts state
  const [blogPosts, setBlogPosts] = useState([
    {
      id: 1,
      title: '5 Essential Tips for First-Time Home Insurance Buyers',
      excerpt: 'Buying your first home insurance policy can be overwhelming. Here are the key things you need to know to make the right choice...',
      content: '<h2>Understanding Home Insurance Basics</h2><p>When purchasing your first home insurance policy, it\'s important to understand the different types of coverage available...</p>',
      status: 'published',
      date: '2024-08-15',
      readTime: '5 min read',
      tags: ['Insurance', 'Home', 'First Time Buyers'],
      author: 'John Smith',
      views: 1247,
      featured: true
    },
    {
      id: 2,
      title: 'Understanding Life Insurance: Term vs Whole Life',
      excerpt: 'Learn the key differences between term and whole life insurance to make the best choice for your family\'s financial security.',
      content: '<h2>Term Life Insurance</h2><p>Term life insurance provides coverage for a specific period...</p>',
      status: 'published',
      date: '2024-08-10',
      readTime: '7 min read',
      tags: ['Life Insurance', 'Financial Planning'],
      author: 'John Smith',
      views: 892,
      featured: false
    },
    {
      id: 3,
      title: 'Auto Insurance Claims: A Step-by-Step Guide',
      excerpt: 'Filing an auto insurance claim doesn\'t have to be stressful. Follow this comprehensive guide to navigate the process smoothly.',
      content: '<h2>When Accidents Happen</h2><p>The moments after an accident can be overwhelming...</p>',
      status: 'draft',
      date: '2024-08-12',
      readTime: '6 min read',
      tags: ['Auto Insurance', 'Claims', 'Guide'],
      author: 'John Smith',
      views: 0,
      featured: false
    }
  ]);

  // Editor state
  const [editorContent, setEditorContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postTags, setPostTags] = useState('');

  const editorRef = useRef(null);

  // Filter and sort posts
  const filteredPosts = blogPosts
    .filter(post => {
      const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date) - new Date(a.date);
        case 'oldest':
          return new Date(a.date) - new Date(b.date);
        case 'views':
          return b.views - a.views;
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
  };

  const editPost = (post) => {
    setEditingPost(post);
    setPostTitle(post.title);
    setPostExcerpt(post.excerpt);
    setEditorContent(post.content);
    setPostTags(post.tags.join(', '));
    setActiveView('editor');
  };

  const savePost = (status = 'draft') => {
    console.log("Saving post:", editorContent);
    const postData = {
      title: postTitle,
      excerpt: postExcerpt,
      content: editorContent,
      status: status,
      tags: postTags.split(',').map(tag => tag.trim()).filter(tag => tag),
      featured: false,
      date: editingPost ? editingPost.date : new Date().toISOString().split('T')[0],
      readTime: Math.ceil(editorContent.replace(/<[^>]*>/g, '').split(' ').length / 200) + ' min read',
      author: 'John Smith',
      views: editingPost ? editingPost.views : 0
    };

    if (editingPost) {
      setBlogPosts(prev => prev.map(post => 
        post.id === editingPost.id ? { ...post, ...postData } : post
      ));
    } else {
      const newPost = { ...postData, id: Date.now() };
      setBlogPosts(prev => [newPost, ...prev]);
    }

    setActiveView('catalog');
  };

  const deletePost = (id) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      setBlogPosts(prev => prev.filter(post => post.id !== id));
    }
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
          className="py-3 hover:text-yellow-400 hover:scale-105 transition-transform duration-300 ease-in-out text-white rounded-lg hover:opacity-95 flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
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
            </select>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
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
                  {new Date(post.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {post.readTime}
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {post.views}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {post.tags.slice(0, 3).map((tag, idx) => (
                  <span key={idx} className="text-xs px-2 py-1 bg-sky-100 text-sky-800 rounded-full">
                    {tag}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                    +{post.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No posts found</p>
          <p className="text-gray-400 mb-6">Try adjusting your search or filters</p>
          <button
            onClick={createNewPost}
            className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-lg"
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
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          <button
            onClick={() => savePost('published')}
            className="px-6 py-2 bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-lg hover:opacity-95 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
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
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
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
      <div className="max-w-7xl mx-auto">
        {activeView === 'catalog' ? renderCatalog() : renderEditor()}
      </div>
    </div>
  );
};

export default BlogConfig;