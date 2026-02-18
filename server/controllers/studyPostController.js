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

export { createPost, getPosts, getPostById, updatePost, deletePost };