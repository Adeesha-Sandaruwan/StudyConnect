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
      enum: ['Male', 'Female', 'Other', 'Prefer not to say'],
      required: true
    },
    nicNumber: {
      type: String,
      required: true
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
    },
    schoolOrUniversity: {
      type: String,
    },
    learningNeeds: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model('Profile', profileSchema);

export default Profile;