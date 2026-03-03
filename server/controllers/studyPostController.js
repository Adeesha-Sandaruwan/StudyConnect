import StudyPost from '../models/StudyPost.js';
import Notification from '../models/Notification.js';

// Helper function to call the 3rd Party API
const containsProfanity = async (text) => {// Using Purgomalum API for profanity checking
  try {// Encode the text to ensure it's safe for URL
    const response = await fetch(`https://www.purgomalum.com/service/containsprofanity?text=${encodeURIComponent(text)}`);
    // The API returns 'true' or 'false' as plain text
    const isProfane = await response.text();// Convert the string response to a boolean

    return isProfane === 'true';// If the API returns 'true', it means profanity is detected

  } catch (error) {
    console.error("Profanity API Error:", error);
    return false; // If API fails, let it pass rather than breaking the app
  }
};

const createPost = async (req, res) => {
  try {// Extracting title, description, and subjectTag from the request body
    const { title, description, subjectTag } = req.body;

    // 3rd Party API Integration: Check for bad words before saving
    const isTitleBad = await containsProfanity(title);
    const isDescBad = await containsProfanity(description);

    if (isTitleBad || isDescBad) {
      return res.status(400).json({ 
        message: 'Post rejected: Content violates community guidelines. Inappropriate language is strictly prohibited.' 
      });
    }

    let mediaUrls = [];// If media files are uploaded, extract their paths to save in the post

    if (req.files && req.files.media) {// Assuming media files are uploaded under the 'media' field
      mediaUrls = req.files.media.map(file => file.path);
    }

    const post = new StudyPost({
      user: req.user._id,
      title,
      description,
      subjectTag,
      media: mediaUrls
    });// Save the post to the database and return the created post in the response

    const createdPost = await post.save();
    res.status(201).json(createdPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPosts = async (req, res) => {
  try {// Implementing pagination and filtering based on query parameters
    const page = parseInt(req.query.page) || 1;// Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10;// Default to 10 posts per page if not provided
    const skip = (page - 1) * limit;

    const query = {};
    // If a keyword is provided, search for it in the title and description using regex for case-insensitive matching

    if (req.query.keyword) {
      query.$or = [// Using regex to search for the keyword in both title and description, case-insensitive
        { title: { $regex: req.query.keyword, $options: 'i' } },
        { description: { $regex: req.query.keyword, $options: 'i' } }
      ];
    }

    if (req.query.subjectTag) {// If a subjectTag is provided, filter posts by that tag
      query.subjectTag = req.query.subjectTag;
    }

    const posts = await StudyPost.find(query)
    // Populate the user field to include name, avatar, and role of the post creator
      .populate('user', 'name avatar role')
      .sort({ createdAt: -1 })// Sort posts by creation date in descending order (newest first)
      .skip(skip)// Skip the appropriate number of posts based on the current page and limit
      .limit(limit);// Count the total number of posts that match the query for pagination purposes

    const total = await StudyPost.countDocuments(query);

    res.json({// Return the posts along with pagination info
              // : current page, total pages, and total posts
      posts,
      page,
      pages: Math.ceil(total / limit),// Calculate total pages based on total posts and limit
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPostById = async (req, res) => {
  try {// Find the post by ID
    const post = await StudyPost.findById(req.params.id)
    // Populate the user field to include name, avatar, and role of the post creator
      .populate('user', 'name avatar role')//
      .populate('answers.user', 'name avatar role');

    if (post) {// If the post is found, return it in the response
      res.json(post);
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePost = async (req, res) => {
  try {// Extracting title, description, and subjectTag from the request body
    const { title, description, subjectTag } = req.body;
    const post = await StudyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.user.toString() !== req.user._id.toString()) {
      //if the user trying to update the post is not the owner, return an error
      return res.status(401).json({ message: 'User not authorized to edit this post' });
    }

    post.title = title || post.title;
    post.description = description || post.description;
    post.subjectTag = subjectTag || post.subjectTag;

    if (req.files && req.files.media) {
      post.media = req.files.media.map(file => file.path);
    }

    //save the updated post to the database and return the updated post in the response
    const updatedPost = await post.save();
    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePost = async (req, res) => {//
  try {// Find the post by ID
    const post = await StudyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user is the owner of the post or an admin before allowing deletion
    if (post.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'User not authorized to delete this post' });
    }

    await StudyPost.deleteOne({ _id: post._id });// Delete the post from the database
    res.json({ message: 'Post removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const upvotePost = async (req, res) => {
  try {// Find the post by ID
    const post = await StudyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user has already upvoted or downvoted the post
    const userId = req.user._id.toString();
    const hasUpvoted = post.upvotes.some(id => id.toString() === userId);
    const hasDownvoted = post.downvotes.some(id => id.toString() === userId);

    if (hasDownvoted) {// If the user has already downvoted, remove their downvote (toggle off)
      post.downvotes = post.downvotes.filter(id => id.toString() !== userId);
    }

    if (hasUpvoted) {// If the user has already upvoted, remove their upvote (toggle off)
      post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
    } else {
      post.upvotes.push(req.user._id);// If the user has not upvoted, add their upvote
      
      if (post.user.toString() !== userId) {
        await Notification.create({
          recipient: post.user,
          sender: req.user._id,
          type: 'upvote',
          post: post._id
        });// Create a notification for the post owner when their post is upvoted by someone else
      }
    }

    await post.save();
    res.json({ upvotes: post.upvotes, downvotes: post.downvotes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downvotePost = async (req, res) => {
  try {// Find the post by ID
    const post = await StudyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the user has already upvoted or downvoted the post
    const userId = req.user._id.toString();
    const hasUpvoted = post.upvotes.some(id => id.toString() === userId);
    const hasDownvoted = post.downvotes.some(id => id.toString() === userId);

    if (hasUpvoted) {// If the user has already upvoted, remove their upvote (toggle off)
      post.upvotes = post.upvotes.filter(id => id.toString() !== userId);
    }

    if (hasDownvoted) {// If the user has already downvoted, remove their downvote (toggle off)
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
  try {// Extract the answer text from the request body and find the post by ID
    const { text } = req.body;
    const post = await StudyPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // 3rd Party API Integration: Check answer for bad words
    const isTextBad = await containsProfanity(text);

    if (isTextBad) {// If the answer contains profanity, reject it and return an error message
      return res.status(400).json({ 
        message: 'Answer rejected: Content violates community guidelines. Inappropriate language is strictly prohibited.' 
      });
    }

    const newAnswer = {// Create a new answer object with the user ID and answer text
      user: req.user._id,
      text,
    };

    post.answers.push(newAnswer);
    await post.save();// Save the updated post with the new answer to the database

    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({// Create a notification for the post owner when their post receives a new answer from someone else
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
  try {// Find the post by ID and then find the specific answer by its ID
    const post = await StudyPost.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find the answer within the post's answers array
    const answer = post.answers.find((a) => a._id.toString() === req.params.answerId);

    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if the user is the owner of the answer, the owner of the post, or an admin before allowing deletion
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
};// Exporting all the controller functions to be used in the routes