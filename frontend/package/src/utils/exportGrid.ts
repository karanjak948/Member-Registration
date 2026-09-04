/**
 * Universal Data Grid Export Utilities
 * Provides seamless export of any table or grid data to CSV, Excel, and Print/PDF.
 */

export interface ExportColumn<T = any> {
  header: string;
  key?: keyof T | string;
  accessor?: (row: T) => any;
  format?: (value: any, row: T) => string;
}

function resolveValue<T>(row: T, col: ExportColumn<T>): string {
  let rawValue: any;
  if (col.accessor) {
    rawValue = col.accessor(row);
  } else if (col.key) {
    const keyStr = String(col.key);
    if (keyStr.includes(".")) {
      rawValue = keyStr.split(".").reduce((acc, part) => acc?.[part], row as any);
    } else {
      rawValue = (row as any)[keyStr];
    }
  } else {
    rawValue = "";
  }

  if (col.format) {
    return col.format(rawValue, row);
  }

  if (rawValue === null || rawValue === undefined) {
    return "";
  }

  if (typeof rawValue === "boolean") {
    return rawValue ? "Yes" : "No";
  }

  if (typeof rawValue === "object") {
    if (rawValue instanceof Date) {
      return rawValue.toLocaleDateString();
    }
    return JSON.stringify(rawValue);
  }

  return String(rawValue);
}

function escapeCSV(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n") || val.includes("\r")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function getFormattedTimestamp(): string {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

/**
 * Export data to standard RFC-4180 CSV with UTF-8 BOM for Microsoft Excel.
 */
export function exportToCSV<T = any>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string = "export",
): void {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headers = columns.map((col) => escapeCSV(col.header)).join(",");
  const rows = data.map((row) =>
    columns.map((col) => escapeCSV(resolveValue(row, col))).join(","),
  );

  const csvContent = "\uFEFF" + [headers, ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${getFormattedTimestamp()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data formatted for Microsoft Excel (.xls XML / HTML workbook)
 */
export function exportToExcel<T = any>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string = "export",
): void {
  if (!data || data.length === 0) {
    alert("No data available to export.");
    return;
  }

  const headerHtml = columns
    .map(
      (c) =>
        `<th style="background-color: #047857; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 10px;">${c.header}</th>`,
    )
    .join("");

  const rowsHtml = data
    .map((row, idx) => {
      const bgColor = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
      const cells = columns
        .map(
          (c) =>
            `<td style="border: 1px solid #e2e8f0; padding: 8px; vertical-align: middle;">${resolveValue(
              row,
              c,
            )}</td>`,
        )
        .join("");
      return `<tr style="background-color: ${bgColor};">${cells}</tr>`;
    })
    .join("");

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${filename.slice(0, 31)}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
      </head>
      <body>
        <h2 style="color: #064e3b; font-family: Arial, sans-serif; margin-bottom: 4px;">Royal SACCO System</h2>
        <p style="color: #64748b; font-family: Arial, sans-serif; font-size: 12px; margin-top: 0;">Exported on: ${new Date().toLocaleString()} | Total Records: ${data.length}</p>
        <table style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 13px; width: 100%;">
          <thead>
            <tr>${headerHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${getFormattedTimestamp()}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Open a beautifully styled print-ready view formatted for browser printing / Save to PDF.
 */
export function printDataGrid<T = any>(
  title: string,
  data: T[],
  columns: ExportColumn<T>[],
): void {
  if (!data || data.length === 0) {
    alert("No data available to print.");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups for this site to print.");
    return;
  }

  const headerHtml = columns.map((c) => `<th>${c.header}</th>`).join("");
  const rowsHtml = data
    .map(
      (row) =>
        `<tr>${columns
          .map((c) => `<td>${resolveValue(row, c)}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - Royal SACCO</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 20px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #047857;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .brand {
            font-size: 22px;
            font-weight: 800;
            color: #047857;
          }
          .meta {
            font-size: 12px;
            color: #64748b;
            text-align: right;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th {
            background-color: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            border: 1px solid #cbd5e1;
          }
          td {
            padding: 8px 10px;
            border: 1px solid #e2e8f0;
          }
          tr:nth-child(even) td {
            background-color: #f8fafc;
          }
          .footer {
            margin-top: 24px;
            font-size: 11px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">ROYAL SACCO</div>
            <div style="font-size: 14px; font-weight: 600; color: #334155; margin-top: 2px;">${title}</div>
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Total Records:</strong> ${data.length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>${headerHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>Confidential Document &bull; Royal SACCO Credit & Registration System</div>
          <div>Printed by Authorized User</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
