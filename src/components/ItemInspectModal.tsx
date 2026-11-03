import React, { useState, useEffect, useMemo } from 'react';
import type {
  InventoryItem,
  ItemCondition,
  OwnershipStatus,
  PastReason,
  NumberGroupingOption,
  Transaction,
  PaletteColor,
} from '../types';
import { 
  X, 
  MapPin, 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Scan,
  Tag 
} from 'lucide-react';
import { sfx } from '../utils/audio';
import { CustomSelect } from './CustomSelect';
import { formatCurrency } from '../utils/numberFormat';
import { matchColorPalette } from '../utils/color';

const PAST_REASON_OPTIONS = [
  { id: 'sold', label: 'Sold' },
  { id: 'gifted', label: 'Gifted' },
  { id: 'donated', label: 'Donated' },
  { id: 'retired', label: 'Retired / Worn Out' },
  { id: 'lost', label: 'Lost / Discarded' },
];

interface ItemInspectModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  onChangeStatus: (item: InventoryItem, newStatus: OwnershipStatus, pastReason?: PastReason, pastDate?: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onUpdateItem?: (updated: InventoryItem) => void;
  onDuplicateItem?: (item: InventoryItem) => void;
  onLogWear?: (itemId: string) => void;
  currencySymbol?: string;
  numberGrouping?: NumberGroupingOption;
  wearCount?: number;
  transactions?: Transaction[];
  privacyMode?: boolean;
  palette?: PaletteColor[];
}

const CONDITION_MAP: Record<ItemCondition, { label: string; pct: number; color: string }> = {
  pristine: { label: 'Pristine (Like New)', pct: 100, color: 'bg-[#059669]' },
  seasoned: { label: 'Seasoned (Well-Kept)', pct: 75, color: 'bg-[#2563EB]' },
  worn: { label: 'Worn (Heavy Use)', pct: 45, color: 'bg-[#D97706]' },
  needs_repair: { label: 'Needs Repair', pct: 20, color: 'bg-[#E11D48]' },
};

