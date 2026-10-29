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
  Trash2,
  Edit2,
  X,
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
  const [colorHex, setColorHex] = useState('#1F1B16');
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
  const [traitLevel, setTraitLevel] = useState<number>(3);
  const [traitNote, setTraitNote] = useState('');

  // Soft-deleted items are filtered out in active collections
  const activeMeasurements = useMemo(
    () => measurements.filter((m) => !m.deletedAt),
    [measurements]
  );
  const activePalette = useMemo(() => palette.filter((p) => !p.deletedAt), [palette]);
  const activePersonality = useMemo(
    () => personality.filter((p) => !p.deletedAt).sort((a, b) => b.dateTaken.localeCompare(a.dateTaken)),
    [personality]
  );
  const activeTraits = useMemo(() => traits.filter((t) => !t.deletedAt), [traits]);

  // Unit preference conversion helper
  const isImperial = settings.unitSystem === 'imperial';
  const formatMeasurementValue = (val: number, unit: string) => {
    if (isImperial) {
      if (unit === 'kg') return { val: (val * 2.20462).toFixed(1), unit: 'lbs' };
      if (unit === 'cm') return { val: (val / 2.54).toFixed(1), unit: 'in' };
    }
    return { val: val.toFixed(1), unit };
  };

  // Grouped measurements by type
  const weightEntries = useMemo(
    () =>
      activeMeasurements
        .filter((m) => m.type === 'weight')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [activeMeasurements]
  );

  const heightEntries = useMemo(
    () =>
      activeMeasurements
        .filter((m) => m.type === 'height')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [activeMeasurements]
  );

  const waistEntries = useMemo(
    () =>
      activeMeasurements
        .filter((m) => m.type === 'waist')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [activeMeasurements]
  );

  const chestEntries = useMemo(
    () =>
      activeMeasurements
        .filter((m) => m.type === 'chest')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [activeMeasurements]
  );

  // Derived waist-to-chest ratio computed across corresponding dates
  const ratioEntries = useMemo(() => {
    const list: BodyMeasurement[] = [];
    waistEntries.forEach((w) => {
      const matchingChest = chestEntries.find((c) => c.date === w.date);
      if (matchingChest && matchingChest.value > 0) {
        list.push({
          id: `ratio-${w.id}`,
          type: 'custom',
          customLabel: 'Waist-to-Chest Ratio',
          value: parseFloat((w.value / matchingChest.value).toFixed(3)),
          unit: 'ratio',
          date: w.date,
          note: `Waist: ${w.value}${w.unit} / Chest: ${matchingChest.value}${matchingChest.unit}`,
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
      return <div className="w-10 h-3 bg-[#E4DED2] rounded-[2px]" />;
    }
    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const span = max - min || 1;
    const width = 44;
    const height = 16;

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
      <svg className="w-11 h-4 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <polyline
          fill="none"
          stroke="#1F1B16"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <circle cx={width - 2} cy={lastY} r="2" fill="#1F1B16" />
      </svg>
    );
  };

  // Delta calculation for a metric card
  const getDeltaBadge = (latest: number | null, prev: number | null, unit: string) => {
    if (latest === null || prev === null) return null;
    const diff = latest - prev;
    if (Math.abs(diff) < 0.01) {
      return <span className="text-[11px] text-[#6B645A]">No change</span>;
    }
    const sign = diff > 0 ? '+' : '';
    return (
      <span className="text-[11px] tabular-nums text-[#6B645A] font-medium flex items-center gap-1">
        {diff > 0 ? <TrendingUp className="w-3 h-3 text-[#6B645A]" /> : <TrendingDown className="w-3 h-3 text-[#6B645A]" />}
        <span>
          {sign}
          {diff.toFixed(1)} {unit}
        </span>
      </span>
    );
  };

  // Overall chart delta evaluation
  const chartDeltaInfo = useMemo(() => {
    if (chartPointsWithMA.length < 2) return null;
    const first = chartPointsWithMA[0].value;
    const current = chartPointsWithMA[chartPointsWithMA.length - 1].value;
    const diff = current - first;
    const unit = chartPointsWithMA[0].unit;

    let colorClass = 'text-[#6B645A]';
    if (activeChartType === 'weight' && settings.targetWeightKg !== undefined) {
      const target = settings.targetWeightKg;
      const initialDist = Math.abs(first - target);
      const currentDist = Math.abs(current - target);
      if (currentDist < initialDist) {
        colorClass = 'text-[#3F6B4F]';
      } else if (currentDist > initialDist) {
        colorClass = 'text-[#9C3D2A]';
      }
    }

    return {
      diff,
      text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)} ${unit}`,
      colorClass,
    };
  }, [chartPointsWithMA, activeChartType, settings.targetWeightKg]);

  // Color Palette Proximity Warnings
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

  const activeMetricTitle = useMemo(() => {
    if (activeChartType === 'weight') return 'Weight';
    if (activeChartType === 'height') return 'Height';
    if (activeChartType === 'waist') return 'Waist';
    if (activeChartType === 'chest') return 'Chest';
    if (activeChartType === 'ratio') return 'Waist-to-Chest Ratio';
    return 'Custom Metric';
  }, [activeChartType]);

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
    <div className="space-y-10">
      {/* 1. MEASUREMENTS & DYNAMIC CHART */}
      <section className="space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E4DED2]">
          <h3 className="font-serif text-[20px] font-normal text-[#1F1B16]">Measurements</h3>

          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              setIsAddMeasurementOpen(true);
            }}
            className="editorial-btn-primary"
          >
            Add Measurement
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
            className={`p-3.5 rounded-[6px] border transition-colors cursor-pointer flex flex-col justify-between ${
              activeChartType === 'weight'
                ? 'bg-[#FBF9F4] border-[#1F1B16]'
                : 'bg-[#FBF9F4] border-[#E4DED2] hover:border-[#1F1B16]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#6B645A] uppercase tracking-wider">Weight</span>
              {renderSparkline(weightEntries.map((e) => e.value))}
            </div>
            <div className="mt-2">
              <div
                className={`editorial-stat-num text-[22px] ${
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
            className={`p-3.5 rounded-[6px] border transition-colors cursor-pointer flex flex-col justify-between ${
              activeChartType === 'height'
                ? 'bg-[#FBF9F4] border-[#1F1B16]'
                : 'bg-[#FBF9F4] border-[#E4DED2] hover:border-[#1F1B16]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#6B645A] uppercase tracking-wider">Height</span>
              {renderSparkline(heightEntries.map((e) => e.value))}
            </div>
            <div className="mt-2">
              <div
                className={`editorial-stat-num text-[22px] ${
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
            className={`p-3.5 rounded-[6px] border transition-colors cursor-pointer flex flex-col justify-between ${
              activeChartType === 'waist'
                ? 'bg-[#FBF9F4] border-[#1F1B16]'
                : 'bg-[#FBF9F4] border-[#E4DED2] hover:border-[#1F1B16]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#6B645A] uppercase tracking-wider">Waist</span>
              {renderSparkline(waistEntries.map((e) => e.value))}
            </div>
            <div className="mt-2">
              <div
                className={`editorial-stat-num text-[22px] ${
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
            className={`p-3.5 rounded-[6px] border transition-colors cursor-pointer flex flex-col justify-between ${
              activeChartType === 'chest'
                ? 'bg-[#FBF9F4] border-[#1F1B16]'
                : 'bg-[#FBF9F4] border-[#E4DED2] hover:border-[#1F1B16]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#6B645A] uppercase tracking-wider">Chest</span>
              {renderSparkline(chestEntries.map((e) => e.value))}
            </div>
            <div className="mt-2">
              <div
                className={`editorial-stat-num text-[22px] ${
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
            className={`p-3.5 rounded-[6px] border transition-colors cursor-pointer flex flex-col justify-between col-span-2 md:col-span-1 ${
              activeChartType === 'ratio'
                ? 'bg-[#FBF9F4] border-[#1F1B16]'
                : 'bg-[#FBF9F4] border-[#E4DED2] hover:border-[#1F1B16]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#6B645A] uppercase tracking-wider">Waist / Chest</span>
              {renderSparkline(ratioEntries.map((e) => e.value))}
            </div>
            <div className="mt-2">
              <div
                className={`editorial-stat-num text-[22px] ${
                  privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
                }`}
              >
                {latestRatio ? latestRatio.value.toFixed(2) : '—'}
              </div>
              <div className="mt-1">
                {latestRatio && prevRatio ? (
                  <span className="text-[11px] tabular-nums text-[#6B645A] font-medium flex items-center gap-1">
                    {latestRatio.value > prevRatio.value ? (
                      <TrendingUp className="w-3 h-3 text-[#6B645A]" />
                    ) : latestRatio.value < prevRatio.value ? (
                      <TrendingDown className="w-3 h-3 text-[#6B645A]" />
                    ) : null}
                    <span>
                      {latestRatio.value >= prevRatio.value ? '+' : ''}
                      {(latestRatio.value - prevRatio.value).toFixed(2)} ratio
                    </span>
                  </span>
                ) : (
                  <span className="text-[11px] text-[#6B645A]">Computed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Chart Container */}
        <div className="space-y-4 pt-2">
          {/* Chart Header Bar: Title, Legend, Delta & Range Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E4DED2]">
            <div className="flex items-center gap-3">
              <span className="font-serif text-[16px] text-[#1F1B16]">
                {activeMetricTitle}
              </span>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] text-[#6B645A]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#1F1B16]" />
                  <span>Raw</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 border-t border-dashed border-[#2D4A6B]" />
                  <span>7d Moving Avg</span>
                </span>
              </div>

              {/* Delta Badge */}
              {chartDeltaInfo && (
                <span className={`text-[12px] tabular-nums font-medium ${chartDeltaInfo.colorClass}`}>
                  {chartDeltaInfo.text}
                </span>
              )}
            </div>

            {/* Range Toggle: 30d / 90d / 1y / All */}
            <div className="inline-flex p-0.5 bg-[#EFEAE0] rounded-[6px] border border-[#E4DED2] self-start sm:self-auto">
              {(['30d', '90d', '1y', 'all'] as ChartRange[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    setChartRange(r);
                  }}
                  className={`px-2.5 py-0.5 rounded-[4px] text-[11px] font-medium transition-colors cursor-pointer ${
                    chartRange === r
                      ? 'bg-[#FBF9F4] text-[#1F1B16] border border-[#E4DED2]'
                      : 'text-[#6B645A] hover:text-[#1F1B16]'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Canvas & Tooltip */}
          {chartPointsWithMA.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-[#6B645A]">
              No entries logged for {activeMetricTitle.toLowerCase()}. Click "Add Measurement" to record.
            </div>
          ) : (
            <div
              className={`relative w-full ${
                privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
              }`}
            >
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

                    const leftPad = 48;
                    const rightPad = 590;
                    const plotWidth = rightPad - leftPad;
                    const topPad = 15;
                    const bottomPad = 185;
                    const plotHeight = bottomPad - topPad;

                    const gridSteps = [0, 0.33, 0.66, 1];
                    const gridlines = gridSteps.map((fraction) => {
                      const y = bottomPad - fraction * plotHeight;
                      const val = min + fraction * span;
                      return { y, val };
                    });

                    const mapped = chartPointsWithMA.map((p, idx) => {
                      const x =
                        chartPointsWithMA.length === 1
                          ? leftPad + plotWidth / 2
                          : leftPad + (idx / (chartPointsWithMA.length - 1)) * plotWidth;
                      const yRaw = bottomPad - ((p.value - min) / span) * plotHeight;
                      const yMA = bottomPad - ((p.movingAvg - min) / span) * plotHeight;
                      return { x, yRaw, yMA, ...p };
                    });

                    const rawPathStr = mapped
                      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yRaw.toFixed(1)}`)
                      .join(' ');

                    const maPathStr = mapped
                      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yMA.toFixed(1)}`)
                      .join(' ');

                    return (
                      <g>
                        {gridlines.map((gl, i) => (
                          <g key={i}>
                            <line
                              x1={leftPad}
                              y1={gl.y}
                              x2={rightPad}
                              y2={gl.y}
                              stroke="#E4DED2"
                              strokeWidth="1"
                              strokeDasharray="2 2"
                            />
                            <text
                              x={leftPad - 8}
                              y={gl.y + 3.5}
                              textAnchor="end"
                              fontSize="10"
                              fill="#6B645A"
                              fontFamily="sans-serif"
                            >
                              {gl.val.toFixed(1)}
                            </text>
                          </g>
                        ))}

                        <path
                          d={maPathStr}
                          fill="none"
                          stroke="#2D4A6B"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                          strokeLinecap="round"
                        />

                        <path
                          d={rawPathStr}
                          fill="none"
                          stroke="#1F1B16"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {mapped.map((p) => (
                          <g key={p.id}>
                            <circle
                              cx={p.x}
                              cy={p.yRaw}
                              r="3.5"
                              fill="#FBF9F4"
                              stroke="#1F1B16"
                              strokeWidth="1.5"
                            />
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

                {hoveredPoint && (
                  <div
                    style={{
                      left: `${hoveredPoint.x}px`,
                      top: `${Math.max(10, hoveredPoint.y - 70)}px`,
                    }}
                    className="absolute -translate-x-1/2 pointer-events-none z-30 bg-[#FBF9F4] text-[#1F1B16] border border-[#E4DED2] p-2.5 rounded-[6px] text-xs space-y-1 min-w-[140px]"
                  >
                    <div className="font-medium text-[#1F1B16] border-b border-[#E4DED2] pb-1 tabular-nums">
                      {hoveredPoint.date}
                    </div>
                    <div className="flex items-center justify-between text-[11px] gap-2 tabular-nums">
                      <span className="text-[#6B645A]">Raw:</span>
                      <span className="font-medium">
                        {hoveredPoint.rawVal.toFixed(1)} {hoveredPoint.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] gap-2 tabular-nums">
                      <span className="text-[#2D4A6B]">7d Avg:</span>
                      <span className="font-medium">
                        {hoveredPoint.movingAvg.toFixed(1)} {hoveredPoint.unit}
                      </span>
                    </div>
                    {hoveredPoint.note && (
                      <div className="text-[10px] text-[#6B645A] italic pt-0.5 border-t border-[#E4DED2]">
                        "{hoveredPoint.note}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] tabular-nums text-[#6B645A] mt-2 px-12">
                <span>{chartPointsWithMA[0].date}</span>
                {chartPointsWithMA.length > 2 && (
                  <span>{chartPointsWithMA[Math.floor(chartPointsWithMA.length / 2)].date}</span>
                )}
                <span>{chartPointsWithMA[chartPointsWithMA.length - 1].date}</span>
              </div>
            </div>
          )}

          {/* Recent Entries List */}
          <div className="mt-4 pt-4 border-t border-[#E4DED2] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#1F1B16] uppercase tracking-wider">
                Recent Entries ({activeDataset.length})
              </span>
              <span className="text-[11px] text-[#6B645A]">Latest records</span>
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
              {activeDataset.slice(-6).reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-[13px] py-1.5 px-3 rounded-[4px] bg-[#FBF9F4] border border-[#E4DED2] hover:border-[#1F1B16] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium tabular-nums text-[#1F1B16]">
                      {entry.value} {entry.unit}
                    </span>
                    {entry.note && (
                      <span className="text-[#6B645A] text-[11px] truncate max-w-[200px] sm:max-w-xs">
                        ({entry.note})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 text-[#6B645A] text-[11px] tabular-nums">
                    <span>{entry.date}</span>
                    {activeChartType !== 'ratio' && (
                      <button
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          onDeleteMeasurement(entry.id);
                        }}
                        className="hover:text-[#9C3D2A] transition-colors p-0.5 cursor-pointer"
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
      </section>

      {/* 2. APPEARANCE & 3. COLOR PALETTE */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pt-6 border-t border-[#E4DED2]">
        {/* Appearance Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
            <h3 className="font-serif text-[18px] font-normal text-[#1F1B16]">Appearance</h3>
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setIsEditAppearanceOpen(true);
              }}
              className="p-1 rounded-[4px] text-[#6B645A] hover:text-[#1F1B16] hover:bg-[#EFEAE0] transition-colors cursor-pointer"
              title="Edit Appearance"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Avatar Photo Preview */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-[6px] bg-[#EFEAE0] border border-[#E4DED2] text-[#1F1B16] font-serif flex items-center justify-center text-xl font-normal overflow-hidden flex-shrink-0">
                {appearance.photoUrl ? (
                  <img
                    src={appearance.photoUrl}
                    alt="Portrait"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>V</span>
                )}
              </div>
              <div>
                <div className="text-[13px] font-medium text-[#1F1B16]">Portrait Profile</div>
                <div className="text-[11px] text-[#6B645A]">Visual reference</div>
              </div>
            </div>

            {/* Skin tone swatch */}
            <div className="p-3 rounded-[6px] bg-[#FBF9F4] border border-[#E4DED2] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-[#6B645A] uppercase tracking-wider block">
                  Skin Tone
                </span>
                <span className="text-[13px] font-normal text-[#1F1B16]">
                  {appearance.skinToneNote || 'Olive Undertone'}
                </span>
              </div>
              <div
                className="w-6 h-6 rounded-[4px] border border-black/10"
                style={{ backgroundColor: appearance.skinToneHex }}
              />
            </div>

            {/* Hair & Eyes */}
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="p-3 rounded-[6px] bg-[#FBF9F4] border border-[#E4DED2]">
                <span className="text-[10px] font-medium text-[#6B645A] uppercase tracking-wider block mb-0.5">
                  Hair
                </span>
                <span className="font-normal text-[#1F1B16] block truncate">{appearance.hair}</span>
              </div>

              <div className="p-3 rounded-[6px] bg-[#FBF9F4] border border-[#E4DED2]">
                <span className="text-[10px] font-medium text-[#6B645A] uppercase tracking-wider block mb-0.5">
                  Eye Color
                </span>
                <span className="font-normal text-[#1F1B16] block truncate">{appearance.eyeColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
            <h3 className="font-serif text-[18px] font-normal text-[#1F1B16]">Color Palette</h3>

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setIsAddColorOpen(true);
              }}
              className="editorial-btn-primary"
            >
              Add Swatch
            </button>
          </div>

          {/* Verdict Groups Navigation Summary at Top of Section */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <span className="px-2 py-0.5 rounded-[4px] text-xs font-medium text-[#3F6B4F] bg-[#F6F2EA] border border-[#3F6B4F]/30">
              Suits You ({activePalette.filter((p) => p.verdict === 'suits').length})
            </span>
            <span className="px-2 py-0.5 rounded-[4px] text-xs font-medium text-[#6B645A] bg-[#F6F2EA] border border-[#E4DED2]">
              Neutral ({activePalette.filter((p) => p.verdict === 'neutral').length})
            </span>
            <span className="px-2 py-0.5 rounded-[4px] text-xs font-medium text-[#9C3D2A] bg-[#F6F2EA] border border-[#9C3D2A]/30">
              Avoid ({activePalette.filter((p) => p.verdict === 'avoid').length})
            </span>
          </div>

          {/* Grouped Swatches Grid */}
          <div className="space-y-4">
            {(['suits', 'neutral', 'avoid'] as PaletteVerdict[]).map((verdict) => {
              const swatches = activePalette.filter((p) => p.verdict === verdict);
              if (swatches.length === 0) return null;

              const verdictBadge = {
                suits: { label: 'Suits You', color: 'text-[#3F6B4F] border-[#3F6B4F]/30' },
                neutral: { label: 'Neutral', color: 'text-[#6B645A] border-[#E4DED2]' },
                avoid: { label: 'Avoid', color: 'text-[#9C3D2A] border-[#9C3D2A]/30' },
              }[verdict];

              return (
                <div key={verdict} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium border bg-[#FBF9F4] ${verdictBadge.color}`}>
                      {verdictBadge.label}
                    </span>
                    <span className="text-[11px] tabular-nums text-[#6B645A]">({swatches.length})</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {swatches.map((item) => {
                      const warning = paletteSimilarityWarnings[item.id];

                      return (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4] flex flex-col justify-between gap-1.5 group hover:border-[#1F1B16] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-5 h-5 rounded-[3px] border border-black/10 flex-shrink-0"
                                style={{ backgroundColor: item.colorHex }}
                                title={item.colorHex}
                              />
                              <div className="min-w-0">
                                <span className="text-[13px] font-medium text-[#1F1B16] block truncate">
                                  {item.label}
                                </span>
                                <span className="text-[11px] text-[#6B645A] font-mono block">
                                  {item.colorHex}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => onDeletePaletteColor(item.id)}
                              className="p-1 rounded text-[#6B645A] hover:text-[#9C3D2A] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Delete color"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {warning && (
                            <div className="text-[10px] text-[#9C3D2A] bg-[#F6F2EA] border border-[#9C3D2A]/30 px-1.5 py-0.5 rounded-[3px] flex items-center gap-1 font-medium truncate">
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
      </section>

      {/* 4. PERSONALITY & 5. TRAITS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pt-6 border-t border-[#E4DED2]">
        {/* Personality Profiling */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
            <h3 className="font-serif text-[18px] font-normal text-[#1F1B16]">Personality</h3>

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setIsAddPersonalityOpen(true);
              }}
              className="editorial-btn-primary"
            >
              Add Assessment
            </button>
          </div>

          <div className="space-y-2.5">
            {activePersonality.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4] flex items-start justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium px-1.5 py-0.5 rounded-[4px] bg-[#EFEAE0] border border-[#E4DED2] text-[#1F1B16]">
                      {p.system}
                    </span>
                    <span className="font-serif text-[15px] font-normal text-[#1F1B16]">{p.result}</span>
                    <span className="text-[11px] tabular-nums text-[#6B645A]">{p.dateTaken}</span>
                  </div>
                  {p.notes && <p className="text-[#6B645A] text-[12px] mt-1">{p.notes}</p>}
                  {p.source && (
                    <span className="text-[11px] text-[#6B645A] block mt-1 truncate">
                      Source: {p.source}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onDeletePersonality(p.id)}
                  className="p-1 rounded text-[#6B645A] hover:text-[#9C3D2A] transition-colors cursor-pointer"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Character Traits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2]">
            <h3 className="font-serif text-[18px] font-normal text-[#1F1B16]">Character Traits</h3>

            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setIsAddTraitOpen(true);
              }}
              className="editorial-btn-primary"
            >
              Add Trait
            </button>
          </div>

          <div className="space-y-2.5">
            {activeTraits.map((t) => {
              const isStrength = t.kind === 'strength';
              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[#1F1B16]">{t.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-medium border ${
                          isStrength
                            ? 'bg-[#F6F2EA] text-[#3F6B4F] border-[#3F6B4F]/30'
                            : 'bg-[#F6F2EA] text-[#9C3D2A] border-[#9C3D2A]/30'
                        }`}
                      >
                        {isStrength ? 'Strength' : 'Working On'}
                      </span>
                    </div>
                    {t.note && <p className="text-[12px] text-[#6B645A] mt-0.5">{t.note}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`w-2 h-2 rounded-full transition-all ${
                            lvl <= t.level
                              ? isStrength
                                ? 'bg-[#3F6B4F]'
                                : 'bg-[#9C3D2A]'
                              : 'bg-[#E4DED2]'
                          }`}
                        />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteTrait(t.id)}
                      className="p-1 rounded text-[#6B645A] hover:text-[#9C3D2A] transition-colors cursor-pointer"
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
      </section>

      {/* MODALS */}

      {/* Modal: Add Measurement */}
      {isAddMeasurementOpen && (
        <div
          onClick={() => setIsAddMeasurementOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-6 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2] mb-4">
              <h3 className="font-serif text-[20px] font-normal text-[#1F1B16]">Add Measurement</h3>
              <button type="button" onClick={() => setIsAddMeasurementOpen(false)}>
                <X className="w-4 h-4 text-[#6B645A]" />
              </button>
            </div>

            <form onSubmit={handleSaveMeasurement} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={mValue}
                    onChange={(e) => setMValue(e.target.value)}
                    placeholder="e.g. 74.5"
                    className="ship-input w-full px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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

              <div className="pt-3 border-t border-[#E4DED2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMeasurementOpen(false)}
                  className="editorial-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="editorial-btn-primary"
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
            className="w-full max-w-md bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-6 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2] mb-4">
              <h3 className="font-serif text-[20px] font-normal text-[#1F1B16]">Edit Appearance</h3>
              <button type="button" onClick={() => setIsEditAppearanceOpen(false)}>
                <X className="w-4 h-4 text-[#6B645A]" />
              </button>
            </div>

            <form onSubmit={handleSaveAppearance} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                  Portrait Photo URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={appPhoto}
                    onChange={(e) => setAppPhoto(e.target.value)}
                    placeholder="https://... URL or upload"
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
                    className="editorial-btn-secondary py-1 px-3 text-xs"
                  >
                    Upload
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                  Skin Tone Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appSkinHex}
                    onChange={(e) => setAppSkinHex(e.target.value)}
                    className="w-8 h-8 rounded-[4px] border border-[#E4DED2] cursor-pointer"
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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

              <div className="pt-3 border-t border-[#E4DED2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditAppearanceOpen(false)}
                  className="editorial-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="editorial-btn-primary"
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
            className="w-full max-w-md bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-6 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2] mb-4">
              <h3 className="font-serif text-[20px] font-normal text-[#1F1B16]">Add Color Swatch</h3>
              <button type="button" onClick={() => setIsAddColorOpen(false)}>
                <X className="w-4 h-4 text-[#6B645A]" />
              </button>
            </div>

            <form onSubmit={handleSaveColor} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                  Color Picker
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-9 h-9 rounded-[4px] border border-[#E4DED2] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="ship-input font-mono w-28 px-3 py-2 text-xs uppercase"
                  />
                  <div
                    className="flex-1 h-8 rounded-[4px] border border-black/10"
                    style={{ backgroundColor: colorHex }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                  Verdict
                </label>
                <CustomSelect
                  value={colorVerdict}
                  options={PALETTE_VERDICT_OPTIONS}
                  onChange={(val) => setColorVerdict(val as PaletteVerdict)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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

              <div className="pt-3 border-t border-[#E4DED2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddColorOpen(false)}
                  className="editorial-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="editorial-btn-primary"
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
            className="w-full max-w-md bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-6 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2] mb-4">
              <h3 className="font-serif text-[20px] font-normal text-[#1F1B16]">Add Personality Entry</h3>
              <button type="button" onClick={() => setIsAddPersonalityOpen(false)}>
                <X className="w-4 h-4 text-[#6B645A]" />
              </button>
            </div>

            <form onSubmit={handleSavePersonality} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                    System
                  </label>
                  <input
                    type="text"
                    required
                    value={persSystem}
                    onChange={(e) => setPersSystem(e.target.value)}
                    placeholder="e.g. MBTI, Enneagram"
                    className="ship-input w-full px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                    Result
                  </label>
                  <input
                    type="text"
                    required
                    value={persResult}
                    onChange={(e) => setPersResult(e.target.value)}
                    placeholder="e.g. INTJ, 5w4, Type 1"
                    className="ship-input w-full px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                    Source
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                  Notes
                </label>
                <textarea
                  rows={2}
                  value={persNotes}
                  onChange={(e) => setPersNotes(e.target.value)}
                  placeholder="Key traits or reflection..."
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-[#E4DED2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPersonalityOpen(false)}
                  className="editorial-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="editorial-btn-primary"
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
            className="w-full max-w-md bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-6 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E4DED2] mb-4">
              <h3 className="font-serif text-[20px] font-normal text-[#1F1B16]">Add Character Trait</h3>
              <button type="button" onClick={() => setIsAddTraitOpen(false)}>
                <X className="w-4 h-4 text-[#6B645A]" />
              </button>
            </div>

            <form onSubmit={handleSaveTrait} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
                    Classification
                  </label>
                  <CustomSelect
                    value={traitKind}
                    options={TRAIT_KIND_OPTIONS}
                    onChange={(val) => setTraitKind(val as TraitKind)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#6B645A] mb-1">
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

              <div className="pt-3 border-t border-[#E4DED2] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTraitOpen(false)}
                  className="editorial-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="editorial-btn-primary"
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
