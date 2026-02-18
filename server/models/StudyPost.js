import mongoose from 'mongoose';

const commentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const studyPostSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    subjectTag: {
      type: String,
      required: true,
    },
    media: {
      type: [String],
      validate: [arrayLimit, '{PATH} exceeds the limit of 3'],
      default: []
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    comments: [commentSchema],
  },
  { timestamps: true }
);

function arrayLimit(val) {
  return val.length <= 3;
}

const StudyPost = mongoose.model('StudyPost', studyPostSchema);

export default StudyPost;