export const ItemInspectModal: React.FC<ItemInspectModalProps> = ({
  item,
  onClose,
  onChangeStatus,
  onLogWear,
  currencySymbol = '৳',
  numberGrouping = 'bangladeshi',
  wearCount = 0,
  transactions = [],
  privacyMode = false,
  palette = [],
}) => {
  const [selectedPastReason, setSelectedPastReason] = useState<PastReason>('sold');
  const [isChoosingPastReason, setIsChoosingPastReason] = useState(false);
  const [isPhotoExpanded, setIsPhotoExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageFitMode, setImageFitMode] = useState<'contain' | 'cover'>('contain');

  // Multi-image gallery list
  const itemImages = useMemo(() => {
    if (!item) return [];
    if (item.images && item.images.length > 0) return item.images;
    if (item.imageUrl) return [item.imageUrl];
    return [];
  }, [item]);

  const activeImageUrl = itemImages[selectedImageIndex] || item?.imageUrl || '';

  // Reset view state when item changes
  useEffect(() => {
    if (item) {
      setSelectedImageIndex(0);
      setIsChoosingPastReason(false);
      setIsPhotoExpanded(false);
      setZoomLevel(1);
    }
  }, [item]);

  // Handle escape key and arrow navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPhotoExpanded) {
        setIsPhotoExpanded(false);
        setZoomLevel(1);
      } else if (isPhotoExpanded && itemImages.length > 1) {
        if (e.key === 'ArrowLeft') {
          setSelectedImageIndex((idx) => (idx > 0 ? idx - 1 : itemImages.length - 1));
          setZoomLevel(1);
        } else if (e.key === 'ArrowRight') {
          setSelectedImageIndex((idx) => (idx < itemImages.length - 1 ? idx + 1 : 0));
          setZoomLevel(1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPhotoExpanded, itemImages.length]);

  if (!item) return null;

  const currentStatus: OwnershipStatus = item.ownershipStatus || (item.isLocked ? 'wishlist' : 'owned');
  const conditionInfo = CONDITION_MAP[item.condition] || CONDITION_MAP.pristine;
  const costPerWear = wearCount > 0 ? (item.goldValue / wearCount).toFixed(2) : null;
  const initialChar = (item.name[0] || 'V').toUpperCase();
  const linkedTx = transactions.find((t) => t.item_id === item.id);
  const derivedPricePaid = linkedTx ? linkedTx.amount : item.price_paid;
  const paletteMatch = matchColorPalette(item.colorHex, palette);

  const handleSetPast = (reason: PastReason) => {
    sfx.playClick();
    const today = new Date().toISOString().split('T')[0];
    onChangeStatus(item, 'past', reason, today);
    setIsChoosingPastReason(false);
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto cursor-pointer"
      >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#FFFFFF] border border-[#E2E8F0] rounded-[6px] overflow-hidden cursor-default my-8"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: item.colorHex || '#64748B' }}
            />
            <span className="text-[12px] font-medium uppercase tracking-wider text-[#64748B]">
              {item.category} · {item.subCategory || 'General'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[4px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              title="Close inspection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5">
          {/* Main Visual Banner (16:9 Widescreen) */}
          <div className="aspect-video max-h-76 w-full rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] relative overflow-hidden flex items-center justify-center text-3xl text-[#64748B] group shadow-xs">
            {activeImageUrl ? (
              <>
                <img
                  src={activeImageUrl}
                  alt={item.name}
                  onClick={() => {
                    sfx.playClick();
                    setIsPhotoExpanded(true);
                    setZoomLevel(1);
                  }}
                  className={`transition-all duration-200 ${
                    imageFitMode === 'contain'
                      ? 'w-full h-full object-contain p-2.5'
                      : 'w-full h-full object-cover object-[center_15%]'
                  } cursor-zoom-in`}
                />

                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        setImageFitMode((m) => (m === 'contain' ? 'cover' : 'contain'));
                      }}
                      className="bg-[#FFFFFF]/90 backdrop-blur-xs text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] px-2 py-1 rounded-[4px] text-xs font-medium flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                      title={imageFitMode === 'contain' ? 'Switch to Crop / Fill Mode' : 'Switch to Fit Entire Garment'}
                    >
                      <Scan className="w-3.5 h-3.5" />
                      <span>{imageFitMode === 'contain' ? 'Fit' : 'Fill'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sfx.playClick();
                        setIsPhotoExpanded(true);
                        setZoomLevel(1);
                      }}
                      className="bg-[#FFFFFF]/90 backdrop-blur-xs text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] px-2.5 py-1 rounded-[4px] text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      title="Expand Photo for Detailed High-Res Inspection"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Expand</span>
                    </button>
                  </div>
              </>
            ) : (
              <span className="font-semibold text-2xl text-[#94A3B8]">{initialChar}</span>
            )}
          </div>

          {/* Photo Gallery Selector Strip */}
          {itemImages.length > 1 && (
            <div className="flex items-center gap-2 pt-0 pb-1 overflow-x-auto">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                Photos ({itemImages.length}):
              </span>
              {itemImages.map((imgUrl, idx) => {
                const isStudio = imgUrl.endsWith('.png');
                const isFlatlay = imgUrl.includes('flatlay');
                const label = isFlatlay ? 'Flat Lay' : isStudio ? 'Studio Hanger' : 'Real Capture';
                const isSelected = selectedImageIndex === idx;
                return (
                  <button
                    key={imgUrl}
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      setSelectedImageIndex(idx);
                    }}
                    className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] border text-xs font-medium transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-xs'
                        : 'bg-[#FFFFFF] text-[#64748B] hover:text-[#0F172A] border-[#E2E8F0] hover:border-[#CBD5E1]'
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={label}
                      className="w-5 h-5 rounded-[3px] object-cover border border-white/20"
                    />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Item Content Dossier */}
          <div>
            {/* Title & Category Bar */}
            <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-serif text-[24px] font-normal text-[#0F172A]">
                      {item.name}
                    </h2>
                    <div className="text-[13px] text-[#64748B] mt-0.5 flex items-center gap-2">
                      <span>{item.subCategory}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#64748B]" />
                        <span>{item.location || 'Vault'}</span>
                      </span>
                    </div>
                  </div>

                  <div className={`text-right ${privacyMode ? 'filter blur-[6px] hover:filter-none transition-all select-none' : ''}`}>
                    <span className="font-serif text-[22px] font-normal tabular-nums text-[#0F172A] block">
                      {formatCurrency(item.goldValue, currencySymbol, numberGrouping)}
                    </span>
                    {derivedPricePaid !== undefined && (
                      <span className="text-[11px] tabular-nums text-[#64748B] block mt-0.5">
                        Paid: {formatCurrency(derivedPricePaid, currencySymbol, numberGrouping)}
                        {linkedTx && (
                          <span className="ml-1 text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-[#E2E8F0] text-[#0F172A]">
                            Tx
                          </span>
                        )}
                      </span>
                    )}
                    {currentStatus === 'wishlist' && item.targetPrice && (
                      <span className="text-[11px] tabular-nums text-[#64748B]">
                        Target: {formatCurrency(item.targetPrice, currencySymbol, numberGrouping)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Wear Log & Efficiency Box */}
                {currentStatus === 'owned' && (
                  <div className="mb-4 p-3.5 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-xs font-medium text-[#0F172A] mb-0.5">
                          Wear Log
                        </div>
                        <div className="text-[12px] tabular-nums text-[#64748B]">
                          {wearCount} {wearCount === 1 ? 'Wear' : 'Wears'} logged
                        </div>
                      </div>
                      {onLogWear && (
                        <button
                          type="button"
                          onClick={() => {
                            sfx.playEquip();
                            onLogWear(item.id);
                          }}
                          className="editorial-btn-secondary py-1 px-2.5 text-[12px]"
                        >
                          Log Wear (+1)
                        </button>
                      )}
                    </div>

                    <div className={`text-right ${privacyMode ? 'filter blur-[6px] hover:filter-none transition-all select-none' : ''}`}>
                      <div className="text-[11px] text-[#64748B]">Cost / Wear</div>
                      <div className="font-serif text-[16px] tabular-nums font-medium text-[#0F172A]">
                        {costPerWear ? `${formatCurrency(parseFloat(costPerWear), currencySymbol, numberGrouping)}` : 'Unworn'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes / Lore */}
                <div className="p-3.5 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] mb-4">
                  <p className="text-[13px] text-[#64748B] leading-relaxed italic">
                    "{item.lore}"
                  </p>
                </div>

                {/* Condition Bar */}
                <div className="mb-4 p-3.5 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF]">
                  <div className="flex items-center justify-between text-[12px] mb-2">
                    <span className="font-medium text-[#0F172A]">Physical Condition</span>
                    <span className="text-[#64748B]">{conditionInfo.label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${conditionInfo.color} transition-all`}
                      style={{ width: `${conditionInfo.pct}%` }}
                    />
                  </div>
                </div>

                {/* Past Relic Notice if Parted */}
                {currentStatus === 'past' && (
                  <div className="mb-4 p-3 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0] text-[13px]">
                    <div className="font-medium text-[#0F172A] mb-1">
                      Possession Archive
                    </div>
                    <p className="text-[#64748B]">
                      Parted with via <strong className="capitalize text-[#0F172A]">{item.pastReason || 'retiring'}</strong>
                      {item.pastDate ? ` on ${item.pastDate}` : ''}.
                    </p>
                  </div>
                )}

                {/* Expandable Specifications & Detailed Provenance */}
                <div className="mb-4 rounded-[6px] border border-[#E2E8F0] bg-[#FFFFFF] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      setIsSpecsExpanded(!isSpecsExpanded);
                    }}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-[#F8FAFC]/60 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-[#64748B]" />
                      <span className="text-[13px] font-medium text-[#0F172A]">
                        Object Specifications & Details
                      </span>
                      {item.brand && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]">
                          {item.brand}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
                      <span>{isSpecsExpanded ? 'Hide' : 'Expand'}</span>
                      {isSpecsExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isSpecsExpanded && (
                    <div className="p-4 pt-2 border-t border-[#E2E8F0] space-y-3 text-[13px]">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {/* Brand / Maker */}
                        <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0]">
                          <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">
                            Brand / Maker
                          </span>
                          <span className="font-medium text-[#0F172A] block mt-0.5 truncate">
                            {item.brand || 'Unspecified'}
                          </span>
                        </div>

                        {/* Size / Fit */}
                        <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0]">
                          <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">
                            Size / Dimensions
                          </span>
                          <span className="font-medium text-[#0F172A] block mt-0.5 truncate">
                            {item.size || 'Standard'}
                          </span>
                        </div>

                        {/* Seasonality */}
                        <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0]">
                          <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">
                            Season
                          </span>
                          <span className="font-medium text-[#0F172A] block mt-0.5 capitalize truncate">
                            {item.season || 'All Seasons'}
                          </span>
                        </div>

                        {/* Date Acquired */}
                        <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0]">
                          <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">
                            Acquired
                          </span>
                          <span className="font-medium text-[#0F172A] block mt-0.5 tabular-nums truncate">
                            {item.dateAcquired || item.acquired_date || item.created_at?.slice(0, 10) || 'Recorded'}
                          </span>
                        </div>

                        {/* Color & Palette Verdict */}
                        <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0]">
                          <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">
                            Color & Palette
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className="w-2.5 h-2.5 rounded-[2px] border border-black/10 shrink-0"
                              style={{ backgroundColor: item.colorHex || '#64748B' }}
                            />
                            <span className="font-medium text-[#0F172A] truncate">
                              {item.colorName || 'Default'}
                            </span>
                            {paletteMatch?.verdict === 'suits' && (
                              <span className="px-1 py-0.2 rounded text-[10px] font-medium bg-[#059669]/10 text-[#059669] shrink-0">
                                Suits
                              </span>
                            )}
                            {paletteMatch?.verdict === 'avoid' && (
                              <span className="px-1 py-0.2 rounded text-[10px] font-medium bg-[#E11D48]/10 text-[#E11D48] shrink-0">
                                Avoid
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Storage Location */}
                        <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0]">
                          <span className="text-[11px] text-[#64748B] uppercase tracking-wider block">
                            Location
                          </span>
                          <span className="font-medium text-[#0F172A] block mt-0.5 truncate">
                            {item.location || 'Vault'}
                          </span>
                        </div>
                      </div>

                      {/* Linked Ledger Record if present */}
                      {linkedTx && (
                        <div className="p-2.5 rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-[12px]">
                          <div>
                            <span className="text-[#64748B] block">Linked Purchase Ledger Entry:</span>
                            <span className="font-medium text-[#0F172A]">{linkedTx.note || 'Acquisition transaction'}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-serif font-medium text-[#0F172A] tabular-nums block">
                              {formatCurrency(linkedTx.amount, currencySymbol, numberGrouping)}
                            </span>
                            <span className="text-[11px] text-[#64748B] tabular-nums">{linkedTx.date}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ownership Lifecycle Transition Control */}
                <div className="p-3.5 rounded-[6px] bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[12px] font-medium text-[#0F172A] block mb-2">
                    Status:
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {currentStatus !== 'owned' && (
                      <button
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          onChangeStatus(item, 'owned');
                        }}
                        className="editorial-btn-secondary py-1 px-3 text-xs"
                      >
                        Mark as Owned
                      </button>
                    )}

                    {currentStatus !== 'wishlist' && (
                      <button
                        type="button"
                        onClick={() => {
                          sfx.playClick();
                          onChangeStatus(item, 'wishlist');
                        }}
                        className="editorial-btn-secondary py-1 px-3 text-xs"
                      >
                        Move to Wishlist
                      </button>
                    )}

                    {currentStatus !== 'past' && !isChoosingPastReason && (
                      <button
                        type="button"
                        onClick={() => setIsChoosingPastReason(true)}
                        className="editorial-btn-secondary py-1 px-3 text-xs"
                      >
                        Parted With
                      </button>
                    )}
                  </div>

                  {isChoosingPastReason && (
                    <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex items-center gap-2">
                      <span className="text-xs text-[#64748B] shrink-0">Reason:</span>
                      <div className="w-44">
                        <CustomSelect
                          value={selectedPastReason}
                          options={PAST_REASON_OPTIONS}
                          onChange={(val) => setSelectedPastReason(val as PastReason)}
                          buttonClassName="py-1 px-2.5 text-xs"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSetPast(selectedPastReason)}
                        className="editorial-btn-primary py-1 px-3 text-xs shrink-0"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsChoosingPastReason(false)}
                        className="editorial-btn-secondary py-1 px-2.5 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
          </div>
        </div>

        {/* Footer Metrics & Actions */}
        <div className="px-6 py-3.5 bg-[#FFFFFF] border-t border-[#E2E8F0] flex items-center justify-between gap-3">
          <div className={`flex items-center gap-3 text-[13px] text-[#64748B] ${privacyMode ? 'filter blur-[6px] hover:filter-none transition-all select-none' : ''}`}>
            <div className="flex items-center gap-1.5">
              <span>Value:</span>
              <span className="text-[#0F172A] font-medium tabular-nums">
                {formatCurrency(item.goldValue, currencySymbol, numberGrouping)}
              </span>
            </div>
            {derivedPricePaid !== undefined && (
              <div className="flex items-center gap-1.5 border-l border-[#E2E8F0] pl-3">
                <span>Price Paid:</span>
                <span className="text-[#0F172A] font-medium tabular-nums">
                  {formatCurrency(derivedPricePaid, currencySymbol, numberGrouping)}
                </span>
                {linkedTx && (
                  <span className="text-[9px] uppercase tracking-wider px-1 py-0.5 rounded bg-[#E2E8F0] text-[#0F172A]">
                    Linked Tx
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#94A3B8]">
            Archival Record
          </span>
        </div>
      </div>
    </div>

    {/* High-Resolution Photo Expansion Lightbox Modal */}
    {isPhotoExpanded && activeImageUrl && (
      <div
        onClick={() => {
          setIsPhotoExpanded(false);
          setZoomLevel(1);
        }}
        className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 cursor-zoom-out animate-in fade-in duration-200"
      >
        {/* Floating Header */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl flex items-center justify-between text-[#FFFFFF] py-2.5 px-4 rounded-[6px] bg-[#0F172A]/90 border border-white/10 shrink-0"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-[15px] text-white font-semibold tracking-tight">{item.name}</span>
            <span className="text-[12px] text-[#94A3B8]">
              · {itemImages.length > 1 ? `Photo ${selectedImageIndex + 1} of ${itemImages.length}` : 'High-Resolution Inspection'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              className="p-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[12px] font-mono tabular-nums px-1.5 text-white">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
              className="p-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPhotoExpanded(false);
                setZoomLevel(1);
              }}
              className="p-1.5 rounded-[4px] bg-white/10 hover:bg-[#E11D48] text-white transition-colors cursor-pointer ml-3"
              title="Close Inspector (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center High-Res Image Display */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex-1 w-full max-w-5xl relative flex items-center justify-center overflow-auto my-3 p-2 cursor-default"
        >
          {itemImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.playClick();
                  setSelectedImageIndex((idx) => (idx > 0 ? idx - 1 : itemImages.length - 1));
                  setZoomLevel(1);
                }}
                className="absolute left-2 md:left-4 z-10 p-2.5 rounded-full bg-[#0F172A]/80 hover:bg-[#0F172A] border border-white/20 text-white shadow-xl cursor-pointer transition-transform hover:scale-110"
                title="Previous Photo (Left Arrow)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.playClick();
                  setSelectedImageIndex((idx) => (idx < itemImages.length - 1 ? idx + 1 : 0));
                  setZoomLevel(1);
                }}
                className="absolute right-2 md:right-4 z-10 p-2.5 rounded-full bg-[#0F172A]/80 hover:bg-[#0F172A] border border-white/20 text-white shadow-xl cursor-pointer transition-transform hover:scale-110"
                title="Next Photo (Right Arrow)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <img
            src={activeImageUrl}
            alt={item.name}
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            className="max-h-[75vh] max-w-full object-contain rounded-[4px] shadow-2xl transition-transform duration-150 select-none"
          />
        </div>

        {/* Footer Gallery Dots and Instructions */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex flex-col items-center gap-2 py-1"
        >
          {itemImages.length > 1 && (
            <div className="flex items-center gap-2">
              {itemImages.map((u, i) => {
                const isSel = selectedImageIndex === i;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      setSelectedImageIndex(i);
                      setZoomLevel(1);
                    }}
                    className={`h-7 w-7 rounded-[4px] overflow-hidden border transition-all cursor-pointer ${
                      isSel
                        ? 'border-white scale-110 shadow-md ring-2 ring-white/30'
                        : 'border-white/30 opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={u} alt={`Thumb ${i}`} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}

          <div className="text-center text-[12px] text-[#94A3B8]">
            {itemImages.length > 1
              ? 'Use Left/Right arrow keys or click thumbnails to switch photos · Scroll or buttons to zoom'
              : 'Inspect stitching, fabric weave, labels, tags, and physical wear · Scroll or buttons to zoom'}
          </div>
        </div>
      </div>
    )}
  </>
);
};
