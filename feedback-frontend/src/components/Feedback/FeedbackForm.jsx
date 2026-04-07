import { useState, useEffect } from "react";
import SendIcon from "@mui/icons-material/Send";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CancelIcon from "@mui/icons-material/Cancel";
import FeedbackIcon from "@mui/icons-material/Feedback";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Rating,
  Fade,
  IconButton,
} from "@mui/material";

// ─────────────────────────────────────────────────────────────
// API Base URL — all feedback endpoints are prefixed with this
// ─────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api/feedback";

// ─────────────────────────────────────────────────────────────
// FeedbackForm Component
//
// Handles two modes:
//   1. CREATE mode  → shown when `editingFeedback` is null/undefined
//   2. EDIT mode    → shown when `editingFeedback` is a feedback object
//
// Props:
//   onFeedbackCreated  — callback fired after successful create or update
//   editingFeedback    — the feedback object to edit (null = create mode)
//   onCancelEdit       — callback to cancel editing and return to create mode
// ─────────────────────────────────────────────────────────────
export default function FeedbackForm({ onFeedbackCreated, editingFeedback, onCancelEdit }) {

  // Determine if we are in edit mode based on whether a feedback object was passed
  const isEditing = !!editingFeedback;

  // ── Empty form template used to reset the form after submit ──
  const emptyForm = {
    tutorName: "",
    tutorEmail: "",
    lesson: "",
    feedback: "",
    rating: 3, // default rating is 3 stars
  };

  // ── Local state ──
  const [form, setForm] = useState(emptyForm);   // form field values
  const [loading, setLoading] = useState(false); // true while API call is in progress
  const [error, setError] = useState("");        // error message from API
  const [success, setSuccess] = useState("");    // success message after API call

  // ─────────────────────────────────────────────────────────────
  // useEffect — Populate form fields when switching to edit mode
  //
  // When `editingFeedback` changes (i.e. user clicks Edit on a row),
  // pre-fill the form with the existing feedback data so the user
  // can see and modify the current values.
  //
  // When `editingFeedback` is null (cancel or after submit),
  // reset form back to empty state.
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (editingFeedback) {
      // Pre-fill each field with existing feedback values
      setForm({
        tutorName: editingFeedback.tutorName || "",
        tutorEmail: editingFeedback.tutorEmail || "",
        lesson: editingFeedback.lesson || "",
        feedback: editingFeedback.feedback || "",
        rating: editingFeedback.rating || 3,
      });
      // Clear any previous messages when switching to edit mode
      setError("");
      setSuccess("");
    } else {
      // Reset form to empty when not editing
      setForm(emptyForm);
    }
  }, [editingFeedback]);

  // ─────────────────────────────────────────────────────────────
  // handleChange — Controlled input handler
  //
  // Updates the corresponding field in the `form` state whenever
  // the user types in any text input.
  // ─────────────────────────────────────────────────────────────
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // ─────────────────────────────────────────────────────────────
  // handleSubmit — CREATE or UPDATE feedback
  //
  // Determines which API call to make based on `isEditing`:
  //
  //   CREATE  →  POST /api/feedback/createFeedback
  //              Sends all form fields as JSON body
  //              Returns the newly created feedback document
  //
  //   UPDATE  →  PUT /api/feedback/updateFeedback/:id
  //              Uses the `_id` from `editingFeedback` in the URL
  //              Sends updated form fields as JSON body
  //              Returns the updated feedback document
  //
  // On success:
  //   - Shows a success alert
  //   - Resets the form to empty
  //   - Calls `onFeedbackCreated` to refresh the list and switch tab
  //
  // On failure:
  //   - Shows the error message returned by the API
  // ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent default HTML form submission
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let res;

      if (isEditing) {
        // ── UPDATE (CRUD: Update) ──────────────────────────────
        // PUT request to update an existing feedback by its MongoDB _id
        res = await fetch(`${API_BASE}/updateFeedback/${editingFeedback._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // send cookies for session/auth
          body: JSON.stringify(form), // send updated form data
        });
      } else {
        // ── CREATE (CRUD: Create) ──────────────────────────────
        // POST request to create a new feedback document
        res = await fetch(`${API_BASE}/createFeedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // send cookies for session/auth
          body: JSON.stringify(form), // send new form data
        });
      }

      // Parse JSON response from the server
      const data = await res.json();

      // If HTTP status is not 2xx, throw an error with the server message
      if (!res.ok) throw new Error(data.message || "Something went wrong");

      // Show appropriate success message based on operation
      setSuccess(isEditing ? "Feedback updated successfully!" : "Feedback submitted successfully!");

      // Reset form fields to empty after successful submission
      setForm(emptyForm);

      // Notify parent component to refresh feedback list and switch to table tab
      onFeedbackCreated?.();

    } catch (err) {
      // Display error message in the Alert component
      setError(err.message);
    } finally {
      // Always stop the loading spinner regardless of success or failure
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <Fade in timeout={400}>
      <Box
        sx={{
          background: "#ffffff",
          borderRadius: "24px",
          border: "1.5px solid #e8eaf0",
          boxShadow: "0 12px 48px rgba(37,99,235,0.12)",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {/* ── Card Header ── */}
        {/* Shows different icon and title based on create vs edit mode */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 4,
            py: 3,
            borderBottom: "1.5px solid #f0f2f7",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {/* Icon badge — orange in edit mode, blue in create mode */}
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: "15px",
                bgcolor: isEditing ? "#f59e0b" : "#2563eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                flexShrink: 0,
                boxShadow: isEditing
                  ? "0 4px 14px rgba(245,158,11,0.35)"
                  : "0 4px 14px rgba(37,99,235,0.30)",
              }}
            >
              {/* EditNoteIcon for edit mode, FeedbackIcon for create mode */}
              {isEditing
                ? <EditNoteIcon sx={{ fontSize: 24 }} />
                : <FeedbackIcon sx={{ fontSize: 24 }} />}
            </Box>

            <Box>
              {/* Title changes based on mode */}
              <Typography sx={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 800,
                fontSize: "1.15rem",
                color: "#0f172a",
                lineHeight: 1.3,
              }}>
                {isEditing ? "Edit Feedback" : "Submit Feedback"}
              </Typography>
              {/* Subtitle changes based on mode */}
              <Typography sx={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: "0.85rem",
                color: "#94a3b8",
                lineHeight: 1.5,
                mt: 0.2,
              }}>
                {isEditing
                  ? "Update your existing feedback below"
                  : "We value your opinion — share your experience"}
              </Typography>
            </Box>
          </Box>

          {/* Cancel button — only visible in edit mode */}
          {isEditing && (
            <IconButton
              onClick={onCancelEdit} // triggers parent to clear editingFeedback
              size="medium"
              sx={{
                color: "#94a3b8",
                bgcolor: "#f1f5f9",
                borderRadius: "12px",
                width: 38,
                height: 38,
                "&:hover": { bgcolor: "#e2e8f0", color: "#64748b" },
              }}
            >
              <CancelIcon />
            </IconButton>
          )}
        </Box>

        {/* ── Form Body ── */}
        <Box sx={{ p: 4 }}>

          {/* Error alert — shown when API returns an error */}
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Success alert — shown after successful create or update */}
          {success && (
            <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}

          {/* Form element — onSubmit triggers handleSubmit */}
          <Box component="form" onSubmit={handleSubmit}>

            {/* ── Row 1: Tutor Name + Tutor Email ── */}
            <Box sx={{ display: "flex", gap: 2.5, mb: 2.5 }}>

              {/* Tutor Name field — required, maps to form.tutorName */}
              <TextField
                label="Tutor Name"
                name="tutorName"
                value={form.tutorName}
                onChange={handleChange}
                required
                fullWidth
                placeholder="e.g. Mr. John Silva"
                variant="outlined"
                sx={fieldSx}
              />

              {/* Tutor Email field — required, type=email for validation */}
              <TextField
                label="Tutor Email"
                name="tutorEmail"
                type="email"
                value={form.tutorEmail}
                onChange={handleChange}
                required
                fullWidth
                placeholder="tutor@example.com"
                variant="outlined"
                sx={fieldSx}
              />
            </Box>

            {/* ── Row 2: Lesson + Rating ── */}
            <Box sx={{ display: "flex", gap: 2.5, mb: 2.5 }}>

              {/* Lesson field — required, maps to form.lesson */}
              <TextField
                label="Lesson"
                name="lesson"
                value={form.lesson}
                onChange={handleChange}
                required
                fullWidth
                placeholder="e.g. Mathematics - Chapter 5"
                variant="outlined"
                sx={fieldSx}
              />

              {/* Rating selector — uses MUI Rating component */}
              {/* Value maps to form.rating (1–5 stars) */}
              <Box
                sx={{
                  minWidth: 210,
                  height: 62,
                  border: "1.5px solid #e8eaf0",
                  borderRadius: "14px",
                  px: 2.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  bgcolor: "#fafbff",
                  flexShrink: 0,
                  transition: "border-color 0.2s",
                  "&:hover": { borderColor: "#93c5fd" },
                }}
              >
                <Typography sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.88rem",
                  color: "#64748b",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}>
                  Rating:
                </Typography>

                {/* Star rating — onChange updates form.rating */}
                <Rating
                  value={Number(form.rating)}
                  onChange={(_, val) => setForm({ ...form, rating: val })}
                  size="large"
                  icon={<StarIcon sx={{ color: "#f59e0b", fontSize: 26 }} />}
                  emptyIcon={<StarBorderIcon sx={{ color: "#d1d5db", fontSize: 26 }} />}
                />

                {/* Display current rating value as text */}
                <Typography sx={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.82rem",
                  color: "#94a3b8",
                  whiteSpace: "nowrap",
                }}>
                  ({form.rating} / 5)
                </Typography>
              </Box>
            </Box>

            {/* ── Row 3: Feedback textarea + Submit button ── */}
            <Box sx={{ display: "flex", gap: 2.5, alignItems: "flex-start" }}>

              {/* Feedback textarea — multiline, required, maps to form.feedback */}
              <TextField
                label="Feedback"
                name="feedback"
                value={form.feedback}
                onChange={handleChange}
                required
                fullWidth
                multiline
                rows={5}
                placeholder="Share your feedback about this lesson..."
                variant="outlined"
                sx={fieldSx}
              />

              {/* Submit button — triggers CREATE or UPDATE based on isEditing */}
              {/* Shows spinner while loading, orange in edit mode, blue in create mode */}
              <Button
                type="submit"
                variant="contained"
                disabled={loading} // disabled while API call is in progress
                endIcon={loading
                  ? <CircularProgress size={18} color="inherit" />
                  : <SendIcon sx={{ fontSize: 20 }} />}
                sx={{
                  flexShrink: 0,
                  width: 210,
                  height: 62,
                  mt: 0.5,
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 700,
                  fontSize: "1rem",
                  borderRadius: "14px",
                  textTransform: "none",
                  letterSpacing: "0.01em",
                  bgcolor: isEditing ? "#f59e0b" : "#2563eb",
                  boxShadow: isEditing
                    ? "0 4px 18px rgba(245,158,11,0.35)"
                    : "0 4px 18px rgba(37,99,235,0.30)",
                  "&:hover": {
                    bgcolor: isEditing ? "#d97706" : "#1d4ed8",
                    boxShadow: isEditing
                      ? "0 6px 24px rgba(245,158,11,0.45)"
                      : "0 6px 24px rgba(37,99,235,0.40)",
                    transform: "translateY(-1px)",
                  },
                  transition: "all 0.18s ease",
                }}
              >
                {/* Button label changes based on loading state and mode */}
                {loading
                  ? "Processing..."
                  : isEditing
                    ? "Update Feedback"   // UPDATE label
                    : "Submit Feedback"}  
              </Button>
            </Box>

          </Box>
        </Box>
      </Box>
    </Fade>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared TextField styles
// Applied to all input fields for consistent look:
//   - Rounded corners (14px)
//   - Light background (#fafbff)
//   - Blue border on focus
//   - Taller input height via padding
// ─────────────────────────────────────────────────────────────
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    fontFamily: "'Outfit', sans-serif",
    fontSize: "0.95rem",
    bgcolor: "#fafbff",
    "& fieldset": { borderColor: "#e8eaf0", borderWidth: "1.5px" },
    "&:hover fieldset": { borderColor: "#93c5fd" },           // light blue on hover
    "&.Mui-focused fieldset": { borderColor: "#2563eb", borderWidth: "2px" }, // blue on focus
    "& input": { py: "16px", px: "16px" }, // taller input height
  },
  "& .MuiInputLabel-root": {
    fontFamily: "'Outfit', sans-serif",
    fontSize: "0.92rem",
    color: "#94a3b8",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#2563eb", // blue label on focus
  },
};