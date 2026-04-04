'use client';

interface CompletionBannerProps {
  onNavigate: () => void;
}

export default function CompletionBanner({ onNavigate }: CompletionBannerProps) {
  return (
    <div className="px-4 py-8 sm:px-6 sm:py-10 animate-scale-in">
      <div className="max-w-sm mx-auto text-center">
        {/* Success icon */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-emerald-200/50">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-8 h-8"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" className="animate-check-draw" />
              </svg>
            </div>
            {/* Decorative ring */}
            <div className="absolute -inset-2 rounded-2xl rotate-3 border-2 border-emerald-200/50 animate-subtle-pulse" />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 tracking-tight">
          Assessment Complete
        </h2>
        <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-7 max-w-xs mx-auto">
          Thank you for completing the assessment. A comprehensive report is being generated based on your responses.
        </p>

        {/* CTA Button */}
        <button
          onClick={onNavigate}
          aria-label="Return to Dashboard"
          className="inline-flex items-center gap-2 min-h-[48px]
            bg-gradient-to-r from-indigo-500 to-indigo-600
            hover:from-indigo-600 hover:to-indigo-700
            text-white px-8 py-3 rounded-xl font-semibold text-sm sm:text-base
            shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-200/60
            transition-all duration-200 hover:-translate-y-0.5
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 10.414l-7-7-7 7A1 1 0 0 1 1.586 9.293l7-7ZM2 17.5A1.5 1.5 0 0 1 3.5 16h13a1.5 1.5 0 0 1 0 3h-13A1.5 1.5 0 0 1 2 17.5Z" clipRule="evenodd" />
          </svg>
          Return to Dashboard
        </button>

        {/* Subtle reassurance */}
        <p className="mt-4 text-[11px] text-gray-400 font-medium">
          Your responses have been securely saved
        </p>
      </div>
    </div>
  );
}
