import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { sfx } from '../utils/audio';

export interface SelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (val: string) => void;
  icon?: React.ComponentType<{ className?: string }>;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  options,
  onChange,
  icon: IconComponent,
  placeholder = 'Select...',
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = options.find((o) => String(o.id) === String(value));

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          sfx.playClick();
          setIsOpen(!isOpen);
        }}
        className={`w-full ship-input py-2 px-3 text-xs flex items-center justify-between gap-2.5 bg-white cursor-pointer hover:border-[#0891B2]/50 transition-colors shadow-2xs ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {IconComponent && <IconComponent className="w-3.5 h-3.5 text-[#0891B2] shrink-0" />}
          <span className="truncate text-[#111113] font-medium">
            {currentOption ? currentOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#9A9AA5] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1.5 min-w-full max-h-60 overflow-y-auto bg-white border border-[#ECECF0] rounded-xl shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 ${dropdownClassName}`}
        >
          {options.map((opt) => {
            const isSelected = String(opt.id) === String(value);
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  sfx.playClick();
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#E6F7F9] text-[#0891B2] font-semibold'
                    : 'text-[#111113] hover:bg-[#F4F4F6] font-normal'
                }`}
              >
                <div className="flex flex-col truncate pr-2">
                  <span className="truncate">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-[10px] text-[#9A9AA5] truncate">{opt.sublabel}</span>
                  )}
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#0891B2] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
