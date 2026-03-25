import mongoose from 'mongoose';

const profileSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    bio: {
      type: String,
      maxLength: 500,
      default: ''
    },
    phoneNumber: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'Sri Lanka'
    },
    dob: {
      type: Date,
      required: true
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other', 'Prefer not to say', ''],
      default: ''
    },
    nicNumber: {
      type: String,
      // Removed required: true - Frontend validates this for tutors only
    },
    emergencyContact: {
      name: { type: String, required: true },
      relation: { type: String, required: true },
      phoneNumber: { type: String, required: true }
    },
    subjects: {
      type: [String]
    },
    experience: {
      type: String,
    },
    availability: {
      type: [String],
      default: []
    },
    nicFront: {
      type: String,
    },
    nicBack: {
      type: String,
    },
    certificates: {
      type: [String],
      default: []
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    gradeLevel: {
      type: String,
      required: true // Required for both Tutors (what they teach) and Students (current level)
    },
    schoolOrUniversity: {
      type: String,
      required: true // Required for both
    },
    learningNeeds: {
      type: String,
      // Removed required: true - Frontend validates this for students only
    }
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;