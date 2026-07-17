"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";

import api from "@/services/api";
import memberService from "@/services/member.service";

import { Member } from "@/interfaces/member";

import {
  validateMember,
  ValidationErrors,
} from "@/utils/memberValidation";

interface MemberCategory {
  id: number;
  name: string;
  code: string;
}

interface EditMemberFormProps {
  member: Member;
  onBack: () => void;
  onSuccess: (member: Member) => void;
}

export default function EditMemberForm({
  member,
  onBack,
  onSuccess,
}: EditMemberFormProps) {
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState<MemberCategory[]>([]);

  const [error, setError] = useState("");

  const [errors, setErrors] =
    useState<ValidationErrors>({});

  const [form, setForm] = useState({
    first_name: member?.first_name ?? "",
    other_names: member?.other_names ?? "",
    national_id: member?.national_id ?? "",
    phone_number: member?.phone_number ?? "",
    email: member?.email ?? "",
    physical_address:
      (member as any)?.physical_address ?? "",
    occupation:
      (member as any)?.occupation ?? "",
    kra_pin:
      (member as any)?.kra_pin ?? "",
    category:
      (member as any)?.category?.id ??
      (member as any)?.category ??
      "",
    passport_photo: null as File | null,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const response = await api.get(
        "/member-categories/"
      );

      setCategories(response.data);
    } catch (error) {
      console.error(error);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === "category"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  }

  async function handleSubmit() {
    const validationErrors =
      validateMember(form);

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    setLoading(true);
    setError("");

    try {
      const payload = new FormData();

      // Explicitly append each field
      payload.append("first_name", form.first_name);
      payload.append("other_names", form.other_names);
      payload.append("national_id", form.national_id);
      payload.append("phone_number", form.phone_number);

      if (form.email) {
        payload.append("email", form.email);
      }

      if (form.physical_address) {
        payload.append("physical_address", form.physical_address);
      }

      if (form.occupation) {
        payload.append("occupation", form.occupation);
      }

      if (form.kra_pin) {
        payload.append("kra_pin", form.kra_pin);
      }

      payload.append("category", String(form.category));

      if (form.passport_photo instanceof File) {
        payload.append(
          "passport_photo",
          form.passport_photo,
          form.passport_photo.name
        );
      }

      const updatedMember =
        await memberService.update(
          member.id,
          payload
        );

      onSuccess(updatedMember);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "Unable to update member."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="First Name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            error={!!errors.first_name}
            helperText={errors.first_name}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Other Names"
            name="other_names"
            value={form.other_names}
            onChange={handleChange}
            error={!!errors.other_names}
            helperText={errors.other_names}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="National ID"
            name="national_id"
            value={form.national_id}
            onChange={handleChange}
            error={!!errors.national_id}
            helperText={errors.national_id}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Phone Number"
            name="phone_number"
            value={form.phone_number}
            onChange={handleChange}
            error={!!errors.phone_number}
            helperText={errors.phone_number}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="Occupation"
            name="occupation"
            value={form.occupation}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Physical Address"
            name="physical_address"
            value={form.physical_address}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label="KRA PIN"
            name="kra_pin"
            value={form.kra_pin}
            onChange={handleChange}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            select
            label="Member Category"
            name="category"
            value={form.category}
            onChange={handleChange}
            error={!!errors.category}
            helperText={errors.category}
          >
            {categories.map((category) => (
              <MenuItem
                key={category.id}
                value={category.id}
              >
                {category.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Button
            component="label"
            variant="outlined"
          >
            {form.passport_photo ? (
              `Selected: ${form.passport_photo.name}`
            ) : (
              "Upload Passport Photo"
            )}

            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file =
                  e.target.files?.[0];

                if (!file) return;

                setForm((prev) => ({
                  ...prev,
                  passport_photo: file,
                }));
              }}
            />
          </Button>
        </Grid>
      </Grid>

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 3 }}
        >
          {error}
        </Alert>
      )}

      <Box
        mt={4}
        display="flex"
        justifyContent="space-between"
      >
        <Button
          variant="outlined"
          onClick={onBack}
          disabled={loading}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? (
            <CircularProgress
              size={22}
              color="inherit"
            />
          ) : (
            "Save Changes"
          )}
        </Button>
      </Box>
    </Box>
  );
}