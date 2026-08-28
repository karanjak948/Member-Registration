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
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
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
  addVehicle,
  updateVehicle,
  removeVehicle,
} from "@/store/registration/registrationSlice";
import { VehicleState } from "@/types/registration";
import {
  IconCar,
  IconNumber,
  IconPalette,
  IconEngine,
  IconArrowLeft,
  IconArrowRight,
  IconPlus,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconSteeringWheel,
} from "@tabler/icons-react";

interface VehicleStepProps {
  onComplete: () => void;
  onBack: () => void;
  onSkip?: () => void;
  required?: boolean;
}

const emptyVehicleForm: VehicleState = {
  id: null,
  member: null,
  registration_number: "",
  make: "",
  model: "",
  year: null,
  color: "",
  engine_number: "",
  chassis_number: "",
};

export default function VehicleStep({
  onComplete,
  onBack,
  onSkip,
  required = true,
}: VehicleStepProps) {
  const dispatch = useAppDispatch();
  const vehicles = useAppSelector((state) => state.registration.vehicles);
  const singleVehicle = useAppSelector((state) => state.registration.vehicle);

  // Fallback if user had preloaded single vehicle
  const activeVehicles =
    vehicles.length > 0
      ? vehicles
      : singleVehicle.registration_number
      ? [singleVehicle]
      : [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<VehicleState>(emptyVehicleForm);
  const [dialogError, setDialogError] = useState("");
  const [pageError, setPageError] = useState("");

  const handleOpenAdd = () => {
    setEditingIndex(null);
    setFormData(emptyVehicleForm);
    setDialogError("");
    setDialogOpen(true);
  };

  const handleOpenEdit = (index: number) => {
    setEditingIndex(index);
    setFormData({ ...activeVehicles[index] });
    setDialogError("");
    setDialogOpen(true);
  };

  const handleDelete = (index: number) => {
    dispatch(removeVehicle(index));
    if (pageError) setPageError("");
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.registration_number.trim()) {
      setDialogError("Registration plate number is required.");
      return;
    }

    const cleanedData: VehicleState = {
      ...formData,
      registration_number: formData.registration_number.trim().toUpperCase(),
      year: formData.year ? Number(formData.year) : null,
    };

    if (editingIndex !== null) {
      dispatch(updateVehicle({ index: editingIndex, data: cleanedData }));
    } else {
      dispatch(addVehicle(cleanedData));
    }

    setDialogOpen(false);
    setDialogError("");
    if (pageError) setPageError("");
  };

  const handleContinue = () => {
    if (required && activeVehicles.length === 0) {
      setPageError(
        "Please register at least one commercial vehicle asset before proceeding.",
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
          borderLeft: "6px solid #059669",
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
                bgcolor: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#059669",
              }}
            >
              <IconCar size={26} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="h5" fontWeight={800} color="#0f172a">
                  Vehicle Assets &amp; Collateral
                </Typography>
                <Chip
                  label={`${activeVehicles.length} Vehicles`}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: activeVehicles.length > 0 ? "#d1fae5" : "#f1f5f9",
                    color: activeVehicles.length > 0 ? "#059669" : "#64748b",
                  }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" mt={0.3}>
                Register transport assets, Matatu / Boda Boda fleet, and collateral security for this member.
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
              background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
              "&:hover": {
                background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
              },
            }}
          >
            + Add Vehicle
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
      {activeVehicles.length === 0 ? (
        <Card
          sx={{
            borderRadius: 3,
            border: "2px dashed #a7f3d0",
            bgcolor: "#f0fdf4",
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
              bgcolor: "#d1fae5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <IconSteeringWheel size={32} />
          </Box>
          <Typography variant="h6" fontWeight={800} color="#0f172a" mb={1}>
            No Vehicles Registered Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" maxWidth={520} mx="auto" mb={3}>
            You can register one or multiple vehicles belonging to this member. Vehicles serve as operational assets and loan collateral.
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
              bgcolor: "#059669",
              "&:hover": { bgcolor: "#047857" },
            }}
          >
            + Add First Vehicle
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
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Registration Plate</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Make &amp; Model</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Year</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Color</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Engine No.</TableCell>
                <TableCell sx={{ fontWeight: 800, color: "#475569" }}>Chassis No.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: "#475569" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activeVehicles.map((veh, idx) => (
                <TableRow
                  key={idx}
                  hover
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell sx={{ fontWeight: 700, color: "#64748b" }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Chip
                      label={veh.registration_number || "—"}
                      sx={{
                        fontWeight: 900,
                        fontFamily: "monospace",
                        fontSize: "0.9rem",
                        bgcolor: "#0f172a",
                        color: "#f8fafc",
                        border: "1px solid #334155",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: "#0f172a" }}>
                    {veh.make ? `${veh.make} ${veh.model || ""}` : "—"}
                  </TableCell>
                  <TableCell sx={{ color: "#475569", fontWeight: 600 }}>
                    {veh.year || "—"}
                  </TableCell>
                  <TableCell>
                    {veh.color ? (
                      <Chip
                        label={veh.color}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          bgcolor: "#f1f5f9",
                          color: "#334155",
                          border: "1px solid #e2e8f0",
                        }}
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", color: "#64748b" }}>
                    {veh.engine_number || "—"}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", color: "#64748b" }}>
                    {veh.chassis_number || "—"}
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Tooltip title="Edit Vehicle">
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
            Continue to Guarantor
          </Button>
        </Stack>
      </Stack>

      {/* ======================================================== */}
      {/* POPUP MODAL: ADD / EDIT VEHICLE                          */}
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
              borderLeft: "6px solid #059669",
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
                bgcolor: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#059669",
                flexShrink: 0,
              }}
            >
              <IconCar size={24} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 900, color: "#0f172a", fontSize: "1.2rem", letterSpacing: "-0.3px" }}>
                {editingIndex !== null ? "Edit Vehicle Asset" : "+ Add Vehicle Asset"}
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748b", fontWeight: 600, display: "block", mt: 0.2 }}>
                Enter vehicle registration, make, model, and chassis verification details.
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
                  label="Registration Number Plate"
                  placeholder="e.g. KEJ 482M"
                  value={formData.registration_number}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      registration_number: e.target.value.toUpperCase(),
                    }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconNumber size={18} color="#059669" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      fontFamily: "monospace",
                      fontWeight: 800,
                      "&:hover fieldset": { borderColor: "#6ee7b7" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Vehicle Make"
                  placeholder="e.g. Toyota, Isuzu, Nissan"
                  value={formData.make}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, make: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconCar size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Vehicle Model"
                  placeholder="e.g. Corolla Axio, Canter, Demio"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, model: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconCar size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Year of Manufacture"
                  placeholder="e.g. 2019"
                  value={formData.year ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      year: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconCalendar size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Vehicle Color"
                  placeholder="e.g. White, Silver, Navy Blue"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconPalette size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Engine Number"
                  placeholder="e.g. 1NZ-FE-829104"
                  value={formData.engine_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, engine_number: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconEngine size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      fontFamily: "monospace",
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label="Chassis Number / VIN"
                  placeholder="e.g. NZE141-9012384"
                  value={formData.chassis_number}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, chassis_number: e.target.value }))
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconSteeringWheel size={18} color="#64748b" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2.5,
                      fontFamily: "monospace",
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#059669" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#059669" },
                  }}
                />
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
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                "&:hover": {
                  background: "linear-gradient(135deg, #047857 0%, #065f46 100%)",
                },
              }}
            >
              {editingIndex !== null ? "Save Changes" : "Save Vehicle Asset"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
