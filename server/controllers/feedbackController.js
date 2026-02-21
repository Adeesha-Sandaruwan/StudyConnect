// server/controllers/feedbackController.js
import Feedback from '../models/feedbackModel.js';
import transporter from '../config/emailConfig.js';

// CREATE + EMAIL
export const createFeedback = async (req, res) => {
    try {
        const newFeedback = await Feedback.create(req.body);

        // Send Email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: req.body.tutorEmail,
            subject: "New Lesson Feedback Received",
            text: `
Tutor: ${req.body.tutorName}
Lesson: ${req.body.lesson}
Rating: ${req.body.rating}

Feedback:
${req.body.feedback}
`
        });

        res.status(201).json(newFeedback);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// READ ALL
export const getFeedbacks = async (req, res) => {
    try {
        const data = await Feedback.find();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// READ ONE
export const getFeedbackById = async (req, res) => {
    try {
        const data = await Feedback.findById(req.params.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// UPDATE
export const updateFeedback = async (req, res) => {
    try {
        const updated = await Feedback.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// DELETE
export const deleteFeedback = async (req, res) => {
    try {
        await Feedback.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted Successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};