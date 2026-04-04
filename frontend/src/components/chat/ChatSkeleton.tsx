'use client';

export default function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Progress bar skeleton */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-1.5">
            <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-8 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full w-0 bg-gray-300 rounded-full" />
          </div>
        </div>
      </div>

      {/* Message bubbles skeleton */}
      <div className="flex-1 overflow-hidden px-4 py-6 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Bot message skeleton 1 */}
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl rounded-bl-sm px-5 py-4 bg-white border border-gray-200 shadow-sm">
              <div className="space-y-2">
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-3 w-12 bg-gray-100 rounded mt-2 animate-pulse" />
            </div>
          </div>

          {/* User message skeleton */}
          <div className="flex justify-end">
            <div className="max-w-[75%] rounded-2xl rounded-br-sm px-5 py-4 bg-emerald-200 shadow-sm">
              <div className="h-4 w-36 bg-emerald-300 rounded animate-pulse" />
              <div className="h-3 w-12 bg-emerald-100 rounded mt-2 animate-pulse" />
            </div>
          </div>

          {/* Bot message skeleton 2 */}
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl rounded-bl-sm px-5 py-4 bg-white border border-gray-200 shadow-sm">
              <div className="space-y-2">
                <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-56 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-3 w-12 bg-gray-100 rounded mt-2 animate-pulse" />
            </div>
          </div>

          {/* User message skeleton */}
          <div className="flex justify-end">
            <div className="max-w-[75%] rounded-2xl rounded-br-sm px-5 py-4 bg-emerald-200 shadow-sm">
              <div className="space-y-2">
                <div className="h-4 w-44 bg-emerald-300 rounded animate-pulse" />
              </div>
              <div className="h-3 w-12 bg-emerald-100 rounded mt-2 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 sm:px-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex gap-3 items-center">
          <div className="flex-1 min-h-[44px] border-2 border-gray-200 rounded-full bg-gray-100 animate-pulse" />
          <div className="min-h-[44px] min-w-[44px] rounded-full bg-gray-200 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
