"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

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

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: session?.user?.name ?? "",
    email: session?.user?.email ?? "",
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
    /**
     * TODO:
     * Call backend endpoint when available.
     */

    setSuccess(true);

    setTimeout(() => {
      router.push("/profile");
    }, 1200);
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h4" mb={3}>
        Edit Profile
      </Typography>

      <Card>
        <CardContent>

          <Grid container spacing={3}>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                value={form.email}
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
              Save Changes
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
          Profile updated successfully.
        </Alert>
      </Snackbar>
    </Container>
  );
}