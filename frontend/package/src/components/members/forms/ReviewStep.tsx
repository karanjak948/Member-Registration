"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Snackbar,
  Typography,
} from "@mui/material";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

import {
  resetRegistration,
} from "@/store/registration/registrationSlice";

import memberService from "@/services/member.service";
import api from "@/services/api";

interface ReviewStepProps {
  onBack: () => void;
}

export default function ReviewStep({
  onBack,
}: ReviewStepProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    member,
    nextOfKin,
    vehicle,
    guarantor,
  } = useAppSelector(
    (state) => state.registration
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Load categories to display category names
  useEffect(() => {
    loadCategories();
  }, []);

  async function loadCategories() {
    try {
      const response = await api.get("/member-categories/");
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  }

  // Helper to get category name from ID
  const getCategoryName = (categoryId: number | string) => {
    if (!categoryId) return "-";
    const category = categories.find(c => c.id === Number(categoryId));
    return category ? category.name : String(categoryId);
  };

  async function finishRegistration() {
    setLoading(true);
    setError("");

    try {
      // 1. Create the member with FormData
      const formData = new FormData();
      
      // Append all member fields
      formData.append("first_name", member.first_name);
      formData.append("other_names", member.other_names);
      formData.append("national_id", member.national_id);
      formData.append("phone_number", member.phone_number);
      
      if (member.email) {
        formData.append("email", member.email);
      }
      
      if (member.physical_address) {
        formData.append("physical_address", member.physical_address);
      }
      
      if (member.occupation) {
        formData.append("occupation", member.occupation);
      }
      
      if (member.kra_pin) {
        formData.append("kra_pin", member.kra_pin);
      }
      
      // Only append category if it's not empty
      if (member.category !== "") {
        formData.append("category", String(member.category));
      }
      
      if (member.passport_photo instanceof File) {
        formData.append(
          "passport_photo",
          member.passport_photo,
          member.passport_photo.name
        );
      }

      const createdMember = await memberService.create(formData);
      console.log("Member created:", createdMember);

      // Validate member was created successfully
      if (!createdMember?.id) {
        throw new Error("Member creation failed: No ID returned.");
      }

      // Track any secondary creation failures
      const secondaryFailures: string[] = [];

      // 2. Create Next of Kin (if data exists)
      if (nextOfKin.first_name.trim()) {
        try {
          const nextOfKinData = {
            member: createdMember.id,
            first_name: nextOfKin.first_name,
            other_names: nextOfKin.other_names,
            relationship: nextOfKin.relationship,
            national_id: nextOfKin.national_id,
            phone_number: nextOfKin.phone_number,
            physical_address: nextOfKin.physical_address,
            is_primary: nextOfKin.is_primary,
          };
          
          const kinResponse = await api.post("/next-of-kin/", nextOfKinData);
          console.log("Next of Kin created:", kinResponse.data);
        } catch (kinError) {
          console.error("Failed to create next of kin:", kinError);
          secondaryFailures.push("Next of Kin");
          // Continue with registration even if next of kin fails
        }
      }

      // 3. Create Vehicle (if data exists)
      if (vehicle.registration_number.trim()) {
        try {
          const vehicleData = {
            member: createdMember.id,
            registration_number: vehicle.registration_number,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color,
            engine_number: vehicle.engine_number,
            chassis_number: vehicle.chassis_number,
          };
          
          const vehicleResponse = await api.post("/vehicles/", vehicleData);
          console.log("Vehicle created:", vehicleResponse.data);
        } catch (vehicleError) {
          console.error("Failed to create vehicle:", vehicleError);
          secondaryFailures.push("Vehicle");
          // Continue with registration even if vehicle fails
        }
      }

      // 4. Create Guarantor (if data exists)
      if (guarantor.first_name.trim()) {
        try {
          const guarantorData = {
            member: createdMember.id,
            first_name: guarantor.first_name,
            other_names: guarantor.other_names,
            national_id: guarantor.national_id,
            phone_number: guarantor.phone_number,
            relationship: guarantor.relationship,
            guarantor_member: guarantor.guarantor_member,
          };
          
          const guarantorResponse = await api.post("/guarantors/", guarantorData);
          console.log("Guarantor created:", guarantorResponse.data);
        } catch (guarantorError) {
          console.error("Failed to create guarantor:", guarantorError);
          secondaryFailures.push("Guarantor");
          // Continue with registration even if guarantor fails
        }
      }

      // Show warning if any secondary records failed
      if (secondaryFailures.length > 0) {
        console.warn(`Failed to create: ${secondaryFailures.join(", ")}`);
        // Optionally show a warning to the user
      }

      setSuccess(true);

      // Reset Redux after the success message is shown
      setTimeout(() => {
        dispatch(resetRegistration());
        router.push("/members");
      }, 1500);
    } catch (err: any) {
      console.error("Registration error:", err);
      setError(
        err?.response?.data?.detail ??
        err?.message ??
        "Failed to complete registration."
      );
    } finally {
      setLoading(false);
    }
  }

  const Detail = ({
    label,
    value,
  }: {
    label: string;
    value: unknown;
  }) => (
    <Grid size={{ xs: 12, md: 6 }}>
      <Typography
        variant="body2"
        color="text.secondary"
      >
        {label}
      </Typography>

      <Typography
        variant="subtitle1"
        fontWeight={600}
      >
        {value ? String(value) : "-"}
      </Typography>
    </Grid>
  );

  return (
    <>
      <Card>
        <CardContent>
          <Typography
            variant="h5"
            mb={3}
          >
            Review Registration
          </Typography>

          {/* Member */}
          <Typography
            variant="h6"
            gutterBottom
          >
            Member Details
          </Typography>

          <Grid container spacing={2} mb={3}>
            <Detail
              label="First Name"
              value={member.first_name}
            />

            <Detail
              label="Other Names"
              value={member.other_names}
            />

            <Detail
              label="National ID"
              value={member.national_id}
            />

            <Detail
              label="Phone Number"
              value={member.phone_number}
            />

            <Detail
              label="Email"
              value={member.email}
            />

            <Detail
              label="Occupation"
              value={member.occupation}
            />

            <Detail
              label="KRA PIN"
              value={member.kra_pin}
            />

            <Detail
              label="Category"
              value={getCategoryName(member.category)}
            />
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Next of Kin */}
          <Typography
            variant="h6"
            gutterBottom
          >
            Next of Kin
          </Typography>

          <Grid container spacing={2} mb={3}>
            <Detail
              label="First Name"
              value={nextOfKin.first_name}
            />

            <Detail
              label="Other Names"
              value={nextOfKin.other_names}
            />

            <Detail
              label="Relationship"
              value={nextOfKin.relationship}
            />

            <Detail
              label="National ID"
              value={nextOfKin.national_id}
            />

            <Detail
              label="Phone Number"
              value={nextOfKin.phone_number}
            />

            <Detail
              label="Physical Address"
              value={nextOfKin.physical_address}
            />

            <Detail
              label="Is Primary"
              value={nextOfKin.is_primary ? "Yes" : "No"}
            />
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Vehicle */}
          <Typography
            variant="h6"
            gutterBottom
          >
            Vehicle
          </Typography>

          <Grid container spacing={2} mb={3}>
            <Detail
              label="Registration Number"
              value={vehicle.registration_number}
            />

            <Detail
              label="Make"
              value={vehicle.make}
            />

            <Detail
              label="Model"
              value={vehicle.model}
            />

            <Detail
              label="Year"
              value={vehicle.year}
            />

            <Detail
              label="Color"
              value={vehicle.color}
            />

            <Detail
              label="Engine Number"
              value={vehicle.engine_number}
            />

            <Detail
              label="Chassis Number"
              value={vehicle.chassis_number}
            />
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Guarantor */}
          <Typography
            variant="h6"
            gutterBottom
          >
            Guarantor
          </Typography>

          <Grid container spacing={2}>
            <Detail
              label="First Name"
              value={guarantor.first_name}
            />

            <Detail
              label="Other Names"
              value={guarantor.other_names}
            />

            <Detail
              label="National ID"
              value={guarantor.national_id}
            />

            <Detail
              label="Phone Number"
              value={guarantor.phone_number}
            />

            <Detail
              label="Relationship"
              value={guarantor.relationship}
            />

            <Detail
              label="Guarantor Member ID"
              value={guarantor.guarantor_member}
            />
          </Grid>

          {error && (
            <Alert severity="error" sx={{ mt: 3 }}>
              {error}
            </Alert>
          )}
        </CardContent>
      </Card>

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
          Back
        </Button>

        <Button
          variant="contained"
          onClick={finishRegistration}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress
              size={22}
              color="inherit"
            />
          ) : (
            "Finish Registration"
          )}
        </Button>
      </Box>

      <Snackbar
        open={success}
        autoHideDuration={2000}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="success"
          variant="filled"
        >
          Member registered successfully.
        </Alert>
      </Snackbar>
    </>
  );
}