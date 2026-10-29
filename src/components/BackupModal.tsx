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
      <div className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4DED2]">
          <div>
            <h2 className="font-serif text-[20px] font-normal text-[#1F1B16]">Backups & Data</h2>
            <p className="text-[12px] text-[#6B645A]">Export archive ZIP (JSON + photos) & restore with dry-run</p>
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
          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 bg-[#F6F2EA] border border-[#3F6B4F]/30 rounded-[6px] text-xs text-[#3F6B4F] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Backup Health Bar */}
          <div className="p-4 bg-[#F6F2EA] border border-[#E4DED2] rounded-[6px] flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[#6B645A]">Last full backup</div>
              <div className="text-[13px] font-medium tabular-nums text-[#1F1B16] mt-0.5">
                {formatLastBackup(settings.lastBackupAt)}
              </div>
            </div>

            {backupOverdue && (
              <span className="text-[11px] font-medium text-[#9C3D2A] bg-[#FBF9F4] border border-[#9C3D2A]/30 px-2 py-0.5 rounded-[4px]">
                Weekly backup recommended
              </span>
            )}
          </div>

          {/* Section 1: Export Everything */}
          <div className="p-4 bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[16px] text-[#1F1B16]">Export Everything (ZIP)</h3>
                <p className="text-[12px] text-[#6B645A] mt-0.5">
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
          <div className="p-4 bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[16px] text-[#1F1B16]">Automatic Save Folder</h3>
                <p className="text-[12px] text-[#6B645A] mt-0.5">
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
              <div className="text-[12px] text-[#1F1B16] pt-1">
                Linked folder: <strong>{settings.autoBackupFolderName}</strong>
              </div>
            )}
          </div>

          {/* Section 3: Import Backup with Dry-Run Preview */}
          <div className="p-4 bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[16px] text-[#1F1B16]">Import Backup Archive</h3>
                <p className="text-[12px] text-[#6B645A] mt-0.5">
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
              <div className="pt-2 border-t border-[#E4DED2] space-y-3">
                {inspection.isValid ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] font-medium text-[#1F1B16]">
                        Inspection Preview
                      </div>
                      {inspection.dateExported && (
                        <div className="text-[11px] tabular-nums text-[#6B645A]">
                          Exported: {new Date(inspection.dateExported).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="p-2 bg-[#F6F2EA] rounded-[4px] border border-[#E4DED2]">
                        <span className="text-[#6B645A]">Items:</span>{' '}
                        <strong className="text-[#1F1B16] tabular-nums">{inspection.counts.items}</strong>
                      </div>
                      <div className="p-2 bg-[#F6F2EA] rounded-[4px] border border-[#E4DED2]">
                        <span className="text-[#6B645A]">Tasks:</span>{' '}
                        <strong className="text-[#1F1B16] tabular-nums">{inspection.counts.tasks}</strong>
                      </div>
                      <div className="p-2 bg-[#F6F2EA] rounded-[4px] border border-[#E4DED2]">
                        <span className="text-[#6B645A]">Habits:</span>{' '}
                        <strong className="text-[#1F1B16] tabular-nums">{inspection.counts.habits}</strong>
                      </div>
                      <div className="p-2 bg-[#F6F2EA] rounded-[4px] border border-[#E4DED2]">
                        <span className="text-[#6B645A]">Photos:</span>{' '}
                        <strong className="text-[#1F1B16] tabular-nums">{inspection.counts.photos}</strong>
                      </div>
                      <div className="p-2 bg-[#F6F2EA] rounded-[4px] border border-[#E4DED2]">
                        <span className="text-[#6B645A]">Days:</span>{' '}
                        <strong className="text-[#1F1B16] tabular-nums">{inspection.counts.dayRecords}</strong>
                      </div>
                      <div className="p-2 bg-[#F6F2EA] rounded-[4px] border border-[#E4DED2]">
                        <span className="text-[#6B645A]">XP Events:</span>{' '}
                        <strong className="text-[#1F1B16] tabular-nums">{inspection.counts.xpEvents}</strong>
                      </div>
                      <div className="p-2 bg-[#F6F2EA] rounded-[4px] border border-[#E4DED2]">
                        <span className="text-[#6B645A]">Body Stats:</span>{' '}
                        <strong className="text-[#1F1B16] tabular-nums">{inspection.counts.measurements}</strong>
                      </div>
                      <div className="p-2 bg-[#F6F2EA] rounded-[4px] border border-[#E4DED2]">
                        <span className="text-[#6B645A]">Skills:</span>{' '}
                        <strong className="text-[#1F1B16] tabular-nums">{inspection.counts.skills}</strong>
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
                  <div className="p-3 bg-[#F6F2EA] border border-[#9C3D2A]/30 rounded-[4px] text-xs text-[#9C3D2A] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{inspection.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E4DED2] bg-[#FBF9F4] flex justify-end">
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
