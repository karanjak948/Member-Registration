"use client";

import {
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import { LoanProduct } from "@/interfaces/loanProduct";

interface Props {
  product: LoanProduct;
}

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="body1">{value || "-"}</Typography>
    </Stack>
  );
}

export default function LoanProductDetails({ product }: Props) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={4}>
          <Typography variant="h5" fontWeight={700}>
            Loan Product Details
          </Typography>

          {/* Basic Information */}

          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Basic Information
            </Typography>

            <Divider />

            <Grid container spacing={3}>
              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <DetailItem label="Product Code" value={product.product_code} />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 8,
                }}
              >
                <DetailItem label="Product Name" value={product.product_name} />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <DetailItem
                  label="Interest Rate"
                  value={`${product.interest_rate}%`}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <DetailItem
                  label="Interest Method"
                  value={product.interest_method}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <DetailItem
                  label="Interest Period"
                  value={product.interest_period}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <DetailItem
                  label="Repayment Frequency"
                  value={product.repayment_frequency}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <DetailItem
                  label="Maximum Period"
                  value={product.max_repayment_period}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>

                  <Chip
                    label={product.is_active ? "Active" : "Inactive"}
                    color={product.is_active ? "success" : "default"}
                    sx={{
                      width: "fit-content",
                    }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </Stack>

          {/* Loan Requirements */}

          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Loan Requirements
            </Typography>

            <Divider />

            <Grid container spacing={3}>
              <Grid
                size={{
                  xs: 12,
                  md: 3,
                }}
              >
                <DetailItem
                  label="Requires Guarantor"
                  value={product.requires_guarantor ? "Yes" : "No"}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 3,
                }}
              >
                <DetailItem
                  label="Requires Deposit"
                  value={product.requires_deposit ? "Yes" : "No"}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 3,
                }}
              >
                <DetailItem
                  label="Requires Security"
                  value={product.requires_security ? "Yes" : "No"}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 3,
                }}
              >
                <DetailItem
                  label="Board Approval"
                  value={product.requires_board_approval ? "Yes" : "No"}
                />
              </Grid>
            </Grid>
          </Stack>

          {/* Classification */}

          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={600}>
              Classification
            </Typography>

            <Divider />

            <Grid container spacing={3}>
              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <DetailItem
                  label="Watchful After"
                  value={`${product.watchful_after_days} days`}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <DetailItem
                  label="Non Performing After"
                  value={`${product.non_performing_after_days} days`}
                />
              </Grid>

              <Grid
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <DetailItem
                  label="Doubtful After"
                  value={`${product.doubtful_after_days} days`}
                />
              </Grid>
            </Grid>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
