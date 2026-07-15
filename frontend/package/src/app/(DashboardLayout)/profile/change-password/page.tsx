"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit() {
    if (
      form.newPassword !==
      form.confirmPassword
    ) {
      alert("Passwords do not match.");
      return;
    }

    /**
     * TODO:
     * Connect to backend endpoint.
     */

    setSuccess(true);

    setTimeout(() => {
      router.push("/profile");
    }, 1200);
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" mb={3}>
        Change Password
      </Typography>

      <Card>
        <CardContent>

          <Grid container spacing={3}>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </Grid>

          </Grid>

          <Box
            mt={4}
            display="flex"
            justifyContent="space-between"
          >
            <Button
              variant="outlined"
              onClick={() => router.back()}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              onClick={handleSubmit}
            >
              Update Password
            </Button>
          </Box>

        </CardContent>
      </Card>

      <Snackbar
        open={success}
        autoHideDuration={2000}
      >
        <Alert
          severity="success"
          variant="filled"
        >
          Password updated successfully.
        </Alert>
      </Snackbar>
    </Container>
  );
}