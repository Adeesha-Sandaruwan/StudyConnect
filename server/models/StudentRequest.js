import mongoose from 'mongoose';

const studentRequestSchema = mongoose.Schema(
  {
    // Reference to the student who created this request
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Subject of tutoring (Mathematics, English, Science, etc.)
    subject: {
      type: String,
      required: true,
      enum: ['Mathematics', 'English', 'Science', 'History', 'Geography', 'ICT', 'Other']
    },
    
    // Detailed description of what help the student needs (max 1000 chars)
    description: {
      type: String,
      required: true,
      maxLength: 1000
    },
    
    // Academic level/grade of the student
    gradeLevel: {
      type: String,
      required: true,
      enum: ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'University'],
      default: 'Grade 10'
    },
    
    // Type of request: one-time session or ongoing sessions
    requestType: {
      type: String,
      enum: ['one-time', 'ongoing'],
      default: 'ongoing'
    },
    
    // Array of preferred times/days for tutoring sessions
    preferredSchedule: {
      type: [String],
      default: []
    },
    
    // Status lifecycle: open -> in-progress -> completed or cancelled
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'cancelled'],
      default: 'open'
    },
    
    // Reference to the tutor assigned to this request (null if not yet assigned)
    assignedTutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    
    // Count of responses/applications from tutors (for tracking interest)
    responses: {
      type: Number,
      default: 0
    },
    
    // Priority level influences which requests tutors see first
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
