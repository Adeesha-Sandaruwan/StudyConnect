import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SendIcon from "@mui/icons-material/Send";
import EditNoteIcon from "@mui/icons-material/EditNote";
import CancelIcon from "@mui/icons-material/Cancel";
import FeedbackIcon from "@mui/icons-material/Feedback";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import AddCommentIcon from "@mui/icons-material/AddComment";
import TableChartIcon from "@mui/icons-material/TableChart";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import ListAltIcon from "@mui/icons-material/ListAlt";
import InboxIcon from "@mui/icons-material/Inbox";
import student from "../assets/student.png";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Rating,
  IconButton,
  Paper,
  Chip,
  Snackbar,
  InputAdornment,
  Container,
  CssBaseline,
  Tab,
  Tabs,
  ThemeProvider,
  createTheme,
  Avatar,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Fade,
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

// MUI Theme Configuration
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2563eb", light: "#3b82f6", dark: "#1d4ed8" },
    secondary: { main: "#7c3aed" },
    warning: { main: "#f59e0b" },
    success: { main: "#10b981" },
    error: { main: "#ef4444" },
    background: { default: "#f5f7ff", paper: "#ffffff" },
    text: { primary: "#0f172a", secondary: "#64748b" },
    divider: "#e8eaf0",
  },
  typography: { fontFamily: "'Outfit', 'DM Sans', 'Segoe UI', sans-serif" },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: "none", fontWeight: 600, borderRadius: 10 } },
    },
    MuiTextField: { defaultProps: { size: "medium" } },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "0.9rem",
          fontFamily: "'Outfit', sans-serif",
        },
      },
    },
  },
});

// Helper Components
function BulletPoint({ text, highlight, color = "#2563eb", bold = false }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
      <FiberManualRecordIcon sx={{ fontSize: 10, color, flexShrink: 0 }} />
      <Typography
        sx={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: bold ? "1.05rem" : "0.95rem",
          fontWeight: bold ? 700 : 400,
          color: bold ? "#0f172a" : "#475569",
        }}
      >
        {highlight ? (
          <>
            {text.split(highlight)[0]}
            <span style={{ color, fontWeight: 700 }}>{highlight}</span>
            {text.split(highlight)[1]}
          </>
        ) : (
          text
        )}
      </Typography>
    </Box>
  );
}

