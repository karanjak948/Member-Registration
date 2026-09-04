"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { IconUserCheck, IconFileCheck, IconBuildingCommunity } from "@tabler/icons-react";
import { Controller, useFormContext } from "react-hook-form";
import { LoanProductCreate } from "@/interfaces/loanProduct";

export default function ApprovalWorkflow() {
  const { control, watch } = useFormContext<LoanProductCreate>();

  const requiresAppraisal = watch("requires_appraisal");
  const requiresBoard = watch("requires_board_approval");

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #e2e8f0",
        bgcolor: "#ffffff",
        boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ height: 4, bgcolor: "#d97706" }} />
      <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Stack spacing={3}>
          {/* Section Header */}
          <Stack direction="row" alignItems="center" spacing={1.75}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                bgcolor: "#fffbeb",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(217, 119, 6, 0.12)",
              }}
            >
              <IconUserCheck size={24} stroke={2} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#0f172a">
                Governance & Approval Workflow
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Mandatory credit committee appraisal stages and SACCO board ratification
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <Grid container spacing={2.5}>
            {/* Requires Appraisal */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px solid ${requiresAppraisal ? "#fed7aa" : "#e2e8f0"}`,
                  bgcolor: requiresAppraisal ? "#fff7ed" : "#f8fafc",
                  transition: "all 0.2s ease",
                  height: "100%",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: requiresAppraisal ? "#ffedd5" : "#f1f5f9",
                        color: requiresAppraisal ? "#ea580c" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconFileCheck size={20} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                        Requires Credit Appraisal
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Loans officer desk & field appraisal
                      </Typography>
                    </Box>
                  </Stack>
                  <Controller
                    name="requires_appraisal"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="warning"
                      />
                    )}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
                  {requiresAppraisal
                    ? "Mandates formal credit officer scoring and evaluation checklist prior to recommendation."
                    : "Standard fast-track approval without dedicated appraisal assessment stage."}
                </Typography>
              </Box>
            </Grid>

            {/* Requires Board Approval */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: `1px solid ${requiresBoard ? "#fde68a" : "#e2e8f0"}`,
                  bgcolor: requiresBoard ? "#fffbeb" : "#f8fafc",
                  transition: "all 0.2s ease",
                  height: "100%",
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        bgcolor: requiresBoard ? "#fef3c7" : "#f1f5f9",
                        color: requiresBoard ? "#b45309" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconBuildingCommunity size={20} />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} color="#0f172a">
                        Requires Board Approval
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Executive committee sign-off
                      </Typography>
                    </Box>
                  </Stack>
                  <Controller
                    name="requires_board_approval"
                    control={control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        color="warning"
                      />
                    )}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
                  {requiresBoard
                    ? "Requires SACCO Board of Directors or Credit Subcommittee resolution before fund release."
                    : "Approved at the branch manager or internal credit committee tier."}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}
