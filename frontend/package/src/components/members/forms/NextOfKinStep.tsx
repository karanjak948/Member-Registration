"use client";

import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addNextOfKin,
  updateNextOfKin,
  removeNextOfKin,
} from "@/store/registration/registrationSlice";
import { NextOfKinState } from "@/types/registration";
import {
  IconHeartHandshake,
  IconUser,
  IconId,
  IconPhone,
  IconMapPin,
  IconArrowLeft,
  IconArrowRight,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCheck,
  IconUserCheck,
} from "@tabler/icons-react";

interface NextOfKinStepProps {
  onComplete: () => void;
  onBack: () => void;
  onSkip?: () => void;
  required?: boolean;
}

const RELATIONSHIP_OPTIONS = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Relative",
  "Guardian",
  "Business Partner",
  "Other",
];

const emptyKinForm: NextOfKinState = {
  id: null,
  member: null,
  first_name: "",
  other_names: "",
  relationship: "",
  national_id: "",
  phone_number: "",
  physical_address: "",
  is_primary: true,
};

export default function NextOfKinStep({
  onComplete,
  onBack,
  onSkip,
  required = true,
}: NextOfKinStepProps) {
  const dispatch = useAppDispatch();
  const nextOfKins = useAppSelector((state) => state.registration.nextOfKins);
  const singleNextOfKin = useAppSelector((state) => state.registration.nextOfKin);

  // Fallback if user had preloaded a single nextOfKin but empty array
  const activeKins =
    nextOfKins.length > 0
      ? nextOfKins
      : singleNextOfKin.first_name
      ? [singleNextOfKin]
      : [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<NextOfKinState>(emptyKinForm);
  const [dialogError, setDialogError] = useState("");
  const [pageError, setPageError] = useState("");

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setFormData({
      ...emptyKinForm,
      is_primary: activeKins.length === 0,
    });
    setDialogError("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...activeKins[index] });
    setDialogError("");
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    dispatch(removeNextOfKin(index));
    if (pageError) setPageError("");
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name.trim()) {
      setDialogError("First name is required.");
      return;
    }
    if (!formData.relationship) {
      setDialogError("Please select a relationship.");
      return;
    }
    if (!formData.phone_number.trim()) {
      setDialogError("Phone number is required.");
      return;
    }

    if (editingIndex !== null) {
      dispatch(updateNextOfKin({ index: editingIndex, data: formData }));
    } else {
      dispatch(addNextOfKin(formData));
    }

    setDialogOpen(false);
    setDialogError("");
    if (pageError) setPageError("");
  };

  const handleContinue = () => {
    if (required && activeKins.length === 0) {
      setPageError(
        "Please add at least one Next of Kin beneficiary before proceeding.",
      );
      return;
    }
    setPageError("");
    onComplete();
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 1050, mx: "auto" }}>
      {/* Top Banner Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
          borderLeft: "6px solid #e11d48",
          bgcolor: "#ffffff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2.5,
                bgcolor: "#fff1f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#e11d48",
              }}
            >
              <IconHeartHandshake size={26} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h5" fontWeight={800} color="#0f172a">
                  Next of Kin &amp; Beneficiaries
                </Typography>
                <Chip
                  label={`${activeKins.length} Registered`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: activeKins.length > 0 ? "#ffe4e6" : "#f1f5f9",
                    color: activeKins.length > 0 ? "#e11d48" : "#64748b",
                  }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" mt={0.3}>
                Register emergency contact persons and designate primary/secondary estate beneficiaries.
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={handleOpenAdd}
            sx={{
              px: 3,
              py: 1.2,
              borderRadius: 2.5,
              fontWeight: 800,
              textTransform: "none",
              background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
              boxShadow: "0 4px 14px rgba(225, 29, 72, 0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #be123c 0%, #9f1239 100%)",
              },
            }}
          >
            + Add Next of Kin
          </Button>
        </Stack>
      </Paper>

      {/* Global Validation Warning */}
      {pageError && (
        <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: 2.5 }}>
          {pageError}
        </Alert>
      )}

      {/* Tabular Grid / Empty State */}
      {activeKins.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: "2px dashed #fecdd3",
            bgcolor: "#fff5f6",
            p: 5,
            textAlign: "center",
            mb: 4,
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: "#ffe4e6",
              color: "#e11d48",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <IconUserCheck size={32} />
          </Box>
          <Typography variant="h6" fontWeight={800} color="#0f172a" mb={1}>
            No Next of Kin Added Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" maxWidth={500} mx="auto" mb={3}>
            Add one or more next-of-kin records. You can designate emergency contacts and assign estate shares to multiple beneficiaries.
          </Typography>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={handleOpenAdd}
            sx={{
              px: 3.5,
              py: 1.2,
              borderRadius: 2.5,
              fontWeight: 800,
              textTransform: "none",
              bgcolor: "#e11d48",
              "&:hover": { bgcolor: "#be123c" },
            }}
          >
            + Add First Next of Kin
          </Button>
        </Card>
      ) : (
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            mb: 4,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 4px 20px -4px rgba(0,0,0,0.05)",
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: "#475569", width: 60 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Full Name</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Relationship</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Phone Number</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>National ID</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Address</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Designation</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#475569" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeKins.map((kin, idx) => (
                <TableRow
                  key={idx}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1.2} alignItems="center">
                      <Box
                        sx={{
                          p: 0.8,
                          borderRadius: 2,
                          bgcolor: "#fff1f2",
                          color: "#e11d48",
                          display: "flex",
                        }}
                      >
                        <IconUser size={16} />
                      </Box>
                      <Typography fontWeight={700} color="#0f172a">
                        {kin.first_name} {kin.other_names}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={kin.relationship || "Not specified"}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: "#eff6ff",
                        color: "#2563eb",
                        border: "1px solid #bfdbfe",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontWeight: 700, color: "#334155" }}>
                    {kin.phone_number || "—"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", color: "#64748b" }}>
                    {kin.national_id || "—"}
                  </TableCell>
                  <TableCell sx={{ color: "#64748b", maxWidth: 150, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                    {kin.physical_address || "—"}
                  </TableCell>
                  <TableCell>
                    {kin.is_primary ? (
                      <Chip
                        icon={<IconCheck size={14} color="#059669" />}
                        label="Primary"
                        size="small"
                        sx={{
                          bgcolor: "#ecfdf5",
                          color: "#059669",
                          fontWeight: 800,
                          border: "1px solid #a7f3d0",
                        }}
                      />
                    ) : (
                      <Chip
                        label="Secondary"
                        size="small"
                        sx={{
                          bgcolor: "#f1f5f9",
                          color: "#64748b",
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit Beneficiary">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(idx)}
                          sx={{ color: "#2563eb", "&:hover": { bgcolor: "#eff6ff" } }}
                        >
                          <IconEdit size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(idx)}
                          sx={{ color: "#e11d48", "&:hover": { bgcolor: "#fff1f2" } }}
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Navigation Buttons */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ pt: 2, borderTop: "1px solid #e2e8f0" }}
      >
        <Button
          variant="outlined"
          startIcon={<IconArrowLeft size={18} />}
          onClick={onBack}
          sx={{
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 2.5,
            px: 3,
            color: "#475569",
            borderColor: "#cbd5e1",
          }}
        >
          Back
        </Button>

        <Stack direction="row" spacing={2} alignItems="center">
          {!required && onSkip && (
            <Button
              variant="text"
              onClick={onSkip}
              sx={{ fontWeight: 700, textTransform: "none", color: "#64748b" }}
            >
              Skip Step
            </Button>
          )}

          <Button
            variant="contained"
            endIcon={<IconArrowRight size={18} />}
            onClick={handleContinue}
            sx={{
              fontWeight: 800,
              textTransform: "none",
              borderRadius: 2.5,
              px: 4,
              py: 1.3,
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
              },
            }}
          >
            Continue to Vehicle Asset
          </Button>
        </Stack>
      </Stack>

      {/* ======================================================== */}
      {/* POPUP MODAL: ADD / EDIT NEXT OF KIN                      */}
      {/* ======================================================== */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            border: "1px solid #f1f5f9",
          },
        }}
      >
        <form onSubmit={handleSaveModal}>
          {/* Header Banner */}
          <Box
            sx={{
              px: { xs: 2.5, sm: 3.5 },
              py: 2.5,
              bgcolor: "#fafbfc",
              borderBottom: "1px solid #f1f5f9",
              borderLeft: "6px solid #e11d48",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: 2.5,
                bgcolor: "#ffe4e6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#e11d48",
                flexShrink: 0,
              }}
            >
              <IconHeartHandshake size={24} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: "1.2rem", letterSpacing: "-0.3px" }}>
                {editingIndex !== null ? "Edit Next of Kin & Beneficiary" : "+ Add Next of Kin"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mt: 0.2 }}>
                Provide contact details, kinship relation, and primary beneficiary nomination
              </Typography>
            </Box>
          </Box>

          <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            {dialogError && (
              <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: 2.5, fontWeight: 700 }}>
                {dialogError}
              </Alert>
            )}

            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Next of Kin First Name"
                  placeholder="e.g. John"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, first_name: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconUser size={18} color="#e11d48" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      "&:hover fieldset": { borderColor: "#fda4af" },
                      "&.Mui-focused fieldset": { borderColor: "#e11d48" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#e11d48" },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Other / Middle Names"
                  placeholder="e.g. Thiga Kamau"
                  value={formData.other_names}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, other_names: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconUser size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#e11d48" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#e11d48" },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  required
                  label="Relationship to Member"
                  value={formData.relationship}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, relationship: e.target.value }))
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      "&:hover fieldset": { borderColor: "#fda4af" },
                      "&.Mui-focused fieldset": { borderColor: "#e11d48" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#e11d48" },
                  }}
                >
                  <MenuItem value="">
                    <em style={{ color: "#94a3b8" }}>Select Relationship</em>
                  </MenuItem>
                  {RELATIONSHIP_OPTIONS.map((rel) => (
                    <MenuItem key={rel} value={rel} sx={{ fontWeight: 600 }}>
                      {rel}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  required
                  label="Phone Number"
                  placeholder="e.g. 0756778876"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone_number: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconPhone size={18} color="#e11d48" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      fontFamily: "monospace",
                      fontWeight: 600,
                      "&:hover fieldset": { borderColor: "#fda4af" },
                      "&.Mui-focused fieldset": { borderColor: "#e11d48" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#e11d48" },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="National ID / Passport Number"
                  placeholder="e.g. 29876556"
                  value={formData.national_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, national_id: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconId size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      fontFamily: "monospace",
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#e11d48" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#e11d48" },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Physical Address / Location"
                  placeholder="e.g. Kimbo, Ruiru"
                  value={formData.physical_address}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, physical_address: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconMapPin size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#e11d48" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#e11d48" },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: 3,
                    bgcolor: formData.is_primary ? "#fff5f6" : "#f8fafc",
                    border: "1px solid",
                    borderColor: formData.is_primary ? "#fecdd3" : "#e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease-in-out",
                  }}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                        Primary Beneficiary Designation
                      </Typography>
                      {formData.is_primary && (
                        <Chip
                          label="Active Primary"
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            bgcolor: "#ffe4e6",
                            color: "#e11d48",
                            height: 22,
                          }}
                        />
                      )}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.3 }}>
                      Mark this person as the principal emergency contact and estate beneficiary.
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(formData.is_primary)}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, is_primary: e.target.checked }))
                        }
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#e11d48",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            backgroundColor: "#e11d48",
                          },
                        }}
                      />
                    }
                    label=""
                  />
                </Paper>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions
            sx={{
              px: { xs: 2.5, sm: 3.5 },
              pb: 3,
              pt: 2,
              borderTop: "1px solid #f1f5f9",
              bgcolor: "#fafbfc",
            }}
          >
            <Button
              onClick={() => setDialogOpen(false)}
              sx={{
                fontWeight: 700,
                color: "#64748b",
                textTransform: "none",
                borderRadius: 2.5,
                px: 2.5,
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                px: 4,
                py: 1.2,
                borderRadius: 2.5,
                fontWeight: 800,
                textTransform: "none",
                background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
                boxShadow: "0 4px 14px rgba(225, 29, 72, 0.35)",
                "&:hover": {
                  background: "linear-gradient(135deg, #be123c 0%, #9f1239 100%)",
                },
              }}
            >
              {editingIndex !== null ? "Save Changes" : "Save Beneficiary"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
