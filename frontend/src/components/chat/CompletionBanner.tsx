'use client';

interface CompletionBannerProps {
  onNavigate: () => void;
}

export default function CompletionBanner({ onNavigate }: CompletionBannerProps) {
  return (
    <div className="px-4 py-6 sm:px-6 animate-slide-up">
      <div className="max-w-md mx-auto bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl px-6 py-6 text-center shadow-lg">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="white"
              className="w-8 h-8"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <p className="text-xl font-bold text-gray-900 mb-1">
          Assessment Complete
        </p>
        <p className="text-sm text-gray-600 mb-5">
          Thank you for completing the assessment. A comprehensive report is being generated based on your responses.
        </p>
        <button
          onClick={onNavigate}
          aria-label="Return to Dashboard"
          className="min-h-[44px] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white
            px-8 py-2.5 rounded-full font-medium
            shadow-md hover:shadow-lg
            transition-all duration-200"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
