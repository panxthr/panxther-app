const BlogModal = ({ blog, isOpen, onClose, theme }) => {

    
  if (!isOpen || !blog) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className={`${theme.card} rounded-2xl max-w-4xl max-h-[90vh] overflow-hidden animate-scale-in w-full`}>
        {/* Header */}
        <div className={`${theme.secondary} p-6 border-b border-white/20 flex items-start justify-between`}>
          <div className="flex-1 pr-4">
            <h2 className={`text-2xl font-bold ${theme.text} mb-2`}>
              {blog.title}
            </h2>
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
            {blog.tags && blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {blog.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className={`${theme.secondary} px-3 py-1 rounded-full text-xs font-medium ${theme.accent}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 ${theme.accent} hover:${theme.text} rounded-full flex items-center justify-center transition-colors duration-200 flex-shrink-0`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto p-6 max-h-[70vh]">
          {blog.excerpt && (
            <div className={`${theme.text} opacity-80 text-lg mb-6 italic font-medium leading-relaxed`}>
              {blog.excerpt}
            </div>
          )}
          
          <div className={`${theme.text} prose prose-lg max-w-none`}>
            {blog.content ? (
              <div dangerouslySetInnerHTML={{ __html: blog.content }} />
            ) : (
              <p className="text-center py-8 opacity-60">Content not available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default BlogModal;