function SkeletonRows() {
  return Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 7 }).map((__, j) => (
        <TableCell key={j}>
          <Skeleton variant="text" width="80%" height={24} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

function nameToColor(name = "") {
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#7c3aed", "#ef4444", "#0891b2"];
  return colors[name.charCodeAt(0) % colors.length];
}

// FeedbackForm Component
function FeedbackForm({ onFeedbackCreated, editingFeedback, onCancelEdit }) {
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
  const showCharacterWarning = touchedFields.feedback && characterCount > 0 && characterCount < 10;

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

// FeedbackTable Component
function FeedbackTable({ feedbacks, loading, onEdit, onRefresh }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;

    setDeletingId(id);
    setDeleteError("");

    try {
      const res = await fetch(`${API_BASE}/deleteFeedback/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Delete failed");

      onRefresh?.();

    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const paginatedRows = feedbacks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const ratingColor = (r) => {
    if (r >= 4) return "success";
    if (r === 3) return "warning";
    return "error";
  };

  return (
    <Fade in timeout={400}>
      <Box
        sx={{
          background: "#fff",
          borderRadius: "20px",
          border: "1.5px solid #e8eaf0",
          overflow: "hidden",
          boxShadow: "0 4px 32px rgba(37,99,235,0.08)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2.5,
            borderBottom: "1.5px solid #f0f2f7",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                bgcolor: "#7c3aed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
              }}
            >
              <ListAltIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  sx={{
                    fontFamily: "'Outfit', 'DM Sans', sans-serif",
                    fontWeight: 700,
                    fontSize: "1rem",
                    color: "#0f172a",
                  }}
                >
                  All Feedbacks
                </Typography>
                <Chip
                  label={feedbacks.length}
                  size="small"
                  sx={{
                    bgcolor: "#eff6ff",
                    color: "#2563eb",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    height: 22,
                    fontFamily: "'Outfit', sans-serif",
                  }}
                />
              </Box>
              <Typography sx={{ fontSize: "0.78rem", color: "#94a3b8", fontFamily: "'Outfit', sans-serif" }}>
                Manage and review all submitted feedbacks
              </Typography>
            </Box>
          </Box>

          <Tooltip title="Refresh list">
            <IconButton
              onClick={onRefresh}
              sx={{
                color: "#64748b",
                bgcolor: "#f8fafc",
                border: "1.5px solid #e8eaf0",
                borderRadius: "10px",
                "&:hover": { bgcolor: "#eff6ff", color: "#2563eb" },
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {deleteError && (
          <Alert severity="error" sx={{ m: 2, borderRadius: 2 }} onClose={() => setDeleteError("")}>
            {deleteError}
          </Alert>
        )}

        {!loading && feedbacks.length === 0 ? (
          <Box sx={{ py: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: "20px",
                bgcolor: "#f0f4ff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <InboxIcon sx={{ fontSize: 36, color: "#a5b4fc" }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: "#0f172a", fontFamily: "'Outfit', sans-serif" }}>
              No feedbacks yet
            </Typography>
            <Typography sx={{ fontSize: "0.85rem", color: "#94a3b8", fontFamily: "'Outfit', sans-serif" }}>
              Be the first to submit a feedback!
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    {["#", "Tutor Name", "Tutor Email", "Lesson", "Rating", "Feedback", "Date", "Actions"].map((h) => (
                      <TableCell
                        key={h}
                        sx={{
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 700,
                          color: "#94a3b8",
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                          borderBottom: "1.5px solid #f0f2f7",
                          py: 1.5,
                        }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <SkeletonRows />
                  ) : (
                    paginatedRows.map((fb, idx) => (
                      <TableRow
                        key={fb._id}
                        hover
                        sx={{
                          "&:hover": { bgcolor: "#fafbff" },
                          "&:last-child td": { border: 0 },
                          "& td": { borderBottom: "1px solid #f0f2f7" },
                        }}
                      >
                        <TableCell sx={{ py: 2 }}>
                          <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.82rem", color: "#cbd5e1", fontWeight: 600 }}>
                            {page * rowsPerPage + idx + 1}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                bgcolor: nameToColor(fb.tutorName),
                                borderRadius: "10px",
                                fontFamily: "'Outfit', sans-serif",
                              }}
                            >
                              {fb.tutorName?.[0]?.toUpperCase() || "?"}
                            </Avatar>
                            <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: "0.88rem", color: "#0f172a" }}>
                              {fb.tutorName}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.83rem", color: "#64748b" }}>
                            {fb.tutorEmail}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={fb.lesson}
                            size="small"
                            sx={{
                              bgcolor: "#eff6ff",
                              color: "#2563eb",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              maxWidth: 140,
                              borderRadius: "8px",
                              fontFamily: "'Outfit', sans-serif",
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Rating
                              value={fb.rating}
                              readOnly
                              size="small"
                              icon={<StarIcon sx={{ color: "#f59e0b", fontSize: 16 }} />}
                              emptyIcon={<StarIcon sx={{ color: "#e2e8f0", fontSize: 16 }} />}
                            />
                            <Chip
                              label={fb.rating}
                              size="small"
                              color={ratingColor(fb.rating)}
                              sx={{ fontWeight: 700, fontSize: "0.72rem", height: 20, borderRadius: "6px", fontFamily: "'Outfit', sans-serif" }}
                            />
                          </Box>
                        </TableCell>

                        <TableCell sx={{ maxWidth: 200 }}>
                          <Typography
                            sx={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: "0.83rem",
                              color: "#64748b",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: 180,
                            }}
                            title={fb.feedback}
                          >
                            {fb.feedback}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.82rem", color: "#94a3b8" }}>
                            {fb.createdAt
                              ? new Date(fb.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => onEdit?.(fb)}
                                sx={{
                                  color: "#2563eb",
                                  bgcolor: "#eff6ff",
                                  borderRadius: "8px",
                                  "&:hover": { bgcolor: "#dbeafe" },
                                }}
                              >
                                <EditIcon sx={{ fontSize: 15 }} />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(fb._id)}
                                disabled={deletingId === fb._id}
                                sx={{
                                  color: "#ef4444",
                                  bgcolor: "#fef2f2",
                                  borderRadius: "8px",
                                  "&:hover": { bgcolor: "#fee2e2" },
                                }}
                              >
                                {deletingId === fb._id ? (
                                  <CircularProgress size={14} color="error" />
                                ) : (
                                  <DeleteIcon sx={{ fontSize: 15 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={feedbacks.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
              sx={{
                fontFamily: "'Outfit', sans-serif",
                borderTop: "1.5px solid #f0f2f7",
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: "0.82rem",
                  color: "#64748b",
                },
              }}
            />
          </>
        )}
      </Box>
    </Fade>
  );
}

// Main Feedbacks Component
export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  const fetchFeedbacks = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch(`${API_BASE}/getFeedbacks`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch feedbacks");
      setFeedbacks(Array.isArray(data) ? data : data.feedbacks || []);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleEdit = (feedback) => {
    setEditingFeedback(feedback);
    setActiveTab(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => setEditingFeedback(null);

  const handleFeedbackCreated = () => {
    setEditingFeedback(null);
    fetchFeedbacks();
    setActiveTab(1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        `}
      </style>

      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7ff" }}>
        {/* Top Navigation Bar */}
        <Box
          sx={{
            bgcolor: "#fff",
            borderBottom: "1.5px solid #e8eaf0",
            position: "sticky",
            top: 0,
            zIndex: 100,
            boxShadow: "0 1px 8px rgba(37,99,235,0.06)",
          }}
        >
          <Container maxWidth="xl">
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                TabIndicatorProps={{ style: { height: 3, borderRadius: 3, backgroundColor: "#2563eb" } }}
              >
                <Tab
                  icon={<AddCommentIcon fontSize="small" />}
                  iconPosition="start"
                  label={editingFeedback ? "Edit Feedback" : "Submit Feedback"}
                  sx={{ py: 2.5, minHeight: 0 }}
                />
                <Tab
                  icon={<TableChartIcon fontSize="small" />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      All Feedbacks
                      {feedbacks.length > 0 && (
                        <Chip
                          label={feedbacks.length}
                          size="small"
                          sx={{
                            bgcolor: "#2563eb",
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            height: 20,
                            fontFamily: "'Outfit', sans-serif",
                          }}
                        />
                      )}
                    </Box>
                  }
                  sx={{ py: 2.5, minHeight: 0 }}
                />
              </Tabs>

              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 900,
                  fontSize: "0.8rem",
                  fontFamily: "'Outfit', sans-serif",
                }}
              >
                MJ
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Hero Section - Submit Tab */}
        {activeTab === 0 && (
          <Box
            sx={{
              width: "100%",
              background: "linear-gradient(110deg, #fdf6d8 0%, #fef3c7 35%, #eef2ff 70%, #ede9fe 100%)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "340px 1fr 1fr" },
                alignItems: "stretch",
                minHeight: { xs: "auto", md: 540 },
                pl: { xs: 3, md: 5, lg: 7 },
                pr: { xs: 3, md: 0 },
              }}
            >
              {/* Left Column - Hero Text */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  pr: { xs: 3, md: 3 },
                  py: { xs: 5, md: 7 },
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 900,
                      fontSize: { xs: "2rem", md: "2.5rem" },
                      lineHeight: 1.15,
                      color: "#0f172a",
                      mb: 0.5,
                    }}
                  >
                    Build Your <span style={{ color: "#7c3aed" }}>Skills</span> 🎓
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 700,
                      fontSize: { xs: "1.1rem", md: "1.45rem" },
                      color: "#0f172a",
                      mb: 3,
                    }}
                  >
                    With Experts Any Time, Anywhere
                  </Typography>
                  <Box>
                    <BulletPoint text="Free online courses from the world's leading experts." />
                    <BulletPoint text="Join 10+ Million Learners today" highlight="10+ Million" color="#2563eb" />
                    <BulletPoint text="Join Us Today" bold />
                    <BulletPoint text="Lifetime Access" />
                    <BulletPoint text="150k Active Students" highlight="150k" color="#7c3aed" />
                    <BulletPoint text="12 online Courses" highlight="12" color="#2563eb" />
                  </Box>
                </Box>
              </Box>

              {/* Middle Column - Feedback Form */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: { xs: 4, md: 5 },
                  px: { xs: 2, md: 3 },
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <FeedbackForm
                    onFeedbackCreated={handleFeedbackCreated}
                    editingFeedback={editingFeedback}
                    onCancelEdit={handleCancelEdit}
                  />
                </Box>
              </Box>

              {/* Right Column - Student Image (Full Cover) */}
              <Box
                sx={{
                  display: { xs: "none", md: "block" },
                  position: "relative",
                  overflow: "hidden",
                  background: "radial-gradient(ellipse at 50% 65%, rgba(253,224,71,0.6) 0%, rgba(253,224,71,0.2) 48%, transparent 72%)",
                }}
              >
                <Box
                  component="img"
                  src={student}
                  alt="Student"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    height: "100%",
                    width: "auto",
                    maxWidth: "none",
                    objectFit: "cover",
                    objectPosition: "bottom center",
                    filter: "drop-shadow(-4px 0 16px rgba(253,200,60,0.18))",
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* Table Tab */}
        {activeTab === 1 && (
          <Container maxWidth="lg" sx={{ py: 4 }}>
            {fetchError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setFetchError("")}>
                {fetchError}
              </Alert>
            )}
            <Fade in timeout={300}>
              <Box>
                <FeedbackTable
                  feedbacks={feedbacks}
                  loading={loading}
                  onEdit={handleEdit}
                  onRefresh={fetchFeedbacks}
                />
              </Box>
            </Fade>
          </Container>
        )}

        {/* Footer */}
        <Box component="footer" sx={{ borderTop: "1.5px solid #e8eaf0", py: 3, textAlign: "center" }}>
          <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.82rem", color: "#94a3b8" }}>
            @ {new Date().getFullYear()} FeedbackHub — Built with React + MUI
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}