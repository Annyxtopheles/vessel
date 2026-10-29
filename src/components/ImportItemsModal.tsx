import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Database,
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
          // Attempt JSON parse first, fallback to CSV
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2C2C2E] flex items-center justify-center text-[#E5E5EA]">
              <Database className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#E5E5EA]">Import Inventory Items</h2>
              <p className="text-xs text-[#8E8E93]">JSON & CSV file import with idempotent reconciliation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8E8E93] hover:text-[#E5E5EA] rounded-md hover:bg-[#2C2C2E] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {importResult ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-[#E5E5EA]">Import Completed Successfully</h3>
                <p className="text-sm text-[#8E8E93] mt-1">
                  Reconciled inventory records into local storage.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto pt-2">
                <div className="p-3 bg-[#242426] border border-[#2C2C2E] rounded-lg">
                  <div className="text-xl font-bold text-teal-400">{importResult.created}</div>
                  <div className="text-xs text-[#8E8E93] mt-0.5">Created</div>
                </div>
                <div className="p-3 bg-[#242426] border border-[#2C2C2E] rounded-lg">
                  <div className="text-xl font-bold text-amber-400">{importResult.updated}</div>
                  <div className="text-xs text-[#8E8E93] mt-0.5">Updated</div>
                </div>
                <div className="p-3 bg-[#242426] border border-[#2C2C2E] rounded-lg">
                  <div className="text-xl font-bold text-[#8E8E93]">{importResult.skipped}</div>
                  <div className="text-xs text-[#8E8E93] mt-0.5">Skipped</div>
                </div>
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-xs font-medium bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#E5E5EA] rounded-md transition-colors"
                >
                  Import Another File
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white rounded-md transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : !report ? (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#2C2C2E] hover:border-teal-500/50 bg-[#161618] hover:bg-[#1E1E20] rounded-xl p-8 text-center cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,.csv"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-[#242426] group-hover:bg-teal-500/10 text-[#8E8E93] group-hover:text-teal-400 flex items-center justify-center mx-auto mb-3 transition-colors">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium text-[#E5E5EA]">
                  Click to select or drag & drop a file
                </div>
                <div className="text-xs text-[#8E8E93] mt-1">
                  Supports JSON and CSV conforming to Vessel import schema
                </div>
              </div>

              <div className="p-4 bg-[#242426] border border-[#2C2C2E] rounded-lg text-xs text-[#8E8E93] space-y-2">
                <div className="flex items-center gap-2 font-medium text-[#E5E5EA]">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span>Schema Documentation & Neutral Samples</span>
                </div>
                <p>
                  You can reference the exact JSON/CSV specifications in{' '}
                  <code className="text-teal-400 bg-black/40 px-1 py-0.5 rounded">/docs/import-format.md</code>{' '}
                  or inspect neutral sample items in{' '}
                  <code className="text-teal-400 bg-black/40 px-1 py-0.5 rounded">/data/import/sample-items.json</code>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-[#242426] border border-[#2C2C2E] rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400" />
                  <span className="text-xs font-mono text-[#E5E5EA]">{fileName}</span>
                </div>
                <button
                  onClick={handleReset}
                  className="text-xs text-[#8E8E93] hover:text-[#E5E5EA] underline"
                >
                  Change file
                </button>
              </div>

              {/* Validation Summary Report */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg">
                  <div className="text-xs text-[#8E8E93]">Total Rows</div>
                  <div className="text-lg font-bold text-[#E5E5EA] mt-0.5">{report.totalRows}</div>
                </div>
                <div className="p-3 bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg">
                  <div className="text-xs text-[#8E8E93]">Valid Items</div>
                  <div className="text-lg font-bold text-teal-400 mt-0.5">{report.validRows}</div>
                </div>
                <div className="p-3 bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg">
                  <div className="text-xs text-[#8E8E93]">Rows with Errors</div>
                  <div className={`text-lg font-bold mt-0.5 ${report.errorRows > 0 ? 'text-rose-400' : 'text-[#8E8E93]'}`}>
                    {report.errorRows}
                  </div>
                </div>
              </div>

              {/* Error List */}
              {report.errors.length > 0 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-rose-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Validation Errors ({report.errors.length}):</span>
                  </div>
                  <ul className="text-xs text-rose-300/80 space-y-1 max-h-36 overflow-y-auto pl-5 list-disc">
                    {report.errors.map((err, i) => (
                      <li key={i}>
                        <span className="font-semibold text-rose-300">Row {err.row}</span> ({err.field}): {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Duplicate Strategy Option */}
              <div className="p-4 bg-[#242426] border border-[#2C2C2E] rounded-lg space-y-3">
                <div className="text-xs font-medium text-[#E5E5EA]">Duplicate Handling Strategy</div>
                <div className="space-y-2 text-xs text-[#8E8E93]">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'overwrite'}
                      onChange={() => setDuplicateStrategy('overwrite')}
                      className="accent-teal-500"
                    />
                    <span>
                      <strong className="text-[#E5E5EA]">Overwrite:</strong> Update matching items by external_id and increment revision
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'skip'}
                      onChange={() => setDuplicateStrategy('skip')}
                      className="accent-teal-500"
                    />
                    <span>
                      <strong className="text-[#E5E5EA]">Skip:</strong> Keep existing items unchanged if external_id matches
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'create_new'}
                      onChange={() => setDuplicateStrategy('create_new')}
                      className="accent-teal-500"
                    />
                    <span>
                      <strong className="text-[#E5E5EA]">Create New:</strong> Always generate a new record regardless of external_id
                    </span>
                  </label>
                </div>
              </div>

              {/* Dry-Run Preview Table */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-[#E5E5EA]">Dry-Run Preview ({report.validRows} valid items)</div>
                <div className="border border-[#2C2C2E] rounded-lg overflow-x-auto max-h-56">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#242426] text-[#8E8E93] border-b border-[#2C2C2E]">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">External ID</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Value</th>
                        <th className="py-2 px-3">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2C2C2E] text-[#E5E5EA]">
                      {report.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#242426]/50">
                          <td className="py-2 px-3 font-medium">
                            {item.name}
                            {item.brand && <span className="text-[#8E8E93] ml-1 font-normal">({item.brand})</span>}
                          </td>
                          <td className="py-2 px-3 font-mono text-[#8E8E93] text-[11px]">
                            {item.external_id || '—'}
                          </td>
                          <td className="py-2 px-3 capitalize text-[#8E8E93]">{item.category}</td>
                          <td className="py-2 px-3 capitalize">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                item.status === 'owned'
                                  ? 'bg-teal-500/10 text-teal-400'
                                  : item.status === 'wanted'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-zinc-500/10 text-zinc-400'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {formatCurrency(
                              item.current_value || item.price_paid || 0,
                              settings.currencySymbol,
                              settings.numberGrouping
                            )}
                          </td>
                          <td className="py-2 px-3 text-[#8E8E93]">{item.location || '—'}</td>
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#2C2C2E] bg-[#161618]">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#8E8E93] hover:text-[#E5E5EA] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={!report || report.validRows === 0 || isProcessing}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-teal-600 hover:bg-teal-500 disabled:bg-[#2C2C2E] disabled:text-[#6B6B76] text-white rounded-md transition-colors"
            >
              {isProcessing ? (
                'Importing...'
              ) : (
                <>
                  <span>Import {report ? `${report.validRows} Items` : ''}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
