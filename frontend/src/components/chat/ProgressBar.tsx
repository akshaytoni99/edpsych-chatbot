'use client';

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  background: { label: 'Background', color: 'bg-gray-500' },
  attention: { label: 'Attention & Focus', color: 'bg-amber-500' },
  social: { label: 'Social Skills', color: 'bg-blue-500' },
  emotional: { label: 'Emotional Wellbeing', color: 'bg-pink-500' },
  academic: { label: 'Academic Performance', color: 'bg-green-500' },
  behavioral: { label: 'Behaviour', color: 'bg-orange-500' },
  summary: { label: 'Summary', color: 'bg-purple-500' },
};

interface ProgressBarProps {
  percentage: number;
  currentCategory?: string;
}

export default function ProgressBar({ percentage, currentCategory }: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const config = currentCategory ? CATEGORY_CONFIG[currentCategory] : null;

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-100 px-3 py-1.5 sm:px-6 sm:py-2">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {config && (
              <span className="text-xs font-medium text-gray-600">
                {config.label}
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-indigo-600">
            {Math.round(clampedPercentage)}% complete
          </span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
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
