import React, { useState, useRef } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  exportFullBackupZip,
  downloadBlob,
  chooseBackupFolder,
  inspectBackupZip,
  restoreBackup,
  isBackupDue,
  type BackupInspectionResult,
} from '../services/backupService';
import type { AppSettings } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  onDataRestored: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onDataRestored,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [inspection, setInspection] = useState<BackupInspectionResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const backupOverdue = isBackupDue(settings.lastBackupAt);

  const handleExport = async () => {
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const { blob, filename } = await exportFullBackupZip();
      downloadBlob(blob, filename);
      setStatusMessage(`Backup successfully downloaded as ${filename}.`);
      onSettingsChange({
        ...settings,
        lastBackupAt: new Date().toISOString(),
      });
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const folderName = await chooseBackupFolder();
      if (folderName) {
        onSettingsChange({
          ...settings,
          autoBackupFolderName: folderName,
          autoBackupEnabled: true,
        });
        setStatusMessage(`Connected backup folder: ${folderName}`);
      }
    } catch (err: any) {
      alert(`Folder selection error: ${err.message}`);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);
    try {
      const result = await inspectBackupZip(file);
      setInspection(result);
    } catch (err: any) {
      alert(`Inspection error: ${err.message}`);
    }
  };

  const handleApplyRestore = async () => {
    if (!inspection || !inspection.isValid) return;
    if (
      !confirm(
        'Restoring this backup will replace current local database records with the backup data. Continue?'
      )
    ) {
      return;
    }

    setIsRestoring(true);
    try {
      await restoreBackup(inspection);
      onDataRestored();
      setStatusMessage('Backup restored successfully!');
    } catch (err: any) {
      alert(`Restore failed: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const formatLastBackup = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div>
            <h2 className="font-serif text-[20px] font-normal text-[#0F172A]">Backups & Data</h2>
            <p className="text-[12px] text-[#64748B]">Export archive ZIP (JSON + photos) & restore with dry-run</p>
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
          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 bg-[#F8FAFC] border border-[#059669]/30 rounded-[6px] text-xs text-[#059669] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Backup Health Bar */}
          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#64748B]">Last full backup</div>
              <div className="text-[13px] font-medium tabular-nums text-[#0F172A] mt-0.5">
                {formatLastBackup(settings.lastBackupAt)}
              </div>
            </div>

            {backupOverdue && (
              <span className="text-[11px] font-medium text-[#E11D48] bg-[#FFFFFF] border border-[#E11D48]/30 px-2 py-0.5 rounded-[4px]">
                Weekly backup recommended
              </span>
            )}
          </div>

          {/* Section 1: Export Everything */}
          <div className="p-4 bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[16px] text-[#0F172A]">Export Everything (ZIP)</h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  Packages all database tables, habits, and stored photos into a portable ZIP.
                </p>
              </div>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="editorial-btn-primary shrink-0"
              >
                {isExporting ? 'Packing...' : 'Export ZIP'}
              </button>
            </div>
          </div>

          {/* Section 2: Auto-Save Folder (File System Access API) */}
          <div className="p-4 bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[16px] text-[#0F172A]">Automatic Save Folder</h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  Link a local directory so backups write directly to your drive.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSelectFolder}
                className="editorial-btn-secondary shrink-0"
              >
                {settings.autoBackupFolderName ? 'Change Folder' : 'Choose Folder'}
              </button>
            </div>
            {settings.autoBackupFolderName && (
              <div className="text-[12px] text-[#0F172A] pt-1">
                Linked folder: <strong>{settings.autoBackupFolderName}</strong>
              </div>
            )}
          </div>

          {/* Section 3: Import Backup with Dry-Run Preview */}
          <div className="p-4 bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[16px] text-[#0F172A]">Import Backup Archive</h3>
                <p className="text-[12px] text-[#64748B] mt-0.5">
                  Select a previously exported .zip file to inspect before applying.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="editorial-btn-secondary shrink-0"
              >
                Select ZIP
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".zip"
                className="hidden"
              />
            </div>

            {/* Dry-run Inspection Preview */}
            {inspection && (
              <div className="pt-2 border-t border-[#E2E8F0] space-y-3">
                {inspection.isValid ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] font-medium text-[#0F172A]">
                        Inspection Preview
                      </div>
                      {inspection.dateExported && (
                        <div className="text-[11px] tabular-nums text-[#64748B]">
                          Exported: {new Date(inspection.dateExported).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="p-2 bg-[#F8FAFC] rounded-[4px] border border-[#E2E8F0]">
                        <span className="text-[#64748B]">Items:</span>{' '}
                        <strong className="text-[#0F172A] tabular-nums">{inspection.counts.items}</strong>
                      </div>
                      <div className="p-2 bg-[#F8FAFC] rounded-[4px] border border-[#E2E8F0]">
                        <span className="text-[#64748B]">Tasks:</span>{' '}
                        <strong className="text-[#0F172A] tabular-nums">{inspection.counts.tasks}</strong>
                      </div>
                      <div className="p-2 bg-[#F8FAFC] rounded-[4px] border border-[#E2E8F0]">
                        <span className="text-[#64748B]">Habits:</span>{' '}
                        <strong className="text-[#0F172A] tabular-nums">{inspection.counts.habits}</strong>
                      </div>
                      <div className="p-2 bg-[#F8FAFC] rounded-[4px] border border-[#E2E8F0]">
                        <span className="text-[#64748B]">Photos:</span>{' '}
                        <strong className="text-[#0F172A] tabular-nums">{inspection.counts.photos}</strong>
                      </div>
                      <div className="p-2 bg-[#F8FAFC] rounded-[4px] border border-[#E2E8F0]">
                        <span className="text-[#64748B]">Days:</span>{' '}
                        <strong className="text-[#0F172A] tabular-nums">{inspection.counts.dayRecords}</strong>
                      </div>
                      <div className="p-2 bg-[#F8FAFC] rounded-[4px] border border-[#E2E8F0]">
                        <span className="text-[#64748B]">XP Events:</span>{' '}
                        <strong className="text-[#0F172A] tabular-nums">{inspection.counts.xpEvents}</strong>
                      </div>
                      <div className="p-2 bg-[#F8FAFC] rounded-[4px] border border-[#E2E8F0]">
                        <span className="text-[#64748B]">Body Stats:</span>{' '}
                        <strong className="text-[#0F172A] tabular-nums">{inspection.counts.measurements}</strong>
                      </div>
                      <div className="p-2 bg-[#F8FAFC] rounded-[4px] border border-[#E2E8F0]">
                        <span className="text-[#64748B]">Skills:</span>{' '}
                        <strong className="text-[#0F172A] tabular-nums">{inspection.counts.skills}</strong>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleApplyRestore}
                        disabled={isRestoring}
                        className="editorial-btn-primary"
                      >
                        {isRestoring ? 'Restoring Database...' : 'Apply & Restore Data'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-[#F8FAFC] border border-[#E11D48]/30 rounded-[4px] text-xs text-[#E11D48] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{inspection.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#FFFFFF] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="editorial-btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
