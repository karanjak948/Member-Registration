"use client";

import { useState } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  IconDownload,
  IconFileTypeCsv,
  IconFileTypeXls,
  IconPrinter,
} from "@tabler/icons-react";

export interface ExportColumn<T> {
  header: string;
  accessor: (item: T) => string | number | null | undefined;
}

interface ExportButtonProps<T> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  title?: string;
  documentTitle?: string;
}

export default function ExportButton<T>({
  data,
  columns,
  filename = "sacco_data_export",
  title = "Export",
  documentTitle = "ROYAL SACCO — OFFICIAL DATA REPORT",
}: ExportButtonProps<T>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // CSV EXPORT
  const exportToCSV = () => {
    handleClose();
    if (!data || data.length === 0) return;

    const headers = columns.map((c) => `"${c.header.replace(/"/g, '""')}"`).join(",");
    const rows = data.map((item) =>
      columns
        .map((c) => {
          const val = c.accessor(item);
          const cleanVal = val === null || val === undefined ? "" : String(val);
          return `"${cleanVal.replace(/"/g, '""')}"`;
        })
        .join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // NATIVE EXCEL (.XLS) EXPORT
  const exportToExcel = () => {
    handleClose();
    if (!data || data.length === 0) return;

    let tableHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    tableHtml += `<head><meta charset="utf-8"/><style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h2 { color: #064e3b; margin-bottom: 5px; }
      p { color: #64748b; font-size: 12px; margin-top: 0; }
      table { border-collapse: collapse; width: 100%; margin-top: 15px; }
      th { background-color: #064e3b; color: #ffffff; font-weight: bold; border: 1px solid #047857; padding: 10px; text-align: left; }
      td { border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; color: #1e293b; }
      tr:nth-child(even) { background-color: #f8fafc; }
    </style></head><body>`;

    tableHtml += `<h2>ROYAL SACCO — DATA REPORT</h2>`;
    tableHtml += `<p>Generated Date: ${new Date().toLocaleString("en-KE")} | Total Records: ${data.length}</p>`;
    tableHtml += `<table><thead><tr>`;

    columns.forEach((c) => {
      tableHtml += `<th>${c.header}</th>`;
    });
    tableHtml += `</tr></thead><tbody>`;

    data.forEach((item) => {
      tableHtml += `<tr>`;
      columns.forEach((c) => {
        const val = c.accessor(item);
        const cleanVal = val === null || val === undefined ? "—" : String(val);
        tableHtml += `<td>${cleanVal}</td>`;
      });
      tableHtml += `</tr>`;
    });

    tableHtml += `</tbody></table></body></html>`;

    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // EXECUTIVE PRINT / PDF REPORT GENERATOR
  const handlePrint = () => {
    handleClose();
    if (!data || data.length === 0) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let printHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentTitle}</title>
          <style>
            @page { size: A4 landscape; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; margin: 0; padding: 10px; }
            .header-banner { border-bottom: 3px solid #059669; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .company-title { font-size: 24px; font-weight: 900; color: #064e3b; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
            .subtitle { font-size: 13px; color: #047857; font-weight: 700; margin-top: 4px; }
            .meta-box { text-align: right; font-size: 12px; color: #475569; font-weight: 600; }
            .report-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .report-table th { background-color: #064e3b; color: #ffffff; font-weight: 800; font-size: 11px; text-transform: uppercase; padding: 10px 8px; border: 1px solid #047857; text-align: left; }
            .report-table td { padding: 9px 8px; border: 1px solid #e2e8f0; font-size: 12px; color: #1e293b; font-weight: 500; }
            .report-table tr:nth-child(even) { background-color: #f8fafc; }
            .footer-note { margin-top: 25px; border-top: 1px solid #e2e8f0; pt: 10px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div>
              <h1 class="company-title">ROYAL SACCO LIMITED</h1>
              <div class="subtitle">${documentTitle}</div>
            </div>
            <div class="meta-box">
              <div><strong>Report Date:</strong> ${new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}</div>
              <div><strong>Total Records:</strong> ${data.length} Entries</div>
            </div>
          </div>

          <table class="report-table">
            <thead>
              <tr>
                <th>#</th>
                ${columns.map((c) => `<th>${c.header}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (item, idx) => `
                <tr>
                  <td style="font-weight:700; color:#64748b; text-align:center;">${idx + 1}</td>
                  ${columns
                    .map((c) => {
                      const val = c.accessor(item);
                      return `<td>${val === null || val === undefined ? "—" : String(val)}</td>`;
                    })
                    .join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="footer-note">
            <span>Confidential — Royal SACCO Management System v1.0 Pro</span>
            <span>Page 1 of 1</span>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(printHtml);
    printWindow.document.close();
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<IconDownload size={18} />}
        onClick={handleClick}
        sx={{
          fontWeight: 800,
          borderRadius: 2.5,
          color: "#ffffff",
          bgcolor: "#059669",
          px: 2.5,
          py: 1,
          boxShadow: "0 4px 14px rgba(5, 150, 105, 0.3)",
          "&:hover": {
            bgcolor: "#047857",
          },
        }}
      >
        {title}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 4,
          sx: { borderRadius: 2.5, minWidth: 200, mt: 1 },
        }}
      >
        <MenuItem onClick={exportToCSV}>
          <ListItemIcon>
            <IconFileTypeCsv size={20} color="#059669" />
          </ListItemIcon>
          <ListItemText
            primary="Export as CSV"
            secondary="Comma Separated File"
            primaryTypographyProps={{ fontWeight: 700, fontSize: "0.88rem" }}
            secondaryTypographyProps={{ fontSize: "0.75rem" }}
          />
        </MenuItem>

        <MenuItem onClick={exportToExcel}>
          <ListItemIcon>
            <IconFileTypeXls size={20} color="#15803d" />
          </ListItemIcon>
          <ListItemText
            primary="Export to Excel (.xls)"
            secondary="Microsoft Excel Sheet"
            primaryTypographyProps={{ fontWeight: 700, fontSize: "0.88rem" }}
            secondaryTypographyProps={{ fontSize: "0.75rem" }}
          />
        </MenuItem>

        <MenuItem onClick={handlePrint}>
          <ListItemIcon>
            <IconPrinter size={20} color="#2563eb" />
          </ListItemIcon>
          <ListItemText
            primary="Print / Save as PDF"
            secondary="Clean Formatted Report"
            primaryTypographyProps={{ fontWeight: 700, fontSize: "0.88rem", color: "#1d4ed8" }}
            secondaryTypographyProps={{ fontSize: "0.75rem" }}
          />
        </MenuItem>
      </Menu>
    </>
  );
}
