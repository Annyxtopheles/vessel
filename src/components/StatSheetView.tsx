import React, { useState, useRef, useMemo } from 'react';
import type {
  BodyMeasurement,
  CharacterAppearance,
  PaletteColor,
  PersonalityEntry,
  CharacterTrait,
  MeasurementType,
  PaletteVerdict,
  TraitKind,
  AppSettings,
} from '../types';
import {
  Plus,
  Scale,
  Sparkles,
  Palette,
  Brain,
  Award,
  Trash2,
  Edit2,
  X,
  Upload,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { sfx } from '../utils/audio';
import { getTodayLocalDateStr } from '../utils/date';
import { getColorDistance } from '../utils/color';
import { CustomSelect } from './CustomSelect';

const MEASUREMENT_TYPE_OPTIONS = [
  { id: 'weight', label: 'Weight' },
  { id: 'height', label: 'Height' },
  { id: 'waist', label: 'Waist' },
  { id: 'chest', label: 'Chest' },
  { id: 'custom', label: 'Custom' },
];

const PALETTE_VERDICT_OPTIONS = [
  { id: 'suits', label: 'Suits You' },
  { id: 'neutral', label: 'Neutral' },
  { id: 'avoid', label: 'Avoid' },
];

const TRAIT_KIND_OPTIONS = [
  { id: 'strength', label: 'Core Strength' },
  { id: 'working_on', label: 'Working On' },
];

const TRAIT_LEVEL_OPTIONS = [
  { id: '1', label: 'Level 1 (Initiate)' },
  { id: '2', label: 'Level 2 (Developing)' },
  { id: '3', label: 'Level 3 (Competent)' },
  { id: '4', label: 'Level 4 (Strong)' },
  { id: '5', label: 'Level 5 (Mastered)' },
];

type ExtendedMetricType = MeasurementType | 'ratio';
type ChartRange = '30d' | '90d' | '1y' | 'all';

interface StatSheetViewProps {
  measurements: BodyMeasurement[];
  appearance: CharacterAppearance;
  palette: PaletteColor[];
  personality: PersonalityEntry[];
  traits: CharacterTrait[];
  settings: AppSettings;
  privacyMode?: boolean;
  onAddMeasurement: (m: Omit<BodyMeasurement, 'id'>) => void;
  onDeleteMeasurement: (id: string) => void;
  onUpdateAppearance: (app: CharacterAppearance) => void;
  onAddPaletteColor: (p: Omit<PaletteColor, 'id'>) => void;
  onUpdatePaletteColor: (p: PaletteColor) => void;
  onDeletePaletteColor: (id: string) => void;
  onAddPersonality: (p: Omit<PersonalityEntry, 'id'>) => void;
  onDeletePersonality: (id: string) => void;
  onAddTrait: (t: Omit<CharacterTrait, 'id'>) => void;
  onDeleteTrait: (id: string) => void;
}

export const StatSheetView: React.FC<StatSheetViewProps> = ({
  measurements,
  appearance,
  palette,
  personality,
  traits,
  settings,
  privacyMode = false,
  onAddMeasurement,
  onDeleteMeasurement,
  onUpdateAppearance,
  onAddPaletteColor,
  onUpdatePaletteColor: _onUpdatePaletteColor,
  onDeletePaletteColor,
  onAddPersonality,
  onDeletePersonality,
  onAddTrait,
  onDeleteTrait,
}) => {
  // Active chart metric type
  const [activeChartType, setActiveChartType] = useState<ExtendedMetricType>('weight');
  const [chartRange, setChartRange] = useState<ChartRange>('all');
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    date: string;
    rawVal: number;
    movingAvg: number;
    unit: string;
    note?: string;
  } | null>(null);

  // Modals
  const [isAddMeasurementOpen, setIsAddMeasurementOpen] = useState(false);
  const [isEditAppearanceOpen, setIsEditAppearanceOpen] = useState(false);
  const [isAddColorOpen, setIsAddColorOpen] = useState(false);
  const [isAddPersonalityOpen, setIsAddPersonalityOpen] = useState(false);
  const [isAddTraitOpen, setIsAddTraitOpen] = useState(false);

  // Form states - Measurement
  const [mType, setMType] = useState<MeasurementType>('weight');
  const [mCustomLabel, setMCustomLabel] = useState('');
  const [mValue, setMValue] = useState('');
  const [mUnit, setMUnit] = useState('kg');
  const [mDate, setMDate] = useState(getTodayLocalDateStr());
  const [mNote, setMNote] = useState('');

  // Form states - Appearance
  const [appSkinHex, setAppSkinHex] = useState(appearance.skinToneHex);
  const [appSkinNote, setAppSkinNote] = useState(appearance.skinToneNote || '');
  const [appHair, setAppHair] = useState(appearance.hair);
  const [appEye, setAppEye] = useState(appearance.eyeColor);
  const [appPhoto, setAppPhoto] = useState(appearance.photoUrl || '');
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Form states - Palette Color
  const [colorHex, setColorHex] = useState('#0891B2');
  const [colorLabel, setColorLabel] = useState('');
  const [colorVerdict, setColorVerdict] = useState<PaletteVerdict>('suits');
  const [colorNote, setColorNote] = useState('');

  // Form states - Personality
  const [persSystem, setPersSystem] = useState('MBTI');
  const [persResult, setPersResult] = useState('');
  const [persDate, setPersDate] = useState(getTodayLocalDateStr());
  const [persSource, setPersSource] = useState('');
  const [persNotes, setPersNotes] = useState('');

  // Form states - Traits
  const [traitName, setTraitName] = useState('');
  const [traitKind, setTraitKind] = useState<TraitKind>('strength');
  const [traitLevel, setTraitLevel] = useState(4);
  const [traitNote, setTraitNote] = useState('');

  const isImperial = settings.unitSystem === 'imperial';

  // Active records (non soft-deleted)
  const activeMeasurements = useMemo(() => measurements.filter((m) => !m.deletedAt), [measurements]);
  const activePalette = useMemo(() => palette.filter((p) => !p.deletedAt), [palette]);
  const activePersonality = useMemo(() => personality.filter((p) => !p.deletedAt), [personality]);
  const activeTraits = useMemo(() => traits.filter((t) => !t.deletedAt), [traits]);

  // Convert measurement display based on preference
  const formatMeasurementValue = (val: number, unit: string) => {
    if (isImperial) {
      if (unit === 'kg') return { val: (val * 2.20462).toFixed(1), unit: 'lbs' };
      if (unit === 'cm') return { val: (val / 2.54).toFixed(1), unit: 'in' };
    }
    return { val: val.toFixed(1), unit };
  };

  // Helper to get all entries for a standard type sorted by date
  const getEntriesForType = (type: MeasurementType) => {
    return activeMeasurements
      .filter((m) => m.type === type)
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const weightEntries = useMemo(() => getEntriesForType('weight'), [activeMeasurements]);
  const heightEntries = useMemo(() => getEntriesForType('height'), [activeMeasurements]);
  const waistEntries = useMemo(() => getEntriesForType('waist'), [activeMeasurements]);
  const chestEntries = useMemo(() => getEntriesForType('chest'), [activeMeasurements]);

  // Derived waist-to-chest ratios
  const ratioEntries = useMemo(() => {
    const list: { id: string; type: 'ratio'; value: number; unit: string; date: string; note?: string }[] = [];
    waistEntries.forEach((w) => {
      // Find chest measurement on the same date, or nearest chest
      const match = chestEntries.find((c) => c.date === w.date) || chestEntries[chestEntries.length - 1];
      if (match && match.value > 0) {
        list.push({
          id: `ratio-${w.id}`,
          type: 'ratio',
          value: parseFloat((w.value / match.value).toFixed(2)),
          unit: 'ratio',
          date: w.date,
          note: `Waist: ${w.value}cm / Chest: ${match.value}cm`,
        });
      }
    });
    return list;
  }, [waistEntries, chestEntries]);

  // Latest measurements
  const latestWeight = weightEntries[weightEntries.length - 1] || null;
  const prevWeight = weightEntries.length > 1 ? weightEntries[weightEntries.length - 2] : null;

  const latestHeight = heightEntries[heightEntries.length - 1] || null;
  const prevHeight = heightEntries.length > 1 ? heightEntries[heightEntries.length - 2] : null;

  const latestWaist = waistEntries[waistEntries.length - 1] || null;
  const prevWaist = waistEntries.length > 1 ? waistEntries[waistEntries.length - 2] : null;

  const latestChest = chestEntries[chestEntries.length - 1] || null;
  const prevChest = chestEntries.length > 1 ? chestEntries[chestEntries.length - 2] : null;

  const latestRatio = ratioEntries[ratioEntries.length - 1] || null;
  const prevRatio = ratioEntries.length > 1 ? ratioEntries[ratioEntries.length - 2] : null;

  // Active chart raw dataset
  const activeDataset = useMemo(() => {
    if (activeChartType === 'ratio') return ratioEntries;
    return activeMeasurements
      .filter((m) => m.type === activeChartType)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [activeMeasurements, activeChartType, ratioEntries]);

  // Apply Range filter (30d / 90d / 1y / all)
  const rangeFilteredData = useMemo(() => {
    if (activeDataset.length === 0 || chartRange === 'all') return activeDataset;
    const latestDate = new Date(activeDataset[activeDataset.length - 1].date).getTime();
    const daysMap = { '30d': 30, '90d': 90, '1y': 365 };
    const cutoffTime = latestDate - daysMap[chartRange] * 86400000;
    const filtered = activeDataset.filter((item) => new Date(item.date).getTime() >= cutoffTime);
    return filtered.length > 0 ? filtered : activeDataset;
  }, [activeDataset, chartRange]);

  // Compute 7-day Moving Average for each point in rangeFilteredData
  const chartPointsWithMA = useMemo(() => {
    return rangeFilteredData.map((pt) => {
      const ptTime = new Date(pt.date).getTime();
      const windowStart = ptTime - 7 * 86400000;
      // Find all points in the entire dataset within the [windowStart, ptTime]
      const windowPts = activeDataset.filter((p) => {
        const t = new Date(p.date).getTime();
        return t >= windowStart && t <= ptTime;
      });
      const avg =
        windowPts.length > 0
          ? windowPts.reduce((acc, curr) => acc + curr.value, 0) / windowPts.length
          : pt.value;
      return {
        ...pt,
        movingAvg: avg,
      };
    });
  }, [rangeFilteredData, activeDataset]);

  // Sparkline generator
  const renderSparkline = (dataPoints: number[]) => {
    if (dataPoints.length < 2) {
      return <div className="w-12 h-4 bg-[#ECECF0] rounded-sm opacity-60" />;
    }
    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const span = max - min || 1;
    const width = 48;
    const height = 18;

    const points = dataPoints
      .map((val, idx) => {
        const x = (idx / (dataPoints.length - 1)) * (width - 4) + 2;
        const y = height - 2 - ((val - min) / span) * (height - 4);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const lastVal = dataPoints[dataPoints.length - 1];
    const lastY = height - 2 - ((lastVal - min) / span) * (height - 4);

    return (
      <svg className="w-12 h-5 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke="#0891B2"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <circle cx={width - 2} cy={lastY} r="2" fill="#0891B2" />
      </svg>
    );
  };

  // Delta calculation for a metric card
  const getDeltaBadge = (latest: number | null, prev: number | null, unit: string) => {
    if (latest === null || prev === null) return null;
    const diff = latest - prev;
    if (Math.abs(diff) < 0.01) {
      return <span className="text-[11px] text-[#6B6B76] font-medium">No change</span>;
    }
    const sign = diff > 0 ? '+' : '';
    return (
      <span className="text-[11px] text-[#6B6B76] font-semibold flex items-center gap-1">
        {diff > 0 ? <TrendingUp className="w-3 h-3 text-[#6B6B76]" /> : <TrendingDown className="w-3 h-3 text-[#6B6B76]" />}
        <span>
          {sign}
          {diff.toFixed(1)} {unit}
        </span>
      </span>
    );
  };

  // Overall chart delta evaluation (Neutral by default, colored relative to target if set in Settings)
  const chartDeltaInfo = useMemo(() => {
    if (chartPointsWithMA.length < 2) return null;
    const first = chartPointsWithMA[0].value;
    const current = chartPointsWithMA[chartPointsWithMA.length - 1].value;
    const diff = current - first;
    const unit = chartPointsWithMA[0].unit;

    // Delta color logic:
    // If user set targetWeightKg in settings AND current metric is weight:
    let colorClass = 'text-[#6B6B76]';
    if (activeChartType === 'weight' && settings.targetWeightKg !== undefined) {
      const target = settings.targetWeightKg;
      const initialDist = Math.abs(first - target);
      const currentDist = Math.abs(current - target);
      if (currentDist < initialDist) {
        colorClass = 'text-[#16A34A]'; // Getting closer to target
      } else if (currentDist > initialDist) {
        colorClass = 'text-[#DC2626]'; // Moving farther from target
      }
    }

    return {
      diff,
      text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} ${unit}`,
      colorClass,
    };
  }, [chartPointsWithMA, activeChartType, settings.targetWeightKg]);

  // Color Palette Proximity Warnings (flag when two swatches have distance < 35)
  const paletteSimilarityWarnings = useMemo(() => {
    const warnings: Record<string, string> = {};
    for (let i = 0; i < activePalette.length; i++) {
      for (let j = 0; j < activePalette.length; j++) {
        if (i !== j) {
          const dist = getColorDistance(activePalette[i].colorHex, activePalette[j].colorHex);
          if (dist < 35) {
            warnings[activePalette[i].id] = `Very similar to ${activePalette[j].label}`;
            break;
          }
        }
      }
    }
    return warnings;
  }, [activePalette]);

  // Metric title for the chart
  const activeMetricTitle = useMemo(() => {
    if (activeChartType === 'weight') return 'Weight';
    if (activeChartType === 'height') return 'Height';
    if (activeChartType === 'waist') return 'Waist';
    if (activeChartType === 'chest') return 'Chest';
    if (activeChartType === 'ratio') return 'Waist-to-Chest Ratio';
    return 'Custom Metric';
  }, [activeChartType]);

  // Handle Add Measurement Submit
  const handleSaveMeasurement = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(mValue);
    if (isNaN(val)) return;

    onAddMeasurement({
      type: mType,
      customLabel: mType === 'custom' ? mCustomLabel.trim() : undefined,
      value: val,
      unit: mUnit.trim() || (mType === 'weight' ? 'kg' : 'cm'),
      date: mDate,
      note: mNote.trim() || undefined,
    });

    setMValue('');
    setMNote('');
    setIsAddMeasurementOpen(false);
    sfx.playClick();
  };

  // Handle Save Appearance
  const handleSaveAppearance = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAppearance({
      ...appearance,
      skinToneHex: appSkinHex,
      skinToneNote: appSkinNote.trim() || undefined,
      hair: appHair.trim(),
      eyeColor: appEye.trim(),
      photoUrl: appPhoto || undefined,
      updatedAt: getTodayLocalDateStr(),
    });
    setIsEditAppearanceOpen(false);
    sfx.playClick();
  };

  // Handle Add Palette Color
  const handleSaveColor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colorLabel.trim()) return;

    onAddPaletteColor({
      colorHex,
      label: colorLabel.trim(),
      verdict: colorVerdict,
      note: colorNote.trim() || undefined,
    });

    setColorLabel('');
    setColorNote('');
    setIsAddColorOpen(false);
    sfx.playClick();
  };

  // Handle Add Personality
  const handleSavePersonality = (e: React.FormEvent) => {
    e.preventDefault();
    if (!persResult.trim()) return;

    onAddPersonality({
      system: persSystem.trim(),
      result: persResult.trim(),
      dateTaken: persDate,
      source: persSource.trim() || undefined,
      notes: persNotes.trim() || undefined,
    });

    setPersResult('');
    setPersNotes('');
    setPersSource('');
    setIsAddPersonalityOpen(false);
    sfx.playClick();
  };

  // Handle Add Trait
  const handleSaveTrait = (e: React.FormEvent) => {
    e.preventDefault();
    if (!traitName.trim()) return;

    onAddTrait({
      name: traitName.trim(),
      kind: traitKind,
      level: traitLevel,
      note: traitNote.trim() || undefined,
    });

    setTraitName('');
    setTraitNote('');
    setIsAddTraitOpen(false);
    sfx.playClick();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAppPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. MEASUREMENTS & DYNAMIC CHART */}
      <div className="ship-card p-6 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ECECF0]">
          <div className="flex items-center gap-2.5">
            <div className="ship-icon-tile">
              <Scale className="w-4 h-4 text-[#0891B2]" />
            </div>
            <h3 className="text-base font-semibold text-[#111113]">Measurements</h3>
          </div>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setIsAddMeasurementOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-center transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Measurement</span>
          </button>
        </div>

        {/* 5 Stat Cards (Weight, Height, Waist, Chest, Waist-to-Chest Ratio) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Card 1: Weight */}
          <div
            onClick={() => {
              sfx.playClick();
              setActiveChartType('weight');
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeChartType === 'weight'
                ? 'bg-[#E6F7F9]/40 border-[#0891B2] ring-2 ring-[#0891B2]/20 shadow-xs'
                : 'bg-white border-[#ECECF0] hover:border-[#BEBEC6]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider">Weight</span>
              {renderSparkline(weightEntries.map((e) => e.value))}
            </div>
            <div className="mt-2">
              <div
                className={`text-xl font-bold text-[#111113] tracking-tight ${
                  privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
                }`}
              >
                {latestWeight ? `${formatMeasurementValue(latestWeight.value, latestWeight.unit).val} ${formatMeasurementValue(latestWeight.value, latestWeight.unit).unit}` : '—'}
              </div>
              <div className="mt-1">
                {getDeltaBadge(
                  latestWeight ? latestWeight.value : null,
                  prevWeight ? prevWeight.value : null,
                  latestWeight ? formatMeasurementValue(latestWeight.value, latestWeight.unit).unit : ''
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Height */}
          <div
            onClick={() => {
              sfx.playClick();
              setActiveChartType('height');
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeChartType === 'height'
                ? 'bg-[#E6F7F9]/40 border-[#0891B2] ring-2 ring-[#0891B2]/20 shadow-xs'
                : 'bg-white border-[#ECECF0] hover:border-[#BEBEC6]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider">Height</span>
              {renderSparkline(heightEntries.map((e) => e.value))}
            </div>
            <div className="mt-2">
              <div
                className={`text-xl font-bold text-[#111113] tracking-tight ${
                  privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
                }`}
              >
                {latestHeight ? `${formatMeasurementValue(latestHeight.value, latestHeight.unit).val} ${formatMeasurementValue(latestHeight.value, latestHeight.unit).unit}` : '—'}
              </div>
              <div className="mt-1">
                {getDeltaBadge(
                  latestHeight ? latestHeight.value : null,
                  prevHeight ? prevHeight.value : null,
                  latestHeight ? formatMeasurementValue(latestHeight.value, latestHeight.unit).unit : ''
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Waist */}
          <div
            onClick={() => {
              sfx.playClick();
              setActiveChartType('waist');
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeChartType === 'waist'
                ? 'bg-[#E6F7F9]/40 border-[#0891B2] ring-2 ring-[#0891B2]/20 shadow-xs'
                : 'bg-white border-[#ECECF0] hover:border-[#BEBEC6]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider">Waist</span>
              {renderSparkline(waistEntries.map((e) => e.value))}
            </div>
            <div className="mt-2">
              <div
                className={`text-xl font-bold text-[#111113] tracking-tight ${
                  privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
                }`}
              >
                {latestWaist ? `${formatMeasurementValue(latestWaist.value, latestWaist.unit).val} ${formatMeasurementValue(latestWaist.value, latestWaist.unit).unit}` : '—'}
              </div>
              <div className="mt-1">
                {getDeltaBadge(
                  latestWaist ? latestWaist.value : null,
                  prevWaist ? prevWaist.value : null,
                  latestWaist ? formatMeasurementValue(latestWaist.value, latestWaist.unit).unit : ''
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Chest */}
          <div
            onClick={() => {
              sfx.playClick();
              setActiveChartType('chest');
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeChartType === 'chest'
                ? 'bg-[#E6F7F9]/40 border-[#0891B2] ring-2 ring-[#0891B2]/20 shadow-xs'
                : 'bg-white border-[#ECECF0] hover:border-[#BEBEC6]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider">Chest</span>
              {renderSparkline(chestEntries.map((e) => e.value))}
            </div>
            <div className="mt-2">
              <div
                className={`text-xl font-bold text-[#111113] tracking-tight ${
                  privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
                }`}
              >
                {latestChest ? `${formatMeasurementValue(latestChest.value, latestChest.unit).val} ${formatMeasurementValue(latestChest.value, latestChest.unit).unit}` : '—'}
              </div>
              <div className="mt-1">
                {getDeltaBadge(
                  latestChest ? latestChest.value : null,
                  prevChest ? prevChest.value : null,
                  latestChest ? formatMeasurementValue(latestChest.value, latestChest.unit).unit : ''
                )}
              </div>
            </div>
          </div>

          {/* Card 5: Derived Waist-to-Chest Ratio */}
          <div
            onClick={() => {
              sfx.playClick();
              setActiveChartType('ratio');
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between col-span-2 md:col-span-1 ${
              activeChartType === 'ratio'
                ? 'bg-[#E6F7F9]/40 border-[#0891B2] ring-2 ring-[#0891B2]/20 shadow-xs'
                : 'bg-white border-[#ECECF0] hover:border-[#BEBEC6]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider">Waist / Chest</span>
              {renderSparkline(ratioEntries.map((e) => e.value))}
            </div>
            <div className="mt-2">
              <div
                className={`text-xl font-bold text-[#111113] tracking-tight ${
                  privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
                }`}
              >
                {latestRatio ? latestRatio.value.toFixed(2) : '—'}
              </div>
              <div className="mt-1">
                {latestRatio && prevRatio ? (
                  <span className="text-[11px] text-[#6B6B76] font-semibold flex items-center gap-1">
                    {latestRatio.value > prevRatio.value ? (
                      <TrendingUp className="w-3 h-3 text-[#6B6B76]" />
                    ) : latestRatio.value < prevRatio.value ? (
                      <TrendingDown className="w-3 h-3 text-[#6B6B76]" />
                    ) : null}
                    <span>
                      {latestRatio.value >= prevRatio.value ? '+' : ''}
                      {(latestRatio.value - prevRatio.value).toFixed(2)} ratio
                    </span>
                  </span>
                ) : (
                  <span className="text-[11px] text-[#9A9AA5]">Computed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Chart Container (No grey inset container) */}
        <div className="space-y-4 pt-2">
          {/* Chart Header Bar: Title, Legend, Delta & Range Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#ECECF0]">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#111113] tracking-tight">
                {activeMetricTitle}
              </span>

              {/* Legend */}
              <div className="flex items-center gap-2.5 text-[11px] text-[#6B6B76] font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0891B2]" />
                  <span>Raw</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 border-t-2 border-dashed border-[#2563EB]" />
                  <span>7d Moving Avg</span>
                </span>
              </div>

              {/* Delta Badge */}
              {chartDeltaInfo && (
                <span className={`text-xs font-semibold ${chartDeltaInfo.colorClass}`}>
                  {chartDeltaInfo.text}
                </span>
              )}
            </div>

            {/* Range Toggle: 30d / 90d / 1y / All */}
            <div className="inline-flex p-0.5 bg-[#ECECF0] rounded-lg self-start sm:self-auto">
              {(['30d', '90d', '1y', 'all'] as ChartRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setChartRange(r);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    chartRange === r
                      ? 'bg-white text-[#111113] shadow-xs'
                      : 'text-[#6B6B76] hover:text-[#111113]'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Canvas & Tooltip */}
          {chartPointsWithMA.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-xs text-[#9A9AA5]">
              No entries logged for {activeMetricTitle.toLowerCase()}. Click "Add Measurement" to record.
            </div>
          ) : (
            <div
              className={`relative w-full ${
                privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
              }`}
            >
              {/* Responsive SVG Chart */}
              <div className="h-56 sm:h-64 w-full relative">
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 600 200"
                  preserveAspectRatio="none"
                >
                  {(() => {
                    const allVals = chartPointsWithMA.flatMap((p) => [p.value, p.movingAvg]);
                    const rawMin = Math.min(...allVals);
                    const rawMax = Math.max(...allVals);
                    const margin = (rawMax - rawMin) * 0.1 || 1;
                    const min = rawMin - margin;
                    const max = rawMax + margin;
                    const span = max - min || 1;

                    // Plot coordinates
                    const leftPad = 48;
                    const rightPad = 590;
                    const plotWidth = rightPad - leftPad;
                    const topPad = 15;
                    const bottomPad = 185;
                    const plotHeight = bottomPad - topPad;

                    // 4 Horizontal Gridlines & Y-Axis labels
                    const gridSteps = [0, 0.33, 0.66, 1];
                    const gridlines = gridSteps.map((fraction) => {
                      const y = bottomPad - fraction * plotHeight;
                      const val = min + fraction * span;
                      return { y, val };
                    });

                    // Points mapping
                    const mapped = chartPointsWithMA.map((p, idx) => {
                      const x =
                        chartPointsWithMA.length === 1
                          ? leftPad + plotWidth / 2
                          : leftPad + (idx / (chartPointsWithMA.length - 1)) * plotWidth;
                      const yRaw = bottomPad - ((p.value - min) / span) * plotHeight;
                      const yMA = bottomPad - ((p.movingAvg - min) / span) * plotHeight;
                      return { x, yRaw, yMA, ...p };
                    });

                    // Path strings
                    const rawPathStr = mapped
                      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yRaw.toFixed(1)}`)
                      .join(' ');

                    const maPathStr = mapped
                      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yMA.toFixed(1)}`)
                      .join(' ');

                    return (
                      <g>
                        {/* Horizontal Gridlines & Y-Axis Labels */}
                        {gridlines.map((gl, i) => (
                          <g key={i}>
                            <line
                              x1={leftPad}
                              y1={gl.y}
                              x2={rightPad}
                              y2={gl.y}
                              stroke="#ECECF0"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={leftPad - 8}
                              y={gl.y + 3.5}
                              textAnchor="end"
                              fontSize="10"
                              fill="#9A9AA5"
                              fontFamily="sans-serif"
                            >
                              {gl.val.toFixed(1)}
                            </text>
                          </g>
                        ))}

                        {/* Raw Area Fill */}
                        <path
                          d={`${rawPathStr} L ${mapped[mapped.length - 1].x.toFixed(1)} ${bottomPad} L ${mapped[0].x.toFixed(1)} ${bottomPad} Z`}
                          fill="#0891B2"
                          fillOpacity="0.06"
                        />

                        {/* 7d Moving Average Line (dashed) */}
                        <path
                          d={maPathStr}
                          fill="none"
                          stroke="#2563EB"
                          strokeWidth="2"
                          strokeDasharray="4 3"
                          strokeLinecap="round"
                        />

                        {/* Raw Points Line */}
                        <path
                          d={rawPathStr}
                          fill="none"
                          stroke="#0891B2"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Interactive Data Circles */}
                        {mapped.map((p) => (
                          <g key={p.id}>
                            {/* Visual Point */}
                            <circle
                              cx={p.x}
                              cy={p.yRaw}
                              r="4"
                              fill="#FFFFFF"
                              stroke="#0891B2"
                              strokeWidth="2"
                            />
                            {/* Transparent Touch / Hover Target */}
                            <circle
                              cx={p.x}
                              cy={p.yRaw}
                              r="14"
                              fill="transparent"
                              className="cursor-pointer"
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                if (rect) {
                                  const pctX = (p.x / 600) * rect.width;
                                  const pctY = (p.yRaw / 200) * rect.height;
                                  setHoveredPoint({
                                    x: pctX,
                                    y: pctY,
                                    date: p.date,
                                    rawVal: p.value,
                                    movingAvg: p.movingAvg,
                                    unit: p.unit,
                                    note: p.note,
                                  });
                                }
                              }}
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          </g>
                        ))}
                      </g>
                    );
                  })()}
                </svg>

                {/* Floating Tooltip Box */}
                {hoveredPoint && (
                  <div
                    style={{
                      left: `${hoveredPoint.x}px`,
                      top: `${Math.max(10, hoveredPoint.y - 70)}px`,
                    }}
                    className="absolute -translate-x-1/2 pointer-events-none z-30 bg-[#111113] text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 animate-in fade-in zoom-in-95 min-w-[140px]"
                  >
                    <div className="font-semibold text-white/90 border-b border-white/10 pb-1">
                      {hoveredPoint.date}
                    </div>
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="text-[#0891B2] font-semibold">Raw:</span>
                      <span className="font-mono">
                        {hoveredPoint.rawVal.toFixed(1)} {hoveredPoint.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="text-[#3B82F6] font-semibold">7d Avg:</span>
                      <span className="font-mono">
                        {hoveredPoint.movingAvg.toFixed(1)} {hoveredPoint.unit}
                      </span>
                    </div>
                    {hoveredPoint.note && (
                      <div className="text-[10px] text-white/70 italic pt-0.5 border-t border-white/10">
                        "{hoveredPoint.note}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* X-Axis Timeline Dates */}
              <div className="flex items-center justify-between text-[11px] text-[#9A9AA5] mt-2 px-12">
                <span>{chartPointsWithMA[0].date}</span>
                {chartPointsWithMA.length > 2 && (
                  <span>{chartPointsWithMA[Math.floor(chartPointsWithMA.length / 2)].date}</span>
                )}
                <span>{chartPointsWithMA[chartPointsWithMA.length - 1].date}</span>
              </div>
            </div>
          )}

          {/* Recent Entries List - Fixed in Normal Flow (No Overlap) */}
          <div className="mt-6 pt-4 border-t border-[#ECECF0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#111113] uppercase tracking-wider">
                Recent Entries ({activeDataset.length})
              </span>
              <span className="text-[11px] text-[#6B6B76]">Showing latest records</span>
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {activeDataset.slice(-6).reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-white border border-[#ECECF0] hover:border-[#BEBEC6] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-[#111113]">
                      {entry.value} {entry.unit}
                    </span>
                    {entry.note && (
                      <span className="text-[#6B6B76] text-[11px] truncate max-w-[200px] sm:max-w-xs">
                        ({entry.note})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 text-[#9A9AA5] text-[11px]">
                    <span>{entry.date}</span>
                    {activeChartType !== 'ratio' && (
                      <button
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          onDeleteMeasurement(entry.id);
                        }}
                        className="hover:text-[#DC2626] transition-colors p-0.5 cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. APPEARANCE & 3. COLOR PALETTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Appearance Card */}
        <div className="ship-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0]">
            <div className="flex items-center gap-2">
              <div className="ship-icon-tile">
                <Sparkles className="w-4 h-4 text-[#0891B2]" />
              </div>
              <h3 className="text-sm font-semibold text-[#111113]">Appearance</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setIsEditAppearanceOpen(true);
              }}
              className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors cursor-pointer"
              title="Edit Appearance"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Avatar Photo Preview */}
            <div className="flex items-center gap-3">
              <img
                src={appearance.photoUrl || '/avatar.jpg'}
                alt="Portrait"
                className="w-14 h-14 rounded-2xl object-cover border border-[#ECECF0] shadow-xs flex-shrink-0"
              />
              <div>
                <div className="text-xs font-semibold text-[#111113]">Portrait Profile</div>
                <div className="text-[11px] text-[#6B6B76]">Visual reference</div>
              </div>
            </div>

            {/* Skin tone swatch */}
            <div className="p-3 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider block">
                  Skin Tone
                </span>
                <span className="text-xs font-medium text-[#111113]">
                  {appearance.skinToneNote || 'Olive Undertone'}
                </span>
              </div>
              <div
                className="w-7 h-7 rounded-full border border-black/10 shadow-xs"
                style={{ backgroundColor: appearance.skinToneHex }}
              />
            </div>

            {/* Hair & Eyes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F4F4F6] border border-[#ECECF0]">
                <span className="text-[10px] font-semibold text-[#6B6B76] uppercase tracking-wider block mb-0.5">
                  Hair
                </span>
                <span className="font-medium text-[#111113] block truncate">{appearance.hair}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F4F4F6] border border-[#ECECF0]">
                <span className="text-[10px] font-semibold text-[#6B6B76] uppercase tracking-wider block mb-0.5">
                  Eye Color
                </span>
                <span className="font-medium text-[#111113] block truncate">{appearance.eyeColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette Card (lg:col-span-2) */}
        <div className="ship-card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0]">
            <div className="flex items-center gap-2">
              <div className="ship-icon-tile">
                <Palette className="w-4 h-4 text-[#0891B2]" />
              </div>
              <h3 className="text-sm font-semibold text-[#111113]">Color Palette</h3>
            </div>

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setIsAddColorOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Swatch</span>
            </button>
          </div>

          {/* Verdict Groups Navigation Summary at Top of Section */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#16A34A] bg-[#E6F6EC]">
              Suits You ({activePalette.filter((p) => p.verdict === 'suits').length})
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#6B6B76] bg-[#F4F4F6]">
              Neutral ({activePalette.filter((p) => p.verdict === 'neutral').length})
            </span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold text-[#DC2626] bg-[#FDECEC]">
              Avoid ({activePalette.filter((p) => p.verdict === 'avoid').length})
            </span>
          </div>

          {/* Grouped Swatches Grid */}
          <div className="space-y-4">
            {(['suits', 'neutral', 'avoid'] as PaletteVerdict[]).map((verdict) => {
              const swatches = activePalette.filter((p) => p.verdict === verdict);
              if (swatches.length === 0) return null;

              const verdictBadge = {
                suits: { label: 'Suits You', color: 'text-[#16A34A] bg-[#E6F6EC]' },
                neutral: { label: 'Neutral', color: 'text-[#6B6B76] bg-[#F4F4F6]' },
                avoid: { label: 'Avoid', color: 'text-[#DC2626] bg-[#FDECEC]' },
              }[verdict];

              return (
                <div key={verdict} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${verdictBadge.color}`}>
                      {verdictBadge.label}
                    </span>
                    <span className="text-[11px] text-[#9A9AA5]">({swatches.length})</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {swatches.map((item) => {
                      const warning = paletteSimilarityWarnings[item.id];

                      return (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl border border-[#ECECF0] bg-white flex flex-col justify-between gap-1.5 shadow-2xs group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-6 h-6 rounded-lg border border-black/10 flex-shrink-0 shadow-2xs"
                                style={{ backgroundColor: item.colorHex }}
                                title={item.colorHex}
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-[#111113] block truncate">
                                  {item.label}
                                </span>
                                <span className="text-[10px] text-[#6B6B76] font-mono block">
                                  {item.colorHex}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onDeletePaletteColor(item.id)}
                              className="p-1 rounded text-[#9A9AA5] hover:text-[#DC2626] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Delete color"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Similarity Proximity Warning */}
                          {warning && (
                            <div className="text-[10px] text-[#DC2626] bg-[#FDECEC] px-1.5 py-0.5 rounded flex items-center gap-1 font-medium truncate">
                              <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{warning}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. PERSONALITY & 5. TRAITS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Personality Profiling */}
        <div className="ship-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0]">
            <div className="flex items-center gap-2">
              <div className="ship-icon-tile">
                <Brain className="w-4 h-4 text-[#0891B2]" />
              </div>
              <h3 className="text-sm font-semibold text-[#111113]">Personality</h3>
            </div>

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setIsAddPersonalityOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Assessment</span>
            </button>
          </div>

          <div className="space-y-3">
            {activePersonality.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-[#ECECF0] bg-[#F4F4F6]/60 flex items-start justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold px-2 py-0.5 rounded-md bg-white border border-[#ECECF0] text-[#0891B2]">
                      {p.system}
                    </span>
                    <span className="font-bold text-[#111113]">{p.result}</span>
                    <span className="text-[11px] text-[#9A9AA5]">{p.dateTaken}</span>
                  </div>
                  {p.notes && <p className="text-[#6B6B76] text-[11px] mt-1">{p.notes}</p>}
                  {p.source && (
                    <span className="text-[10px] text-[#0891B2] font-medium block mt-1 truncate">
                      Source: {p.source}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onDeletePersonality(p.id)}
                  className="p-1 rounded text-[#9A9AA5] hover:text-[#DC2626] transition-colors cursor-pointer"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Character Traits */}
        <div className="ship-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0]">
            <div className="flex items-center gap-2">
              <div className="ship-icon-tile">
                <Award className="w-4 h-4 text-[#0891B2]" />
              </div>
              <h3 className="text-sm font-semibold text-[#111113]">Character Traits</h3>
            </div>

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setIsAddTraitOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Trait</span>
            </button>
          </div>

          <div className="space-y-3">
            {activeTraits.map((t) => {
              const isStrength = t.kind === 'strength';
              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-[#ECECF0] bg-white flex items-center justify-between gap-3 text-xs shadow-2xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#111113]">{t.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          isStrength
                            ? 'bg-[#E6F7F9] text-[#0891B2]'
                            : 'bg-[#FDECEC] text-[#DC2626]'
                        }`}
                      >
                        {isStrength ? 'Strength' : 'Working On'}
                      </span>
                    </div>
                    {t.note && <p className="text-[11px] text-[#6B6B76] mt-0.5">{t.note}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Level 1-5 Indicator Pips */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`w-2 h-2 rounded-full transition-all ${
                            lvl <= t.level
                              ? isStrength
                                ? 'bg-[#0891B2]'
                                : 'bg-[#DC2626]'
                              : 'bg-[#ECECF0]'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteTrait(t.id)}
                      className="p-1 rounded text-[#9A9AA5] hover:text-[#DC2626] transition-colors cursor-pointer"
                      title="Delete trait"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* Modal: Add Measurement */}
      {isAddMeasurementOpen && (
        <div
          onClick={() => setIsAddMeasurementOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-[#ECECF0] rounded-2xl shadow-xl p-6 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0] mb-4">
              <h3 className="text-base font-semibold text-[#111113]">Add Measurement</h3>
              <button onClick={() => setIsAddMeasurementOpen(false)}>
                <X className="w-4 h-4 text-[#6B6B76]" />
              </button>
            </div>

            <form onSubmit={handleSaveMeasurement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Metric Type
                </label>
                <CustomSelect
                  value={mType}
                  options={MEASUREMENT_TYPE_OPTIONS}
                  onChange={(val) => {
                    const t = val as MeasurementType;
                    setMType(t);
                    if (t === 'weight') setMUnit('kg');
                    else setMUnit('cm');
                  }}
                />
              </div>

              {mType === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Custom Metric Name
                  </label>
                  <input
                    type="text"
                    required
                    value={mCustomLabel}
                    onChange={(e) => setMCustomLabel(e.target.value)}
                    placeholder="e.g. Neck, Bicep, Resting Heart Rate"
                    className="ship-input w-full px-3 py-2 text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={mValue}
                    onChange={(e) => setMValue(e.target.value)}
                    placeholder="e.g. 74.5"
                    className="ship-input w-full px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    required
                    value={mUnit}
                    onChange={(e) => setMUnit(e.target.value)}
                    className="ship-input w-full px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={mDate}
                  onChange={(e) => setMDate(e.target.value)}
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={mNote}
                  onChange={(e) => setMNote(e.target.value)}
                  placeholder="e.g. Morning fasted, post hydration"
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#ECECF0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMeasurementOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs cursor-pointer"
                >
                  Save Measurement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Appearance */}
      {isEditAppearanceOpen && (
        <div
          onClick={() => setIsEditAppearanceOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-[#ECECF0] rounded-2xl shadow-xl p-6 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0] mb-4">
              <h3 className="text-base font-semibold text-[#111113]">Edit Appearance</h3>
              <button onClick={() => setIsEditAppearanceOpen(false)}>
                <X className="w-4 h-4 text-[#6B6B76]" />
              </button>
            </div>

            <form onSubmit={handleSaveAppearance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Portrait Photo URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={appPhoto}
                    onChange={(e) => setAppPhoto(e.target.value)}
                    placeholder="https://... or upload local"
                    className="ship-input flex-1 px-3 py-2 text-xs"
                  />
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl border border-[#ECECF0] bg-[#F4F4F6] text-xs font-semibold text-[#111113] hover:bg-[#ECECF0] flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#0891B2]" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Skin Tone Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appSkinHex}
                    onChange={(e) => setAppSkinHex(e.target.value)}
                    className="w-9 h-9 rounded-xl border border-[#ECECF0] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={appSkinNote}
                    onChange={(e) => setAppSkinNote(e.target.value)}
                    placeholder="e.g. Warm olive undertones"
                    className="ship-input flex-1 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Hair Style & Color
                </label>
                <input
                  type="text"
                  required
                  value={appHair}
                  onChange={(e) => setAppHair(e.target.value)}
                  placeholder="e.g. Dark Espresso Brown, crop cut"
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Eye Color
                </label>
                <input
                  type="text"
                  required
                  value={appEye}
                  onChange={(e) => setAppEye(e.target.value)}
                  placeholder="e.g. Deep Hazel / Amber"
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#ECECF0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditAppearanceOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs cursor-pointer"
                >
                  Save Appearance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Color Swatch */}
      {isAddColorOpen && (
        <div
          onClick={() => setIsAddColorOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-[#ECECF0] rounded-2xl shadow-xl p-6 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0] mb-4">
              <h3 className="text-base font-semibold text-[#111113]">Add Color Swatch</h3>
              <button onClick={() => setIsAddColorOpen(false)}>
                <X className="w-4 h-4 text-[#6B6B76]" />
              </button>
            </div>

            <form onSubmit={handleSaveColor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Color Picker
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-[#ECECF0] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="ship-input font-mono w-28 px-3 py-2 text-xs uppercase font-semibold"
                  />
                  <div
                    className="flex-1 h-9 rounded-xl border border-black/10 shadow-xs"
                    style={{ backgroundColor: colorHex }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Color Name
                </label>
                <input
                  type="text"
                  required
                  value={colorLabel}
                  onChange={(e) => setColorLabel(e.target.value)}
                  placeholder="e.g. Deep Olive, Burnt Copper, Forest Pine"
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Verdict
                </label>
                <CustomSelect
                  value={colorVerdict}
                  options={PALETTE_VERDICT_OPTIONS}
                  onChange={(val) => setColorVerdict(val as PaletteVerdict)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Styling Notes (Optional)
                </label>
                <input
                  type="text"
                  value={colorNote}
                  onChange={(e) => setColorNote(e.target.value)}
                  placeholder="e.g. Excellent for outerwear and knits"
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#ECECF0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddColorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs cursor-pointer"
                >
                  Save Swatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Personality */}
      {isAddPersonalityOpen && (
        <div
          onClick={() => setIsAddPersonalityOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-[#ECECF0] rounded-2xl shadow-xl p-6 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0] mb-4">
              <h3 className="text-base font-semibold text-[#111113]">Add Personality Entry</h3>
              <button onClick={() => setIsAddPersonalityOpen(false)}>
                <X className="w-4 h-4 text-[#6B6B76]" />
              </button>
            </div>

            <form onSubmit={handleSavePersonality} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    System
                  </label>
                  <input
                    type="text"
                    required
                    value={persSystem}
                    onChange={(e) => setPersSystem(e.target.value)}
                    placeholder="e.g. MBTI, Enneagram"
                    className="ship-input w-full px-3 py-2 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Result
                  </label>
                  <input
                    type="text"
                    required
                    value={persResult}
                    onChange={(e) => setPersResult(e.target.value)}
                    placeholder="e.g. INTJ, 5w4, Type 1"
                    className="ship-input w-full px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Date Taken
                  </label>
                  <input
                    type="date"
                    required
                    value={persDate}
                    onChange={(e) => setPersDate(e.target.value)}
                    className="ship-input w-full px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Source / Test
                  </label>
                  <input
                    type="text"
                    value={persSource}
                    onChange={(e) => setPersSource(e.target.value)}
                    placeholder="e.g. 16personalities"
                    className="ship-input w-full px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Notes & Archetype Description
                </label>
                <textarea
                  rows={2}
                  value={persNotes}
                  onChange={(e) => setPersNotes(e.target.value)}
                  placeholder="Key traits, shadow functions, or behavioral dynamics..."
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#ECECF0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPersonalityOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Trait */}
      {isAddTraitOpen && (
        <div
          onClick={() => setIsAddTraitOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-[#ECECF0] rounded-2xl shadow-xl p-6 cursor-default animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0] mb-4">
              <h3 className="text-base font-semibold text-[#111113]">Add Character Trait</h3>
              <button onClick={() => setIsAddTraitOpen(false)}>
                <X className="w-4 h-4 text-[#6B6B76]" />
              </button>
            </div>

            <form onSubmit={handleSaveTrait} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Trait Name
                </label>
                <input
                  type="text"
                  required
                  value={traitName}
                  onChange={(e) => setTraitName(e.target.value)}
                  placeholder="e.g. Deep Focus, Verbal Articulation, Mobility"
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Classification
                  </label>
                  <CustomSelect
                    value={traitKind}
                    options={TRAIT_KIND_OPTIONS}
                    onChange={(val) => setTraitKind(val as TraitKind)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                    Mastery Level (1 - 5)
                  </label>
                  <CustomSelect
                    value={String(traitLevel)}
                    options={TRAIT_LEVEL_OPTIONS}
                    onChange={(val) => setTraitLevel(parseInt(val, 10))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Behavioral Note
                </label>
                <textarea
                  rows={2}
                  value={traitNote}
                  onChange={(e) => setTraitNote(e.target.value)}
                  placeholder="Specific contexts or real-world manifestation..."
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#ECECF0] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTraitOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B6B76] hover:bg-[#F4F4F6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs cursor-pointer"
                >
                  Save Trait
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
