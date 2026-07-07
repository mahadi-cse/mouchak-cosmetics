'use client';

import React, { useRef, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Theme } from '../utils/theme';
import { Btn } from '@/shared/components/ui/Primitives';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, X } from 'lucide-react';

export interface BulkUploadColumn {
  header: string;
  key: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean';
  example?: string;
}

export interface BulkUploadProps {
  open: boolean;
  onClose: () => void;
  title: string;
  columns: BulkUploadColumn[];
  onUpload: (data: any[]) => Promise<{ imported: number; skipped?: number; failed: number; errors: any[] }>;
  onDownloadSample: () => void;
}

function parseFileData(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(new Error('Failed to parse file. Please use a valid Excel or CSV file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}

function validateRows(rows: any[], columns: BulkUploadColumn[]): { valid: any[]; errors: { row: number; message: string }[] } {
  const errors: { row: number; message: string }[] = [];
  const valid: any[] = [];

  rows.forEach((row, idx) => {
    const rowErrors: string[] = [];
    const cleaned: any = {};

    for (const col of columns) {
      const val = row[col.key] ?? row[col.header] ?? '';

      if (col.required && (val === '' || val === null || val === undefined)) {
        rowErrors.push(`${col.header} is required`);
      }

      if (col.type === 'number' && val !== '' && val !== null && val !== undefined) {
        const num = Number(val);
        if (isNaN(num)) {
          rowErrors.push(`${col.header} must be a number`);
        } else {
          cleaned[col.key] = num;
        }
      } else if (col.type === 'boolean' && val !== '' && val !== null && val !== undefined) {
        const str = String(val).toLowerCase();
        cleaned[col.key] = str === 'true' || str === '1' || str === 'yes';
      } else {
        cleaned[col.key] = val;
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ row: idx + 2, message: rowErrors.join(', ') });
    } else {
      valid.push(cleaned);
    }
  });

  return { valid, errors };
}

export default function BulkUploadModal({ open, onClose, title, columns, onUpload, onDownloadSample }: BulkUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<{ row: number; message: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped?: number; failed: number; errors: any[] } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsedData([]);
    setValidationErrors([]);
    setResult(null);
    setParseError(null);

    try {
      const data = await parseFileData(selectedFile);
      if (data.length === 0) {
        setParseError('File is empty or has no data rows.');
        return;
      }
      if (data.length > 500) {
        setParseError('Maximum 500 rows allowed per upload.');
        return;
      }
      const { valid, errors } = validateRows(data, columns);
      setParsedData(valid);
      setValidationErrors(errors);
    } catch (err: any) {
      setParseError(err.message);
    }
  }, [columns]);

  const handleUpload = async () => {
    if (parsedData.length === 0) return;
    setIsUploading(true);
    try {
      const res = await onUpload(parsedData);
      setResult(res);
    } catch (err: any) {
      setResult({ imported: 0, failed: parsedData.length, errors: [{ error: err.message }] });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setParsedData([]);
    setValidationErrors([]);
    setResult(null);
    setParseError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-[700px] overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={20} style={{ color: Theme.primary }} />
            <span className="text-[16px] font-bold" style={{ color: Theme.fg }}>{title}</span>
          </div>
          <button onClick={handleClose} className="cursor-pointer border-none bg-transparent text-xl" style={{ color: Theme.mutedFg }}>
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Download sample */}
          <div className="mb-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: Theme.mutedFg }}>Step 1: Download Sample File</div>
            <p className="mb-3 text-xs" style={{ color: Theme.mutedFg }}>
              Download the sample file to see the expected format. Fill in your data and upload the completed file.
            </p>
            <Btn variant="secondary" size="sm" onClick={onDownloadSample}>
              <Download size={14} className="mr-1" />
              Download Sample Excel
            </Btn>
          </div>

          {/* Step 2: Upload file */}
          <div className="mb-5">
            <div className="mb-2 text-xs font-bold uppercase tracking-wider" style={{ color: Theme.mutedFg }}>Step 2: Upload Your File</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 transition-colors cursor-pointer bg-transparent"
              style={{
                borderColor: file ? Theme.primary : '#d1d5db',
                background: file ? `${Theme.secondary}` : '#fafafa',
                color: Theme.fg,
              }}
            >
              <Upload size={20} style={{ color: file ? Theme.primary : Theme.mutedFg }} />
              <span className="text-sm font-semibold">
                {file ? file.name : 'Click to select Excel or CSV file'}
              </span>
            </button>
          </div>

          {/* Parse error */}
          {parseError && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {parseError}
            </div>
          )}

          {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="mb-1 flex items-center gap-1 text-xs font-bold text-amber-700">
                <AlertCircle size={14} />
                {validationErrors.length} row(s) have validation errors
              </div>
              <div className="max-h-32 overflow-y-auto text-[11px] text-amber-600">
                {validationErrors.slice(0, 10).map((err, i) => (
                  <div key={i}>Row {err.row}: {err.message}</div>
                ))}
                {validationErrors.length > 10 && <div>...and {validationErrors.length - 10} more</div>}
              </div>
            </div>
          )}

          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="mb-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: Theme.mutedFg }}>
                  Preview ({parsedData.length} valid rows)
                </div>
              </div>
              <div className="max-h-48 overflow-auto rounded-lg border border-gray-200">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr style={{ background: Theme.muted }}>
                      {columns.slice(0, 6).map((col) => (
                        <th key={col.key} className="px-2 py-1.5 text-left font-bold" style={{ color: Theme.fg }}>
                          {col.header}
                          {col.required && <span className="text-red-500">*</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-t border-gray-100">
                        {columns.slice(0, 6).map((col) => (
                          <td key={col.key} className="px-2 py-1.5" style={{ color: Theme.fg }}>
                            {String(row[col.key] ?? '').slice(0, 30)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.length > 5 && (
                  <div className="px-2 py-1.5 text-center text-[10px]" style={{ color: Theme.mutedFg }}>
                    ...and {parsedData.length - 5} more rows
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mb-5 rounded-lg border p-3 text-xs" style={{
              borderColor: result.failed === 0 ? '#bbf7d0' : '#fecaca',
              background: result.failed === 0 ? '#f0fdf4' : '#fef2f2',
            }}>
              <div className="flex items-center gap-1 font-bold" style={{ color: result.failed === 0 ? '#166534' : '#991b1b' }}>
                {result.failed === 0 ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                Import Complete
              </div>
              <div className="mt-1" style={{ color: result.failed === 0 ? '#166534' : '#991b1b' }}>
                {result.imported} imported{result.skipped ? `, ${result.skipped} skipped` : ''}{result.failed > 0 ? `, ${result.failed} failed` : ''}
              </div>
              {result.errors.length > 0 && (
                <div className="mt-1 max-h-20 overflow-y-auto text-[10px]">
                  {result.errors.slice(0, 5).map((err: any, i: number) => (
                    <div key={i}>{err.name || err.error || JSON.stringify(err)}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Btn variant="ghost" size="sm" onClick={handleClose}>
              {result ? 'Close' : 'Cancel'}
            </Btn>
            {!result && (
              <Btn
                variant="primary"
                size="sm"
                onClick={handleUpload}
                loading={isUploading}
                disabled={parsedData.length === 0 || validationErrors.length > 0}
              >
                Import {parsedData.length} Rows
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
