import React, { useState, useRef, useMemo, useEffect } from 'react';
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

type ChartRange = '30d' | '90d' | '1y' | 'all';

interface NormalizedMeasurement extends BodyMeasurement {
  normalizedValue: number;
  displayUnit: string;
  originalValue: number;
  originalUnit: string;
  isConverted: boolean;
}

// Canonical unit based on unitSystem preference
const getCanonicalUnitForMetric = (metric: MeasurementType, unitSystem: string = 'hybrid'): string => {
  if (metric === 'weight') return unitSystem === 'imperial' ? 'lbs' : 'kg';
  if (metric === 'height' || metric === 'waist' || metric === 'chest') {
    return unitSystem === 'metric' ? 'cm' : 'in';
  }
  return '';
};

// Normalize any measurement to canonical unit
const normalizeMeasurement = (
  m: BodyMeasurement,
  unitSystem: string = 'hybrid'
): NormalizedMeasurement => {
  const origVal = m.value;
  const origUnit = (m.unit || '').toLowerCase().trim();
  const canonicalUnit = getCanonicalUnitForMetric(m.type, unitSystem);

  let normVal = origVal;
  let dispUnit = m.unit;

  if (canonicalUnit) {
    dispUnit = canonicalUnit;
    if (m.type === 'weight') {
      if ((origUnit === 'lbs' || origUnit === 'pounds') && canonicalUnit === 'kg') {
        normVal = origVal / 2.20462;
      } else if ((origUnit === 'kg' || origUnit === 'kilograms') && canonicalUnit === 'lbs') {
        normVal = origVal * 2.20462;
      }
    } else if (m.type === 'height' || m.type === 'waist' || m.type === 'chest') {
      if ((origUnit === 'cm' || origUnit === 'centimeters') && canonicalUnit === 'in') {
        normVal = origVal / 2.54;
      } else if ((origUnit === 'in' || origUnit === 'inches') && canonicalUnit === 'cm') {
        normVal = origVal * 2.54;
      }
    }
  }

  const rounded = parseFloat(normVal.toFixed(1));
  const isConverted = Math.abs(rounded - origVal) > 0.05 || (origUnit !== '' && origUnit !== dispUnit.toLowerCase());

  return {
    ...m,
    value: rounded,
    unit: dispUnit,
    normalizedValue: rounded,
    displayUnit: dispUnit,
    originalValue: origVal,
    originalUnit: m.unit,
    isConverted,
  };
};

