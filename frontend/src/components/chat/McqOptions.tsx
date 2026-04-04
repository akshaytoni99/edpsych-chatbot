'use client';

import { McqOption } from '@/src/types/chat';

interface McqOptionsProps {
  options: McqOption[];
  onSelect: (option: McqOption) => void;
  disabled: boolean;
}

export default function McqOptions({ options, onSelect, disabled }: McqOptionsProps) {
  return (
    <div className="px-3 py-3 sm:px-6 sm:py-4 border-t border-gray-100/80 bg-gradient-to-t from-gray-50 to-white/80 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto">
        <p className="text-[11px] sm:text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wider">
          Select an option
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
          {options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => onSelect(option)}
              disabled={disabled}
              aria-label={`Select: ${option.label}`}
              className={`group relative min-h-[44px] sm:min-h-[52px] px-4 py-2.5 sm:px-5 sm:py-3.5
                bg-white border border-gray-200
                text-gray-700 rounded-xl
                hover:bg-indigo-50/50 hover:border-indigo-300 hover:text-indigo-900
                hover:shadow-md hover:shadow-indigo-100/50 hover:-translate-y-[1px]
                active:bg-indigo-100/60 active:translate-y-0 active:shadow-sm
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1
                transition-all duration-200 ease-out
                disabled:opacity-40 disabled:cursor-not-allowed
                disabled:hover:bg-white disabled:hover:border-gray-200
                disabled:hover:shadow-none disabled:hover:translate-y-0
                text-left mcq-option-enter`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className="flex items-center gap-2.5 sm:gap-3">
                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-100 text-gray-500
                  group-hover:bg-indigo-100 group-hover:text-indigo-600
                  flex items-center justify-center text-[11px] sm:text-xs font-bold flex-shrink-0
                  transition-colors duration-200">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-sm sm:text-[15px] font-medium leading-snug">
                  {option.label}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
