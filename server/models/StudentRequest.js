import mongoose from 'mongoose';

const studentRequestSchema = mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: {
      type: String,
      required: true,
      enum: ['Mathematics', 'English', 'Science', 'History', 'Geography', 'ICT', 'Other']
    },
    description: {
      type: String,
      required: true,
      maxLength: 1000
    },
    gradeLevel: {
      type: String,
      required: true,
      enum: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'],
      default: 'Grade 10'
    },
    requestType: {
      type: String,
      enum: ['one-time', 'ongoing'],
      default: 'ongoing'
    },
    preferredSchedule: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'cancelled'],
      default: 'open'
    },
    assignedTutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    responses: {
      type: Number,
      default: 0
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  {
    timestamps: true
  }
);

const StudentRequest = mongoose.model('StudentRequest', studentRequestSchema);

export default StudentRequest;