// Beautiful, human-friendly Y-axis scale calculator
function getNiceScale(minVal: number, maxVal: number, targetTicks = 4) {
  let rawSpan = maxVal - minVal;
  if (rawSpan <= 0.0001) rawSpan = 1;

  const roughStep = rawSpan / targetTicks;
  const exponent = Math.floor(Math.log10(roughStep));
  const fraction = roughStep / Math.pow(10, exponent);

  let niceFraction: number;
  if (fraction <= 1.5) niceFraction = 1;
  else if (fraction <= 3) niceFraction = 2;
  else if (fraction <= 7) niceFraction = 5;
  else niceFraction = 10;

  const step = niceFraction * Math.pow(10, exponent);

  const pad = Math.max(step * 0.25, 0.4);
  const niceMin = Math.floor((minVal - pad) / step) * step;
  const niceMax = Math.ceil((maxVal + pad) / step) * step;

  const ticks: number[] = [];
  const count = Math.round((niceMax - niceMin) / step);
  for (let i = 0; i <= count; i++) {
    const val = parseFloat((niceMin + i * step).toFixed(3));
    ticks.push(val);
  }

  return {
    min: niceMin,
    max: niceMax,
    span: niceMax - niceMin || 1,
    step,
    ticks,
  };
}

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
  onDeletePaletteColor: _onDeletePaletteColor,
  onAddPersonality,
  onDeletePersonality: _onDeletePersonality,
  onAddTrait,
  onDeleteTrait: _onDeleteTrait,
}) => {
  // Active chart metric type
  const [activeChartType, setActiveChartType] = useState<MeasurementType>('weight');
  const [chartRange, setChartRange] = useState<ChartRange>('all');
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(800);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const update = () => {
      if (el.clientWidth > 0) {
        setChartWidth(el.clientWidth);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    date: string;
    rawVal: number;
    movingAvg: number;
    unit: string;
    note?: string;
    originalVal?: number;
    originalUnit?: string;
    isConverted?: boolean;
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
  const [colorHex, setColorHex] = useState('#0F172A');
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

  // Normalized measurements collection
  const normalizedMeasurements = useMemo(
    () => activeMeasurements.map((m) => normalizeMeasurement(m, settings.unitSystem)),
    [activeMeasurements, settings.unitSystem]
  );

  // Grouped normalized measurements by type
  const weightEntries = useMemo(
    () =>
      normalizedMeasurements
        .filter((m) => m.type === 'weight')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [normalizedMeasurements]
  );

  const heightEntries = useMemo(
    () =>
      normalizedMeasurements
        .filter((m) => m.type === 'height')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [normalizedMeasurements]
  );

  const waistEntries = useMemo(
    () =>
      normalizedMeasurements
        .filter((m) => m.type === 'waist')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [normalizedMeasurements]
  );

  const chestEntries = useMemo(
    () =>
      normalizedMeasurements
        .filter((m) => m.type === 'chest')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [normalizedMeasurements]
  );

  // Latest measurements
  const latestWeight = weightEntries[weightEntries.length - 1] || null;
  const prevWeight = weightEntries.length > 1 ? weightEntries[weightEntries.length - 2] : null;

  const latestHeight = heightEntries[heightEntries.length - 1] || null;
  const prevHeight = heightEntries.length > 1 ? heightEntries[heightEntries.length - 2] : null;

  const latestWaist = waistEntries[waistEntries.length - 1] || null;
  const prevWaist = waistEntries.length > 1 ? waistEntries[waistEntries.length - 2] : null;

  const latestChest = chestEntries[chestEntries.length - 1] || null;
  const prevChest = chestEntries.length > 1 ? chestEntries[chestEntries.length - 2] : null;

  // Active chart normalized dataset
  const activeDataset = useMemo(() => {
    return normalizedMeasurements
      .filter((m) => m.type === activeChartType)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [normalizedMeasurements, activeChartType]);

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
          ? windowPts.reduce((acc, curr) => acc + curr.normalizedValue, 0) / windowPts.length
          : pt.normalizedValue;
      return {
        ...pt,
        movingAvg: parseFloat(avg.toFixed(1)),
      };
    });
  }, [rangeFilteredData, activeDataset]);

  // Sparkline generator
  const renderSparkline = (dataPoints: number[]) => {
    if (dataPoints.length < 2) {
      return <div className="w-10 h-3 bg-[#E2E8F0] rounded-[2px]" />;
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
          stroke="#0F172A"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        <circle cx={width - 2} cy={lastY} r="2" fill="#0F172A" />
      </svg>
    );
  };

  // Delta calculation for a metric card
  const getDeltaBadge = (latest: number | null, prev: number | null, unit: string) => {
    if (latest === null || prev === null) return null;
    const diff = latest - prev;
    if (Math.abs(diff) < 0.01) {
      return <span className="text-[11px] text-[#64748B]">No change</span>;
    }
    const sign = diff > 0 ? '+' : '';
    return (
      <span className="text-[11px] tabular-nums text-[#64748B] font-medium flex items-center gap-1">
        {diff > 0 ? <TrendingUp className="w-3 h-3 text-[#64748B]" /> : <TrendingDown className="w-3 h-3 text-[#64748B]" />}
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

    let colorClass = 'text-[#64748B]';
    if (activeChartType === 'weight' && settings.targetWeightKg !== undefined) {
      const target = settings.targetWeightKg;
      const initialDist = Math.abs(first - target);
      const currentDist = Math.abs(current - target);
      if (currentDist < initialDist) {
        colorClass = 'text-[#059669]';
      } else if (currentDist > initialDist) {
        colorClass = 'text-[#E11D48]';
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
          <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">Measurements</h3>

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

        {/* 4 Stat Cards (Weight, Height, Waist, Chest) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {/* Card 1: Weight */}
          <div
            onClick={() => {
              sfx.playClick();
              setActiveChartType('weight');
            }}
            className={`p-3.5 rounded-[6px] border transition-all cursor-pointer flex flex-col justify-between ${
              activeChartType === 'weight'
                ? 'bg-[#FFFFFF] border-[#0F172A] ring-1 ring-[#0F172A]/20 shadow-xs'
                : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Weight</span>
              {renderSparkline(weightEntries.map((e) => e.normalizedValue))}
            </div>
            <div className="mt-2">
              <div
                className={`editorial-stat-num text-[22px] ${
                  privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
                }`}
              >
                {latestWeight ? `${latestWeight.normalizedValue} ${latestWeight.displayUnit}` : '—'}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {getDeltaBadge(
                  latestWeight ? latestWeight.normalizedValue : null,
                  prevWeight ? prevWeight.normalizedValue : null,
                  latestWeight ? latestWeight.displayUnit : 'kg'
                )}
                {settings.targetWeightKg && (
                  <span className="text-[11px] text-[#64748B] tabular-nums">
                    Target: {settings.targetWeightKg}kg
                  </span>
                )}
              </div>
              <div className="text-[10px] text-[#64748B]/80 mt-1 tabular-nums">
                Current: {latestWeight ? latestWeight.normalizedValue : 96}kg · Target: {settings.targetWeightKg ?? 85}kg · Peak: 106kg
              </div>
            </div>
          </div>

          {/* Card 2: Height */}
          <div
            onClick={() => {
              sfx.playClick();
              setActiveChartType('height');
            }}
            className={`p-3.5 rounded-[6px] border transition-all cursor-pointer flex flex-col justify-between ${
              activeChartType === 'height'
                ? 'bg-[#FFFFFF] border-[#0F172A] ring-1 ring-[#0F172A]/20 shadow-xs'
                : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Height</span>
              {renderSparkline(heightEntries.map((e) => e.normalizedValue))}
            </div>
            <div className="mt-2">
              <div
                className={`editorial-stat-num text-[22px] ${
                  privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
                }`}
              >
                {latestHeight ? `${latestHeight.normalizedValue} ${latestHeight.displayUnit}` : '—'}
              </div>
              <div className="mt-1">
                {getDeltaBadge(
                  latestHeight ? latestHeight.normalizedValue : null,
                  prevHeight ? prevHeight.normalizedValue : null,
                  latestHeight ? latestHeight.displayUnit : 'in'
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
            className={`p-3.5 rounded-[6px] border transition-all cursor-pointer flex flex-col justify-between ${
              activeChartType === 'waist'
                ? 'bg-[#FFFFFF] border-[#0F172A] ring-1 ring-[#0F172A]/20 shadow-xs'
                : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Waist</span>
              {renderSparkline(waistEntries.map((e) => e.normalizedValue))}
            </div>
            <div className="mt-2">
              <div
                className={`editorial-stat-num text-[22px] ${
                  privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
                }`}
              >
                {latestWaist ? `${latestWaist.normalizedValue} ${latestWaist.displayUnit}` : '—'}
              </div>
              <div className="mt-1">
                {getDeltaBadge(
                  latestWaist ? latestWaist.normalizedValue : null,
                  prevWaist ? prevWaist.normalizedValue : null,
                  latestWaist ? latestWaist.displayUnit : 'in'
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
            className={`p-3.5 rounded-[6px] border transition-all cursor-pointer flex flex-col justify-between ${
              activeChartType === 'chest'
                ? 'bg-[#FFFFFF] border-[#0F172A] ring-1 ring-[#0F172A]/20 shadow-xs'
                : 'bg-[#FFFFFF] border-[#E2E8F0] hover:border-[#94A3B8]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">Chest</span>
              {renderSparkline(chestEntries.map((e) => e.normalizedValue))}
            </div>
            <div className="mt-2">
              <div
                className={`editorial-stat-num text-[22px] ${
                  privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
                }`}
              >
                {latestChest ? `${latestChest.normalizedValue} ${latestChest.displayUnit}` : '—'}
              </div>
              <div className="mt-1">
                {getDeltaBadge(
                  latestChest ? latestChest.normalizedValue : null,
                  prevChest ? prevChest.normalizedValue : null,
                  latestChest ? latestChest.displayUnit : 'in'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Chart Container */}
        {/* Dynamic Chart Container */}
        <div className="space-y-4 pt-2">
          {/* Chart Header Bar: Title, Legend, Delta & Range Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-3">
              <span className="font-serif text-[16px] text-[#0F172A]">
                {activeMetricTitle}
              </span>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F172A]" />
                  <span>Recorded</span>
                </span>
                {chartPointsWithMA.some((p) => Math.abs(p.normalizedValue - p.movingAvg) > 0.1) && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t border-dashed border-[#2563EB]" />
                    <span>7d Trend</span>
                  </span>
                )}
              </div>

              {/* Delta Badge */}
              {chartDeltaInfo && (
                <span className={`text-[12px] tabular-nums font-medium ${chartDeltaInfo.colorClass}`}>
                  {chartDeltaInfo.text}
                </span>
              )}
            </div>

            {/* Range Toggle: 30d / 90d / 1y / All */}
            <div className="inline-flex p-0.5 bg-[#F1F5F9] rounded-[6px] border border-[#E2E8F0] self-start sm:self-auto">
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
                      ? 'bg-[#FFFFFF] text-[#0F172A] border border-[#E2E8F0] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Canvas & Tooltip */}
          {chartPointsWithMA.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-[#64748B]">
              No entries logged for {activeMetricTitle.toLowerCase()}. Click "Add Measurement" to record.
            </div>
          ) : (
            <div
              className={`relative w-full ${
                privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
              }`}
            >
              <div ref={chartContainerRef} className="h-60 sm:h-64 w-full relative">
                {(() => {
                  const allVals = chartPointsWithMA.flatMap((p) => [p.normalizedValue, p.movingAvg]);
                  const rawMin = Math.min(...allVals);
                  const rawMax = Math.max(...allVals);
                  
                  const scale = getNiceScale(rawMin, rawMax, 4);
                  const min = scale.min;
                  const span = scale.span;

                  const leftPad = 48;
                  const rightPad = Math.max(leftPad + 120, chartWidth - 24);
                  const plotWidth = rightPad - leftPad;
                  const topPad = 20;
                  const bottomPad = 200;
                  const plotHeight = bottomPad - topPad;

                  const gridlines = scale.ticks.map((val) => {
                    const y = bottomPad - ((val - min) / span) * plotHeight;
                    return { y, val };
                  });

                  // Chronological X-axis spacing with collision prevention
                  const firstTime = new Date(chartPointsWithMA[0].date).getTime();
                  const lastTime = new Date(chartPointsWithMA[chartPointsWithMA.length - 1].date).getTime();
                  const totalTimeSpan = lastTime - firstTime;

                  const initialX = chartPointsWithMA.map((p, idx) => {
                    if (chartPointsWithMA.length === 1) return leftPad + plotWidth / 2;
                    if (totalTimeSpan <= 0) return leftPad + (idx / (chartPointsWithMA.length - 1)) * plotWidth;
                    const t = new Date(p.date).getTime();
                    return leftPad + ((t - firstTime) / totalTimeSpan) * plotWidth;
                  });

                  // Ensure minimum 24px between consecutive points
                  const xPositions = [...initialX];
                  for (let i = 1; i < xPositions.length; i++) {
                    if (xPositions[i] - xPositions[i - 1] < 24) {
                      xPositions[i] = xPositions[i - 1] + 24;
                    }
                  }
                  // Normalize back into [leftPad, rightPad]
                  const maxX = xPositions[xPositions.length - 1];
                  if (maxX > rightPad) {
                    const rescale = plotWidth / (maxX - leftPad);
                    for (let i = 0; i < xPositions.length; i++) {
                      xPositions[i] = leftPad + (xPositions[i] - leftPad) * rescale;
                    }
                  }

                  const mapped = chartPointsWithMA.map((p, idx) => {
                    const x = xPositions[idx];
                    const yRaw = bottomPad - ((p.normalizedValue - min) / span) * plotHeight;
                    const yMA = bottomPad - ((p.movingAvg - min) / span) * plotHeight;
                    return { ...p, x, yRaw, yMA };
                  });

                  const linePathStr = mapped
                    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yRaw.toFixed(1)}`)
                    .join(' ');

                  const areaPathStr = mapped.length > 1
                    ? `${linePathStr} L ${mapped[mapped.length - 1].x.toFixed(1)} ${bottomPad} L ${mapped[0].x.toFixed(1)} ${bottomPad} Z`
                    : '';

                  const showMA = mapped.some((p) => Math.abs(p.normalizedValue - p.movingAvg) > 0.1);
                  const maPathStr = showMA
                    ? mapped
                        .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yMA.toFixed(1)}`)
                        .join(' ')
                    : '';

                  // Visible date markers on X axis (avoid overlapping text)
                  const dateMarkers: { id: string; x: number; text: string }[] = [];
                  let prevLabelX = -100;
                  if (mapped.length > 0) {
                    dateMarkers.push({ id: mapped[0].id, x: mapped[0].x, text: mapped[0].date });
                    prevLabelX = mapped[0].x;
                  }
                  for (let i = 1; i < mapped.length - 1; i++) {
                    const pt = mapped[i];
                    const distEnd = mapped[mapped.length - 1].x - pt.x;
                    if (pt.x - prevLabelX >= 75 && distEnd >= 75) {
                      dateMarkers.push({ id: pt.id, x: pt.x, text: pt.date });
                      prevLabelX = pt.x;
                    }
                  }
                  if (mapped.length > 1) {
                    const lastPt = mapped[mapped.length - 1];
                    if (lastPt.x - prevLabelX >= 55) {
                      dateMarkers.push({ id: lastPt.id, x: lastPt.x, text: lastPt.date });
                    }
                  }

                  return (
                    <>
                      <svg
                        className="w-full h-full overflow-visible"
                        viewBox={`0 0 ${chartWidth} 240`}
                      >
                        <defs>
                          <linearGradient id="metricChartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0F172A" stopOpacity="0.07" />
                            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.00" />
                          </linearGradient>
                        </defs>

                        {/* Grid lines and Y-axis scale */}
                        {gridlines.map((gl, i) => (
                          <g key={i}>
                            <line
                              x1={leftPad}
                              y1={gl.y}
                              x2={rightPad}
                              y2={gl.y}
                              stroke="#E2E8F0"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                            <text
                              x={leftPad - 8}
                              y={gl.y + 3.5}
                              textAnchor="end"
                              fontSize="11"
                              fill="#64748B"
                              fontFamily="sans-serif"
                              className="tabular-nums"
                            >
                              {gl.val}
                            </text>
                          </g>
                        ))}

                        {/* Soft Area fill under curve */}
                        {areaPathStr && (
                          <path
                            d={areaPathStr}
                            fill="url(#metricChartGrad)"
                          />
                        )}

                        {/* 7-day Moving Average (if different from raw) */}
                        {showMA && (
                          <path
                            d={maPathStr}
                            fill="none"
                            stroke="#2563EB"
                            strokeWidth="1.5"
                            strokeDasharray="4 4"
                            strokeLinecap="round"
                          />
                        )}

                        {/* Main Trend Line */}
                        <path
                          d={linePathStr}
                          fill="none"
                          stroke="#0F172A"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Point Circles */}
                        {mapped.map((p) => {
                          const isHovered = hoveredPoint?.date === p.date;
                          return (
                            <g key={p.id}>
                              {/* Outer white ring */}
                              <circle
                                cx={p.x}
                                cy={p.yRaw}
                                r={isHovered ? 5.5 : 4}
                                fill="#FFFFFF"
                                stroke="#0F172A"
                                strokeWidth={isHovered ? 2.5 : 2}
                                className="transition-all duration-150"
                              />
                              {/* Inner dark center */}
                              <circle
                                cx={p.x}
                                cy={p.yRaw}
                                r={isHovered ? 2.5 : 1.5}
                                fill="#0F172A"
                              />
                              {/* Invisible hit area */}
                              <circle
                                cx={p.x}
                                cy={p.yRaw}
                                r="16"
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => {
                                  setHoveredPoint({
                                    x: p.x,
                                    y: p.yRaw,
                                    date: p.date,
                                    rawVal: p.normalizedValue,
                                    movingAvg: p.movingAvg,
                                    unit: p.displayUnit,
                                    note: p.note,
                                    originalVal: p.originalValue,
                                    originalUnit: p.originalUnit,
                                    isConverted: p.isConverted,
                                  });
                                }}
                                onMouseLeave={() => setHoveredPoint(null)}
                              />
                            </g>
                          );
                        })}
                      </svg>

                      {/* Tooltip */}
                      {hoveredPoint && (
                        <div
                          style={{
                            left: `${hoveredPoint.x}px`,
                            top: `${Math.max(10, hoveredPoint.y - 82)}px`,
                          }}
                          className="absolute -translate-x-1/2 pointer-events-none z-30 bg-[#FFFFFF] text-[#0F172A] border border-[#E2E8F0] p-2.5 rounded-[6px] text-xs shadow-md space-y-1 min-w-[145px]"
                        >
                          <div className="font-medium text-[#0F172A] border-b border-[#E2E8F0] pb-1 tabular-nums flex items-center justify-between">
                            <span>{hoveredPoint.date}</span>
                            {hoveredPoint.isConverted && (
                              <span className="text-[9px] font-mono uppercase bg-[#F1F5F9] px-1 py-0.5 rounded text-[#64748B]">
                                {hoveredPoint.originalVal} {hoveredPoint.originalUnit}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] gap-2 tabular-nums">
                            <span className="text-[#64748B]">Recorded:</span>
                            <span className="font-semibold text-[#0F172A]">
                              {hoveredPoint.rawVal} {hoveredPoint.unit}
                            </span>
                          </div>
                          {showMA && (
                            <div className="flex items-center justify-between text-[11px] gap-2 tabular-nums">
                              <span className="text-[#2563EB]">7d Trend:</span>
                              <span className="font-medium text-[#2563EB]">
                                {hoveredPoint.movingAvg} {hoveredPoint.unit}
                              </span>
                            </div>
                          )}
                          {hoveredPoint.note && (
                            <div className="text-[10px] text-[#64748B] italic pt-0.5 border-t border-[#E2E8F0] truncate max-w-[200px]">
                              "{hoveredPoint.note}"
                            </div>
                          )}
                        </div>
                      )}

                      {/* Aligned Chronological Date Labels */}
                      <div className="relative h-6 text-[11px] tabular-nums text-[#64748B] mt-1.5 overflow-hidden">
                        {dateMarkers.map((m) => (
                          <div
                            key={m.id}
                            style={{ left: `${m.x}px` }}
                            className="absolute -translate-x-1/2 whitespace-nowrap"
                          >
                            <span>{m.text}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Recent Entries List */}
          <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-medium text-[#0F172A] uppercase tracking-wider">
                Recent Entries ({activeDataset.length})
              </span>
              <span className="text-[11px] text-[#64748B]">Latest records</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {activeDataset.slice(-6).reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-[13px] py-1.5 px-3 rounded-[4px] bg-[#FFFFFF] border border-[#E2E8F0] hover:border-[#0F172A] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium tabular-nums text-[#0F172A]">
                      {entry.value} {entry.unit}
                    </span>
                    {entry.isConverted && (
                      <span className="text-[10px] text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded font-mono">
                        logged {entry.originalValue} {entry.originalUnit}
                      </span>
                    )}
                    {entry.note && (
                      <span className="text-[#64748B] text-[11px] truncate max-w-[200px] sm:max-w-xs">
                        ({entry.note})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 text-[#64748B] text-[11px] tabular-nums">
                    <span>{entry.date}</span>
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        onDeleteMeasurement(entry.id);
                      }}
                      className="hover:text-[#E11D48] transition-colors p-0.5 cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. APPEARANCE & 3. COLOR PALETTE */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start pt-6 border-t border-[#E2E8F0]">
        {/* Appearance Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <h3 className="font-serif text-[18px] font-normal text-[#0F172A]">Appearance</h3>
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                setIsEditAppearanceOpen(true);
              }}
              className="p-1 rounded-[4px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer"
              title="Edit Appearance"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Avatar Photo Preview */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-[6px] bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-serif flex items-center justify-center text-xl font-normal overflow-hidden flex-shrink-0">
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
                <div className="text-[13px] font-medium text-[#0F172A]">Portrait Profile</div>
                <div className="text-[11px] text-[#64748B]">Visual reference</div>
              </div>
            </div>

            {/* Skin tone swatch */}
            <div className="p-3 rounded-[6px] bg-[#FFFFFF] border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider block">
                  Skin Tone
                </span>
                <span className="text-[13px] font-normal text-[#0F172A]">
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
              <div className="p-3 rounded-[6px] bg-[#FFFFFF] border border-[#E2E8F0]">
                <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider block mb-0.5">
                  Hair
                </span>
                <span className="font-normal text-[#0F172A] block truncate">{appearance.hair}</span>
              </div>

              <div className="p-3 rounded-[6px] bg-[#FFFFFF] border border-[#E2E8F0]">
                <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-wider block mb-0.5">
                  Eye Color
                </span>
                <span className="font-normal text-[#0F172A] block truncate">{appearance.eyeColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Color Palette (lg:col-span-2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <h3 className="font-serif text-[18px] font-normal text-[#0F172A]">Color Palette</h3>
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-medium">
              Wardrobe Alignment
            </span>
          </div>

          {/* Verdict Groups Navigation Summary at Top of Section */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <span className="px-2 py-0.5 rounded-[4px] text-xs font-medium text-[#059669] bg-[#F8FAFC] border border-[#059669]/30">
              Suits You ({activePalette.filter((p) => p.verdict === 'suits').length})
            </span>
            <span className="px-2 py-0.5 rounded-[4px] text-xs font-medium text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0]">
              Neutral ({activePalette.filter((p) => p.verdict === 'neutral').length})
            </span>
            <span className="px-2 py-0.5 rounded-[4px] text-xs font-medium text-[#E11D48] bg-[#F8FAFC] border border-[#E11D48]/30">
              Avoid ({activePalette.filter((p) => p.verdict === 'avoid').length})
            </span>
          </div>

          {/* Grouped Swatches Grid */}
          <div className="space-y-4">
            {(['suits', 'neutral', 'avoid'] as PaletteVerdict[]).map((verdict) => {
              const swatches = activePalette.filter((p) => p.verdict === verdict);
              if (swatches.length === 0) return null;

              const verdictBadge = {
                suits: { label: 'Suits You', color: 'text-[#059669] border-[#059669]/30' },
                neutral: { label: 'Neutral', color: 'text-[#64748B] border-[#E2E8F0]' },
                avoid: { label: 'Avoid', color: 'text-[#E11D48] border-[#E11D48]/30' },
              }[verdict];

              return (
                <div key={verdict} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-[4px] text-[11px] font-medium border bg-[#FFFFFF] ${verdictBadge.color}`}>
                      {verdictBadge.label}
                    </span>
                    <span className="text-[11px] tabular-nums text-[#64748B]">({swatches.length})</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                    {swatches.map((item) => {
                      const warning = paletteSimilarityWarnings[item.id];

                      return (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF] flex flex-col justify-between gap-1.5 group hover:border-[#0F172A] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-5 h-5 rounded-[3px] border border-black/10 flex-shrink-0"
                                style={{ backgroundColor: item.colorHex }}
                                title={item.colorHex}
                              />
                              <div className="min-w-0">
                                <span className="text-[13px] font-medium text-[#0F172A] block truncate">
                                  {item.label}
                                </span>
                                <span className="text-[11px] text-[#64748B] font-mono block">
                                  {item.colorHex}
                                </span>
                              </div>
                            </div>
                          </div>

                          {warning && (
                            <div className="text-[10px] text-[#E11D48] bg-[#F8FAFC] border border-[#E11D48]/30 px-1.5 py-0.5 rounded-[3px] flex items-center gap-1 font-medium truncate">
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

      {/* 4. PERSONALITY & 5. TRAITS (Immutable Character Codex) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pt-6 border-t border-[#E2E8F0]">
        {/* Personality Profiling */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <h3 className="font-serif text-[18px] font-normal text-[#0F172A]">Personality</h3>
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-medium">
              Psychological Typology
            </span>
          </div>

          <div className="space-y-2.5">
            {activePersonality.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF] flex items-start justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium px-1.5 py-0.5 rounded-[4px] bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A]">
                      {p.system}
                    </span>
                    <span className="font-serif text-[15px] font-normal text-[#0F172A]">{p.result}</span>
                    <span className="text-[11px] tabular-nums text-[#64748B]">{p.dateTaken}</span>
                  </div>
                  {p.notes && <p className="text-[#64748B] text-[12px] mt-1">{p.notes}</p>}
                  {p.source && (
                    <span className="text-[11px] text-[#64748B] block mt-1 truncate">
                      Source: {p.source}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Character Traits */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <h3 className="font-serif text-[18px] font-normal text-[#0F172A]">Character Traits</h3>
            <span className="text-[11px] text-[#64748B] uppercase tracking-wider font-medium">
              Core Axioms
            </span>
          </div>

          <div className="space-y-2.5">
            {activeTraits.map((t) => {
              const isStrength = t.kind === 'strength';
              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-[#0F172A]">{t.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-medium border ${
                          isStrength
                            ? 'bg-[#F8FAFC] text-[#059669] border-[#059669]/30'
                            : 'bg-[#F8FAFC] text-[#E11D48] border-[#E11D48]/30'
                        }`}
                      >
                        {isStrength ? 'Strength' : 'Working On'}
                      </span>
                    </div>
                    {t.note && <p className="text-[12px] text-[#64748B] mt-0.5">{t.note}</p>}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`w-2 h-2 rounded-full transition-all ${
                            lvl <= t.level
                              ? isStrength
                                ? 'bg-[#059669]'
                                : 'bg-[#E11D48]'
                              : 'bg-[#E2E8F0]'
                          }`}
                        />
                      ))}
                    </div>
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
            className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-6 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">Add Measurement</h3>
              <button type="button" onClick={() => setIsAddMeasurementOpen(false)}>
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleSaveMeasurement} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
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
            className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-6 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">Edit Appearance</h3>
              <button type="button" onClick={() => setIsEditAppearanceOpen(false)}>
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleSaveAppearance} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
                  Skin Tone Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={appSkinHex}
                    onChange={(e) => setAppSkinHex(e.target.value)}
                    className="w-8 h-8 rounded-[4px] border border-[#E2E8F0] cursor-pointer"
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
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
            className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-6 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">Add Color Swatch</h3>
              <button type="button" onClick={() => setIsAddColorOpen(false)}>
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleSaveColor} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
                  Color Picker
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-9 h-9 rounded-[4px] border border-[#E2E8F0] cursor-pointer"
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
                  Verdict
                </label>
                <CustomSelect
                  value={colorVerdict}
                  options={PALETTE_VERDICT_OPTIONS}
                  onChange={(val) => setColorVerdict(val as PaletteVerdict)}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
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
            className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-6 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">Add Personality Entry</h3>
              <button type="button" onClick={() => setIsAddPersonalityOpen(false)}>
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleSavePersonality} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
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
            className="w-full max-w-md bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] p-6 cursor-default"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
              <h3 className="font-serif text-[20px] font-normal text-[#0F172A]">Add Character Trait</h3>
              <button type="button" onClick={() => setIsAddTraitOpen(false)}>
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>

            <form onSubmit={handleSaveTrait} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
                    Classification
                  </label>
                  <CustomSelect
                    value={traitKind}
                    options={TRAIT_KIND_OPTIONS}
                    onChange={(val) => setTraitKind(val as TraitKind)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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
                <label className="block text-[11px] font-medium uppercase tracking-wider text-[#64748B] mb-1">
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

              <div className="pt-3 border-t border-[#E2E8F0] flex justify-end gap-2">
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
