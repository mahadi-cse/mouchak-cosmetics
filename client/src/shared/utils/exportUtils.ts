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

export interface FullReportSection {
  title: string;
  columns: ExportColumn[];
  data: any[];
}

export interface FullReportOptions {
  filename: string;
  title: string;
  subtitle: string;
  summary: FullReportSection;
  trend: FullReportSection;
  products: FullReportSection;
  categories: FullReportSection;
  chartImage?: string | null;
}

/** Export full analytics report as CSV */
export function exportFullCSV({ filename, title, subtitle, summary, trend, products, categories }: FullReportOptions) {
  let csv = `${title.toUpperCase()}\n${subtitle}\nGenerated: ${new Date().toLocaleDateString('en-BD')}\n\n`;

  const appendSection = (sect: FullReportSection) => {
    let part = `--- ${sect.title.toUpperCase()} ---\n`;
    part += sect.columns.map((c) => c.header).join(',') + '\n';
    part += sect.data.map((row, idx) =>
      sect.columns
        .map((col) => {
          const val = getCellValue(row, col, idx);
          const str = String(val ?? '');
          return str.includes(',') || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(',')
    ).join('\n') + '\n\n';
    return part;
  };

  csv += appendSection(summary);
  csv += appendSection(trend);
  csv += appendSection(products);
  csv += appendSection(categories);

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
}

/** Export full analytics report as Excel (.xlsx) with multiple sheets */
export function exportFullExcel({ filename, summary, trend, products, categories }: FullReportOptions) {
  const wb = XLSX.utils.book_new();

  const addSheet = (sect: FullReportSection, sheetName: string) => {
    const rows = sect.data.map((row, idx) => {
      const obj: Record<string, any> = {};
      sect.columns.forEach((col) => {
        obj[col.header] = getCellValue(row, col, idx);
      });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = sect.columns.map((col) => {
      const maxLen = Math.max(
        col.header.length,
        ...sect.data.map((row, idx) => String(getCellValue(row, col, idx) ?? '').length)
      );
      return { wch: Math.min(maxLen + 2, 40) };
    });
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  addSheet(summary, 'Summary Overview');
  addSheet(trend, 'Revenue Trend');
  addSheet(products, 'Top Products');
  addSheet(categories, 'Sales by Category');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}

/** Export full analytics report as PDF, including tables and chart image */
export function exportFullPDF({ filename, title, subtitle, summary, trend, products, categories, chartImage }: FullReportOptions) {
  const doc = new jsPDF({ orientation: 'portrait' });
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(240, 17, 114); // Theme primary color #f01172
  doc.text(title, 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(subtitle, 14, 26);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-BD')}`, 14, 31);
  
  // Line separator
  doc.setDrawColor(224, 224, 224);
  doc.line(14, 34, 196, 34);
  
  let currentY = 42;
  
  // Section 1: Summary Overview
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('Summary Overview', 14, currentY);
  currentY += 4;
  
  const summaryHead = [summary.columns.map((c) => c.header)];
  const summaryBody = summary.data.map((row, idx) => summary.columns.map((col) => String(getCellValue(row, col, idx) ?? '')));
  
  autoTable(doc, {
    head: summaryHead,
    body: summaryBody,
    startY: currentY,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 17, 114], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 245, 247] },
    margin: { left: 14, right: 14 }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 8;
  
  // Section 2: Chart Image (if exists)
  if (chartImage) {
    if (currentY + 80 > 280) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 33, 33);
    doc.text('Revenue Trend Visual', 14, currentY);
    currentY += 4;
    
    // Draw chart image
    doc.addImage(chartImage, 'PNG', 14, currentY, 182, 91);
    currentY += 96;
  }
  
  // Section 3: Revenue Trend Details (on next page to keep it clean)
  doc.addPage();
  currentY = 20;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('Revenue Trend Details', 14, currentY);
  currentY += 4;
  
  const trendHead = [trend.columns.map((c) => c.header)];
  const trendBody = trend.data.map((row, idx) => trend.columns.map((col) => String(getCellValue(row, col, idx) ?? '')));
  
  autoTable(doc, {
    head: trendHead,
    body: trendBody,
    startY: currentY,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 17, 114], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 245, 247] },
    margin: { left: 14, right: 14 }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 10;
  
  // Section 4: Top Products by Revenue
  if (currentY + 40 > 280) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('Top Products by Revenue', 14, currentY);
  currentY += 4;
  
  const productsHead = [products.columns.map((c) => c.header)];
  const productsBody = products.data.map((row, idx) => products.columns.map((col) => String(getCellValue(row, col, idx) ?? '')));
  
  autoTable(doc, {
    head: productsHead,
    body: productsBody,
    startY: currentY,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 17, 114], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 245, 247] },
    margin: { left: 14, right: 14 }
  });
  
  currentY = (doc as any).lastAutoTable.finalY + 10;
  
  // Section 5: Sales by Category
  if (currentY + 40 > 280) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(33, 33, 33);
  doc.text('Sales by Category', 14, currentY);
  currentY += 4;
  
  const categoriesHead = [categories.columns.map((c) => c.header)];
  const categoriesBody = categories.data.map((row, idx) => categories.columns.map((col) => String(getCellValue(row, col, idx) ?? '')));
  
  autoTable(doc, {
    head: categoriesHead,
    body: categoriesBody,
    startY: currentY,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [240, 17, 114], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 245, 247] },
    margin: { left: 14, right: 14 }
  });
  
  doc.save(`${filename}.pdf`);
}
