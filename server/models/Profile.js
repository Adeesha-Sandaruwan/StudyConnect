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
    subjects: {
      type: [String],
      validate: {
        validator: function (v) {
          if (this.role === 'tutor' && v.length === 0) return false;
          return true;
        },
        message: 'Tutors must select at least one subject.'
      }
    },
    experience: {
      type: String,
    },
    availability: {
      type: [String],
      default: []
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending'
    },
    verificationDocuments: {
      type: [String],
      default: []
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