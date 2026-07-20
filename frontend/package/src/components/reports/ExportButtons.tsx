"use client";

import {
  Button,
  Stack,
} from "@mui/material";

import FileDownloadIcon from "@mui/icons-material/FileDownload";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";

import { Member } from "@/interfaces/member";

interface ExportButtonsProps {
  members: Member[];
}

export default function ExportButtons({
  members,
}: ExportButtonsProps) {
  const exportCSV = () => {
    const headers = [
      "Membership Number",
      "First Name",
      "Other Names",
      "National ID",
      "Phone Number",
      "Email",
      "Status",
      "Registration Stage",
      "Created At",
    ];

    const rows = members.map((member: any) => [
      member.membership_number,
      member.first_name,
      member.other_names,
      member.national_id,
      member.phone_number,
      member.email,
      member.status,
      member.registration_stage,
      member.created_at,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "members-report.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const printReport = () => {
    window.print();
  };

  const downloadPDF = () => {
    /*
      Browsers save to PDF through the print dialog.
    */
    window.print();
  };

  return (
    <Stack
      direction={{
        xs: "column",
        sm: "row",
      }}
      spacing={2}
      justifyContent="flex-end"
      mb={3}
    >
      <Button
        variant="contained"
        color="primary"
        startIcon={<FileDownloadIcon />}
        onClick={exportCSV}
      >
        Export CSV
      </Button>

      <Button
        variant="outlined"
        startIcon={<PictureAsPdfIcon />}
        onClick={downloadPDF}
      >
        Download PDF
      </Button>

      <Button
        variant="outlined"
        startIcon={<PrintIcon />}
        onClick={printReport}
      >
        Print
      </Button>
    </Stack>
  );
}