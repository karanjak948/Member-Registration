"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowBack,
  CheckCircleOutline,
  DirectionsCarOutlined,
  ErrorOutline,
  FamilyRestroomOutlined,
  PersonOutline,
  SendOutlined,
  VerifiedUserOutlined,
} from "@mui/icons-material";

import { useAppDispatch, useAppSelector } from "@/store/hooks";

import { resetRegistration } from "@/store/registration/registrationSlice";

import memberService from "@/services/member.service";
import api from "@/services/api";

/* =========================================================
   TYPES
========================================================= */

interface ReviewStepProps {
  onBack: () => void;
}

interface MemberCategory {
  id: number;
  name: string;
  code?: string;
}

/* =========================================================
   HELPERS
========================================================= */

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

function cleanString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/*
 * Extract readable validation messages from
 * Django REST Framework / Axios responses.
 */
function getApiErrorMessage(error: any): string {
  const responseData = error?.response?.data;

  if (!responseData) {
    return error?.message ?? "Registration failed.";
  }

  /*
   * Standard DRF error:
   *
   * {
   *   detail: "..."
   * }
   */
  if (typeof responseData.detail === "string") {
    return responseData.detail;
  }

  /*
   * Plain string response.
   */
  if (typeof responseData === "string") {
    return responseData;
  }

  /*
   * Validation errors.
   *
   * Example:
   *
   * {
   *   email: [
   *     "member with this email already exists."
   *   ],
   *   national_id: [
   *     "Member with this National ID already exists."
   *   ]
   * }
   */
  if (typeof responseData === "object") {
    const messages: string[] = [];

    Object.entries(responseData).forEach(([field, value]) => {
      if (Array.isArray(value)) {
        value.forEach((msg) => {
          messages.push(`${field.replace(/_/g, " ")}: ${msg}`);
        });
      } else if (typeof value === "string") {
        messages.push(`${field.replace(/_/g, " ")}: ${value}`);
      }
    });

    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  return "Registration failed. Please try again.";
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ReviewStep({ onBack }: ReviewStepProps) {
  const router = useRouter();

  const dispatch = useAppDispatch();

  /*
   * Read the complete registration
   * object once.
   *
   * ReviewStep must never maintain a
   * second copy of registration data.
   */
  const registration = useAppSelector((state) => state.registration);

  const { member, nextOfKin, vehicle, guarantor } = registration;

  const [loading, setLoading] = useState(false);

  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [categories, setCategories] = useState<MemberCategory[]>([]);

  const [error, setError] = useState("");

  const [warning, setWarning] = useState("");

  const [success, setSuccess] = useState(false);

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  /*
   * Additional protection against
   * double-click / duplicate POST.
   *
   * State alone is asynchronous.
   * This ref locks immediately.
   */
  const submissionLock = useRef(false);

  /* =======================================================
     LOAD MEMBER CATEGORIES
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadCategories() {
      setCategoriesLoading(true);

      try {
        const response = await api.get("/member-categories/");

        if (!mounted) {
          return;
        }

        /*
         * Supports:
         *
         * [...]
         *
         * and DRF pagination:
         *
         * {
         *   results: [...]
         * }
         */
        const data = Array.isArray(response.data)
          ? response.data
          : (response.data?.results ?? []);

        setCategories(data);
      } catch (err) {
        console.error("Failed to load member categories:", err);

        /*
         * Category lookup failure should
         * not destroy the registration.
         *
         * We can still display the raw ID.
         */
      } finally {
        if (mounted) {
          setCategoriesLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     PHOTO PREVIEW
  ======================================================= */

  useEffect(() => {
    const photo = member.passport_photo;

    if (!photo) {
      setPhotoPreview(null);

      return;
    }

    /*
     * Newly selected browser file.
     */
    if (photo instanceof File) {
      const objectUrl = URL.createObjectURL(photo);

      setPhotoPreview(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    /*
     * Existing backend URL/path.
     */
    if (typeof photo === "string") {
      setPhotoPreview(photo);
    }
  }, [member.passport_photo]);

  /* =======================================================
     DERIVED REGISTRATION STATE
  ======================================================= */

  const categoryName = useMemo(() => {
    if (
      member.category === "" ||
      member.category === null ||
      member.category === undefined
    ) {
      return "—";
    }

    const category = categories.find(
      (item) => item.id === Number(member.category),
    );

    return category?.name ?? String(member.category);
  }, [categories, member.category]);

  /*
   * Required member fields.
   *
   * These determine whether final
   * registration may proceed.
   */
  const hasMemberDetails = Boolean(
    cleanString(member.first_name) &&
    cleanString(member.national_id) &&
    cleanString(member.phone_number),
  );

  const hasCategory =
    member.category !== "" &&
    member.category !== null &&
    member.category !== undefined;

  const memberReady = hasMemberDetails && hasCategory;

  /*
   * Optional related sections.
   */
  const hasNextOfKin = Boolean(cleanString(nextOfKin.first_name));

  const hasVehicle = Boolean(cleanString(vehicle.registration_number));

  const hasGuarantor = Boolean(cleanString(guarantor.first_name));

  /* =======================================================
     FINAL REGISTRATION
  ======================================================= */

  async function finishRegistration() {
    /*
     * Prevent duplicate requests.
     */
    if (loading || submissionLock.current) {
      return;
    }

    setError("");
    setWarning("");

    /* -----------------------------------------------------
       PRE-SUBMISSION VALIDATION
    ----------------------------------------------------- */

    if (!hasMemberDetails) {
      setError(
        "The primary member details are missing from the registration draft. Return to Member Details, verify the required fields, and continue through the wizard again.",
      );

      return;
    }

    if (!hasCategory) {
      setError(
        "A member category has not been saved in the registration draft. Return to Member Details and select a category before submitting.",
      );

      return;
    }

    /*
     * Lock synchronously before any
     * asynchronous request begins.
     */
    submissionLock.current = true;

    setLoading(true);

    try {
      /* ===============================================
         1. CREATE PRIMARY MEMBER
      =============================================== */

      const formData = new FormData();

      formData.append("first_name", cleanString(member.first_name));

      formData.append("other_names", cleanString(member.other_names));

      formData.append("national_id", cleanString(member.national_id));

      formData.append("phone_number", cleanString(member.phone_number));

      const email = cleanString(member.email);

      if (email) {
        formData.append("email", email);
      }

      const physicalAddress = cleanString(member.physical_address);

      if (physicalAddress) {
        formData.append("physical_address", physicalAddress);
      }

      const occupation = cleanString(member.occupation);

      if (occupation) {
        formData.append("occupation", occupation);
      }

      const kraPin = cleanString(member.kra_pin);

      if (kraPin) {
        formData.append("kra_pin", kraPin);
      }

      formData.append("category", String(member.category));

      /*
       * Append only a real local File.
       *
       * A backend URL/string must not be
       * submitted as multipart binary data.
       */
      if (member.passport_photo instanceof File) {
        formData.append(
          "passport_photo",
          member.passport_photo,
          member.passport_photo.name,
        );
      }

      const createdMember = await memberService.create(formData);

      if (!createdMember || !createdMember.id) {
        throw new Error(
          "The server did not return a valid member ID after creating the member.",
        );
      }

      const memberId = createdMember.id;

      /*
       * Track secondary failures.
       *
       * The member already exists after
       * this point, so we must NOT silently
       * retry the entire registration.
       */
      const secondaryFailures: string[] = [];

      /* ===============================================
         2. CREATE NEXT OF KIN
      =============================================== */

      if (hasNextOfKin) {
        try {
          await api.post("/next-of-kin/", {
            member: memberId,

            first_name: cleanString(nextOfKin.first_name),

            other_names: cleanString(nextOfKin.other_names),

            relationship: cleanString(nextOfKin.relationship),

            national_id: cleanString(nextOfKin.national_id),

            phone_number: cleanString(nextOfKin.phone_number),

            physical_address: cleanString(nextOfKin.physical_address),

            is_primary: Boolean(nextOfKin.is_primary),
          });
        } catch (err) {
          console.error("Next of Kin creation failed:", err);

          secondaryFailures.push("Next of Kin");
        }
      }

      /* ===============================================
         3. CREATE VEHICLE
      =============================================== */

      if (hasVehicle) {
        try {
          await api.post("/vehicles/", {
            member: memberId,

            registration_number: cleanString(vehicle.registration_number),

            make: cleanString(vehicle.make),

            model: cleanString(vehicle.model),

            year: vehicle.year || null,

            color: cleanString(vehicle.color),

            engine_number: cleanString(vehicle.engine_number),

            chassis_number: cleanString(vehicle.chassis_number),
          });
        } catch (err) {
          console.error("Vehicle creation failed:", err);

          secondaryFailures.push("Vehicle");
        }
      }

      /* ===============================================
         4. CREATE GUARANTOR
      =============================================== */

      if (hasGuarantor) {
        try {
          const guarantorPayload: Record<string, unknown> = {
            member: memberId,

            first_name: cleanString(guarantor.first_name),

            other_names: cleanString(guarantor.other_names),

            national_id: cleanString(guarantor.national_id),

            phone_number: cleanString(guarantor.phone_number),

            relationship: cleanString(guarantor.relationship),
          };

          /*
           * Do not send null/empty FK.
           */
          if (guarantor.guarantor_member) {
            guarantorPayload.guarantor_member = guarantor.guarantor_member;
          }

          await api.post("/guarantors/", guarantorPayload);
        } catch (err) {
          console.error("Guarantor creation failed:", err);

          secondaryFailures.push("Guarantor");
        }
      }

      /* ===============================================
         5. HANDLE PARTIAL SUCCESS
      =============================================== */

      if (secondaryFailures.length > 0) {
        setWarning(
          `The primary member was created successfully, but these related records could not be saved: ${secondaryFailures.join(
            ", ",
          )}. Do not click Finish Registration again because that could create a duplicate member. Open the member record and complete the missing related information there.`,
        );

        /*
         * Keep the lock active.
         *
         * Primary member creation already
         * succeeded. Re-enabling Finish would
         * risk duplicate creation.
         */
        return;
      }

      /* ===============================================
         6. COMPLETE
      =============================================== */

      setSuccess(true);

      /*
       * Give the success notification a
       * moment to render before clearing
       * the wizard and redirecting.
       */
      window.setTimeout(() => {
        dispatch(resetRegistration());

        router.replace("/members");
      }, 1200);
    } catch (err) {
      console.error("Registration error:", err);

      setError(getApiErrorMessage(err));

      /*
       * Primary member creation failed,
       * therefore retrying is safe.
       */
      submissionLock.current = false;
    } finally {
      setLoading(false);
    }
  }

  /* =======================================================
     DETAIL COMPONENT
  ======================================================= */

  function Detail({
    label,
    value,
    fullWidth = false,
  }: {
    label: string;
    value: unknown;
    fullWidth?: boolean;
  }) {
    return (
      <Grid
        size={{
          xs: 12,

          md: fullWidth ? 12 : 6,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{
              mb: 0.35,
            }}
          >
            {label}
          </Typography>

          <Typography
            variant="body1"
            fontWeight={600}
            sx={{
              wordBreak: "break-word",
            }}
          >
            {hasValue(value) ? String(value) : "—"}
          </Typography>
        </Box>
      </Grid>
    );
  }

  /* =======================================================
     REVIEW SECTION COMPONENT
  ======================================================= */

  function ReviewSection({
    title,
    subtitle,
    icon,
    completed,
    children,
  }: {
    title: string;
    subtitle: string;
    icon: ReactNode;
    completed: boolean;
    children: ReactNode;
  }) {
    return (
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 2.5,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: {
              xs: 2,
              md: 2.5,
            },

            py: 2,

            bgcolor: "background.default",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            spacing={1.5}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  width: 40,
                  height: 40,

                  bgcolor: completed
                    ? "primary.main"
                    : "action.disabledBackground",

                  color: completed ? "primary.contrastText" : "text.secondary",
                }}
              >
                {icon}
              </Avatar>

              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {title}
                </Typography>

                <Typography variant="caption" color="text.secondary">
                  {subtitle}
                </Typography>
              </Box>
            </Stack>

            <Chip
              size="small"
              variant="outlined"
              color={completed ? "success" : "default"}
              icon={completed ? <CheckCircleOutline /> : undefined}
              label={completed ? "Completed" : "Not provided"}
            />
          </Stack>
        </Box>

        <Divider />

        <Box
          sx={{
            p: {
              xs: 2,
              md: 2.5,
            },
          }}
        >
          {children}
        </Box>
      </Paper>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <Box>
        {/* =============================================
            REVIEW HEADER
        ============================================== */}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>
            Review Registration
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Verify the captured information before completing registration. You
            can return to previous steps to make corrections.
          </Typography>
        </Box>

        {/* =============================================
            INCOMPLETE DRAFT WARNING
        ============================================== */}

        {!memberReady && (
          <Alert
            severity="error"
            icon={<ErrorOutline />}
            sx={{ mb: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={onBack}
                disabled={loading}
              >
                Return
              </Button>
            }
          >
            <Typography variant="body2" component="div">
              <strong>Primary member information is incomplete.</strong> The
              registration cannot be submitted until the required Member Details
              have been saved. Use Back to return through the wizard and verify
              Step 1.
            </Typography>
          </Alert>
        )}

        {/* =============================================
            API ERROR
        ============================================== */}

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              whiteSpace: "pre-line",
            }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {/* =============================================
            PARTIAL SUCCESS WARNING
        ============================================== */}

        {warning && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {warning}
          </Alert>
        )}

        {/* =============================================
            REVIEW SECTIONS
        ============================================== */}

        <Stack spacing={2.5}>
          {/* MEMBER */}

          <ReviewSection
            title="Member Details"
            subtitle="Primary member information"
            icon={<PersonOutline fontSize="small" />}
            completed={memberReady}
          >
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={3}
              alignItems="flex-start"
            >
              {photoPreview && (
                <Avatar
                  src={photoPreview}
                  alt={[member.first_name, member.other_names]
                    .filter(Boolean)
                    .join(" ")}
                  variant="rounded"
                  sx={{
                    width: 110,

                    height: 130,

                    border: "1px solid",

                    borderColor: "divider",

                    flexShrink: 0,
                  }}
                />
              )}

              <Grid
                container
                spacing={2.5}
                sx={{
                  flex: 1,
                  width: "100%",
                }}
              >
                <Detail label="First Name" value={member.first_name} />

                <Detail label="Other Names" value={member.other_names} />

                <Detail label="National ID" value={member.national_id} />

                <Detail label="Phone Number" value={member.phone_number} />

                <Detail label="Email Address" value={member.email} />

                <Detail
                  label="Occupation / Business"
                  value={member.occupation}
                />

                <Detail label="KRA PIN" value={member.kra_pin} />

                <Detail
                  label="Member Category"
                  value={
                    categoriesLoading
                      ? member.category
                        ? "Loading..."
                        : "—"
                      : categoryName
                  }
                />

                <Detail
                  label="Physical Address"
                  value={member.physical_address}
                  fullWidth
                />
              </Grid>
            </Stack>
          </ReviewSection>

          {/* NEXT OF KIN */}

          <ReviewSection
            title="Next of Kin"
            subtitle="Emergency and family contact information"
            icon={<FamilyRestroomOutlined fontSize="small" />}
            completed={hasNextOfKin}
          >
            <Grid container spacing={2.5}>
              <Detail label="First Name" value={nextOfKin.first_name} />

              <Detail label="Other Names" value={nextOfKin.other_names} />

              <Detail label="Relationship" value={nextOfKin.relationship} />

              <Detail label="National ID" value={nextOfKin.national_id} />

              <Detail label="Phone Number" value={nextOfKin.phone_number} />

              <Detail
                label="Primary Next of Kin"
                value={
                  hasNextOfKin ? (nextOfKin.is_primary ? "Yes" : "No") : null
                }
              />

              <Detail
                label="Physical Address"
                value={nextOfKin.physical_address}
                fullWidth
              />
            </Grid>
          </ReviewSection>

          {/* VEHICLE */}

          <ReviewSection
            title="Vehicle Details"
            subtitle="Vehicle associated with this membership"
            icon={<DirectionsCarOutlined fontSize="small" />}
            completed={hasVehicle}
          >
            <Grid container spacing={2.5}>
              <Detail
                label="Registration Number"
                value={vehicle.registration_number}
              />

              <Detail label="Make" value={vehicle.make} />

              <Detail label="Model" value={vehicle.model} />

              <Detail label="Year" value={vehicle.year} />

              <Detail label="Color" value={vehicle.color} />

              <Detail label="Engine Number" value={vehicle.engine_number} />

              <Detail
                label="Chassis Number"
                value={vehicle.chassis_number}
                fullWidth
              />
            </Grid>
          </ReviewSection>

          {/* GUARANTOR */}

          <ReviewSection
            title="Guarantor"
            subtitle="Guarantor or recruiter information"
            icon={<VerifiedUserOutlined fontSize="small" />}
            completed={hasGuarantor}
          >
            <Grid container spacing={2.5}>
              <Detail label="First Name" value={guarantor.first_name} />

              <Detail label="Other Names" value={guarantor.other_names} />

              <Detail label="National ID" value={guarantor.national_id} />

              <Detail label="Phone Number" value={guarantor.phone_number} />

              <Detail label="Relationship" value={guarantor.relationship} />

              <Detail
                label="Linked Member ID"
                value={guarantor.guarantor_member}
              />
            </Grid>
          </ReviewSection>
        </Stack>

        {/* =============================================
            ACTION BAR
        ============================================== */}

        <Box
          sx={{
            mt: 4,
            pt: 3,

            borderTop: "1px solid",

            borderColor: "divider",
          }}
        >
          <Stack
            direction={{
              xs: "column-reverse",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            spacing={2}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={onBack}
              disabled={loading}
            >
              Back
            </Button>

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={1.5}
              alignItems={{
                xs: "stretch",
                sm: "center",
              }}
            >
              {!memberReady && (
                <Typography variant="caption" color="error.main">
                  Complete Member Details before submitting.
                </Typography>
              )}

              <Button
                variant="contained"
                startIcon={!loading ? <SendOutlined /> : undefined}
                onClick={finishRegistration}
                disabled={loading || !memberReady || Boolean(warning)}
                sx={{
                  minWidth: 210,
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress
                      size={20}
                      color="inherit"
                      sx={{ mr: 1 }}
                    />
                    Submitting...
                  </>
                ) : (
                  "Finish Registration"
                )}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* =============================================
          SUCCESS NOTIFICATION
      ============================================== */}

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
          icon={<CheckCircleOutline />}
        >
          Member registration completed successfully. Redirecting to members...
        </Alert>
      </Snackbar>
    </>
  );
}
