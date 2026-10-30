import JSZip from 'jszip';
import { db } from './db';
import {
  itemRepo,
  photoRepo,
  questRepo,
  questEvidenceRepo,
  habitRepo,
  dayRecordRepo,
  wearEventRepo,
  xpEventRepo,
  skillRepo,
  measurementRepo,
  appearanceRepo,
  paletteRepo,
  personalityRepo,
  traitRepo,
  settingsRepo,
  profileRepo,
  reminderRepo,
  bucketListRepo,
  accountRepo,
  financeCategoryRepo,
  transactionRepo,
  savingsGoalRepo,
  debtRepo,
  netWorthSnapshotRepo,
} from '../repositories';
import type { PhotoRecord } from '../types';

export interface BackupCounts {
  items: number;
  tasks: number;
  habits: number;
  dayRecords: number;
  measurements: number;
  photos: number;
  xpEvents: number;
  skills: number;
  palette: number;
  personality: number;
  traits: number;
  reminders?: number;
  bucketList?: number;
  accounts?: number;
  transactions?: number;
  savingsGoals?: number;
  debts?: number;
}

export interface BackupInspectionResult {
  isValid: boolean;
  error?: string;
  counts: BackupCounts;
  dateExported?: string;
  parsedData?: Record<string, any>;
  photosList?: {
    id: string;
    fullBlob?: Blob;
    thumbBlob?: Blob;
    metadata: Partial<PhotoRecord>;
  }[];
}

/**
 * Checks if a backup is due (more than 7 days since last backup or never backed up)
 */
export function isBackupDue(lastBackupAt?: string): boolean {
  if (!lastBackupAt) return true;
  const lastTime = new Date(lastBackupAt).getTime();
  if (isNaN(lastTime)) return true;
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - lastTime > SEVEN_DAYS_MS;
}

/**
 * Export everything: full database JSON + all photo blobs compressed into a single ZIP
 */
export async function exportFullBackupZip(): Promise<{ filename: string; blob: Blob }> {
  const zip = new JSZip();

  // 1. Gather all entity datasets
  const [
    items,
    photos,
    quests,
    questEvidence,
    habits,
    dayRecords,
    wearEvents,
    xpEvents,
    skills,
    measurements,
    appearance,
    palette,
    personality,
    traits,
    settings,
    profile,
    reminders,
    bucketList,
    accounts,
    financeCategories,
    transactions,
    savingsGoals,
    debts,
    netWorthSnapshots,
  ] = await Promise.all([
    itemRepo.list(true),
    photoRepo.list(true),
    questRepo.list(true),
    questEvidenceRepo.list(true),
    habitRepo.list(true),
    dayRecordRepo.list(true),
    wearEventRepo.list(true),
    xpEventRepo.list(true),
    skillRepo.list(true),
    measurementRepo.list(true),
    appearanceRepo.list(true),
    paletteRepo.list(true),
    personalityRepo.list(true),
    traitRepo.list(true),
    settingsRepo.list(true),
    profileRepo.list(true),
    reminderRepo.list(true),
    bucketListRepo.list(true),
    accountRepo.list(true),
    financeCategoryRepo.list(true),
    transactionRepo.list(true),
    savingsGoalRepo.list(true),
    debtRepo.list(true),
    netWorthSnapshotRepo.list(true),
  ]);

  // Strip blobs from JSON metadata
  const photoMetadata = photos.map(({ fullBlob, thumbBlob, ...meta }) => meta);

  const exportPayload = {
    version: 3,
    exportedAt: new Date().toISOString(),
    appName: 'Vessel',
    data: {
      items,
      quests,
      questEvidence,
      habits,
      dayRecords,
      wearEvents,
      xpEvents,
      skills,
      measurements,
      appearance,
      palette,
      personality,
      traits,
      settings,
      profile,
      reminders,
      bucketList,
      accounts,
      financeCategories,
      transactions,
      savingsGoals,
      debts,
      netWorthSnapshots,
      photos: photoMetadata,
    },
  };

  zip.file('data.json', JSON.stringify(exportPayload, null, 2));

  // 2. Add photo blobs into photos/ directory inside the ZIP
  const photosFolder = zip.folder('photos');
  if (photosFolder) {
    for (const photo of photos) {
      if (photo.fullBlob) {
        photosFolder.file(`${photo.id}_full.webp`, photo.fullBlob);
      }
      if (photo.thumbBlob) {
        photosFolder.file(`${photo.id}_thumb.webp`, photo.thumbBlob);
      }
    }
  }

  // 3. Generate ZIP blob
  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const filename = `vessel-backup-${dateStr}.zip`;

  // 4. Update lastBackupAt timestamp in settings
  await settingsRepo.saveSettings({ lastBackupAt: new Date().toISOString() });

  // 5. If File System Access API directory handle exists, save a copy directly
  try {
    await saveBackupToFileSystem(zipBlob, filename);
  } catch (err) {
    console.warn('[Backup] Automatic File System Access save skipped or failed:', err);
  }

  return { filename, blob: zipBlob };
}

