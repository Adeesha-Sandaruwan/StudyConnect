import mongoose from 'mongoose';

// Nested schema for file metadata (PDFs, notes) shared directly by tutors
const requestSharedFileSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' }, // Cloudinary secure URL for accessing the file
    publicId: { type: String, default: '' }, // Cloudinary public ID for file deletion/updates
    name: { type: String, default: '' } // Original filename
  },
  { _id: false } // Don't create separate IDs for embedded file objects
);

const requestSharedResourceSchema = new mongoose.Schema(
  {
    resourceType: {
      type: String,
      enum: ['lesson', 'pdf', 'note'],
      required: true
    },
    title: {
      type: String,
      default: '',
      trim: true,
      maxlength: 150
    },
    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubjectContent',
      default: null
    },
    file: {
      type: requestSharedFileSchema,
      default: () => ({})
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

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
    
    // Status lifecycle: open -> in-progress -> completed or rejected
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'rejected', 'cancelled'],
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
    },

    // Array of module lesson IDs linked to this request by tutors
    // Contains lessons from SubjectContent that help address the student's needs
    linkedLessons: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubjectContent'
      }],
      default: []
    },

    // Array of resources directly shared by tutor (lesson refs, PDFs, notes, messages)
    // These are resources specifically created or uploaded for this request
    sharedResources: {
      type: [requestSharedResourceSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Compound database indexes for high-frequency query patterns
// Improves performance on public browse, admin dashboards, tutor searches
studentRequestSchema.index({ status: 1, createdAt: -1 }); // List open requests in feed
studentRequestSchema.index({ subject: 1, status: 1, createdAt: -1 }); // Filter by subject + status
studentRequestSchema.index({ gradeLevel: 1, status: 1, createdAt: -1 }); // Filter by grade + status
studentRequestSchema.index({ priority: 1, status: 1, createdAt: -1 }); // Sort by priority
studentRequestSchema.index({ assignedTutor: 1, status: 1, createdAt: -1 }); // Tutor dashboard (tutor's assigned requests)
studentRequestSchema.index({ student: 1, createdAt: -1 }); // Student's own requests

const StudentRequest = mongoose.model('StudentRequest', studentRequestSchema);

export default StudentRequest;
