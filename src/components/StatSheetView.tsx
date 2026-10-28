import React, { useState, useRef } from 'react';
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
  Eye,
  EyeOff,
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
  Minus,
} from 'lucide-react';
import { sfx } from '../utils/audio';
import { getTodayLocalDateStr } from '../utils/date';
import { CustomSelect } from './CustomSelect';

const MEASUREMENT_TYPE_OPTIONS = [
  { id: 'weight', label: 'Body Weight' },
  { id: 'height', label: 'Height' },
  { id: 'waist', label: 'Waist Circumference' },
  { id: 'chest', label: 'Chest Circumference' },
  { id: 'custom', label: 'Custom Metric' },
];

const PALETTE_VERDICT_OPTIONS = [
  { id: 'suits', label: 'Suits You (Optimal Harmony)' },
  { id: 'neutral', label: 'Neutral (Acceptable Contrast)' },
  { id: 'avoid', label: 'Avoid (Clashes or Washes Out)' },
];

const TRAIT_KIND_OPTIONS = [
  { id: 'strength', label: 'Core Strength' },
  { id: 'working_on', label: 'Deliberate Practice (Working On)' },
];

const TRAIT_LEVEL_OPTIONS = [
  { id: '1', label: 'Level 1 (Initiate)' },
  { id: '2', label: 'Level 2 (Developing)' },
  { id: '3', label: 'Level 3 (Competent)' },
  { id: '4', label: 'Level 4 (Strong / Advanced)' },
  { id: '5', label: 'Level 5 (Mastered / Pinnacle)' },
];

interface StatSheetViewProps {
  measurements: BodyMeasurement[];
  appearance: CharacterAppearance;
  palette: PaletteColor[];
  personality: PersonalityEntry[];
  traits: CharacterTrait[];
  settings: AppSettings;
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
  // Privacy mode toggle (blurs values until hovered/clicked)
  const [privacyMode, setPrivacyMode] = useState(false);

  // Active chart measurement type
  const [activeChartType, setActiveChartType] = useState<MeasurementType>('weight');

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

  // Active measurements (non soft-deleted)
  const activeMeasurements = measurements.filter((m) => !m.deletedAt);
  const activePalette = palette.filter((p) => !p.deletedAt);
  const activePersonality = personality.filter((p) => !p.deletedAt);
  const activeTraits = traits.filter((t) => !t.deletedAt);

  // Get latest measurement for each standard type
  const getLatest = (type: MeasurementType) => {
    const list = activeMeasurements
      .filter((m) => m.type === type)
      .sort((a, b) => b.date.localeCompare(a.date));
    return list[0] || null;
  };

  const latestWeight = getLatest('weight');
  const latestHeight = getLatest('height');
  const latestWaist = getLatest('waist');
  const latestChest = getLatest('chest');

  // Convert measurement display based on preference
  const formatMeasurementValue = (val: number, unit: string) => {
    if (isImperial) {
      if (unit === 'kg') return { val: (val * 2.20462).toFixed(1), unit: 'lbs' };
      if (unit === 'cm') return { val: (val / 2.54).toFixed(1), unit: 'in' };
    }
    return { val: val.toFixed(1), unit };
  };

  // History for selected chart
  const chartHistory = activeMeasurements
    .filter((m) => m.type === activeChartType)
    .sort((a, b) => a.date.localeCompare(b.date));

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
      {/* 0. Section Top Bar: Privacy Mode Toggle & Overview */}
      <div className="ship-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[15px] font-semibold text-[#111113] tracking-tight">
              Character Stat Sheet & Biometrics
            </h2>
            <span className="ship-pill-accent text-[11px] font-semibold">
              Unit: {isImperial ? 'Imperial' : 'Metric'}
            </span>
          </div>
          <p className="text-[13px] text-[#6B6B76] mt-0.5">
            Comprehensive biometrics, physical appearance, harmonic color palette, and traits
          </p>
        </div>

