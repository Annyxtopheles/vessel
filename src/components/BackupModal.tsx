import React, { useState, useRef } from 'react';
import {
  X,
  Archive,
  Download,
  Upload,
  FolderPlus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  HardDrive,
  RefreshCw,
  FolderCheck,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1C1C1E] border border-[#2C2C2E] rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2C2C2E] flex items-center justify-center text-[#E5E5EA]">
              <Archive className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#E5E5EA]">Data & Backup Management</h2>
              <p className="text-xs text-[#8E8E93]">Export full archive ZIP (JSON + photos) & restore with dry-run</p>
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
          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-lg text-xs text-teal-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Backup Health Bar */}
          <div className="p-4 bg-[#242426] border border-[#2C2C2E] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  backupOverdue
                    ? 'bg-amber-500/10 text-amber-400'
                    : 'bg-teal-500/10 text-teal-400'
                }`}
              >
                {backupOverdue ? <Clock className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              </div>
              <div>
                <div className="text-xs text-[#8E8E93]">Last full backup:</div>
                <div className="text-sm font-medium text-[#E5E5EA]">
                  {formatLastBackup(settings.lastBackupAt)}
                </div>
              </div>
            </div>

            {backupOverdue && (
              <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded">
                Weekly backup recommended
              </span>
            )}
          </div>

          {/* Section 1: Export Everything */}
          <div className="p-4 bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-[#E5E5EA]">Export Everything (ZIP)</h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Packages all database tables, journal logs, habits, and full-resolution photos into a portable ZIP.
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium bg-teal-600 hover:bg-teal-500 disabled:bg-[#2C2C2E] text-white rounded-md transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Packing...' : 'Export ZIP'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Auto-Save Folder (File System Access API) */}
          <div className="p-4 bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-[#E5E5EA]">Automatic Save Folder</h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Link a local directory via File System Access API so backups write directly to your drive.
                </p>
              </div>
              <button
                onClick={handleSelectFolder}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#E5E5EA] rounded-md transition-colors shrink-0"
              >
                {settings.autoBackupFolderName ? (
                  <>
                    <FolderCheck className="w-4 h-4 text-teal-400" />
                    <span>Change Folder</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4" />
                    <span>Choose Folder</span>
                  </>
                )}
              </button>
            </div>
            {settings.autoBackupFolderName && (
              <div className="text-xs text-teal-400 flex items-center gap-1.5 pt-1">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Linked directory: <strong>{settings.autoBackupFolderName}</strong></span>
              </div>
            )}
          </div>

          {/* Section 3: Import Backup with Dry-Run Preview */}
          <div className="p-4 bg-[#1C1C1E] border border-[#2C2C2E] rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-[#E5E5EA]">Import Backup Archive</h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Select a previously exported .zip file to inspect its contents before applying.
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#E5E5EA] rounded-md transition-colors shrink-0"
              >
                <Upload className="w-4 h-4" />
                <span>Select ZIP</span>
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
              <div className="pt-2 border-t border-[#2C2C2E] space-y-3">
                {inspection.isValid ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-[#E5E5EA]">
                        Dry-Run Inspection Preview
                      </div>
                      {inspection.dateExported && (
                        <div className="text-[11px] text-[#8E8E93]">
                          Exported: {new Date(inspection.dateExported).toLocaleDateString()}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 bg-[#242426] rounded border border-[#2C2C2E]">
                        <span className="text-[#8E8E93]">Items:</span>{' '}
                        <strong className="text-teal-400">{inspection.counts.items}</strong>
                      </div>
                      <div className="p-2.5 bg-[#242426] rounded border border-[#2C2C2E]">
                        <span className="text-[#8E8E93]">Tasks:</span>{' '}
                        <strong className="text-teal-400">{inspection.counts.tasks}</strong>
                      </div>
                      <div className="p-2.5 bg-[#242426] rounded border border-[#2C2C2E]">
                        <span className="text-[#8E8E93]">Habits:</span>{' '}
                        <strong className="text-teal-400">{inspection.counts.habits}</strong>
                      </div>
                      <div className="p-2.5 bg-[#242426] rounded border border-[#2C2C2E]">
                        <span className="text-[#8E8E93]">Photos:</span>{' '}
                        <strong className="text-teal-400">{inspection.counts.photos}</strong>
                      </div>
                      <div className="p-2.5 bg-[#242426] rounded border border-[#2C2C2E]">
                        <span className="text-[#8E8E93]">Days:</span>{' '}
                        <strong className="text-teal-400">{inspection.counts.dayRecords}</strong>
                      </div>
                      <div className="p-2.5 bg-[#242426] rounded border border-[#2C2C2E]">
                        <span className="text-[#8E8E93]">XP Events:</span>{' '}
                        <strong className="text-teal-400">{inspection.counts.xpEvents}</strong>
                      </div>
                      <div className="p-2.5 bg-[#242426] rounded border border-[#2C2C2E]">
                        <span className="text-[#8E8E93]">Body Stats:</span>{' '}
                        <strong className="text-teal-400">{inspection.counts.measurements}</strong>
                      </div>
                      <div className="p-2.5 bg-[#242426] rounded border border-[#2C2C2E]">
                        <span className="text-[#8E8E93]">Skills:</span>{' '}
                        <strong className="text-teal-400">{inspection.counts.skills}</strong>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={handleApplyRestore}
                        disabled={isRestoring}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-amber-600 hover:bg-amber-500 disabled:bg-[#2C2C2E] text-white rounded-md transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                        <span>{isRestoring ? 'Restoring Database...' : 'Apply & Restore Data'}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{inspection.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2C2C2E] bg-[#161618] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-[#8E8E93] hover:text-[#E5E5EA] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
