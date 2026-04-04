'use client';

import { McqOption } from '@/src/types/chat';

interface McqOptionsProps {
  options: McqOption[];
  onSelect: (option: McqOption) => void;
  disabled: boolean;
}

export default function McqOptions({ options, onSelect, disabled }: McqOptionsProps) {
  return (
    <div className="px-3 py-2 sm:px-6 sm:py-3 border-t border-gray-100/80 bg-gradient-to-t from-gray-50 to-white/80">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap gap-1.5 sm:grid sm:grid-cols-2 sm:gap-2">
          {options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => onSelect(option)}
              disabled={disabled}
              aria-label={`Select: ${option.label}`}
              className={`group flex-1 min-w-[calc(50%-4px)] sm:min-w-0 min-h-[36px] sm:min-h-[44px] px-3 py-1.5 sm:px-4 sm:py-2.5
                bg-white border border-gray-200
                text-gray-700 rounded-lg sm:rounded-xl
                hover:bg-indigo-50/50 hover:border-indigo-300 hover:text-indigo-900
                hover:shadow-md hover:shadow-indigo-100/50
                active:bg-indigo-100/60
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
                transition-all duration-150
                disabled:opacity-40 disabled:cursor-not-allowed
                text-left mcq-option-enter`}
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gray-100 text-gray-500
                  group-hover:bg-indigo-100 group-hover:text-indigo-600
                  flex items-center justify-center text-[10px] sm:text-[11px] font-bold flex-shrink-0
                  transition-colors duration-150">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-xs sm:text-sm font-medium leading-tight">
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
