import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Container,
  CssBaseline,
  Fade,
  Tab,
  Tabs,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import AddCommentIcon from "@mui/icons-material/AddComment";
import TableChartIcon from "@mui/icons-material/TableChart";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import FeedbackForm from "./FeedbackForm";
import FeedbackTable from "./FeedbackTable";
import studentImg from "../../assets/student.png";

// ─────────────────────────────────────────────────────────────
// API Base URL — READ endpoint is used here to fetch all feedbacks
// ─────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api/feedback";

// ─────────────────────────────────────────────────────────────
// MUI Theme Configuration
// Defines the global color palette, typography, and component
// overrides used across all MUI components in this module.
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// BulletPoint — Reusable hero list item component
//
// Props:
//   text      — full text of the bullet
//   highlight — substring to highlight in a different color
//   color     — color for the dot and highlighted text
//   bold      — whether to make the entire text bold
// ─────────────────────────────────────────────────────────────
function BulletPoint({ text, highlight, color = "#2563eb", bold = false }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
      {/* Colored bullet dot */}
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
            {/* Text before highlighted word */}
            {text.split(highlight)[0]}
            {/* Highlighted word in custom color */}
            <span style={{ color, fontWeight: 700 }}>{highlight}</span>
            {/* Text after highlighted word */}
            {text.split(highlight)[1]}
          </>
        ) : (
          text
        )}
      </Typography>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
