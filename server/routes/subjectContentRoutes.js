import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import {
  normalizeSubjectContentBody,
  validateSubjectContentCreate,
  validateSubjectContentUpdate,
} from "../middleware/subjectContentValidation.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createSubjectContent,
  getMySubjectContents,
  getPublishedSubjectContents,
  getSubjectContentById,
  updateSubjectContent,
  deleteSubjectContent,
  uploadPdfToContent,
  viewSubjectContentPdf,
} from "../controllers/subjectContentController.js";

const router = express.Router();

// Students can view published content (requires login)
router.get("/", protect, getPublishedSubjectContents);

// Tutor/Admin CRUD
router.post(
  "/",
  protect,
  allowRoles("tutor", "admin"),
  upload.single("pdf"),
  normalizeSubjectContentBody,
  validateSubjectContentCreate,
  createSubjectContent
);

router.get("/my", protect, allowRoles("tutor", "admin"), getMySubjectContents);
router.get("/:id/pdf", protect, viewSubjectContentPdf);
router.get("/:id", protect, allowRoles("tutor", "admin"), getSubjectContentById);

router.put(
  "/:id",
  protect,
  allowRoles("tutor", "admin"),
  upload.single("pdf"),
  normalizeSubjectContentBody,
  validateSubjectContentUpdate,
  updateSubjectContent
);

router.delete("/:id", protect, allowRoles("tutor", "admin"), deleteSubjectContent);

// Upload PDF notes only
router.post(
  "/:id/upload-pdf",
  protect,
  allowRoles("tutor", "admin"),
  upload.single("pdf"),
  uploadPdfToContent
);

export default router;
