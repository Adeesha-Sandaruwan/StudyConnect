import StudyPost from '../models/StudyPost.js';
import Notification from '../models/Notification.js';

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
      .populate('answers.user', 'name avatar role');

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

const upvotePost = async (req, res) => {
  try {
    const post = await StudyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const hasUpvoted = post.upvotes.some(id => id.toString() === userId);
    const hasDownvoted = post.downvotes.some(id => id.toString() === userId);

    if (hasDownvoted) {
      post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
    }

    if (hasUpvoted) {
      post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
    } else {
      post.upvotes.push(req.user._id);
      
      if (post.user.toString() !== userId) {
        await Notification.create({
          recipient: post.user,
          sender: req.user._id,
          type: 'upvote',
          post: post._id
        });
      }
    }

    await post.save();
    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downvotePost = async (req, res) => {
  try {
    const post = await StudyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const userId = req.user._id.toString();
    const hasUpvoted = post.upvotes.some(id => id.toString() === userId);
    const hasDownvoted = post.downvotes.some(id => id.toString() === userId);

    if (hasUpvoted) {
      post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
    }

    if (hasDownvoted) {
      post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
    } else {
      post.downvotes.push(req.user._id);
    }

    await post.save();
    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addAnswer = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await StudyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newAnswer = {
      user: req.user._id,
      text,
    };

    post.answers.push(newAnswer);
    await post.save();

    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: 'answer',
        post: post._id
      });
    }

    res.status(201).json(post.answers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAnswer = async (req, res) => {
  try {
    const post = await StudyPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const answer = post.answers.find((a) => a._id.toString() === req.params.answerId);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    const isAnswerOwner = answer.user.toString() === req.user._id.toString();
    const isPostOwner = post.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAnswerOwner && !isPostOwner && !isAdmin) {
      return res.status(401).json({ message: 'User not authorized to delete this answer' });
    }

    post.answers = post.answers.filter((a) => a._id.toString() !== req.params.answerId);
    await post.save();
    
    res.json({ message: 'Answer removed successfully', answers: post.answers });
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
  upvotePost,
  downvotePost,
  addAnswer,
  deleteAnswer 
};