// Feedbacks — Main Page Component
//
// Responsibilities:
//   1. READ    — fetches all feedbacks from the API on mount
//   2. Manages which feedback is being edited (passed to FeedbackForm)
//   3. Routes between Submit tab and All Feedbacks table tab
//   4. Passes callbacks to child components for edit/refresh
// ─────────────────────────────────────────────────────────────
export default function Feedbacks() {

  // ── State ──
  const [feedbacks, setFeedbacks] = useState([]);         // all feedback records from API
  const [loading, setLoading] = useState(true);           // true while fetching feedbacks
  const [fetchError, setFetchError] = useState("");       // error message from fetch
  const [editingFeedback, setEditingFeedback] = useState(null); // feedback object being edited (null = create mode)
  const [activeTab, setActiveTab] = useState(0);          // 0 = Submit Form tab, 1 = Table tab

  // ─────────────────────────────────────────────────────────────
  // fetchFeedbacks — READ (CRUD: Read)
  //
  // GET /api/feedback/getFeedbacks
  // Fetches all feedback documents from the backend and stores
  // them in the `feedbacks` state array.
  //
  // Called:
  //   - On component mount (useEffect below)
  //   - After a feedback is created, updated, or deleted (via onRefresh)
  // ─────────────────────────────────────────────────────────────
  const fetchFeedbacks = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await fetch(`${API_BASE}/getFeedbacks`, {
        credentials: "include", // send cookies for session/auth
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch feedbacks");
      // Handle both array response and { feedbacks: [] } shaped response
      setFeedbacks(Array.isArray(data) ? data : data.feedbacks || []);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch feedbacks on initial page load ──
  useEffect(() => { fetchFeedbacks(); }, []);

  // ─────────────────────────────────────────────────────────────
  // handleEdit — Triggered from FeedbackTable when user clicks Edit
  //
  // Sets the feedback to be edited and switches to the form tab.
  // The form will pre-fill with the selected feedback's data.
  // ─────────────────────────────────────────────────────────────
  const handleEdit = (feedback) => {
    setEditingFeedback(feedback); // pass feedback data to FeedbackForm
    setActiveTab(0);              // switch to Submit/Edit form tab
    window.scrollTo({ top: 0, behavior: "smooth" }); // scroll to top for visibility
  };

  // ─────────────────────────────────────────────────────────────
  // handleCancelEdit — Triggered from FeedbackForm cancel button
  //
  // Clears the editing state, returning the form to create mode.
  // ─────────────────────────────────────────────────────────────
  const handleCancelEdit = () => setEditingFeedback(null);

  // ─────────────────────────────────────────────────────────────
  // handleFeedbackCreated — Triggered after successful create or update
  //
  // Resets editing state, refreshes the feedback list from the API,
  // and switches to the table tab to show the updated list.
  // ─────────────────────────────────────────────────────────────
  const handleFeedbackCreated = () => {
    setEditingFeedback(null); // clear edit mode
    fetchFeedbacks();         // re-fetch the updated list (READ again)
    setActiveTab(1);          // switch to table tab to show result
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Load Outfit font from Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');
      `}</style>

      <Box sx={{ minHeight: "100vh", bgcolor: "#f5f7ff" }}>

        {/* ── Top Navigation Bar ── */}
        {/* Contains tab switcher and logo badge */}
        <Box sx={{
          bgcolor: "#fff",
          borderBottom: "1.5px solid #e8eaf0",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 1px 8px rgba(37,99,235,0.06)",
        }}>
          <Container maxWidth="xl">
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>

              {/* Tab switcher — 0: Submit Form, 1: All Feedbacks table */}
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                TabIndicatorProps={{ style: { height: 3, borderRadius: 3, backgroundColor: "#2563eb" } }}
              >
                {/* Tab 0: Submit / Edit Feedback form */}
                <Tab
                  icon={<AddCommentIcon fontSize="small" />}
                  iconPosition="start"
                  label={editingFeedback ? "Edit Feedback" : "Submit Feedback"} // label changes in edit mode
                  sx={{ py: 2.5, minHeight: 0 }}
                />
                {/* Tab 1: All Feedbacks table with record count badge */}
                <Tab
                  icon={<TableChartIcon fontSize="small" />}
                  iconPosition="start"
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      All Feedbacks
                      {/* Show count badge only when there are feedbacks */}
                      {feedbacks.length > 0 && (
                        <Chip
                          label={feedbacks.length}
                          size="small"
                          sx={{
                            bgcolor: "#2563eb", color: "#fff", fontWeight: 700,
                            fontSize: "0.7rem", height: 20, fontFamily: "'Outfit', sans-serif",
                          }}
                        />
                      )}
                    </Box>
                  }
                  sx={{ py: 2.5, minHeight: 0 }}
                />
              </Tabs>

              {/* MJ Logo badge — decorative */}
              <Box sx={{
                width: 36, height: 36, borderRadius: "10px",
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 900, fontSize: "0.8rem", fontFamily: "'Outfit', sans-serif",
              }}>
                MJ
              </Box>
            </Box>
          </Container>
        </Box>

        {/* ── Hero Section (visible only on Submit/Edit tab) ── */}
        {activeTab === 0 && (
          <Box
            sx={{
              width: "100%",
              // Warm cream-yellow to lavender gradient background
              background: "linear-gradient(110deg, #fdf6d8 0%, #fef3c7 35%, #eef2ff 70%, #ede9fe 100%)",
              overflow: "hidden",
            }}
          >
            {/* 3-column grid layout: [hero text] [form] [student image] */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "340px 620px 1fr" },
                // col 1: fixed 340px for text
                // col 2: fixed 620px for form (wider for readability)
                // col 3: 1fr — takes remaining space for student image
                alignItems: "stretch",
                minHeight: { xs: "auto", md: 540 },
                pl: { xs: 3, md: 5, lg: 7 }, // left padding so content doesn't touch edge
              }}
            >
              {/* ── Col 1: Hero Marketing Text ── */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  pr: { xs: 3, md: 3 },
                  py: { xs: 5, md: 7 },
                }}
              >
                <Box>
                  {/* Main heading */}
                  <Typography sx={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 900,
                    fontSize: { xs: "2rem", md: "2.5rem" },
                    lineHeight: 1.15,
                    color: "#0f172a",
                    mb: 0.5,
                  }}>
                    Build Your{" "}
                    <span style={{ color: "#7c3aed" }}>Skills</span> 🎓
                  </Typography>
                  {/* Sub-heading */}
                  <Typography sx={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 700,
                    fontSize: { xs: "1.1rem", md: "1.45rem" },
                    color: "#0f172a",
                    mb: 3,
                  }}>
                    With Experts Any Time, Anywhere
                  </Typography>
                  {/* Feature bullet points */}
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

              {/* ── Col 2: Feedback Form (CREATE or EDIT) ── */}
              {/* FeedbackForm handles both create and update operations */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: { xs: 4, md: 5 },
                  pr: { xs: 3, md: 3 },
                }}
              >
                <Box sx={{ width: "100%" }}>
                  <FeedbackForm
                    onFeedbackCreated={handleFeedbackCreated} // called after create/update success
                    editingFeedback={editingFeedback}         // null = create mode, object = edit mode
                    onCancelEdit={handleCancelEdit}           // clears edit mode on cancel
                  />
                </Box>
              </Box>

              {/* ── Col 3: Student Image with yellow glow ── */}
              {/* Hidden on mobile, visible on md+ screens */}
              <Box
                sx={{
                  display: { xs: "none", md: "block" },
                  position: "relative",
                  overflow: "hidden",
                  // Yellow radial glow effect behind the student image
                  background: "radial-gradient(ellipse at 50% 65%, rgba(253,224,71,0.6) 0%, rgba(253,224,71,0.2) 48%, transparent 72%)",
                }}
              >
                {/* Student image — 106% height so feet are cropped at bottom naturally */}
                <Box
                  component="img"
                  src={studentImg}
                  alt="Student with backpack"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: "50%",
                    transform: "translateX(-50%)", // horizontally center in column
                    height: "106%",                // slightly taller than column to crop feet
                    width: "auto",
                    maxWidth: "none",
                    objectFit: "contain",
                    objectPosition: "bottom center",
                    filter: "drop-shadow(-4px 0 16px rgba(253,200,60,0.18))",
                  }}
                />
              </Box>

            </Box>
          </Box>
        )}

        {/* ── Table Tab (READ + DELETE) ── */}
        {/* Visible when activeTab === 1 */}
        {activeTab === 1 && (
          <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Show fetch error if the GET request failed */}
            {fetchError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setFetchError("")}>
                {fetchError}
              </Alert>
            )}
            <Fade in timeout={300}>
              <Box>
                {/* FeedbackTable handles READ display and DELETE operations */}
                <FeedbackTable
                  feedbacks={feedbacks}     // array of feedback documents from API
                  loading={loading}         // shows skeleton rows while fetching
                  onEdit={handleEdit}       // triggers edit mode for selected feedback
                  onRefresh={fetchFeedbacks} // re-fetches list after delete
                />
              </Box>
            </Fade>
          </Container>
        )}

        {/* ── Footer ── */}
        <Box component="footer" sx={{ borderTop: "1.5px solid #e8eaf0", py: 3, textAlign: "center" }}>
          <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.82rem", color: "#94a3b8" }}>
            © {new Date().getFullYear()} FeedbackHub — Built with React + MUI
          </Typography>
        </Box>

      </Box>
    </ThemeProvider>
  );
}