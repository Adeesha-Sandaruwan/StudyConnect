import { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Fade,
  IconButton,
  Rating,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import ListAltIcon from "@mui/icons-material/ListAlt";
import InboxIcon from "@mui/icons-material/Inbox";
import StarIcon from "@mui/icons-material/Star";

// ─────────────────────────────────────────────────────────────
// API Base URL — DELETE endpoint is used in this component
// ─────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000/api/feedback";

// ─────────────────────────────────────────────────────────────
// SkeletonRows — Loading placeholder
//
// Renders 5 rows of skeleton cells while feedback data is
// being fetched from the API (during READ operation).
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// nameToColor — Avatar color helper
//
// Generates a consistent color for a tutor's avatar based on
// the first character of their name (deterministic, not random).
// ─────────────────────────────────────────────────────────────
function nameToColor(name = "") {
  const colors = ["#2563eb", "#10b981", "#f59e0b", "#7c3aed", "#ef4444", "#0891b2"];
  return colors[name.charCodeAt(0) % colors.length];
}

// ─────────────────────────────────────────────────────────────
// FeedbackTable Component
//
// Displays all feedback records in a paginated table.
// Handles:
//   READ   — displays feedbacks passed via props (fetched by parent)
//   DELETE — sends DELETE request to remove a feedback by ID
//   EDIT   — triggers parent's handleEdit callback to open form in edit mode
//
// Props:
//   feedbacks  — array of feedback objects from the API
//   loading    — boolean, true while parent is fetching data
//   onEdit     — callback(feedback) called when Edit button is clicked
//   onRefresh  — callback() called after successful delete to re-fetch list
// ─────────────────────────────────────────────────────────────
export default function FeedbackTable({ feedbacks, loading, onEdit, onRefresh }) {

  // ── Pagination state ──
  const [page, setPage] = useState(0);           // current page index (0-based)
  const [rowsPerPage, setRowsPerPage] = useState(5); // rows per page option

  // ── Delete state ──
  const [deleteError, setDeleteError] = useState("");  // error message from delete API
  const [deletingId, setDeletingId] = useState(null);  // ID of the row currently being deleted

  // ─────────────────────────────────────────────────────────────
  // handleDelete — DELETE (CRUD: Delete)
  //
  // DELETE /api/feedback/deleteFeedback/:id
  // Sends a DELETE request to remove the feedback with the given ID.
  //
  // Flow:
  //   1. Confirm with user via browser dialog
  //   2. Set deletingId to show spinner on the correct row
  //   3. Send DELETE request with the feedback's MongoDB _id in the URL
  //   4. On success: call onRefresh() so parent re-fetches the updated list
  //   5. On failure: show error message in the Alert
  // ─────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    // Ask user to confirm before deleting — prevents accidental deletions
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;

    setDeletingId(id);    // show spinner on this specific row's delete button
    setDeleteError("");   // clear any previous error

    try {
      // Send DELETE request to the backend with the feedback's ID in the URL
      const res = await fetch(`${API_BASE}/deleteFeedback/${id}`, {
        method: "DELETE",
        credentials: "include", // send cookies for session/auth
      });

      const data = await res.json();

      // If HTTP status is not 2xx, throw an error with the server message
      if (!res.ok) throw new Error(data.message || "Delete failed");

      // Success — re-fetch the feedback list to reflect the deletion
      onRefresh?.();

    } catch (err) {
      // Display error in the Alert at the top of the table
      setDeleteError(err.message);
    } finally {
      // Always clear the deleting spinner regardless of outcome
      setDeletingId(null);
    }
  };

  // ── Pagination handlers ──
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0); // reset to first page when rows per page changes
  };

  // Slice the feedbacks array for the current page
  const paginatedRows = feedbacks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ── Helper: determine Chip color based on star rating ──
  // 4–5 stars → green (success), 3 stars → yellow (warning), 1–2 stars → red (error)
  const ratingColor = (r) => {
    if (r >= 4) return "success";
    if (r === 3) return "warning";
    return "error";
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
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
        {/* ── Table Header ── */}
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
            {/* Purple icon badge */}
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
                {/* Total count badge — shows total number of feedback records */}
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

          {/* Refresh button — triggers READ again by calling onRefresh */}
          <Tooltip title="Refresh list">
            <IconButton
              onClick={onRefresh} // re-fetches feedbacks from the API
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

        {/* Delete error alert — shown if DELETE request fails */}
        {deleteError && (
          <Alert severity="error" sx={{ m: 2, borderRadius: 2 }} onClose={() => setDeleteError("")}>
            {deleteError}
          </Alert>
        )}

        {/* ── Empty State ── */}
        {/* Shown when READ returns no feedback records */}
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
            {/* ── Data Table (READ display) ── */}
            <TableContainer>
              <Table sx={{ minWidth: 800 }}>

                {/* Table column headers */}
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
                  {/* Show skeleton rows while READ is in progress */}
                  {loading ? (
                    <SkeletonRows />
                  ) : (
                    // Map over paginated feedback records
                    paginatedRows.map((fb, idx) => (
                      <TableRow
                        key={fb._id} // MongoDB document _id as React key
                        hover
                        sx={{
                          "&:hover": { bgcolor: "#fafbff" },
                          "&:last-child td": { border: 0 },
                          "& td": { borderBottom: "1px solid #f0f2f7" },
                        }}
                      >
                        {/* Row number (1-based, accounts for pagination) */}
                        <TableCell sx={{ py: 2 }}>
                          <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.82rem", color: "#cbd5e1", fontWeight: 600 }}>
                            {page * rowsPerPage + idx + 1}
                          </Typography>
                        </TableCell>

                        {/* Tutor Name with colored avatar */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            {/* Avatar color is determined by first letter of tutor name */}
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

                        {/* Tutor Email */}
                        <TableCell>
                          <Typography sx={{ fontFamily: "'Outfit', sans-serif", fontSize: "0.83rem", color: "#64748b" }}>
                            {fb.tutorEmail}
                          </Typography>
                        </TableCell>

                        {/* Lesson displayed as a blue pill chip */}
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

                        {/* Rating — stars + colored numeric badge */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {/* Read-only star rating display */}
                            <Rating
                              value={fb.rating}
                              readOnly
                              size="small"
                              icon={<StarIcon sx={{ color: "#f59e0b", fontSize: 16 }} />}
                              emptyIcon={<StarIcon sx={{ color: "#e2e8f0", fontSize: 16 }} />}
                            />
                            {/* Numeric badge — green/yellow/red based on rating value */}
                            <Chip
                              label={fb.rating}
                              size="small"
                              color={ratingColor(fb.rating)}
                              sx={{ fontWeight: 700, fontSize: "0.72rem", height: 20, borderRadius: "6px", fontFamily: "'Outfit', sans-serif" }}
                            />
                          </Box>
                        </TableCell>

                        {/* Feedback text — truncated with ellipsis, full text on hover (title attr) */}
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
                            title={fb.feedback} // shows full text on hover
                          >
                            {fb.feedback}
                          </Typography>
                        </TableCell>

                        {/* Created date — formatted as "Jan 1, 2024" */}
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

                        {/* ── Action Buttons: EDIT + DELETE ── */}
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 0.5 }}>

                            {/* Edit button — triggers UPDATE flow via onEdit callback */}
                            {/* Parent (Feedbacks.jsx) will set editingFeedback and switch to form tab */}
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => onEdit?.(fb)} // passes full feedback object to parent
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

                            {/* Delete button — triggers DELETE API call */}
                            {/* Shows spinner while this specific row is being deleted */}
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(fb._id)} // passes MongoDB _id
                                disabled={deletingId === fb._id}     // disable only this row's button
                                sx={{
                                  color: "#ef4444",
                                  bgcolor: "#fef2f2",
                                  borderRadius: "8px",
                                  "&:hover": { bgcolor: "#fee2e2" },
                                }}
                              >
                                {/* Spinner replaces icon while delete is in progress */}
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

            {/* ── Pagination Controls ── */}
            {/* Allows user to navigate between pages and change rows per page */}
            <TablePagination
              component="div"
              count={feedbacks.length}          // total number of records
              page={page}                        // current page index
              onPageChange={handleChangePage}    // page navigation handler
              rowsPerPage={rowsPerPage}          // currently selected rows per page
              onRowsPerPageChange={handleChangeRowsPerPage} // rows per page change handler
              rowsPerPageOptions={[5, 10, 25]}   // available options
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