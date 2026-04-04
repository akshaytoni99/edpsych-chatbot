'use client';

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 justify-start animate-fade-in" role="status" aria-label="Preparing response">
      {/* Bot Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mb-1 shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
          <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 20.97V18.5a48.648 48.648 0 0 1-1.087-.058C2.99 18.22 1.5 16.614 1.5 14.656V6.385c0-1.866 1.369-3.477 3.413-3.727ZM17.04 7.008a48.114 48.114 0 0 0-7.832 0C7.548 7.186 6.5 8.67 6.5 10.2v4.287c0 1.53 1.048 3.013 2.708 3.191a46.604 46.604 0 0 0 3.063.215l3.26 3.026a.75.75 0 0 0 1.27-.543v-2.323c1.66-.178 2.708-1.66 2.708-3.191V10.2c-.001-1.53-1.05-3.014-2.469-3.192Z" />
        </svg>
      </div>

      <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-md border border-gray-100 max-w-[75%]">
        <div className="flex space-x-1">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
