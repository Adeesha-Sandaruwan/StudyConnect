import mongoose from 'mongoose';

const answerSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,// each answer must be associated with a user
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
      type: mongoose.Schema.Types.ObjectId,// each study post must be associated with a user
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
      // media field is an array of strings (e.g., URLs) with a custom validator to ensure it does not exceed 3 items
      default: []
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    downvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    answers: [answerSchema],
    // answers field is an array of subdocuments defined by the answerSchema,
    //  allowing each study post to have multiple answers associated with it
  },
  { timestamps: true }
);

function arrayLimit(val) {
  return val.length <= 3;
}

const StudyPost = mongoose.model('StudyPost', studyPostSchema);

export default StudyPost;