/**
 * Triggers a download of the ZIP file in browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Prompt user to select an automatic backup directory using File System Access API
 */
export async function chooseBackupFolder(): Promise<string | null> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('File System Access API is not supported in this browser.');
  }

  try {
    const dirHandle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
    });
    if (dirHandle && dirHandle.name) {
      await db.keyval.put({ key: 'backup_dir_handle', value: dirHandle });
      await settingsRepo.saveSettings({
        autoBackupFolderName: dirHandle.name,
        autoBackupEnabled: true,
      });
      return dirHandle.name;
    }
    return null;
  } catch (err: any) {
    if (err.name === 'AbortError') return null;
    throw err;
  }
}

/**
 * Save backup directly to previously selected directory via File System Access API
 */
async function saveBackupToFileSystem(blob: Blob, filename: string): Promise<boolean> {
  const rec = await db.keyval.get('backup_dir_handle');
  if (!rec || !rec.value) return false;

  const dirHandle = rec.value;
  // Verify permission
  const permission = await dirHandle.queryPermission({ mode: 'readwrite' });
  if (permission !== 'granted') {
    const requested = await dirHandle.requestPermission({ mode: 'readwrite' });
    if (requested !== 'granted') return false;
  }

  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(blob);
  await writable.close();
  return true;
}

/**
 * Inspect a backup ZIP file and provide a dry-run preview before applying
 */
export async function inspectBackupZip(file: File): Promise<BackupInspectionResult> {
  try {
    const zip = await JSZip.loadAsync(file);
    const dataFile = zip.file('data.json');
    if (!dataFile) {
      return {
        isValid: false,
        error: 'Invalid backup file: "data.json" missing from ZIP archive.',
        counts: {
          items: 0,
          tasks: 0,
          habits: 0,
          dayRecords: 0,
          measurements: 0,
          photos: 0,
          xpEvents: 0,
          skills: 0,
          palette: 0,
          personality: 0,
          traits: 0,
        },
      };
    }

    const jsonText = await dataFile.async('text');
    const parsed = JSON.parse(jsonText);
    const data = parsed.data || parsed;

    const items = Array.isArray(data.items) ? data.items : [];
    const quests = Array.isArray(data.quests) ? data.quests : [];
    const habits = Array.isArray(data.habits) ? data.habits : [];
    const dayRecords = Array.isArray(data.dayRecords)
      ? data.dayRecords
      : typeof data.dayRecords === 'object' && data.dayRecords !== null
      ? Object.values(data.dayRecords)
      : [];
    const measurements = Array.isArray(data.measurements) ? data.measurements : [];
    const photoMetas = Array.isArray(data.photos) ? data.photos : [];
    const xpEvents = Array.isArray(data.xpEvents) ? data.xpEvents : [];
    const skills = Array.isArray(data.skills) ? data.skills : [];
    const palette = Array.isArray(data.palette) ? data.palette : [];
    const personality = Array.isArray(data.personality) ? data.personality : [];
    const traits = Array.isArray(data.traits) ? data.traits : [];

    // Check photos stored in ZIP
    const photosList: {
      id: string;
      fullBlob?: Blob;
      thumbBlob?: Blob;
      metadata: Partial<PhotoRecord>;
    }[] = [];

    for (const meta of photoMetas) {
      const fullFile = zip.file(`photos/${meta.id}_full.webp`);
      const thumbFile = zip.file(`photos/${meta.id}_thumb.webp`);
      const fullBlob = fullFile ? await fullFile.async('blob') : undefined;
      const thumbBlob = thumbFile ? await thumbFile.async('blob') : undefined;

      photosList.push({
        id: meta.id,
        metadata: meta,
        fullBlob,
        thumbBlob,
      });
    }

    return {
      isValid: true,
      counts: {
        items: items.length,
        tasks: quests.length,
        habits: habits.length,
        dayRecords: dayRecords.length,
        measurements: measurements.length,
        photos: photoMetas.length,
        xpEvents: xpEvents.length,
        skills: skills.length,
        palette: palette.length,
        personality: personality.length,
        traits: traits.length,
        accounts: (data.accounts || []).length,
        transactions: (data.transactions || []).length,
        savingsGoals: (data.savingsGoals || []).length,
        debts: (data.debts || []).length,
      },
      dateExported: parsed.exportedAt,
      parsedData: data,
      photosList,
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `Failed to inspect backup file: ${err.message || 'Corrupted file'}`,
      counts: {
        items: 0,
        tasks: 0,
        habits: 0,
        dayRecords: 0,
        measurements: 0,
        photos: 0,
        xpEvents: 0,
        skills: 0,
        palette: 0,
        personality: 0,
        traits: 0,
        accounts: 0,
        transactions: 0,
        savingsGoals: 0,
        debts: 0,
      },
    };
  }
}

