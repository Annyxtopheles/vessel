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
        className={`w-full py-1.5 px-3 text-[13px] rounded-[6px] border border-[#E4DED2] bg-[#FBF9F4] flex items-center justify-between gap-2 text-[#1F1B16] hover:border-[#1F1B16] transition-colors cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 truncate">
          {IconComponent && <IconComponent className="w-3.5 h-3.5 text-[#6B645A] shrink-0" />}
          <span className="truncate text-[#1F1B16] font-normal">
            {currentOption ? currentOption.label : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#6B645A] shrink-0 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-1 min-w-full max-h-60 overflow-y-auto bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-1 z-50 ${dropdownClassName}`}
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
                className={`w-full px-2.5 py-1.5 rounded-[4px] text-[13px] text-left transition-colors flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-[#F6F2EA] text-[#1F1B16] font-medium'
                    : 'text-[#1F1B16] hover:bg-[#F6F2EA]/60 font-normal'
                }`}
              >
                <div className="flex flex-col truncate pr-2">
                  <span className="truncate">{opt.label}</span>
                  {opt.sublabel && (
                    <span className="text-[11px] text-[#6B645A] truncate">{opt.sublabel}</span>
                  )}
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#1F1B16] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
