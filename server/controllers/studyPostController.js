import StudyPost from '../models/StudyPost.js';

const createPost = async (req, res) => {
  try {
    const { title, description, subjectTag } = req.body;
    let mediaUrls = [];

    if (req.files && req.files.media) {
      mediaUrls = req.files.media.map(file => file.path);
    }

    const post = new StudyPost({
      user: req.user._id,
      title,
      description,
      subjectTag,
      media: mediaUrls
    });

    const createdPost = await post.save();
    res.status(201).json(createdPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPosts = async (req, res) => {
  try {
    const posts = await StudyPost.find()
      .populate('user', 'name avatar role')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPostById = async (req, res) => {
  try {
    const post = await StudyPost.findById(req.params.id)
      .populate('user', 'name avatar role')
      .populate('comments.user', 'name avatar role');

    if (post) {
      res.json(post);
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const { title, description, subjectTag } = req.body;
    const post = await StudyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized to edit this post' });
    }

    post.title = title || post.title;
    post.description = description || post.description;
    post.subjectTag = subjectTag || post.subjectTag;

    if (req.files && req.files.media) {
      post.media = req.files.media.map(file => file.path);
    }

    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await StudyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'User not authorized to delete this post' });
    }

    await StudyPost.deleteOne({ _id: post._id });
    res.json({ message: 'Post removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const likePost = async (req, res) => {
  try {
    const post = await StudyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      post.likes = post.likes.filter((likeId) => likeId.toString() !== req.user._id.toString());
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json(post.likes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await StudyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newComment = {
      user: req.user._id,
      text,
    };

    post.comments.push(newComment);
    await post.save();
    res.status(201).json(post.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const post = await StudyPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.find((c) => c._id.toString() === req.params.commentId);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const isCommentOwner = comment.user.toString() === req.user._id.toString();
    const isPostOwner = post.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCommentOwner && !isPostOwner && !isAdmin) {
      return res.status(401).json({ message: 'User not authorized to delete this comment' });
    }

    post.comments = post.comments.filter((c) => c._id.toString() !== req.params.commentId);
    await post.save();
    
    res.json({ message: 'Comment removed successfully', comments: post.comments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { 
  createPost, 
  getPosts, 
  getPostById, 
  updatePost, 
  deletePost,
  likePost,
  addComment,
  deleteComment 
};