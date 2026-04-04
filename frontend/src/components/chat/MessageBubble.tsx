'use client';

import { ChatMessage } from '@/src/types/chat';

interface MessageBubbleProps {
  message: ChatMessage;
  isLatest?: boolean;
}

export default function MessageBubble({ message, isLatest }: MessageBubbleProps) {
  const timestamp = new Date(message.timestamp);
  const timeString = timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // System messages
  if (message.role === 'system') {
    return (
      <div className="flex justify-center my-3 animate-fade-in">
        <div className="max-w-[85%] text-center">
          <p className="text-[13px] text-gray-500 bg-gray-100/60 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/40 font-medium">
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  const isUser = message.role === 'user';
  const isValidation = message.isValidationFeedback;

  return (
    <div
      className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} ${isLatest ? 'animate-slide-up' : 'animate-fade-in'}`}
    >
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm shadow-indigo-200/50">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7Z" />
            <path d="M10 21h4" />
            <path d="M12 6v4" />
            <path d="M10 10h4" />
          </svg>
        </div>
      )}

      <div
        className={`max-w-[78%] sm:max-w-[72%] px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-indigo-200/30'
            : isValidation
            ? 'bg-amber-50 text-amber-900 border border-amber-200/80 rounded-2xl rounded-bl-sm'
            : 'bg-white text-gray-800 border border-gray-150 rounded-2xl rounded-bl-sm shadow-sm'
        }`}
      >
        <p className={`whitespace-pre-wrap text-[14px] sm:text-[15px] leading-relaxed ${
          isUser ? 'text-white/95' : ''
        }`}>
          {message.content}
        </p>
        <p
          className={`text-[10px] mt-1.5 font-medium ${
            isUser ? 'text-indigo-200/70' : isValidation ? 'text-amber-400' : 'text-gray-300'
          }`}
        >
          {timeString}
        </p>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center flex-shrink-0 mb-0.5 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
            <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}
