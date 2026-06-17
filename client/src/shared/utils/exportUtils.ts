import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { saveAs } from 'file-saver';

export interface ExportColumn {
  header: string;
  accessor: string | ((row: any, index?: number) => any);
  format?: (value: any) => string;
}

export interface ExportOptions {
  filename: string;
  columns: ExportColumn[];
  data: any[];
  title?: string;
}

function getCellValue(row: any, col: ExportColumn, index: number): any {
  const raw = typeof col.accessor === 'function' ? col.accessor(row, index) : row[col.accessor];
  return col.format ? col.format(raw) : raw;
}

/** Export data as CSV */
export function exportCSV({ filename, columns, data }: ExportOptions) {
  const header = columns.map((c) => c.header).join(',');
  const rows = data.map((row, idx) =>
    columns
      .map((col) => {
        const val = getCellValue(row, col, idx);
        const str = String(val ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
}

/** Export data as Excel (.xlsx) */
export function exportExcel({ filename, columns, data }: ExportOptions) {
  const rows = data.map((row, idx) => {
    const obj: Record<string, any> = {};
    columns.forEach((col) => {
      obj[col.header] = getCellValue(row, col, idx);
    });
    return obj;
  });
  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-fit column widths
  const colWidths = columns.map((col) => {
    const maxLen = Math.max(
      col.header.length,
      ...data.map((row, idx) => String(getCellValue(row, col, idx) ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 40) };
  });
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}

/** Export data as PDF */
export function exportPDF({ filename, columns, data, title }: ExportOptions) {
  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });

  if (title) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-BD')}`, 14, 28);
  }

  const head = [columns.map((c) => c.header)];
  const body = data.map((row, idx) => columns.map((col) => String(getCellValue(row, col, idx) ?? '')));

  autoTable(doc, {
    head,
    body,
    startY: title ? 34 : 14,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [233, 30, 140],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 245, 247],
    },
    margin: { top: title ? 34 : 14 },
  });

  doc.save(`${filename}.pdf`);
}
