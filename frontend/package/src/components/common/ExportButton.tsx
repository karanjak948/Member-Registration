"use client";

import { useState } from "react";
import { Button, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import {
  IconDownload,
  IconFileSpreadsheet,
  IconTableExport,
  IconPrinter,
  IconChevronDown,
} from "@tabler/icons-react";
import { ExportColumn, exportToCSV, exportToExcel, printDataGrid } from "@/utils/exportGrid";

interface ExportButtonProps<T = any> {
  data: T[];
  columns: ExportColumn<T>[];
  filename?: string;
  title?: string;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

export default function ExportButton<T = any>({
  data,
  columns,
  filename = "export",
  title = "Registry Export",
  disabled = false,
  size = "medium",
}: ExportButtonProps<T>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleExportCSV = () => {
    handleClose();
    exportToCSV(data, columns, filename);
  };

  const handleExportExcel = () => {
    handleClose();
    exportToExcel(data, columns, filename);
  };

  const handlePrint = () => {
    handleClose();
    printDataGrid(title, data, columns);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="inherit"
        size={size}
        startIcon={<IconDownload size={18} />}
        endIcon={<IconChevronDown size={14} />}
        disabled={disabled || data.length === 0}
        onClick={handleClick}
        sx={{
          textTransform: "none",
          fontWeight: 700,
          borderRadius: 2.5,
          borderColor: "#cbd5e1",
          color: "#334155",
          bgcolor: "#ffffff",
          "&:hover": {
            bgcolor: "#f8fafc",
            borderColor: "#94a3b8",
          },
        }}
      >
        Export ({data.length})
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2.5,
            minWidth: 190,
            mt: 0.8,
            border: "1px solid #e2e8f0",
          },
        }}
      >
        <MenuItem onClick={handleExportCSV} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 32, color: "#059669" }}>
            <IconFileSpreadsheet size={18} />
          </ListItemIcon>
          <ListItemText primary="Export as CSV" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </MenuItem>

        <MenuItem onClick={handleExportExcel} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 32, color: "#10b981" }}>
            <IconTableExport size={18} />
          </ListItemIcon>
          <ListItemText primary="Export to Excel (.xls)" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </MenuItem>

        <MenuItem onClick={handlePrint} sx={{ py: 1 }}>
          <ListItemIcon sx={{ minWidth: 32, color: "#2563eb" }}>
            <IconPrinter size={18} />
          </ListItemIcon>
          <ListItemText primary="Print / Save PDF" primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }} />
        </MenuItem>
      </Menu>
    </>
  );
}
