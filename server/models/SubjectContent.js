import mongoose from "mongoose";

/**
 * One document = one weekly lesson item.
 * “Module” concept is formed by grouping:
 * createdBy + grade + subject
 * Example module: (Tutor A, Grade 10, ICT) -> Week 1..N documents
 */


const subjectContentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 }, // lesson title shown in UI
    subject: { type: String, required: true, trim: true }, // ICT, Maths...
    grade: { type: Number, required: true, min: 1, max: 13 }, // 10
    weekNumber: { type: Number, required: true, min: 1, max: 52 },
    lessonDate: { type: Date, required: true }, //  date

    description: { type: String, default: "", maxlength: 1500 },
    contentText: { type: String, default: "", maxlength: 7000 }, //  week content details

    resources: {
      pdfUrl: { type: String, default: "" },        //  notes PDF URL (Cloudinary)
      pdfPublicId: { type: String, default: "" },   // optional: for delete from cloud
      referenceLinks: { type: [String], default: [] },
      videoLinks: { type: [String], default: [] },
      quizFormLink: { type: String, default: "" },
      worksheetLink: { type: String, default: "" },
      answerSheetLink: { type: String, default: "" },
      meetingLink: { type: String, default: "" },
    },

    homework: { type: String, default: "", maxlength: 2000 },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

subjectContentSchema.index({ grade: 1, subject: 1, weekNumber: 1, status: 1 });

const SubjectContent = mongoose.model("SubjectContent", subjectContentSchema);
export default SubjectContent;
