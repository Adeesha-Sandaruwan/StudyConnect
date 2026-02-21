// server/models/feedbackModel.js
import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
    tutorName: String,
    tutorEmail: String,
    lesson: String,
    feedback: String,
    rating: Number
}, { timestamps: true });

export default mongoose.model('Feedback', feedbackSchema);