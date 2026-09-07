"use client";

import React, { useRef } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import {
  IconPrinter,
  IconX,
  IconShieldCheck,
  IconCheck,
  IconQrcode,
  IconCertificate,
  IconAward,
} from "@tabler/icons-react";

export interface ClearanceCertificateData {
  certificateNumber: string;
  securityCode: string;
  issueDate: string;
  clearanceDate: string;
  memberName: string;
  membershipNumber: string;
  nationalId: string;
  phone: string;
  loanNumber: string;
  productName: string;
  principalAmount: number;
  totalSettledAmount: number;
  outstandingBalance: number;
  status: string;
  verificationUrl: string;
}

interface LoanClearanceCertificateModalProps {
  open: boolean;
  onClose: () => void;
  certificate: ClearanceCertificateData | null;
}

export default function LoanClearanceCertificateModal({
  open,
  onClose,
  certificate,
}: LoanClearanceCertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 3,
          bgcolor: "#0f172a",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      }}
    >
      {/* Modal Toolbar (Hidden during Print) */}
      <Box
        className="no-print"
        sx={{
          px: 3,
          py: 2,
          bgcolor: "#1e293b",
          borderBottom: "1px solid #334155",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              p: 0.75,
              borderRadius: 2,
              bgcolor: "#065f46",
              color: "#34d399",
              display: "flex",
            }}
          >
            <IconAward size={22} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="#ffffff">
              Official Loan Clearance Certificate Preview
            </Typography>
            <Typography variant="caption" color="#94a3b8">
              Serial No: {certificate.certificateNumber} • Security Code: {certificate.securityCode}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            startIcon={<IconPrinter size={18} />}
            onClick={handlePrint}
            sx={{
              bgcolor: "#059669",
              color: "#ffffff",
              fontWeight: 800,
              borderRadius: 2,
              px: 2.5,
              "&:hover": { bgcolor: "#047857" },
              boxShadow: "0 4px 14px rgba(5, 150, 105, 0.4)",
            }}
          >
            Print Certificate
          </Button>
          <IconButton onClick={onClose} sx={{ color: "#94a3b8", "&:hover": { color: "#ffffff" } }}>
            <IconX size={20} />
          </IconButton>
        </Stack>
      </Box>

      {/* Certificate Container */}
      <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: "#0f172a" }}>
        {/* Printable Certificate Frame */}
        <Box
          id="printable-loan-certificate"
          ref={certificateRef}
          sx={{
            width: "100%",
            maxWidth: "760px",
            mx: "auto",
            bgcolor: "#ffffff",
            color: "#0f172a",
            p: { xs: 3, sm: 4.5 },
            borderRadius: 1.5,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            position: "relative",
            border: "3px solid #064e3b",
            outline: "1px solid #cbd5e1",
            outlineOffset: "-6px",
          }}
        >
          {/* Official SACCO Header */}
          <Stack alignItems="center" textAlign="center" spacing={0.75} mb={2.5}>
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #064e3b 0%, #047857 70%, #b45309 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 3px 10px rgba(6, 78, 59, 0.25)",
                mb: 0.5,
              }}
            >
              <IconCertificate size={30} stroke={2} />
            </Box>

            <Typography
              variant="h5"
              fontWeight={900}
              sx={{
                color: "#064e3b",
                fontFamily: "serif",
                letterSpacing: "0.5px",
                fontSize: { xs: "1.25rem", sm: "1.6rem" },
                textTransform: "uppercase",
              }}
            >
              Royal Savings &amp; Credit Co-operative Society Ltd
            </Typography>

            <Typography
              variant="caption"
              fontWeight={700}
              sx={{ color: "#b45309", letterSpacing: "1px", textTransform: "uppercase", fontSize: "0.75rem" }}
            >
              Incorporated Under The Co-operative Societies Act • Licensed &amp; Regulated by SASRA
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
              Royal Plaza, Upper Hill, P.O. Box 48291-00100 Nairobi, Kenya • info@royalltd.co.ke
            </Typography>

            <Divider sx={{ width: "100%", mt: 1, mb: 1.5, borderColor: "#064e3b", borderWidth: 1 }} />
          </Stack>

          {/* Certificate Title & Metadata Bar */}
          <Box textAlign="center" mb={2}>
            <Typography
              variant="h6"
              fontWeight={900}
              sx={{
                color: "#0f172a",
                fontFamily: "serif",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                fontSize: { xs: "1.1rem", sm: "1.35rem" },
                mb: 1,
              }}
            >
              Certificate of Loan Clearance
            </Typography>

            <Stack
              direction="row"
              justifyContent="center"
              alignItems="center"
              spacing={{ xs: 1.5, sm: 3 }}
              sx={{
                py: 0.75,
                px: 2,
                bgcolor: "#f8fafc",
                borderRadius: 1,
                border: "1px solid #e2e8f0",
                display: "inline-flex",
              }}
            >
              <Typography variant="caption" fontWeight={700} color="#475569">
                CERTIFICATE NO:{" "}
                <span style={{ color: "#064e3b", fontFamily: "monospace", fontWeight: 800 }}>
                  {certificate.certificateNumber}
                </span>
              </Typography>
              <Typography variant="caption" color="#cbd5e1">|</Typography>
              <Typography variant="caption" fontWeight={700} color="#475569">
                CLEARANCE DATE:{" "}
                <span style={{ color: "#0f172a", fontWeight: 700 }}>
                  {certificate.clearanceDate}
                </span>
              </Typography>
            </Stack>
          </Box>

          {/* Direct, Clear Certification Attestation */}
          <Typography
            variant="body1"
            sx={{
              lineHeight: 1.7,
              textAlign: "center",
              color: "#1e293b",
              fontFamily: "serif",
              fontSize: { xs: "0.92rem", sm: "1.02rem" },
              my: 2,
              px: { xs: 1, sm: 2 },
            }}
          >
            This is to certify that <strong>{certificate.memberName}</strong>, holder of Membership No.{" "}
            <strong style={{ color: "#064e3b" }}>{certificate.membershipNumber}</strong> and National ID / Passport{" "}
            <strong>{certificate.nationalId || "VERIFIED"}</strong>, has fully satisfied, settled, and liquidated all
            outstanding obligations under credit facility <strong>{certificate.loanNumber}</strong>.
          </Typography>

          {/* Simple Particulars Card */}
          <Box
            sx={{
              p: 2,
              my: 2,
              bgcolor: "#f8fafc",
              borderRadius: 1.5,
              border: "1px solid #e2e8f0",
            }}
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Borrower Name:</Typography>
                    <Typography variant="caption" fontWeight={800} color="#0f172a">{certificate.memberName}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Membership Number:</Typography>
                    <Typography variant="caption" fontWeight={800} color="#064e3b" fontFamily="monospace">
                      {certificate.membershipNumber}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">National ID / Passport:</Typography>
                    <Typography variant="caption" fontWeight={700} color="#0f172a">
                      {certificate.nationalId || "VERIFIED"}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Phone Number:</Typography>
                    <Typography variant="caption" fontWeight={700} color="#0f172a">{certificate.phone}</Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Loan Reference:</Typography>
                    <Typography variant="caption" fontWeight={800} color="#0f172a" fontFamily="monospace">
                      {certificate.loanNumber}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Facility Product:</Typography>
                    <Typography variant="caption" fontWeight={700} color="#0f172a">{certificate.productName}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Principal Cleared:</Typography>
                    <Typography variant="caption" fontWeight={800} color="#0f172a">
                      KES {certificate.principalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Outstanding Balance:</Typography>
                    <Typography variant="caption" fontWeight={900} color="#059669">
                      KES 0.00 (NIL / CLEARED)
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {/* Simple Discharge Note */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              textAlign: "center",
              fontStyle: "italic",
              mb: 3,
              px: 2,
            }}
          >
            The Society confirms that there are no continuing liabilities on this facility. All associated guarantors,
            pledges, and securities are unconditionally released and discharged.
          </Typography>

          {/* Signatures on Either Side & Official Seal in Center */}
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2.5, pt: 1 }}>
            {/* Left Side: Authorized Signatory */}
            <Grid size={{ xs: 4 }}>
              <Box sx={{ width: "90%", mx: "auto" }}>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  color="#0f172a"
                  display="block"
                  textAlign="center"
                  mb={1}
                >
                  Authorized Signatory
                </Typography>
                <Stack spacing={1.2}>
                  <Box display="flex" alignItems="flex-end">
                    <Typography variant="caption" fontWeight={600} color="#475569" sx={{ width: 38 }}>
                      Name:
                    </Typography>
                    <Box sx={{ flexGrow: 1, borderBottom: "1px solid #334155", height: 14 }} />
                  </Box>
                  <Box display="flex" alignItems="flex-end">
                    <Typography variant="caption" fontWeight={600} color="#475569" sx={{ width: 38 }}>
                      Sign:
                    </Typography>
                    <Box sx={{ flexGrow: 1, borderBottom: "1px solid #334155", height: 14 }} />
                  </Box>
                  <Box display="flex" alignItems="flex-end">
                    <Typography variant="caption" fontWeight={600} color="#475569" sx={{ width: 38 }}>
                      Date:
                    </Typography>
                    <Box sx={{ flexGrow: 1, borderBottom: "1px solid #334155", height: 14 }} />
                  </Box>
                </Stack>
              </Box>
            </Grid>

            {/* Center Official Gold Seal */}
            <Grid size={{ xs: 4 }} textAlign="center">
              <Box
                sx={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  mx: "auto",
                  background: "radial-gradient(circle, #fef3c7 0%, #fde68a 40%, #d97706 80%, #92400e 100%)",
                  border: "2px dashed #78350f",
                  boxShadow: "0 4px 12px rgba(180, 83, 9, 0.3)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#78350f",
                  p: 0.5,
                }}
              >
                <IconShieldCheck size={26} stroke={2.5} />
                <Typography
                  variant="caption"
                  fontWeight={900}
                  fontSize="0.52rem"
                  lineHeight={1.1}
                  mt={0.4}
                  letterSpacing={0.5}
                  textAlign="center"
                >
                  OFFICIAL SEAL
                  <br />
                  ROYAL SACCO
                  <br />
                  2026
                </Typography>
              </Box>
            </Grid>

            {/* Right Side: Credit Operations */}
            <Grid size={{ xs: 4 }}>
              <Box sx={{ width: "90%", mx: "auto" }}>
                <Typography
                  variant="caption"
                  fontWeight={800}
                  color="#0f172a"
                  display="block"
                  textAlign="center"
                  mb={1}
                >
                  Credit Operations
                </Typography>
                <Stack spacing={1.2}>
                  <Box display="flex" alignItems="flex-end">
                    <Typography variant="caption" fontWeight={600} color="#475569" sx={{ width: 38 }}>
                      Name:
                    </Typography>
                    <Box sx={{ flexGrow: 1, borderBottom: "1px solid #334155", height: 14 }} />
                  </Box>
                  <Box display="flex" alignItems="flex-end">
                    <Typography variant="caption" fontWeight={600} color="#475569" sx={{ width: 38 }}>
                      Sign:
                    </Typography>
                    <Box sx={{ flexGrow: 1, borderBottom: "1px solid #334155", height: 14 }} />
                  </Box>
                  <Box display="flex" alignItems="flex-end">
                    <Typography variant="caption" fontWeight={600} color="#475569" sx={{ width: 38 }}>
                      Date:
                    </Typography>
                    <Box sx={{ flexGrow: 1, borderBottom: "1px solid #334155", height: 14 }} />
                  </Box>
                </Stack>
              </Box>
            </Grid>
          </Grid>

          {/* Clean Verification Strip (No long raw URL) */}
          <Divider sx={{ my: 2, borderColor: "#cbd5e1" }} />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems="center"
            spacing={1.5}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  bgcolor: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#064e3b",
                }}
              >
                <IconQrcode size={24} />
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={800} color="#0f172a" display="block">
                  DIGITAL SECURITY VERIFICATION
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" fontSize="0.72rem">
                  Security Code:{" "}
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#b45309" }}>
                    {certificate.securityCode}
                  </span>
                </Typography>
              </Box>
            </Stack>

            <Chip
              icon={<IconCheck size={14} color="#047857" />}
              label="ORIGINAL CERTIFICATE • SYSTEM VERIFIED"
              size="small"
              sx={{
                bgcolor: "#ecfdf5",
                color: "#047857",
                fontWeight: 800,
                fontSize: "0.68rem",
                border: "1px solid #a7f3d0",
              }}
            />
          </Stack>
        </Box>
      </DialogContent>

      {/* Embedded Print CSS */}
      <style jsx global>{`
        @media print {
          /* Hide all page chrome, modals, headers, sidebars */
          body * {
            visibility: hidden !important;
          }

          /* Show only the printable certificate */
          #printable-loan-certificate,
          #printable-loan-certificate * {
            visibility: visible !important;
          }

          #printable-loan-certificate {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100vw !important;
            height: auto !important;
            min-height: 98vh !important;
            margin: 0 !important;
            padding: 12mm 15mm !important;
            border: 3px solid #064e3b !important;
            outline: 1px solid #cbd5e1 !important;
            outline-offset: -5px !important;
            box-shadow: none !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 6mm;
          }
        }
      `}</style>
    </Dialog>
  );
}
