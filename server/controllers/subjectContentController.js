import mongoose from "mongoose";
import SubjectContent from "../models/SubjectContent.js";
import fetch from "node-fetch";
import * as pdfParse from "pdf-parse"; 
import dotenv from "dotenv";

dotenv.config(); // Load environment variables from .env file

/**
 * Helper function to check if the current user is either
 * the creator of the content or an admin.
 */
const isOwnerOrAdmin = (content, user) => {
  const isOwner = content.createdBy.toString() === user._id.toString();
  const isAdmin = user.role === "admin";
  return isOwner || isAdmin;
};

/**
 * Helper function to extract PDF information from uploaded file
 */
const buildPdfDataFromFile = (file) => {
  if (!file) {
    return { pdfUrl: "", pdfPublicId: "", hasPdf: false };
  }

  const pdfUrl = file.secure_url || file.path || file.url || "";
  const pdfPublicId = file.filename || file.public_id || "";

  return {
    pdfUrl,
    pdfPublicId,
    hasPdf: Boolean(pdfUrl),
  };
};

const normalizePdfFilesArray = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      url: String(item.url ?? "").trim(),
      publicId: String(item.publicId ?? "").trim(),
      name: String(item.name ?? "").trim(),
    }))
    .filter((item) => item.url);
};

const getAllPdfUrlsFromResources = (resources) => {
  const res = resources || {};
  const urls = [];
  if (Array.isArray(res.pdfFiles) && res.pdfFiles.length) {
    for (const f of res.pdfFiles) {
      if (f && f.url) urls.push(f.url);
    }
  }
  if (urls.length === 0 && res.pdfUrl) urls.push(res.pdfUrl);
  return urls;
};

const syncLegacyPdfFields = (resources) => {
  // If the document only has the legacy single PDF fields (pdfUrl/pdfPublicId),
  // convert them into pdfFiles so multi-PDF uploads don't accidentally drop the old PDF.
  const filesFromArray = normalizePdfFilesArray(resources?.pdfFiles);
  const legacyUrl = resources?.pdfUrl ? String(resources.pdfUrl).trim() : "";
  const legacyPublicId = resources?.pdfPublicId ? String(resources.pdfPublicId).trim() : "";

  const files =
    filesFromArray.length > 0
      ? filesFromArray
      : legacyUrl
        ? [{ url: legacyUrl, publicId: legacyPublicId, name: "PDF notes" }]
        : [];

  resources.pdfFiles = files;
  if (files.length > 0) {
    resources.pdfUrl = files[0].url;
    resources.pdfPublicId = files[0].publicId || "";
  } else {
    resources.pdfUrl = "";
    resources.pdfPublicId = "";
  }
};

/**
 * Helper function to safely pick resource fields from request body
 * Ensures default empty values if fields are missing
 */
const pickResourceFields = (resources, withDefaults = false) => {
  const source = resources && typeof resources === "object" ? resources : {};
  const out = {};

  const setIfPresent = (key, fallback = "") => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      out[key] = source[key] ?? fallback;
    } else if (withDefaults) {
      out[key] = fallback;
    }
  };

  if (Object.prototype.hasOwnProperty.call(source, "referenceLinks")) {
    out.referenceLinks = Array.isArray(source.referenceLinks) ? source.referenceLinks : [];
  } else if (withDefaults) {
    out.referenceLinks = [];
  }

  if (Object.prototype.hasOwnProperty.call(source, "videoLinks")) {
    out.videoLinks = Array.isArray(source.videoLinks) ? source.videoLinks : [];
  } else if (withDefaults) {
    out.videoLinks = [];
  }

  setIfPresent("quizFormLink", "");
  setIfPresent("worksheetLink", "");
  setIfPresent("answerSheetLink", "");
  setIfPresent("meetingLink", "");
  setIfPresent("pdfUrl", "");
  setIfPresent("pdfPublicId", "");

  if (Object.prototype.hasOwnProperty.call(source, "pdfFiles")) {
    out.pdfFiles = normalizePdfFilesArray(source.pdfFiles);
  } else if (withDefaults) {
    out.pdfFiles = [];
  }

  return out;
};

