import React, { useState, useRef } from 'react';
import {
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  parseCSV,
  validateImportData,
  executeItemImport,
  type ImportValidationReport,
  type DuplicateStrategy,
} from '../services/itemImportService';
import { formatCurrency } from '../utils/numberFormat';
import type { AppSettings } from '../types';

interface ImportItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  settings: AppSettings;
}

export const ImportItemsModal: React.FC<ImportItemsModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  settings,
}) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [report, setReport] = useState<ImportValidationReport | null>(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('overwrite');
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let rawData: any[] = [];

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          rawData = Array.isArray(parsed) ? parsed : [parsed];
        } else if (file.name.endsWith('.csv')) {
          rawData = parseCSV(text);
        } else {
          try {
            rawData = JSON.parse(text);
          } catch {
            rawData = parseCSV(text);
          }
        }

        const validation = validateImportData(rawData);
        setReport(validation);
      } catch (err: any) {
        setReport({
          isValid: false,
          totalRows: 0,
          validRows: 0,
          errorRows: 1,
          errors: [{ row: 1, field: 'file', message: `Parse error: ${err.message}` }],
          items: [],
        });
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!report || report.items.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await executeItemImport(report.items, duplicateStrategy);
      setImportResult(res);
      onSuccess();
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setReport(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="font-serif text-[20px] font-normal text-[#0F172A]">Import Items</h2>
            <p className="text-[12px] text-[#64748B]">JSON & CSV file import with idempotent reconciliation</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[4px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {importResult ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-[6px] bg-[#F8FAFC] border border-[#059669]/30 text-[#059669] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-[18px] text-[#0F172A]">Import Complete</h3>
                <p className="text-[13px] text-[#64748B] mt-1">
                  Reconciled inventory records into local storage.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px]">
                  <div className="editorial-stat-num text-[22px]">{importResult.created}</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Created</div>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px]">
                  <div className="editorial-stat-num text-[22px]">{importResult.updated}</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Updated</div>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px]">
                  <div className="editorial-stat-num text-[22px]">{importResult.skipped}</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">Skipped</div>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="editorial-btn-secondary"
                >
                  Import Another File
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="editorial-btn-primary"
                >
                  Done
                </button>
              </div>
            </div>
          ) : !report ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E2E8F0] hover:border-[#0F172A] bg-[#F8FAFC] rounded-[6px] p-8 text-center cursor-pointer transition-colors group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,.csv"
                  className="hidden"
                />
                <div className="font-serif text-[16px] text-[#0F172A]">
                  Select or drop a JSON / CSV file
                </div>
                <div className="text-[12px] text-[#64748B] mt-1">
                  Conforming to the Vessel import format
                </div>
              </div>

              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] text-[12px] text-[#64748B] space-y-1.5">
                <div className="font-medium text-[#0F172A]">
                  Schema Documentation & Samples
                </div>
                <p>
                  Reference specifications in <code className="text-[#0F172A] bg-[#F1F5F9] px-1 py-0.5 rounded-[3px]">/docs/import-format.md</code> or sample items in <code className="text-[#0F172A] bg-[#F1F5F9] px-1 py-0.5 rounded-[3px]">/data/import/sample-items.json</code>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#64748B]" />
                  <span className="text-[12px] font-mono text-[#0F172A]">{fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[12px] text-[#64748B] hover:text-[#0F172A] underline"
                >
                  Change file
                </button>
              </div>

              {/* Validation Summary Report */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px]">
                  <div className="text-[11px] text-[#64748B]">Total Rows</div>
                  <div className="editorial-stat-num text-[20px] mt-0.5">{report.totalRows}</div>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px]">
                  <div className="text-[11px] text-[#64748B]">Valid Items</div>
                  <div className="editorial-stat-num text-[20px] text-[#059669] mt-0.5">{report.validRows}</div>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px]">
                  <div className="text-[11px] text-[#64748B]">Rows with Errors</div>
                  <div className={`editorial-stat-num text-[20px] mt-0.5 ${report.errorRows > 0 ? 'text-[#E11D48]' : 'text-[#64748B]'}`}>
                    {report.errorRows}
                  </div>
                </div>
              </div>

              {/* Error List */}
              {report.errors.length > 0 && (
                <div className="p-4 bg-[#F8FAFC] border border-[#E11D48]/30 rounded-[6px] space-y-2">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-[#E11D48]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Validation Errors ({report.errors.length}):</span>
                  </div>
                  <ul className="text-[12px] text-[#E11D48] space-y-1 max-h-36 overflow-y-auto pl-5 list-disc">
                    {report.errors.map((err, i) => (
                      <li key={i}>
                        <span className="font-medium">Row {err.row}</span> ({err.field}): {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Duplicate Strategy Option */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] space-y-3">
                <div className="text-[12px] font-medium text-[#0F172A]">Duplicate Handling Strategy</div>
                <div className="space-y-2 text-[12px] text-[#64748B]">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'overwrite'}
                      onChange={() => setDuplicateStrategy('overwrite')}
                      className="accent-[#0F172A]"
                    />
                    <span>
                      <strong className="text-[#0F172A]">Overwrite:</strong> Update matching items by external_id and increment revision
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'skip'}
                      onChange={() => setDuplicateStrategy('skip')}
                      className="accent-[#0F172A]"
                    />
                    <span>
                      <strong className="text-[#0F172A]">Skip:</strong> Keep existing items unchanged if external_id matches
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'create_new'}
                      onChange={() => setDuplicateStrategy('create_new')}
                      className="accent-[#0F172A]"
                    />
                    <span>
                      <strong className="text-[#0F172A]">Create New:</strong> Always generate a new record regardless of external_id
                    </span>
                  </label>
                </div>
              </div>

              {/* Dry-Run Preview Table */}
              <div className="space-y-2">
                <div className="text-[12px] font-medium text-[#0F172A]">Preview ({report.validRows} valid items)</div>
                <div className="border border-[#E2E8F0] rounded-[6px] overflow-x-auto max-h-56 bg-[#FFFFFF]">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead className="bg-[#F8FAFC] text-[#64748B] border-b border-[#E2E8F0]">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">External ID</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Value</th>
                        <th className="py-2 px-3">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                      {report.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#F8FAFC]/60">
                          <td className="py-2 px-3 font-medium">
                            {item.name}
                            {item.brand && <span className="text-[#64748B] ml-1 font-normal">({item.brand})</span>}
                          </td>
                          <td className="py-2 px-3 font-mono text-[#64748B] text-[11px]">
                            {item.external_id || '—'}
                          </td>
                          <td className="py-2 px-3 capitalize text-[#64748B]">{item.category}</td>
                          <td className="py-2 px-3 capitalize">
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums">
                            {formatCurrency(
                              item.current_value || item.price_paid || 0,
                              settings.currencySymbol,
                              settings.numberGrouping
                            )}
                          </td>
                          <td className="py-2 px-3 text-[#64748B]">{item.location || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!importResult && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#E2E8F0] bg-[#FFFFFF]">
            <button
              type="button"
              onClick={onClose}
              className="editorial-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={!report || report.validRows === 0 || isProcessing}
              className="editorial-btn-primary disabled:opacity-50"
            >
              {isProcessing ? 'Importing...' : `Import ${report ? `${report.validRows} Items` : ''}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
