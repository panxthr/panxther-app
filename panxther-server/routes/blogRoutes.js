// routes/blogRoutes.js
module.exports = (db, admin) => {
  const express = require('express');
  const router = express.Router();

  // Helper function to validate blog post data
  const validateBlogPost = (blogData) => {
    const errors = [];
    
    if (!blogData.title || blogData.title.trim().length === 0) {
      errors.push('Title is required');
    }
    
    if (!blogData.content || blogData.content.trim().length === 0) {
      errors.push('Content is required');
    }
    
    if (!blogData.status || !['draft', 'published'].includes(blogData.status)) {
      errors.push('Status must be either "draft" or "published"');
    }
    
    return errors;
  };

  // Helper function to calculate read time
  const calculateReadTime = (content) => {
    const wordsPerMinute = 200;
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length;
    const readTime = Math.ceil(wordCount / wordsPerMinute);
    return readTime + ' min read';
  };

  // GET all blogs for a specific user
  router.get('/:userId/blogs', async (req, res) => {
    const { userId } = req.params;
    const { status, limit = 50, orderBy = 'createdAt', order = 'desc' } = req.query;

    try {
      console.log(`Fetching blogs for user: ${userId}`);
      
      let query = db.collection('Users').doc(userId).collection('Blogs');
      
      // Filter by status if provided
      if (status && ['draft', 'published'].includes(status)) {
        query = query.where('status', '==', status);
      }
      
      // Apply ordering
      query = query.orderBy(orderBy, order);
      
      // Apply limit
      query = query.limit(parseInt(limit));
      
      const blogsSnapshot = await query.get();
      
      if (blogsSnapshot.empty) {
        console.log(`No blogs found for user: ${userId}`);
        return res.json({
          success: true,
          blogs: [],
          count: 0,
          message: 'No blogs found'
        });
      }
      
      const blogs = [];
      blogsSnapshot.forEach(doc => {
        const blogData = doc.data();
        blogs.push({
          id: doc.id,
          ...blogData,
          // Convert Firestore timestamps to ISO strings
          createdAt: blogData.createdAt?.toDate?.()?.toISOString() || blogData.createdAt,
          updatedAt: blogData.updatedAt?.toDate?.()?.toISOString() || blogData.updatedAt,
          date: blogData.date || blogData.createdAt?.toDate?.()?.toISOString()?.split('T')[0]
        });
      });
      
      console.log(`Retrieved ${blogs.length} blogs for user: ${userId}`);
      
      res.json({
        success: true,
        blogs,
        count: blogs.length
      });
      
    } catch (error) {
      console.error(`Error fetching blogs for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blogs',
        error: error.message
      });
    }
  });

  // GET specific blog by ID
  router.get('/:userId/blogs/:blogId', async (req, res) => {
    const { userId, blogId } = req.params;

    try {
      console.log(`Fetching blog ${blogId} for user: ${userId}`);
      
      const blogDoc = await db.collection('Users').doc(userId).collection('Blogs').doc(blogId).get();
      
      if (!blogDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }
      
      const blogData = blogDoc.data();
      const blog = {
        id: blogDoc.id,
        ...blogData,
        createdAt: blogData.createdAt?.toDate?.()?.toISOString() || blogData.createdAt,
        updatedAt: blogData.updatedAt?.toDate?.()?.toISOString() || blogData.updatedAt,
        date: blogData.date || blogData.createdAt?.toDate?.()?.toISOString()?.split('T')[0]
      };
      
      // Increment view count
      await db.collection('Users').doc(userId).collection('Blogs').doc(blogId).update({
        views: admin.firestore.FieldValue.increment(1)
      });
      
      blog.views = (blog.views || 0) + 1;
      
      console.log(`Retrieved blog: ${blog.title}`);
      
      res.json({
        success: true,
        blog
      });
      
    } catch (error) {
      console.error(`Error fetching blog ${blogId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog post',
        error: error.message
      });
    }
  });

  // POST create new blog
  router.post('/:userId/blogs', async (req, res) => {
    const { userId } = req.params;
    const blogData = req.body;

    try {
      console.log(`Creating new blog for user: ${userId}`);
      
      // Validate required fields
      const validationErrors = validateBlogPost(blogData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      // Prepare blog document
      const now = admin.firestore.Timestamp.now();
      const newBlog = {
        title: blogData.title.trim(),
        excerpt: blogData.excerpt?.trim() || '',
        content: blogData.content.trim(),
        status: blogData.status,
        tags: Array.isArray(blogData.tags) ? blogData.tags : [],
        author: blogData.author || 'Anonymous',
        featured: blogData.featured || false,
        views: 0,
        readTime: calculateReadTime(blogData.content),
        date: blogData.date || now.toDate().toISOString().split('T')[0],
        createdAt: now,
        updatedAt: now
      };

      // Add to Firestore
      const blogRef = await db.collection('Users').doc(userId).collection('Blogs').add(newBlog);
      
      console.log(`Blog created with ID: ${blogRef.id}`);
      
      res.status(201).json({
        success: true,
        message: 'Blog post created successfully',
        blog: {
          id: blogRef.id,
          ...newBlog,
          createdAt: newBlog.createdAt.toDate().toISOString(),
          updatedAt: newBlog.updatedAt.toDate().toISOString()
        }
      });
      
    } catch (error) {
      console.error(`Error creating blog for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to create blog post',
        error: error.message
      });
    }
  });

  // PUT update existing blog
  router.put('/:userId/blogs/:blogId', async (req, res) => {
    const { userId, blogId } = req.params;
    const updateData = req.body;

    try {
      console.log(`Updating blog ${blogId} for user: ${userId}`);
      
      // Check if blog exists
      const blogRef = db.collection('Users').doc(userId).collection('Blogs').doc(blogId);
      const blogDoc = await blogRef.get();
      
      if (!blogDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }

      // Validate if title or content are being updated
      if (updateData.title !== undefined || updateData.content !== undefined) {
        const validationErrors = validateBlogPost({
          title: updateData.title || blogDoc.data().title,
          content: updateData.content || blogDoc.data().content,
          status: updateData.status || blogDoc.data().status
        });
        
        if (validationErrors.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: validationErrors
          });
        }
      }

      // Prepare update object
      const updateObj = {
        updatedAt: admin.firestore.Timestamp.now()
      };

      // Add fields that are being updated
      if (updateData.title !== undefined) updateObj.title = updateData.title.trim();
      if (updateData.excerpt !== undefined) updateObj.excerpt = updateData.excerpt.trim();
      if (updateData.content !== undefined) {
        updateObj.content = updateData.content.trim();
        updateObj.readTime = calculateReadTime(updateData.content);
      }
      if (updateData.status !== undefined) updateObj.status = updateData.status;
      if (updateData.tags !== undefined) updateObj.tags = Array.isArray(updateData.tags) ? updateData.tags : [];
      if (updateData.author !== undefined) updateObj.author = updateData.author;
      if (updateData.featured !== undefined) updateObj.featured = updateData.featured;
      if (updateData.date !== undefined) updateObj.date = updateData.date;

      // Update in Firestore
      await blogRef.update(updateObj);
      
      // Fetch updated document
      const updatedDoc = await blogRef.get();
      const updatedBlog = {
        id: updatedDoc.id,
        ...updatedDoc.data(),
        createdAt: updatedDoc.data().createdAt?.toDate?.()?.toISOString(),
        updatedAt: updatedDoc.data().updatedAt?.toDate?.()?.toISOString()
      };
      
      console.log(`Blog ${blogId} updated successfully`);
      
      res.json({
        success: true,
        message: 'Blog post updated successfully',
        blog: updatedBlog
      });
      
    } catch (error) {
      console.error(`Error updating blog ${blogId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to update blog post',
        error: error.message
      });
    }
  });

  // DELETE specific blog
  router.delete('/:userId/blogs/:blogId', async (req, res) => {
    const { userId, blogId } = req.params;

    try {
      console.log(`Deleting blog ${blogId} for user: ${userId}`);
      
      const blogRef = db.collection('Users').doc(userId).collection('Blogs').doc(blogId);
      const blogDoc = await blogRef.get();
      
      if (!blogDoc.exists) {
        return res.status(404).json({
          success: false,
          message: 'Blog post not found'
        });
      }
      
      await blogRef.delete();
      
      console.log(`Blog ${blogId} deleted successfully`);
      
      res.json({
        success: true,
        message: 'Blog post deleted successfully'
      });
      
    } catch (error) {
      console.error(`Error deleting blog ${blogId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete blog post',
        error: error.message
      });
    }
  });

  // DELETE all blogs for a user
  router.delete('/:userId/blogs', async (req, res) => {
    const { userId } = req.params;

    try {
      console.log(`Deleting all blogs for user: ${userId}`);
      
      const blogsSnapshot = await db.collection('Users').doc(userId).collection('Blogs').get();
      
      if (blogsSnapshot.empty) {
        return res.json({
          success: true,
          message: 'No blogs to delete',
          deletedCount: 0
        });
      }
      
      const batch = db.batch();
      blogsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`Deleted ${blogsSnapshot.docs.length} blogs for user: ${userId}`);
      
      res.json({
        success: true,
        message: 'All blog posts deleted successfully',
        deletedCount: blogsSnapshot.docs.length
      });
      
    } catch (error) {
      console.error(`Error deleting all blogs for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete blog posts',
        error: error.message
      });
    }
  });

  // GET blog statistics for a user
  router.get('/:userId/blogs/stats', async (req, res) => {
    const { userId } = req.params;

    try {
      console.log(`Fetching blog statistics for user: ${userId}`);
      
      const blogsSnapshot = await db.collection('Users').doc(userId).collection('Blogs').get();
      
      if (blogsSnapshot.empty) {
        return res.json({
          success: true,
          stats: {
            total: 0,
            published: 0,
            draft: 0,
            totalViews: 0,
            featured: 0
          }
        });
      }
      
      let published = 0;
      let draft = 0;
      let totalViews = 0;
      let featured = 0;
      
      blogsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'published') published++;
        if (data.status === 'draft') draft++;
        if (data.featured) featured++;
        totalViews += data.views || 0;
      });
      
      const stats = {
        total: blogsSnapshot.docs.length,
        published,
        draft,
        totalViews,
        featured
      };
      
      console.log(`Blog stats for user ${userId}:`, stats);
      
      res.json({
        success: true,
        stats
      });
      
    } catch (error) {
      console.error(`Error fetching blog stats for user ${userId}:`, error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch blog statistics',
        error: error.message
      });
    }
  });

  return router;
};