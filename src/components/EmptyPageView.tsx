import React from 'react';

interface EmptyPageViewProps {
  title: string;
  type: 'bucket-list' | 'money';
}

export const EmptyPageView: React.FC<EmptyPageViewProps> = ({ title, type }) => {
  const description =
    type === 'bucket-list'
      ? 'Track aspirational life goals, travel expeditions, and milestone experiences.'
      : 'Track net worth, asset allocations, cash flow, and monthly financial metrics.';

  return (
    <div className="space-y-6">
      <div className="bg-[#FBF9F4] border border-[#E4DED2] rounded-[6px] p-12 flex flex-col items-center justify-center text-center min-h-[360px]">
        <h3 className="font-serif text-[24px] font-normal text-[#1F1B16]">{title}</h3>
        <p className="text-[14px] text-[#6B645A] max-w-md mt-2 leading-relaxed">
          {description}
        </p>
        <span className="mt-4 px-2.5 py-1 rounded-[4px] text-xs font-medium bg-[#EFEAE0] text-[#6B645A] border border-[#E4DED2]">
          In development
        </span>
      </div>
    </div>
  );
};
