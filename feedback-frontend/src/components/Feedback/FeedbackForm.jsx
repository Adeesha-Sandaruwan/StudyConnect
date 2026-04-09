import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SendIcon from "@mui/icons-material/Send";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CancelIcon from "@mui/icons-material/Cancel";
import FeedbackIcon from "@mui/icons-material/Feedback";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
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
  Paper,
  Chip,
  Snackbar,
  InputAdornment,
} from "@mui/material";

// API Base URL
const API_BASE = "http://localhost:5000/api/feedback";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

const fieldVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 },
  }),
};

export default function FeedbackForm({ onFeedbackCreated, editingFeedback, onCancelEdit }) {
  const isEditing = !!editingFeedback;
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const emptyForm = {
    tutorName: "",
    tutorEmail: "",
    lesson: "",
    feedback: "",
    rating: 3,
  };

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (editingFeedback) {
      setForm({
        tutorName: editingFeedback.tutorName || "",
        tutorEmail: editingFeedback.tutorEmail || "",
        lesson: editingFeedback.lesson || "",
        feedback: editingFeedback.feedback || "",
        rating: editingFeedback.rating || 3,
      });
      setError("");
      setSuccess("");
      setFieldErrors({});
      setTouchedFields({});
    } else {
      setForm(emptyForm);
      setFormSubmitted(false);
    }
  }, [editingFeedback]);

  const validateField = (name, value) => {
    switch (name) {
      case "tutorName":
        if (!value.trim()) return "Tutor name is required";
        if (value.length < 2) return "Name must be at least 2 characters";
        if (value.length > 50) return "Name must be less than 50 characters";
        return "";
      case "tutorEmail":
        if (!value.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email address";
        return "";
      case "lesson":
        if (!value.trim()) return "Lesson is required";
        if (value.length < 3) return "Lesson must be at least 3 characters";
        return "";
      case "feedback":
        if (!value.trim()) return "Feedback is required";
        if (value.length < 10) return "Please provide more detailed feedback (min 10 characters)";
        if (value.length > 500) return "Feedback must be less than 500 characters";
        return "";
      default:
        return "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (touchedFields[name]) {
      const error = validateField(name, value);
      setFieldErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setFieldErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    Object.keys(form).forEach(key => {
      if (key !== "rating") {
        const error = validateField(key, form[key]);
        if (error) {
          errors[key] = error;
          isValid = false;
        }
      }
    });

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSnackbar({
        open: true,
        message: "Please fix the errors in the form",
        severity: "error",
      });
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let res;
      const submitData = { ...form, rating: Number(form.rating) };

      if (isEditing) {
        res = await fetch(`${API_BASE}/updateFeedback/${editingFeedback._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(submitData),
        });
      } else {
        res = await fetch(`${API_BASE}/createFeedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(submitData),
        });
      }

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Something went wrong");

      setFormSubmitted(true);
      setSuccess(isEditing ? "Feedback updated successfully!" : "Feedback submitted successfully!");
      
      setSnackbar({
        open: true,
        message: isEditing ? "✨ Feedback updated successfully!" : "🎉 Feedback submitted successfully!",
        severity: "success",
      });

      setTimeout(() => {
        setForm(emptyForm);
        setFormSubmitted(false);
        onFeedbackCreated?.();
      }, 1500);
    } catch (err) {
      setError(err.message);
      setSnackbar({
        open: true,
        message: err.message,
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const characterCount = form.feedback.length;
  const isFeedbackValid = characterCount >= 10 && characterCount <= 500;
  const showCharacterWarning = touchedFields.feedback && characterCount > 0 && characterCount < 10;

  return (
    <>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <Paper
          elevation={0}
          sx={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            borderRadius: "28px",
            border: "1px solid rgba(37,99,235,0.1)",
            boxShadow: "0 20px 40px -12px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.05)",
            overflow: "hidden",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: isEditing
                ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                : "linear-gradient(90deg, #2563eb, #60a5fa)",
            },
          }}
        >
          {/* Animated background particles */}
          <Box
            sx={{
              position: "absolute",
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              borderRadius: "50%",
              background: isEditing
                ? "radial-gradient(circle, rgba(245,158,11,0.05) 0%, rgba(245,158,11,0) 70%)"
                : "radial-gradient(circle, rgba(37,99,235,0.05) 0%, rgba(37,99,235,0) 70%)",
              pointerEvents: "none",
            }}
          />

          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: { xs: 3, sm: 4 },
              py: { xs: 2.5, sm: 3 },
              borderBottom: "1px solid rgba(0,0,0,0.06)",
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "18px",
                    background: isEditing
                      ? "linear-gradient(135deg, #f59e0b, #fbbf24)"
                      : "linear-gradient(135deg, #2563eb, #60a5fa)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    flexShrink: 0,
                    boxShadow: isEditing
                      ? "0 8px 20px rgba(245,158,11,0.25)"
                      : "0 8px 20px rgba(37,99,235,0.25)",
                  }}
                >
                  {isEditing
                    ? <EditNoteIcon sx={{ fontSize: 28 }} />
                    : <FeedbackIcon sx={{ fontSize: 28 }} />}
                </Box>
              </motion.div>

              <Box>
                <Typography
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 800,
                    fontSize: { xs: "1.1rem", sm: "1.25rem" },
                    background: "linear-gradient(135deg, #1e293b, #334155)",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {isEditing ? "Edit Feedback" : "Share Your Experience"}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.875rem",
                    color: "#64748b",
                    mt: 0.5,
                  }}
                >
                  {isEditing
                    ? "Update your feedback to help us improve"
                    : "Your insights help us create better learning experiences"}
                </Typography>
              </Box>
            </Box>

            {isEditing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <IconButton
                  onClick={onCancelEdit}
                  size="medium"
                  sx={{
                    color: "#94a3b8",
                    bgcolor: "rgba(0,0,0,0.04)",
                    borderRadius: "14px",
                    width: 42,
                    height: 42,
                    transition: "all 0.2s",
                    "&:hover": {
                      bgcolor: "#fee2e2",
                      color: "#ef4444",
                      transform: "rotate(90deg)",
                    },
                  }}
                >
                  <CancelIcon />
                </IconButton>
              </motion.div>
            )}
          </Box>

          {/* Form Body */}
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <AnimatePresence mode="wait">
              {formSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 8,
                      background: "linear-gradient(135deg, #f0fdf4, #dcfce7)",
                      borderRadius: "20px",
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 64, color: "#22c55e", mb: 2 }} />
                    </motion.div>
                    <Typography variant="h6" sx={{ color: "#166534", fontWeight: 600, mb: 1 }}>
                      {success}
                    </Typography>
                    <Typography sx={{ color: "#15803d" }}>
                      Redirecting to feedback list...
                    </Typography>
                  </Box>
                </motion.div>
              ) : (
                <Box component="form" onSubmit={handleSubmit}>
                  {/* Row 1: Tutor Name + Tutor Email */}
                  <Box sx={{ display: "flex", gap: 2.5, mb: 2.5, flexWrap: "wrap" }}>
                    {["tutorName", "tutorEmail"].map((field, index) => (
                      <motion.div
                        key={field}
                        custom={index}
                        variants={fieldVariants}
                        initial="hidden"
                        animate="visible"
                        style={{ flex: 1, minWidth: "200px" }}
                      >
                        <TextField
                          label={field === "tutorName" ? "Tutor Name" : "Tutor Email"}
                          name={field}
                          type={field === "tutorEmail" ? "email" : "text"}
                          value={form[field]}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          required
                          fullWidth
                          placeholder={
                            field === "tutorName"
                              ? "e.g., Mr. John Silva"
                              : "tutor@example.com"
                          }
                          error={!!fieldErrors[field] && touchedFields[field]}
                          helperText={touchedFields[field] && fieldErrors[field]}
                          variant="outlined"
                          sx={fieldSx}
                          InputProps={{
                            startAdornment: field === "tutorEmail" && (
                              <InputAdornment position="start">
                                <Typography sx={{ color: "#94a3b8" }}>📧</Typography>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </motion.div>
                    ))}
                  </Box>

                  {/* Row 2: Lesson + Rating */}
                  <Box sx={{ display: "flex", gap: 2.5, mb: 2.5, flexWrap: "wrap" }}>
                    <motion.div
                      custom={2}
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      style={{ flex: 2 }}
                    >
                      <TextField
                        label="Lesson / Subject"
                        name="lesson"
                        value={form.lesson}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        fullWidth
                        placeholder="e.g., Advanced Calculus - Derivatives"
                        error={!!fieldErrors.lesson && touchedFields.lesson}
                        helperText={touchedFields.lesson && fieldErrors.lesson}
                        variant="outlined"
                        sx={fieldSx}
                      />
                    </motion.div>

                    <motion.div
                      custom={3}
                      variants={fieldVariants}
                      initial="hidden"
                      animate="visible"
                      style={{ flex: 1 }}
                    >
                      <Box
                        sx={{
                          p: 1.5,
                          border: "1.5px solid #e8eaf0",
                          borderRadius: "16px",
                          background: "#ffffff",
                          transition: "all 0.2s",
                          "&:hover": { borderColor: "#93c5fd", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            fontWeight: 600,
                            mb: 1,
                            ml: 1,
                          }}
                        >
                          Overall Rating
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 2, px: 1 }}>
                          <Rating
                            value={Number(form.rating)}
                            onChange={(_, val) => {
                              setForm({ ...form, rating: val });
                              setTouchedFields({ ...touchedFields, rating: true });
                            }}
                            size="large"
                            icon={<StarIcon sx={{ color: "#f59e0b", fontSize: 28 }} />}
                            emptyIcon={<StarBorderIcon sx={{ color: "#cbd5e1", fontSize: 28 }} />}
                          />
                          <Chip
                            label={`${form.rating} / 5`}
                            size="small"
                            sx={{
                              bgcolor: "#fef3c7",
                              color: "#d97706",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                        </Box>
                      </Box>
                    </motion.div>
                  </Box>

                  {/* Row 3: Feedback */}
                  <motion.div
                    custom={4}
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <TextField
                      label="Your Feedback"
                      name="feedback"
                      value={form.feedback}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Share your detailed feedback about the lesson, teaching style, and learning outcomes..."
                      error={(!!fieldErrors.feedback && touchedFields.feedback) || showCharacterWarning}
                      helperText={
                        (touchedFields.feedback && fieldErrors.feedback) ||
                        (showCharacterWarning && `Add ${10 - characterCount} more characters`) ||
                        (characterCount > 0 && `${characterCount}/500 characters`)
                      }
                      variant="outlined"
                      sx={fieldSx}
                    />
                  </motion.div>

                  {/* Submit Button */}
                  <motion.div
                    custom={5}
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <Box sx={{ mt: 3.5, display: "flex", gap: 2, justifyContent: "flex-end" }}>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                        sx={{
                          px: 4,
                          py: 1.5,
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          borderRadius: "14px",
                          textTransform: "none",
                          background: isEditing
                            ? "linear-gradient(135deg, #f59e0b, #fbbf24)"
                            : "linear-gradient(135deg, #2563eb, #60a5fa)",
                          boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                          transition: "all 0.2s",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
                          },
                        }}
                      >
                        {loading
                          ? "Processing..."
                          : isEditing
                            ? "Update Feedback"
                            : "Submit Feedback"}
                      </Button>
                    </Box>
                  </motion.div>
                </Box>
              )}
            </AnimatePresence>
          </Box>
        </Paper>
      </motion.div>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: "12px", alignItems: "center" }}
          iconMapping={{
            success: <CheckCircleIcon fontSize="inherit" />,
            error: <ErrorIcon fontSize="inherit" />,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

// Modern TextField styles
const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "16px",
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.95rem",
    background: "#ffffff",
    transition: "all 0.2s",
    "& fieldset": {
      borderColor: "#e2e8f0",
      borderWidth: "1.5px",
    },
    "&:hover fieldset": {
      borderColor: "#93c5fd",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2563eb",
      borderWidth: "2px",
      boxShadow: "0 0 0 3px rgba(37,99,235,0.1)",
    },
  },
  "& .MuiInputLabel-root": {
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.9rem",
    color: "#64748b",
    "&.Mui-focused": {
      color: "#2563eb",
      fontWeight: 500,
    },
  },
  "& .MuiFormHelperText-root": {
    fontFamily: "'Inter', sans-serif",
    fontSize: "0.75rem",
    marginLeft: 1,
  },
};