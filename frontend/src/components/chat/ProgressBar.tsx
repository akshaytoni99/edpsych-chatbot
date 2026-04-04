'use client';

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  background: { label: 'Background', color: 'from-gray-400 to-gray-500' },
  attention: { label: 'Attention & Focus', color: 'from-amber-400 to-amber-500' },
  social: { label: 'Social Skills', color: 'from-blue-400 to-blue-500' },
  emotional: { label: 'Emotional Wellbeing', color: 'from-pink-400 to-pink-500' },
  academic: { label: 'Academic Performance', color: 'from-emerald-400 to-emerald-500' },
  behavioral: { label: 'Behaviour', color: 'from-orange-400 to-orange-500' },
  summary: { label: 'Summary', color: 'from-purple-400 to-purple-500' },
};

interface ProgressBarProps {
  percentage: number;
  currentCategory?: string;
}

export default function ProgressBar({ percentage, currentCategory }: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const config = currentCategory ? CATEGORY_CONFIG[currentCategory] : null;

  return (
    <div className="bg-white/70 backdrop-blur-sm border-b border-gray-100/60 px-3 py-2 sm:px-6 sm:py-2.5">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            {config ? (
              <span className="text-xs font-semibold text-gray-600 tracking-wide">
                {config.label}
              </span>
            ) : (
              <span className="text-xs font-medium text-gray-400">
                Assessment Progress
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-indigo-600 tabular-nums">
            {Math.round(clampedPercentage)}%
          </span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out progress-bar-fill ${
              config
                ? `bg-gradient-to-r ${config.color}`
                : 'bg-gradient-to-r from-indigo-500 via-indigo-400 to-purple-500'
            }`}
            style={{ width: `${clampedPercentage}%` }}
            role="progressbar"
            aria-valuenow={clampedPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Assessment progress: ${Math.round(clampedPercentage)}%`}
          />
        </div>
      </div>
    </div>
  );
}
