'use client';

import { McqOption } from '@/src/types/chat';

interface McqOptionsProps {
  options: McqOption[];
  onSelect: (option: McqOption) => void;
  disabled: boolean;
}

export default function McqOptions({ options, onSelect, disabled }: McqOptionsProps) {
  return (
    <div className="px-3 py-2 sm:px-6 sm:py-3 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <p className="text-[11px] text-gray-500 mb-1.5 font-medium">Choose an option:</p>
        <div className="flex flex-wrap gap-1.5 sm:grid sm:grid-cols-2 sm:gap-2">
          {options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => onSelect(option)}
              disabled={disabled}
              aria-label={`Select: ${option.label}`}
              className={`min-h-[36px] sm:min-h-[44px] px-3 py-1.5 sm:px-5 sm:py-3 bg-white border-2 border-indigo-200 text-gray-800 rounded-xl
                hover:bg-indigo-50 hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5
                active:bg-indigo-100 active:translate-y-0
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-indigo-200 disabled:hover:shadow-none disabled:hover:translate-y-0
                font-medium text-xs sm:text-sm text-left
                animate-slide-up`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <span className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] sm:text-xs font-bold flex-shrink-0">
                  {String.fromCharCode(65 + index)}
                </span>
                {option.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
