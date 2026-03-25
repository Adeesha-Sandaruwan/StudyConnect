import { OAuth2Client } from 'google-auth-library';// Importing the Google OAuth2 client for handling Google authentication
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto'; // Importing crypto to hash the reset token before comparing it with the database
import sendEmail from '../utils/sendEmail.js'; // Importing the email utility

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);// Initializing the Google OAuth2 client with the client ID from environment variables

//  @desc    Register a new user
const registerUser = async (req, res) => {// Extracting the name, email, password, and role from the request body
  const { name, email, password, role } = req.body;

  try {// Checking if a user with the provided email already exists in the database
    const userExists = await User.findOne({ email });

    if (userExists) {// If a user with the provided email already exists, return a 400 status with an error message
      return res.status(400).json({ message: 'User already exists' });
    }

    let safeRole = role;// Ensuring that the role is either 'student' or 'tutor', defaulting to 'student' if an invalid role is provided
    if (role === 'admin' || (role !== 'student' && role !== 'tutor')) {//
      // If the role is 'admin' or any invalid role, set it to 'student' to prevent unauthorized admin access
        safeRole = 'student';
    }

    const user = await User.create({
      name,
      email,
      password,
      role: safeRole
    });// Creating a new user in the database with the provided name, email, password, and validated role

    if (user) {// If the user is successfully created
      generateToken(res, user._id);// Generating a JWT token for the newly created user and setting it in the response cookies
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      });// Returning the user details along with the generated token in the response
    } else {
      res.status(400).json({ message: 'Invalid user data' });// If the user creation fails, return a 400 status with an error message
    }
  } catch (error) {
    console.error(error);// Logging any errors that occur during the registration process
    res.status(500).json({ message: error.message });// Returning a 500 status with the error message if an exception occurs
  }
};

const loginUser = async (req, res) => {// Extracting the email and password from the request body
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });// Finding a user in the database with the provided email

    if (user && (await user.matchPassword(password))) {// If a user is found and the provided password matches the stored password
      generateToken(res, user._id);// Generating a JWT token for the authenticated user and setting it in the response cookies
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      });// Returning the user details along with the generated token in the response
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const googleAuth = async (req, res) => {// Extracting the token from the request body
  const accessToken = req.body.access_token || req.body.token;// Fetching user info directly from Google using the access token
  const requestedRole = req.body.role; // Fetching the role selected on the frontend

  try {
    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      throw new Error("Failed to retrieve user info from Google");
    }
    
    // Extracting the user's name, email, picture, and Google ID (sub) from the token payload
    const { name, email, picture, sub } = await response.json();

    let user = await User.findOne({ email });// Checking if a user with the provided email already exists in the database

    if (user) {// If a user with the provided email already exists, check if they have a Google ID associated with their account
      if (!user.googleId) {//
        user.googleId = sub;
        user.avatar = picture || user.avatar;
        await user.save();// If the user does not have a Google ID, associate the Google ID and avatar
        //  with their existing account and save the changes to the database
      }
    } else {// If no user with the provided email exists, create a new user with the extracted information from the Google token
      
      let safeRole = requestedRole;// Ensuring that the role is either 'student' or 'tutor'
      if (requestedRole === 'admin' || (requestedRole !== 'student' && requestedRole !== 'tutor')) {
          safeRole = 'student';
      }

      user = await User.create({
        name,
        email,
        googleId: sub,
        avatar: picture,
        role: safeRole,
        password: Date.now().toString(36) + Math.random().toString(36).substr(2)// Generating a random password for the new user
      });//
    }

    generateToken(res, user._id);// Generating a JWT token for the authenticated user and setting it in the response cookies
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    });
    
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Google authentication failed' });
  }
};

const logoutUser = (req, res) => {
  res.cookie('jwt', '', {// Clearing the JWT token from the response cookies to log the user out
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

const getUsers = async (req, res) => {// Implementing pagination and filtering for retrieving users based on query parameters
  try {
    const page = parseInt(req.query.page) || 1;//page number from query parameters, defaulting to 1 if not provided
    const limit = parseInt(req.query.limit) || 10;//users per page from query parameters, defaulting to 10 if not provided
    const skip = (page - 1) * limit;//number of documents to skip based on the current page and limit

    const query = {};//empty quary to be populated with search criteria based on query parameters

    // If a keyword is provided in the query parameters, add a case-insensitive search condition for both name and email fields
    if (req.query.keyword) {//
      query.$or = [
        { name: { $regex: req.query.keyword, $options: 'i' } },
        { email: { $regex: req.query.keyword, $options: 'i' } }//
      ];
    }

    if (req.query.role) {// If a role is provided in the query parameters, add a filter condition for the role field
      query.role = req.query.role;
    }

    // Retrieving users from the database based on the constructed query, applying pagination and excluding the password field from the results
    const users = await User.find(query)//
      .select('-password')
      .skip(skip)
      .limit(limit);
      
    // Counting the total number of users that match the query criteria for pagination purposes
    const total = await User.countDocuments(query);

    res.json({
      users,
      page,
      pages: Math.ceil(total / limit),
      total
    });// Returning the retrieved users along with pagination information in the response
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {// Finding a user in the database by their ID, excluding the password field from the results
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json(user);// If a user is found, return their details in the response
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {// Finding a user in the database by their ID and deleting them if they exist
    const user = await User.findById(req.params.id);
    if (user) {
      await User.deleteOne({ _id: user._id });// Deleting the user from the database
      res.json({ message: 'User removed successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {// Finding a user in the database by their ID and updating their details if they exist
    const user = await User.findById(req.params.id);
    if (user) {//
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.role = req.body.role || user.role;
//Update user name , email, and role based on the request body, keeping existing values if not provided
      const updatedUser = await user.save();

      res.json({// Returning the updated user details in the response, excluding the password field
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Update User Error: ", error);
    res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({ message: 'There is no user with that email' });
    }

    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // The URL that will be sent to the user's email, pointing to your React frontend
    const frontendURL = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendURL}/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please click the link below to reset your password: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'StudyConnect - Password Reset Token',
        message,
      });

      res.status(200).json({ message: 'Email sent successfully' });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save({ validateBeforeSave: false });

      console.error('Email sending failed: ', error);
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    // Get hashed token to match the one saved in the database
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.resettoken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Log the user in immediately after successful reset
    generateToken(res, user._id);
    
    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// NEW: Dedicated function for Admins to create other Admins securely without logging themselves out
const createAdminUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, role: 'admin' });

    // We DO NOT generate a token here, so the current admin stays logged in
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export {
  registerUser,
  loginUser,
  googleAuth,
  createAdminUser,
  logoutUser,
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
  forgotPassword,
  resetPassword
};// Exporting all the defined functions for use in other parts of the application, such as route handlers