import React from 'react';
import { Sparkles, DollarSign } from 'lucide-react';

interface EmptyPageViewProps {
  title: string;
  type: 'bucket-list' | 'money';
}

export const EmptyPageView: React.FC<EmptyPageViewProps> = ({ title, type }) => {
  const Icon = type === 'bucket-list' ? Sparkles : DollarSign;
  const description =
    type === 'bucket-list'
      ? 'Track aspirational life goals, travel expeditions, and milestone experiences.'
      : 'Track net worth, asset allocations, cash flow, and monthly financial metrics.';

  return (
    <div className="space-y-6">
      <div className="ship-card p-12 flex flex-col items-center justify-center text-center min-h-[380px]">
        <div className="w-12 h-12 rounded-2xl bg-[#E6F7F9] border border-[#BCE7EB] flex items-center justify-center mb-4 text-[#0891B2]">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-[#111113] tracking-tight">{title}</h3>
        <p className="text-sm text-[#6B6B76] max-w-md mt-1.5 leading-relaxed">
          {description}
        </p>
        <span className="mt-4 px-3 py-1 rounded-full text-xs font-semibold bg-[#F4F4F6] text-[#9A9AA5] border border-[#ECECF0]">
          Feature in development
        </span>
      </div>
    </div>
  );
};
