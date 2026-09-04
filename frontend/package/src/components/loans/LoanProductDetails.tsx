"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import {
  IconArrowLeft,
  IconEdit,
  IconBuildingBank,
  IconPercentage,
  IconCalendar,
  IconShieldCheck,
  IconClock,
  IconReceiptTax,
  IconScale,
  IconUserCheck,
  IconArrowsSort,
  IconRefresh,
  IconCash,
  IconFileText,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { LoanProduct } from "@/interfaces/loanProduct";

interface Props {
  product: LoanProduct;
}

function formatLabel(str: string | null | undefined): string {
  if (!str) return "—";
  return str
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function LoanProductDetails({ product }: Props) {
  const router = useRouter();

  const formattedRate = `${Number(product.interest_rate || 0)}%`;
  const rateMethod = formatLabel(product.interest_method);
  const tenorLabel = product.max_repayment_period
    ? `${product.max_repayment_period} Months`
    : "Flexible";

  const allocationSteps = (product.allocation_order || "penalty,interest,principal")
    .split(",")
    .map((s) => s.trim());

  return (
    <Box sx={{ pb: 6 }}>
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HERO BANNER                                                 */}
      {/* ========================================================================= */}
      <Paper
        elevation={0}
        sx={{
          background: "linear-gradient(135deg, #064e3b 0%, #047857 55%, #059669 100%)",
          borderRadius: 3.5,
          p: { xs: 3, md: 4 },
          mb: 3.5,
          color: "#ffffff",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 12px 36px -8px rgba(6, 78, 59, 0.28)",
        }}
      >
        {/* Subtle decorative background glow */}
        <Box
          sx={{
            position: "absolute",
            top: -60,
            right: -60,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Back navigation & action strip */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Button
            variant="text"
            startIcon={<IconArrowLeft size={18} />}
            onClick={() => router.push("/loan-products")}
            sx={{
              color: "rgba(255,255,255,0.9)",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.875rem",
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(6px)",
              "&:hover": {
                background: "rgba(255,255,255,0.2)",
                color: "#ffffff",
              },
            }}
          >
            Back to Loan Products Catalog
          </Button>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<IconEdit size={18} />}
              onClick={() => router.push(`/loan-products/${product.id}/edit`)}
              sx={{
                bgcolor: "#ffffff",
                color: "#064e3b",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: 2,
                px: 2.5,
                py: 0.85,
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                "&:hover": {
                  bgcolor: "#f0fdf4",
                  color: "#047857",
                },
              }}
            >
              Edit Product Tier
            </Button>
          </Stack>
        </Stack>

        {/* Product Identity Header */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", md: "flex-end" }}
          spacing={2}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
              <Chip
                label={product.product_code || "CODE-NOT-SET"}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.2)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  letterSpacing: 0.8,
                  backdropFilter: "blur(4px)",
                  borderRadius: 1.5,
                }}
              />
              <Chip
                label={product.is_active ? "Active Tier" : "Inactive Tier"}
                sx={{
                  bgcolor: product.is_active ? "#10b981" : "rgba(255,255,255,0.25)",
                  color: "#ffffff",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  borderRadius: 1.5,
                }}
              />
              {product.version_number && (
                <Chip
                  label={`v${product.version_number}.0`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 600,
                    fontSize: "0.7rem",
                  }}
                />
              )}
            </Stack>

            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                letterSpacing: "-0.5px",
                fontSize: { xs: "1.75rem", md: "2.25rem" },
                mb: 0.5,
              }}
            >
              {product.product_name}
            </Typography>

            <Typography
              variant="body2"
              sx={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "0.95rem" }}
            >
              Royal SACCO Lending Facility Specification &bull; Effective Date:{" "}
              {product.effective_date || "Immediate"}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* ========================================================================= */}
      {/* 2. KEY METRIC HIGHLIGHT STRIP (4 CARDS)                                   */}
      {/* ========================================================================= */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Metric 1: Interest Rate */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
              transition: "transform 0.15s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2.5,
                  bgcolor: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconPercentage size={26} stroke={2.2} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Interest Rate
                </Typography>
                <Typography variant="h5" fontWeight={800} color="#064e3b">
                  {formattedRate} p.a.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {rateMethod}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Metric 2: Max Tenor */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
              transition: "transform 0.15s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2.5,
                  bgcolor: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconCalendar size={26} stroke={2.2} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Max Repayment Tenor
                </Typography>
                <Typography variant="h5" fontWeight={800} color="#1e40af">
                  {tenorLabel}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatLabel(product.repayment_frequency)} Repayments
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Metric 3: Underwriting Requirement */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
              transition: "transform 0.15s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2.5,
                  bgcolor: "#f5f3ff",
                  color: "#7c3aed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconShieldCheck size={26} stroke={2.2} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Security & Guarantors
                </Typography>
                <Typography variant="h6" fontWeight={800} color="#5b21b6">
                  {product.requires_guarantor ? "Guarantor Req." : "No Guarantor"}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {product.requires_security ? "Collateral Mandatory" : "Clean / Unsecured"}
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>

        {/* Metric 4: Delinquency PAR */}
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              bgcolor: "#ffffff",
              boxShadow: "0 4px 16px -2px rgba(0, 0, 0, 0.04)",
              transition: "transform 0.15s ease",
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 2.5,
                  bgcolor: "#fffbeb",
                  color: "#d97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconClock size={26} stroke={2.2} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
                  Delinquency PAR
                </Typography>
                <Typography variant="h6" fontWeight={800} color="#b45309">
                  {product.watchful_after_days || 30} Days
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Watchful Classification Threshold
                </Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* ========================================================================= */}
      {/* 3. MAIN SPECIFICATION GRIDS                                               */}
      {/* ========================================================================= */}
      <Grid container spacing={3}>
        {/* LEFT COLUMN: Financial Terms & Underwriting */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Stack spacing={3}>
            {/* CARD A: FINANCIAL TERMS & CALCULATION ENGINE */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "#ecfdf5",
                      color: "#047857",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconBuildingBank size={22} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      Financial Architecture & Terms
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Core interest computation methods, repayment schedule, and tenor
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #f1f5f9" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        PRODUCT CODE
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="#0f172a">
                        {product.product_code || "—"}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #f1f5f9" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        INTEREST CALCULATION METHOD
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="#0f172a">
                        {rateMethod}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #f1f5f9" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        ANNUAL INTEREST RATE
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="#047857">
                        {formattedRate} per annum
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #f1f5f9" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        INTEREST ACCRUAL PERIOD
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="#0f172a">
                        {formatLabel(product.interest_period)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #f1f5f9" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        REPAYMENT FREQUENCY
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="#0f172a">
                        {formatLabel(product.repayment_frequency)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #f1f5f9" }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        MAXIMUM TENOR
                      </Typography>
                      <Typography variant="body1" fontWeight={700} color="#0f172a">
                        {tenorLabel}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* CARD B: UNDERWRITING, COLLATERAL & SAVINGS MULTIPLIER */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "#f5f3ff",
                      color: "#7c3aed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconShieldCheck size={22} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      Underwriting, Eligibility & Collateral Policy
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Mandatory credit criteria, security requirements, and savings multipliers
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Stack spacing={2}>
                  {/* Guarantor Requirement */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: product.requires_guarantor ? "#f5f3ff" : "#f8fafc",
                      border: `1px solid ${product.requires_guarantor ? "#ddd6fe" : "#f1f5f9"}`,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="#0f172a">
                        Guarantor Requirement
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.requires_guarantor
                          ? "Applications require active SACCO member guarantors"
                          : "Borrower can qualify without external guarantors"}
                      </Typography>
                    </Box>
                    <Chip
                      icon={product.requires_guarantor ? <IconCheck size={16} /> : <IconX size={16} />}
                      label={product.requires_guarantor ? "Required" : "Not Required"}
                      color={product.requires_guarantor ? "primary" : "default"}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>

                  {/* Savings Multiplier */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: product.is_multiple_of_savings ? "#ecfdf5" : "#f8fafc",
                      border: `1px solid ${product.is_multiple_of_savings ? "#a7f3d0" : "#f1f5f9"}`,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="#0f172a">
                        Savings Multiplier Rule
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.is_multiple_of_savings
                          ? `Loan principal capped at ${product.savings_multiplier || 1}x member shares & savings`
                          : "Loan limit assessed independent of member savings balance"}
                      </Typography>
                    </Box>
                    <Chip
                      label={product.is_multiple_of_savings ? `${product.savings_multiplier || 1}x Savings` : "Independent"}
                      color={product.is_multiple_of_savings ? "success" : "default"}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>

                  {/* Security / Collateral */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: product.requires_security ? "#fef3c7" : "#f8fafc",
                      border: `1px solid ${product.requires_security ? "#fde68a" : "#f1f5f9"}`,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="#0f172a">
                        Collateral / Security Pledge
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.requires_security
                          ? `Mandatory collateral pledge: ${product.security_value || 0}${
                              product.security_type === "percentage" ? "% of principal" : " KES"
                            }`
                          : "No physical collateral or chattel mortgage required"}
                      </Typography>
                      {product.security_notes && (
                        <Typography variant="caption" display="block" sx={{ color: "#92400e", mt: 0.5, fontStyle: "italic" }}>
                          Note: {product.security_notes}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={product.requires_security ? `${product.security_value || 0}${product.security_type === "percentage" ? "%" : " KES"}` : "Unsecured"}
                      color={product.requires_security ? "warning" : "default"}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>

                  {/* Mandatory Deposit */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: product.requires_deposit ? "#eff6ff" : "#f8fafc",
                      border: `1px solid ${product.requires_deposit ? "#bfdbfe" : "#f1f5f9"}`,
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={700} color="#0f172a">
                        Advance Deposit Requirement
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {product.requires_deposit
                          ? `Mandatory advance deposit: ${product.deposit_value || 0}${
                              product.deposit_type === "percentage" ? "%" : " KES"
                            }`
                          : "Zero advance deposit required prior to disbursement"}
                      </Typography>
                    </Box>
                    <Chip
                      label={product.requires_deposit ? `${product.deposit_value || 0}${product.deposit_type === "percentage" ? "%" : " KES"}` : "None"}
                      color={product.requires_deposit ? "info" : "default"}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            {/* CARD C: PRODUCT FEES SCHEDULE */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "#eef2ff",
                      color: "#6366f1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconReceiptTax size={22} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      Product Fee Schedule ({product.fees?.length || 0})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Mandatory and optional loan deductions, appraisal, and legal fees
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {(!product.fees || product.fees.length === 0) ? (
                  <Box sx={{ py: 3, textAlign: "center", bgcolor: "#f8fafc", borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No standalone fees attached to this loan tier.
                    </Typography>
                  </Box>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ "& th": { fontWeight: 700, color: "text.secondary", fontSize: "0.75rem" } }}>
                        <TableCell>FEE NAME</TableCell>
                        <TableCell>TYPE</TableCell>
                        <TableCell align="right">VALUE</TableCell>
                        <TableCell>CALCULATION BASIS</TableCell>
                        <TableCell>LEDGER ACCOUNT</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {product.fees.map((f, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{f.fee_name}</TableCell>
                          <TableCell>
                            <Chip label={formatLabel(f.fee_type)} size="small" sx={{ fontSize: "0.7rem" }} />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "#047857" }}>
                            {f.fee_type === "percentage" ? `${f.fee_value}%` : `KES ${Number(f.fee_value).toLocaleString()}`}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                            {formatLabel(f.fee_basis)}
                          </TableCell>
                          <TableCell sx={{ color: "text.secondary", fontSize: "0.8rem" }}>
                            {f.ledger_account_name || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* RIGHT COLUMN: Governance, PAR Aging & Waterfall */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            {/* CARD D: DELINQUENCY & PAR AGING TIMELINE */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "#fff7ed",
                      color: "#ea580c",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconClock size={22} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      Regulatory Classification & PAR
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Portfolio at Risk aging thresholds for loan provisioning
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Stack spacing={2.5}>
                  {/* Step 1: Watchful */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "#fffbeb",
                      border: "1px solid #fde68a",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={700} color="#92400e">
                        Watchful Account
                      </Typography>
                      <Chip
                        label={`${product.watchful_after_days || 30} Days`}
                        size="small"
                        sx={{ bgcolor: "#fef3c7", color: "#92400e", fontWeight: 700 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="#b45309">
                      Classified as Watchful after {product.watchful_after_days || 30} days in arrears.
                    </Typography>
                  </Box>

                  {/* Step 2: Non-Performing */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "#fff7ed",
                      border: "1px solid #fed7aa",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={700} color="#9a3412">
                        Non-Performing (Substandard)
                      </Typography>
                      <Chip
                        label={`${product.non_performing_after_days || 90} Days`}
                        size="small"
                        sx={{ bgcolor: "#ffedd5", color: "#9a3412", fontWeight: 700 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="#c2410c">
                      Triggers loan suspension and recovery escalation at {product.non_performing_after_days || 90} days.
                    </Typography>
                  </Box>

                  {/* Step 3: Doubtful */}
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "#fef2f2",
                      border: "1px solid #fecaca",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={700} color="#991b1b">
                        Doubtful / Loss Provision
                      </Typography>
                      <Chip
                        label={`${product.doubtful_after_days || 180} Days`}
                        size="small"
                        sx={{ bgcolor: "#fee2e2", color: "#991b1b", fontWeight: 700 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="#b91c1c">
                      Classified as Doubtful / Default for full loan loss provisioning.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* CARD E: REPAYMENT WATERFALL & RESTRUCTURING */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "#ccfbf1",
                      color: "#0f766e",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconArrowsSort size={22} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      Repayment Waterfall & Restructuring
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Payment allocation sequence, offset rules, and rescheduling
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                {/* Waterfall allocation sequence visual */}
                <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" sx={{ mb: 1, display: "block" }}>
                  Payment Priority Waterfall
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: "wrap" }}>
                  {allocationSteps.map((step, idx) => (
                    <Chip
                      key={idx}
                      label={`${idx + 1}. ${formatLabel(step)}`}
                      color={idx === 0 ? "error" : idx === 1 ? "warning" : "success"}
                      variant="outlined"
                      sx={{ fontWeight: 700, borderRadius: 1.5 }}
                    />
                  ))}
                </Stack>

                {/* Rescheduling policy */}
                <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #f1f5f9", mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    LOAN RESCHEDULING / RESTRUCTURING
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#0f172a">
                    {product.allows_rescheduling
                      ? `Allowed (Fee: ${product.reschedule_fee_value || 0}${
                          product.reschedule_fee_type === "percentage" ? "%" : " KES"
                        })`
                      : "Rescheduling Disabled for this Product"}
                  </Typography>
                </Box>

                {/* Offset policy */}
                <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #f1f5f9", mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    LOAN OFFSET (REFINANCING)
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#0f172a">
                    {product.allows_offset
                      ? `Permitted against ${formatLabel(product.offset_covers || "savings")} (Fee: ${
                          product.offset_fee_value || 0
                        }${product.offset_fee_type === "percentage" ? "%" : " KES"})`
                      : "Offsetting Disabled for this Product"}
                  </Typography>
                </Box>

                {/* Governance approvals */}
                <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: 2, border: "1px solid #f1f5f9" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    GOVERNANCE & AUDIT APPROVALS
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                    <Chip
                      label={product.requires_appraisal ? "Appraisal Mandatory" : "Appraisal Optional"}
                      size="small"
                      color={product.requires_appraisal ? "primary" : "default"}
                      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                    />
                    <Chip
                      label={product.requires_board_approval ? "Board Approval Required" : "Branch Level Approval"}
                      size="small"
                      color={product.requires_board_approval ? "warning" : "default"}
                      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                    />
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            {/* CARD F: PRODUCT PENALTIES */}
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                border: "1px solid #e2e8f0",
                bgcolor: "#ffffff",
                boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
              }}
            >
              <CardContent sx={{ p: 3.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "#fee2e2",
                      color: "#dc2626",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconScale size={22} />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      Default & Late Penalties ({product.penalties?.length || 0})
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Automated late payment charges and default interest
                    </Typography>
                  </Box>
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {(!product.penalties || product.penalties.length === 0) ? (
                  <Box sx={{ py: 3, textAlign: "center", bgcolor: "#f8fafc", borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No dynamic penalties configured.
                    </Typography>
                  </Box>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ "& th": { fontWeight: 700, color: "text.secondary", fontSize: "0.75rem" } }}>
                        <TableCell>PENALTY</TableCell>
                        <TableCell>TRIGGER</TableCell>
                        <TableCell align="right">RATE</TableCell>
                        <TableCell align="center">STATUS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {product.penalties.map((pen, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{pen.penalty_name}</TableCell>
                          <TableCell sx={{ fontSize: "0.8rem", color: "text.secondary" }}>
                            {formatLabel(pen.trigger)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, color: "#dc2626" }}>
                            {pen.value}%
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={pen.is_active ? "Active" : "Disabled"}
                              color={pen.is_active ? "success" : "default"}
                              size="small"
                              sx={{ fontSize: "0.7rem", height: 22 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
