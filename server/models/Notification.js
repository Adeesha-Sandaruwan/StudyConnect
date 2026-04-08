import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['answer', 'upvote', 'request-resource-shared'],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudyPost',
      default: null,
    },
    studentRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentRequest',
      default: null,
    },
    title: {
      type: String,
      default: '',
      trim: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    actionLink: {
      type: String,
      default: '',
      trim: true,
    },
    resourceType: {
      type: String,
      default: '',
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;