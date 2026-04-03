import mongoose from 'mongoose';

const moduleAnnouncementSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    moduleType: {
      type: String,
      enum: ['school', 'course'],
      required: true,
      default: 'school',
    },
    grade: { type: Number, required: true, min: 0, max: 13 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

moduleAnnouncementSchema.index({ moduleType: 1, grade: 1, subject: 1 });

const ModuleAnnouncement = mongoose.model('ModuleAnnouncement', moduleAnnouncementSchema);

export default ModuleAnnouncement;