/**
 * Applies a verified backup to the IndexedDB database
 */
export async function restoreBackup(inspection: BackupInspectionResult): Promise<void> {
  if (!inspection.isValid || !inspection.parsedData) {
    throw new Error('Cannot restore an invalid backup.');
  }

  const { parsedData, photosList } = inspection;

  // Clear existing records and replace cleanly
  await Promise.all([
    itemRepo.clear(),
    questRepo.clear(),
    questEvidenceRepo.clear(),
    habitRepo.clear(),
    dayRecordRepo.clear(),
    wearEventRepo.clear(),
    xpEventRepo.clear(),
    skillRepo.clear(),
    measurementRepo.clear(),
    appearanceRepo.clear(),
    paletteRepo.clear(),
    personalityRepo.clear(),
    traitRepo.clear(),
    photoRepo.clear(),
    reminderRepo.clear(),
    bucketListRepo.clear(),
    accountRepo.clear(),
    financeCategoryRepo.clear(),
    transactionRepo.clear(),
    savingsGoalRepo.clear(),
    debtRepo.clear(),
    netWorthSnapshotRepo.clear(),
  ]);

  if (parsedData.items) await itemRepo.batchPut(parsedData.items);
  if (parsedData.quests) await questRepo.batchPut(parsedData.quests);
  if (parsedData.questEvidence) await questEvidenceRepo.batchPut(parsedData.questEvidence);
  if (parsedData.habits) await habitRepo.batchPut(parsedData.habits);
  if (parsedData.dayRecords) {
    const list = Array.isArray(parsedData.dayRecords)
      ? parsedData.dayRecords
      : Object.values(parsedData.dayRecords);
    await dayRecordRepo.batchPut(list);
  }
  if (parsedData.wearEvents) await wearEventRepo.batchPut(parsedData.wearEvents);
  if (parsedData.xpEvents) await xpEventRepo.batchPut(parsedData.xpEvents);
  if (parsedData.skills) await skillRepo.batchPut(parsedData.skills);
  if (parsedData.measurements) await measurementRepo.batchPut(parsedData.measurements);
  if (parsedData.appearance) await appearanceRepo.batchPut(parsedData.appearance);
  if (parsedData.palette) await paletteRepo.batchPut(parsedData.palette);
  if (parsedData.personality) await personalityRepo.batchPut(parsedData.personality);
  if (parsedData.traits) await traitRepo.batchPut(parsedData.traits);
  if (parsedData.settings) await settingsRepo.batchPut(parsedData.settings);
  if (parsedData.profile) await profileRepo.batchPut(parsedData.profile);
  if (parsedData.reminders) await reminderRepo.batchPut(parsedData.reminders);
  if (parsedData.bucketList) await bucketListRepo.batchPut(parsedData.bucketList);
  if (parsedData.accounts) await accountRepo.batchPut(parsedData.accounts);
  if (parsedData.financeCategories) await financeCategoryRepo.batchPut(parsedData.financeCategories);
  if (parsedData.transactions) await transactionRepo.batchPut(parsedData.transactions);
  if (parsedData.savingsGoals) await savingsGoalRepo.batchPut(parsedData.savingsGoals);
  if (parsedData.debts) await debtRepo.batchPut(parsedData.debts);
  if (parsedData.netWorthSnapshots) await netWorthSnapshotRepo.batchPut(parsedData.netWorthSnapshots);

  // Restore photos with reconstructed Blobs
  if (photosList && photosList.length > 0) {
    const fullPhotoRecords: PhotoRecord[] = [];
    for (const item of photosList) {
      if (item.fullBlob && item.thumbBlob) {
        fullPhotoRecords.push({
          ...(item.metadata as PhotoRecord),
          id: item.id,
          fullBlob: item.fullBlob,
          thumbBlob: item.thumbBlob,
          mimeType: (item.metadata as any).mimeType || 'image/webp',
          width: (item.metadata as any).width || 1200,
          height: (item.metadata as any).height || 1500,
          created_at: (item.metadata as any).created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          revision: (item.metadata as any).revision || 1,
        });
      }
    }
    if (fullPhotoRecords.length > 0) {
      await photoRepo.batchPut(fullPhotoRecords);
    }
  }

  // Update backup timestamp
  await settingsRepo.saveSettings({ lastBackupAt: new Date().toISOString() });
}
