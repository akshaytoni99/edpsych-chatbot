'use client';

import { useState, useCallback } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled: boolean;
  placeholder: string;
  validationFeedback?: string | null;
}

export default function ChatInput({ onSend, disabled, placeholder, validationFeedback }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed && !disabled) {
        onSend(trimmed);
        setValue('');
      }
    },
    [value, disabled, onSend]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed && !disabled) {
          onSend(trimmed);
          setValue('');
        }
      }
    },
    [value, disabled, onSend]
  );

  return (
    <div className="bg-white border-t border-gray-200 px-3 py-2 sm:px-6 sm:py-3 shadow-lg">
      <div className="max-w-4xl mx-auto">
        {/* Validation feedback */}
        {validationFeedback && (
          <div className="mb-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg animate-slide-up">
            <p className="text-xs text-amber-700 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0">
                <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
              </svg>
              Please provide more detail for a better assessment
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              aria-label="Type your message"
              className="w-full min-h-[44px] max-h-[120px] border-2 border-gray-200 rounded-2xl px-5 py-2.5
                focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
                disabled:opacity-50 disabled:cursor-not-allowed
                text-gray-800 placeholder-gray-400 text-sm
                resize-none overflow-hidden transition-colors"
              style={{ height: 'auto' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
              }}
            />
            {value.length > 0 && (
              <span className="absolute right-3 bottom-2 text-[10px] text-gray-400">
                {value.length}
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            aria-label="Send message"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center
              bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white
              rounded-full px-5 py-2.5
              shadow-md hover:shadow-lg
              transition-all duration-200
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-md disabled:from-gray-400 disabled:to-gray-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
