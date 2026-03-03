import express from 'express';// server/index.js
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import studyPostRoutes from './routes/studyPostRoutes.js';
import subjectContentRoutes from "./routes/subjectContentRoutes.js";
import notificationRoutes from './routes/notificationRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import studentRequestRoutes from './routes/studentRequestRoutes.js';

dotenv.config();// Load environment variables from .env file

connectDB();// Connect to MongoDB database

const app = express();// Create an Express application
const port = process.env.PORT || 5000;// Set the port for the server

app.use(express.json());// Middleware to parse JSON request bodies
app.use(express.urlencoded({ extended: true }));// Middleware to parse URL-encoded request bodies
app.use(cookieParser());// Middleware to parse cookies
app.use(helmet());// Middleware to set security-related HTTP headers
app.use(morgan('dev')); // Middleware for logging HTTP requests in console
app.use(cors({
    origin: 'http://localhost:5173',// Allow requests from this origin (your frontend)
    credentials: true
}));

app.use('/api/users', authRoutes);// Use auth routes for user-related endpoints
app.use('/api/profile', profileRoutes);// Use profile routes for profile-related endpoints
app.use('/api/studyposts', studyPostRoutes);// Use study post routes for study post-related endpoints
app.use("/api/subject-content", subjectContentRoutes);
app.use('/api/notifications', notificationRoutes);// Use notification routes for notification-related endpoints
app.use('/api/feedback', feedbackRoutes);
app.use('/api/student-requests', studentRequestRoutes);

app.get('/', (req, res) => {// Define a basic route for the root URL
    res.send('API is running...');// Basic route to check if the server is running
});

app.listen(port, () => console.log(`Server started on port ${port}`));// Start the server and listen on the specified port