/**
 * Tutor/Admin: CREATE
 * POST /api/subject-content
 */
export const createSubjectContent = async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.resources = pickResourceFields(req.body.resources, true);

    const { pdfUrl, pdfPublicId, hasPdf } = buildPdfDataFromFile(req.file);

    if (hasPdf) {
      const name = req.file.originalname || req.file.name || "";
      payload.resources.pdfFiles = [
        ...normalizePdfFilesArray(payload.resources.pdfFiles),
        { url: pdfUrl, publicId: pdfPublicId, name },
      ];
    }
    syncLegacyPdfFields(payload.resources);

    const content = await SubjectContent.create({
      ...payload,
      createdBy: req.user._id,
    });

    return res.status(201).json(content);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Tutor/Admin: GET my contents
 * GET /api/subject-content/my
 */
export const getMySubjectContents = async (req, res) => {
  try {
    const contents = await SubjectContent.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(contents);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Student/Tutor/Admin: GET published contents (filters)
 * GET /api/subject-content?grade=10&subject=ICT&weekNumber=1
 */
export const getPublishedSubjectContents = async (req, res) => {
  try {
    const { grade, subject, weekNumber } = req.query;
    const query = { status: "published" };

    if (grade !== undefined) {
      const gradeNum = Number(grade);
      if (Number.isNaN(gradeNum)) {
        return res.status(400).json({ message: "grade must be a number" });
      }
      query.grade = gradeNum;
    }

    if (subject) {
      query.subject = subject;
    }

    if (weekNumber !== undefined) {
      const weekNum = Number(weekNumber);
      if (Number.isNaN(weekNum)) {
        return res.status(400).json({ message: "weekNumber must be a number" });
      }
      query.weekNumber = weekNum;
    }

    const contents = await SubjectContent.find(query)
      .populate("createdBy", "name role avatar")
      .sort({ weekNumber: 1, lessonDate: 1 });

    return res.status(200).json(contents);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Tutor/Admin: GET one by id (only owner or admin)
 * GET /api/subject-content/:id
 */
export const getSubjectContentById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Content not found" });
    }

    const content = await SubjectContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    if (!isOwnerOrAdmin(content, req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.status(200).json(content);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Tutor/Admin: UPDATE (only owner or admin)
 * PUT /api/subject-content/:id
 */
export const updateSubjectContent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Content not found" });
    }

    const content = await SubjectContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    if (!isOwnerOrAdmin(content, req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const payload = { ...req.body };
    const resourceUpdates = pickResourceFields(req.body.resources, false);

    if (Object.keys(resourceUpdates).length > 0) {
      content.resources = {
        ...content.resources.toObject(),
        ...resourceUpdates,
      };
    }

    const { pdfUrl, pdfPublicId, hasPdf } = buildPdfDataFromFile(req.file);
    if (hasPdf) {
      const name = req.file.originalname || req.file.name || "";
      let existing = normalizePdfFilesArray(content.resources?.pdfFiles);
      // Preserve legacy single-PDF data when this document hasn't been migrated yet.
      if (!existing.length && content.resources?.pdfUrl) {
        existing = [
          {
            url: content.resources.pdfUrl,
            publicId: content.resources.pdfPublicId || "",
            name: "PDF notes",
          },
        ];
      }
      content.resources.pdfFiles = [...existing, { url: pdfUrl, publicId: pdfPublicId, name }];
    }
    syncLegacyPdfFields(content.resources);

    delete payload.resources;
    Object.assign(content, payload);

    const updated = await content.save();
    return res.status(200).json(updated);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Tutor/Admin: DELETE (only owner or admin)
 * DELETE /api/subject-content/:id
 */
export const deleteSubjectContent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Content not found" });
    }

    const content = await SubjectContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    if (!isOwnerOrAdmin(content, req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await SubjectContent.deleteOne({ _id: content._id });
    return res.status(200).json({ message: "Content deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * Tutor/Admin: UPLOAD PDF to one content item
 * POST /api/subject-content/:id/upload-pdf
 */
export const uploadPdfToContent = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Content not found" });
    }

    const content = await SubjectContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    if (!isOwnerOrAdmin(content, req.user)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    const { pdfUrl, pdfPublicId, hasPdf } = buildPdfDataFromFile(req.file);

    if (!hasPdf) {
      return res.status(400).json({ message: "Failed to upload PDF" });
    }

    const name = req.file.originalname || req.file.name || "";
    const entry = { url: pdfUrl, publicId: pdfPublicId, name };
    let existing = normalizePdfFilesArray(content.resources?.pdfFiles);
    // Preserve legacy single-PDF data when this document hasn't been migrated yet.
    if (!existing.length && content.resources?.pdfUrl) {
      existing = [
        {
          url: content.resources.pdfUrl,
          publicId: content.resources.pdfPublicId || "",
          name: "PDF notes",
        },
      ];
    }
    content.resources.pdfFiles = [...existing, entry];
    syncLegacyPdfFields(content.resources);

    await content.save();

    return res.status(200).json({
      message: "PDF uploaded successfully",
      pdfUrl: content.resources.pdfUrl,
      content,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * View PDF by content id and index (0-based)
 * GET /api/subject-content/:id/pdf/:pdfIndex
 */
export const viewSubjectContentPdfByIndex = async (req, res) => {
  try {
    const { id, pdfIndex } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "Content not found" });
    }

    const content = await SubjectContent.findById(id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    const urls = getAllPdfUrlsFromResources(content.resources);
    const idx = parseInt(pdfIndex, 10);
    if (Number.isNaN(idx) || idx < 0 || idx >= urls.length) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (req.user.role === "student") {
      if (content.status !== "published") {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else {
      const isOwner = content.createdBy.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "admin";
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    return res.redirect(urls[idx]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/**
 * View PDF by content id (first file — legacy)
 * GET /api/subject-content/:id/pdf
 */
export const viewSubjectContentPdf = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Content not found" });
    }

    const content = await SubjectContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    const urls = getAllPdfUrlsFromResources(content.resources);
    if (!urls.length) {
      return res.status(404).json({ message: "PDF not found" });
    }

    if (req.user.role === "student") {
      if (content.status !== "published") {
        return res.status(403).json({ message: "Forbidden" });
      }
    } else {
      const isOwner = content.createdBy.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "admin";
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    return res.redirect(urls[0]);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

async function getPdfText(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to download PDF");
    const buffer = await res.arrayBuffer();

    // Use pdfParse.default for ES modules
    const data = await pdfParse(Buffer.from(buffer));
    return data.text; // extracted text
  } catch (err) {
    console.error("PDF extraction error:", err.message);
    return ""; // fallback if PDF cannot be read
  }
}

/**
 * Ask AI a question about a lesson content
 * Route: POST /api/subject-content/:id/ask
 * Uses Hugging Face API to generate answers
 */
export const askAI = async (req, res) => {
  try {
    const { id } = req.params;
    const { question } = req.body;

    // 1 Get week content from MongoDB
    const week = await SubjectContent.findById(id);
    if (!week) return res.status(404).json({ message: "Week not found" });

    // 2 Extract PDF text if available (all uploaded PDFs)
    const pdfUrls = getAllPdfUrlsFromResources(week.resources);
    let pdfText = "";
    for (const url of pdfUrls) {
      pdfText += `${await getPdfText(url)}\n\n`;
    }

    // 3 Combine all context
    const context = `
Lesson description:
${week.description || ""}

Lesson content:
${week.contentText || ""}

PDF content:
${pdfText}
`;

    // 4 Prepare Hugging Face request
    const body = {
      model: process.env.HUGGING_FACE_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a student assistant. Use the provided lesson content and PDF to answer questions in simple words."
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nStudent question:\n${question}`
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    };

    // 5 Call Hugging Face Chat API
    const hfResponse = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      }
    );

    if (!hfResponse.ok) {
      const text = await hfResponse.text();
      console.error("Hugging Face API error:", text);
      return res.status(hfResponse.status).json({ message: text });
    }

    // 6 Parse answer
    const data = await hfResponse.json();
    const rawAnswer = data.choices?.[0]?.message?.content || "";
    const answer = rawAnswer.trim() === "" ? "Sorry, no answer." : rawAnswer;

    // 7 Send to frontend
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};