        {/* Privacy Mode Toggle */}
        <button
          type="button"
          onClick={() => {
            sfx.playClick();
            setPrivacyMode(!privacyMode);
          }}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            privacyMode
              ? 'bg-[#111113] border-[#111113] text-white shadow-xs'
              : 'bg-white border-[#ECECF0] text-[#6B6B76] hover:text-[#111113]'
          }`}
          title="Blurs sensitive biometrics until hovered or clicked"
        >
          {privacyMode ? <EyeOff className="w-3.5 h-3.5 text-[#0891B2]" /> : <Eye className="w-3.5 h-3.5" />}
          <span>Privacy Mode: {privacyMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* 1. BODY MEASUREMENTS */}
      <div className="ship-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ECECF0]">
          <div className="flex items-center gap-2.5">
            <div className="ship-icon-tile">
              <Scale className="w-4 h-4 text-[#0891B2]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111113]">Body Measurements & Trends</h3>
              <span className="text-xs text-[#6B6B76]">
                Track biometrics, waist-to-chest ratios, and equilibrium over time
              </span>
            </div>
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

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { type: 'weight' as const, label: 'Weight', latest: latestWeight, fallback: '74.5 kg' },
            { type: 'height' as const, label: 'Height', latest: latestHeight, fallback: '178 cm' },
            { type: 'waist' as const, label: 'Waist', latest: latestWaist, fallback: '79 cm' },
            { type: 'chest' as const, label: 'Chest', latest: latestChest, fallback: '100 cm' },
          ].map(({ type, label, latest }) => {
            const isSelected = activeChartType === type;
            const formatted = latest
              ? formatMeasurementValue(latest.value, latest.unit)
              : null;

            return (
              <div
                key={type}
                onClick={() => {
                  sfx.playClick();
                  setActiveChartType(type);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#E6F7F9]/40 border-[#0891B2] ring-2 ring-[#0891B2]/20 shadow-xs'
                    : 'bg-white border-[#ECECF0] hover:border-[#BEBEC6]'
                }`}
              >
                <div className="text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  {label}
                </div>
                <div
                  className={`text-xl font-semibold text-[#111113] tracking-tight ${
                    privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
                  }`}
                >
                  {formatted ? `${formatted.val} ${formatted.unit}` : 'No data'}
                </div>
                <div className="text-[11px] text-[#9A9AA5] mt-1 truncate">
                  {latest ? `Logged ${latest.date}` : 'Tap to track'}
                </div>
              </div>
            );
          })}
        </div>

        {/* History SVG Line Chart for selected metric */}
        <div className="p-5 rounded-2xl bg-[#F4F4F6] border border-[#ECECF0]">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#ECECF0]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#111113]">
                {activeChartType.toUpperCase()} PROGRESSION CURVE
              </span>
              <span className="text-[11px] text-[#6B6B76] block">
                Historical records over time ({chartHistory.length} data points)
              </span>
            </div>

            {chartHistory.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                {chartHistory[chartHistory.length - 1].value < chartHistory[0].value ? (
                  <span className="text-[#16A34A] flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5" />
                    <span>
                      {(chartHistory[chartHistory.length - 1].value - chartHistory[0].value).toFixed(1)}{' '}
                      {chartHistory[0].unit}
                    </span>
                  </span>
                ) : chartHistory[chartHistory.length - 1].value > chartHistory[0].value ? (
                  <span className="text-[#0891B2] flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>
                      +{(chartHistory[chartHistory.length - 1].value - chartHistory[0].value).toFixed(1)}{' '}
                      {chartHistory[0].unit}
                    </span>
                  </span>
                ) : (
                  <span className="text-[#6B6B76] flex items-center gap-1">
                    <Minus className="w-3.5 h-3.5" /> Neutral
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Minimalist SVG Chart */}
          {chartHistory.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-xs text-[#9A9AA5]">
              No entries logged for {activeChartType}. Click "Add Measurement" to record.
            </div>
          ) : (
            <div
              className={`h-40 w-full relative ${
                privacyMode ? 'filter blur-[6px] hover:filter-none transition-all' : ''
              }`}
            >
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                {(() => {
                  const vals = chartHistory.map((h) => h.value);
                  const min = Math.min(...vals) - 1;
                  const max = Math.max(...vals) + 1;
                  const span = max - min || 1;

                  const points = chartHistory.map((h, i) => {
                    const x = chartHistory.length === 1 ? 250 : (i / (chartHistory.length - 1)) * 480 + 10;
                    const y = 110 - ((h.value - min) / span) * 100;
                    return { x, y, ...h };
                  });

                  const pathStr = points
                    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                    .join(' ');

                  return (
                    <g>
                      {/* Area gradient */}
                      <path
                        d={`${pathStr} L ${points[points.length - 1].x} 120 L ${points[0].x} 120 Z`}
                        fill="#0891B2"
                        fillOpacity="0.08"
                      />
                      {/* Line */}
                      <path d={pathStr} fill="none" stroke="#0891B2" strokeWidth="2.5" strokeLinecap="round" />
                      {/* Points */}
                      {points.map((p) => (
                        <circle
                          key={p.id}
                          cx={p.x}
                          cy={p.y}
                          r="4"
                          fill="#FFFFFF"
                          stroke="#0891B2"
                          strokeWidth="2"
                        />
                      ))}
                    </g>
                  );
                })()}
              </svg>

              {/* Data points timeline bar */}
              <div className="flex items-center justify-between text-[10px] text-[#9A9AA5] mt-2">
                <span>{chartHistory[0].date}</span>
                <span>{chartHistory[chartHistory.length - 1].date}</span>
              </div>

              {/* Recent measurement logs with delete option */}
              <div className="mt-4 pt-3 border-t border-[#ECECF0] space-y-1.5">
                <div className="text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider mb-2">
                  Recent Entries
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {chartHistory.slice(-5).reverse().map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-white border border-[#ECECF0]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#111113]">{entry.value} {entry.unit}</span>
                        {entry.note && <span className="text-[#6B6B76] text-[11px]">({entry.note})</span>}
                      </div>
                      <div className="flex items-center gap-2 text-[#9A9AA5] text-[11px]">
                        <span>{entry.date}</span>
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. APPEARANCE & 3. COLOR PALETTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appearance Card */}
        <div className="ship-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0] mb-4">
              <div className="flex items-center gap-2">
                <div className="ship-icon-tile">
                  <Sparkles className="w-4 h-4 text-[#0891B2]" />
                </div>
                <h3 className="text-sm font-semibold text-[#111113]">Appearance Signatures</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  sfx.playClick();
                  setIsEditAppearanceOpen(true);
                }}
                className="p-1.5 rounded-lg text-[#6B6B76] hover:text-[#111113] hover:bg-[#F4F4F6] transition-colors"
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
                  <div className="text-xs font-semibold text-[#111113]">Visual Benchmark</div>
                  <div className="text-[11px] text-[#6B6B76]">Portrait profile reference</div>
                </div>
              </div>

              {/* Skin tone swatch */}
              <div className="p-3 rounded-xl bg-[#F4F4F6] border border-[#ECECF0] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#6B6B76] uppercase tracking-wider block">
                    Skin Tone
                  </span>
                  <span className="text-xs font-medium text-[#111113]">
                    {appearance.skinToneNote || 'Warm Olive'}
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
        </div>

        {/* Color Palette Card (2 cols) */}
        <div className="ship-card p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0]">
            <div className="flex items-center gap-2">
              <div className="ship-icon-tile">
                <Palette className="w-4 h-4 text-[#0891B2]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#111113]">Harmonic Color Palette</h3>
                <span className="text-xs text-[#6B6B76]">
                  Curated tonal recommendations informing wardrobe and inventory matching
                </span>
              </div>
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

          {/* Grouped Swatches Grid */}
          <div className="space-y-4">
            {(['suits', 'neutral', 'avoid'] as PaletteVerdict[]).map((verdict) => {
              const swatches = activePalette.filter((p) => p.verdict === verdict);
              if (swatches.length === 0) return null;

              const verdictBadge = {
                suits: { label: 'Suits You (Optimal)', color: 'text-[#16A34A] bg-[#E6F6EC]' },
                neutral: { label: 'Neutral (Acceptable)', color: 'text-[#6B6B76] bg-[#F4F4F6]' },
                avoid: { label: 'Avoid (Clashing / Dulling)', color: 'text-[#DC2626] bg-[#FDECEC]' },
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
                    {swatches.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl border border-[#ECECF0] bg-white flex items-center justify-between gap-2 shadow-2xs group"
                      >
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
                            <span className="text-[10px] text-[#9A9AA5] block font-mono">
                              {item.colorHex}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeletePaletteColor(item.id)}
                          className="p-1 rounded text-[#9A9AA5] hover:text-[#DC2626] transition-colors opacity-0 group-hover:opacity-100"
                          title="Delete color"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. PERSONALITY & 5. TRAITS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personality Profiling */}
        <div className="ship-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0]">
            <div className="flex items-center gap-2">
              <div className="ship-icon-tile">
                <Brain className="w-4 h-4 text-[#0891B2]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#111113]">Psychometrics & Personality</h3>
                <span className="text-xs text-[#6B6B76]">
                  Standard psychometric assessments (MBTI, Enneagram, Big Five)
                </span>
              </div>
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
                    <span className="font-semibold text-[#111113]">{p.result}</span>
                  </div>
                  {p.notes && <p className="text-[#6B6B76] leading-relaxed mt-1">{p.notes}</p>}
                  <span className="text-[10px] text-[#9A9AA5] mt-1 block">
                    Taken on {p.dateTaken} {p.source ? `• via ${p.source}` : ''}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onDeletePersonality(p.id)}
                  className="p-1 rounded text-[#9A9AA5] hover:text-[#DC2626] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Traits & Competencies */}
        <div className="ship-card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ECECF0]">
            <div className="flex items-center gap-2">
              <div className="ship-icon-tile">
                <Award className="w-4 h-4 text-[#0891B2]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#111113]">Character Traits & Edge</h3>
                <span className="text-xs text-[#6B6B76]">
                  Calibrated core strengths and areas of deliberate practice
                </span>
              </div>
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

          <div className="space-y-2.5">
            {activeTraits.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl border border-[#ECECF0] bg-white flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        t.kind === 'strength'
                          ? 'bg-[#E6F7F9] text-[#0891B2]'
                          : 'bg-[#FDECEC] text-[#DC2626]'
                      }`}
                    >
                      {t.kind === 'strength' ? 'Core Strength' : 'Working On'}
                    </span>
                    <span className="font-semibold text-[#111113] truncate">{t.name}</span>
                  </div>
                  {t.note && <p className="text-[#6B6B76] text-[11px] truncate">{t.note}</p>}
                </div>

                {/* Level 1-5 Indicator */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <div
                      key={lvl}
                      className={`w-2.5 h-2.5 rounded-full ${
                        lvl <= t.level
                          ? t.kind === 'strength'
                            ? 'bg-[#0891B2]'
                            : 'bg-[#DC2626]'
                          : 'bg-[#ECECF0]'
                      }`}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => onDeleteTrait(t.id)}
                    className="ml-2 p-1 text-[#9A9AA5] hover:text-[#DC2626] transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL 1: ADD MEASUREMENT */}
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
              <h3 className="text-base font-semibold text-[#111113]">Add Biometric Measurement</h3>
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
                    placeholder="e.g. Bicep, Resting Heart Rate, Body Fat %"
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
                    placeholder="74.5"
                    className="ship-input w-full px-3 py-2 text-xs"
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
                    placeholder="kg, cm, lbs, in"
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
                  placeholder="e.g. Post-workout morning weigh-in"
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT APPEARANCE */}
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
              <h3 className="text-base font-semibold text-[#111113]">Edit Appearance Signatures</h3>
              <button onClick={() => setIsEditAppearanceOpen(false)}>
                <X className="w-4 h-4 text-[#6B6B76]" />
              </button>
            </div>

            <form onSubmit={handleSaveAppearance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Skin Tone Color & Note
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="color"
                    value={appSkinHex}
                    onChange={(e) => setAppSkinHex(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-[#ECECF0]"
                  />
                  <input
                    type="text"
                    value={appSkinHex}
                    onChange={(e) => setAppSkinHex(e.target.value)}
                    className="ship-input w-28 px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <input
                  type="text"
                  value={appSkinNote}
                  onChange={(e) => setAppSkinNote(e.target.value)}
                  placeholder="e.g. Warm golden olive undertones"
                  className="ship-input w-full px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Hair Style & Tone
                </label>
                <input
                  type="text"
                  value={appHair}
                  onChange={(e) => setAppHair(e.target.value)}
                  placeholder="e.g. Dark Espresso Brown, textured crop"
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Eye Color
                </label>
                <input
                  type="text"
                  value={appEye}
                  onChange={(e) => setAppEye(e.target.value)}
                  placeholder="e.g. Deep Hazel / Amber"
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Photo URL or Upload
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={appPhoto}
                    onChange={(e) => setAppPhoto(e.target.value)}
                    placeholder="/avatar.jpg or https://..."
                    className="ship-input flex-1 px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl border border-[#ECECF0] bg-[#F4F4F6] text-xs font-medium text-[#111113] hover:bg-[#EAEAEF] flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#0891B2]" />
                    <span>Upload</span>
                  </button>
                  <input
                    type="file"
                    ref={photoInputRef}
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs"
                >
                  Save Appearance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD PALETTE SWATCH */}
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
              <h3 className="text-base font-semibold text-[#111113]">Add Harmonic Palette Swatch</h3>
              <button onClick={() => setIsAddColorOpen(false)}>
                <X className="w-4 h-4 text-[#6B6B76]" />
              </button>
            </div>

            <form onSubmit={handleSaveColor} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Color Swatch & Hex Code
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="w-12 h-10 rounded-xl cursor-pointer border border-[#ECECF0]"
                  />
                  <input
                    type="text"
                    required
                    value={colorHex}
                    onChange={(e) => setColorHex(e.target.value)}
                    className="ship-input flex-1 px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Color Label / Name
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
                  placeholder="e.g. Ideal for base knitwear and outerwear"
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs"
                >
                  Save Swatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD PERSONALITY */}
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
              <h3 className="text-base font-semibold text-[#111113]">Add Personality Assessment</h3>
              <button onClick={() => setIsAddPersonalityOpen(false)}>
                <X className="w-4 h-4 text-[#6B6B76]" />
              </button>
            </div>

            <form onSubmit={handleSavePersonality} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  System / Framework
                </label>
                <input
                  type="text"
                  required
                  value={persSystem}
                  onChange={(e) => setPersSystem(e.target.value)}
                  placeholder="e.g. MBTI, Enneagram, Big Five, CliftonStrengths"
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Result / Type
                </label>
                <input
                  type="text"
                  required
                  value={persResult}
                  onChange={(e) => setPersResult(e.target.value)}
                  placeholder="e.g. INTJ-A, Type 5w6, Strategic"
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Date Taken
                </label>
                <input
                  type="date"
                  value={persDate}
                  onChange={(e) => setPersDate(e.target.value)}
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Source / Test Provider
                </label>
                <input
                  type="text"
                  value={persSource}
                  onChange={(e) => setPersSource(e.target.value)}
                  placeholder="e.g. 16Personalities, Truity, Official Practitioner"
                  className="ship-input w-full px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6B6B76] uppercase tracking-wider mb-1">
                  Key Insights & Behavioral Notes
                </label>
                <textarea
                  rows={2}
                  value={persNotes}
                  onChange={(e) => setPersNotes(e.target.value)}
                  placeholder="Summary of cognitive preferences or strengths..."
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs"
                >
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD TRAIT */}
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
                  Behavioral Note & Evidence
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
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#0891B2] hover:bg-[#0E7490] text-white shadow-xs"
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
