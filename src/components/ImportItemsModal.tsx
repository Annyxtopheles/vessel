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
      <div className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4DED2]">
          <div>
            <h2 className="font-serif text-[20px] font-normal text-[#1F1B16]">Import Items</h2>
            <p className="text-[12px] text-[#6B645A]">JSON & CSV file import with idempotent reconciliation</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[4px] text-[#6B645A] hover:text-[#1F1B16] hover:bg-[#EFEAE0] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {importResult ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-[6px] bg-[#F6F2EA] border border-[#3F6B4F]/30 text-[#3F6B4F] flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-[18px] text-[#1F1B16]">Import Complete</h3>
                <p className="text-[13px] text-[#6B645A] mt-1">
                  Reconciled inventory records into local storage.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div className="p-3 bg-[#F6F2EA] border border-[#E4DED2] rounded-[6px]">
                  <div className="editorial-stat-num text-[22px]">{importResult.created}</div>
                  <div className="text-[11px] text-[#6B645A] mt-0.5">Created</div>
                </div>
                <div className="p-3 bg-[#F6F2EA] border border-[#E4DED2] rounded-[6px]">
                  <div className="editorial-stat-num text-[22px]">{importResult.updated}</div>
                  <div className="text-[11px] text-[#6B645A] mt-0.5">Updated</div>
                </div>
                <div className="p-3 bg-[#F6F2EA] border border-[#E4DED2] rounded-[6px]">
                  <div className="editorial-stat-num text-[22px]">{importResult.skipped}</div>
                  <div className="text-[11px] text-[#6B645A] mt-0.5">Skipped</div>
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
                className="border-2 border-dashed border-[#E4DED2] hover:border-[#1F1B16] bg-[#F6F2EA] rounded-[6px] p-8 text-center cursor-pointer transition-colors group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json,.csv"
                  className="hidden"
                />
                <div className="font-serif text-[16px] text-[#1F1B16]">
                  Select or drop a JSON / CSV file
                </div>
                <div className="text-[12px] text-[#6B645A] mt-1">
                  Conforming to the Vessel import format
                </div>
              </div>

              <div className="p-4 bg-[#F6F2EA] border border-[#E4DED2] rounded-[6px] text-[12px] text-[#6B645A] space-y-1.5">
                <div className="font-medium text-[#1F1B16]">
                  Schema Documentation & Samples
                </div>
                <p>
                  Reference specifications in <code className="text-[#1F1B16] bg-[#EFEAE0] px-1 py-0.5 rounded-[3px]">/docs/import-format.md</code> or sample items in <code className="text-[#1F1B16] bg-[#EFEAE0] px-1 py-0.5 rounded-[3px]">/data/import/sample-items.json</code>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 bg-[#F6F2EA] border border-[#E4DED2] rounded-[6px]">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#6B645A]" />
                  <span className="text-[12px] font-mono text-[#1F1B16]">{fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[12px] text-[#6B645A] hover:text-[#1F1B16] underline"
                >
                  Change file
                </button>
              </div>

              {/* Validation Summary Report */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[#F6F2EA] border border-[#E4DED2] rounded-[6px]">
                  <div className="text-[11px] text-[#6B645A]">Total Rows</div>
                  <div className="editorial-stat-num text-[20px] mt-0.5">{report.totalRows}</div>
                </div>
                <div className="p-3 bg-[#F6F2EA] border border-[#E4DED2] rounded-[6px]">
                  <div className="text-[11px] text-[#6B645A]">Valid Items</div>
                  <div className="editorial-stat-num text-[20px] text-[#3F6B4F] mt-0.5">{report.validRows}</div>
                </div>
                <div className="p-3 bg-[#F6F2EA] border border-[#E4DED2] rounded-[6px]">
                  <div className="text-[11px] text-[#6B645A]">Rows with Errors</div>
                  <div className={`editorial-stat-num text-[20px] mt-0.5 ${report.errorRows > 0 ? 'text-[#9C3D2A]' : 'text-[#6B645A]'}`}>
                    {report.errorRows}
                  </div>
                </div>
              </div>

              {/* Error List */}
              {report.errors.length > 0 && (
                <div className="p-4 bg-[#F6F2EA] border border-[#9C3D2A]/30 rounded-[6px] space-y-2">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-[#9C3D2A]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Validation Errors ({report.errors.length}):</span>
                  </div>
                  <ul className="text-[12px] text-[#9C3D2A] space-y-1 max-h-36 overflow-y-auto pl-5 list-disc">
                    {report.errors.map((err, i) => (
                      <li key={i}>
                        <span className="font-medium">Row {err.row}</span> ({err.field}): {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Duplicate Strategy Option */}
              <div className="p-4 bg-[#F6F2EA] border border-[#E4DED2] rounded-[6px] space-y-3">
                <div className="text-[12px] font-medium text-[#1F1B16]">Duplicate Handling Strategy</div>
                <div className="space-y-2 text-[12px] text-[#6B645A]">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'overwrite'}
                      onChange={() => setDuplicateStrategy('overwrite')}
                      className="accent-[#1F1B16]"
                    />
                    <span>
                      <strong className="text-[#1F1B16]">Overwrite:</strong> Update matching items by external_id and increment revision
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'skip'}
                      onChange={() => setDuplicateStrategy('skip')}
                      className="accent-[#1F1B16]"
                    />
                    <span>
                      <strong className="text-[#1F1B16]">Skip:</strong> Keep existing items unchanged if external_id matches
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="radio"
                      name="dupStrategy"
                      checked={duplicateStrategy === 'create_new'}
                      onChange={() => setDuplicateStrategy('create_new')}
                      className="accent-[#1F1B16]"
                    />
                    <span>
                      <strong className="text-[#1F1B16]">Create New:</strong> Always generate a new record regardless of external_id
                    </span>
                  </label>
                </div>
              </div>

              {/* Dry-Run Preview Table */}
              <div className="space-y-2">
                <div className="text-[12px] font-medium text-[#1F1B16]">Preview ({report.validRows} valid items)</div>
                <div className="border border-[#E4DED2] rounded-[6px] overflow-x-auto max-h-56 bg-[#FBF9F4]">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead className="bg-[#F6F2EA] text-[#6B645A] border-b border-[#E4DED2]">
                      <tr>
                        <th className="py-2 px-3">Name</th>
                        <th className="py-2 px-3">External ID</th>
                        <th className="py-2 px-3">Category</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Value</th>
                        <th className="py-2 px-3">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E4DED2] text-[#1F1B16]">
                      {report.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#F6F2EA]/60">
                          <td className="py-2 px-3 font-medium">
                            {item.name}
                            {item.brand && <span className="text-[#6B645A] ml-1 font-normal">({item.brand})</span>}
                          </td>
                          <td className="py-2 px-3 font-mono text-[#6B645A] text-[11px]">
                            {item.external_id || '—'}
                          </td>
                          <td className="py-2 px-3 capitalize text-[#6B645A]">{item.category}</td>
                          <td className="py-2 px-3 capitalize">
                            <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2]">
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
                          <td className="py-2 px-3 text-[#6B645A]">{item.location || '—'}</td>
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#E4DED2] bg-[#FBF9F4]">
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
