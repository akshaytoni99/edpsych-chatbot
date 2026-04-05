"use client";

import { useState } from "react";

interface JsonViewerProps {
  data: any;
}

/**
 * Dependency-free pretty JSON renderer with a copy-to-clipboard button.
 * Renders JSON.stringify output as plain text inside a dark <pre> element.
 * No syntax highlighting library and no unsafe HTML injection — just text.
 */
export default function JsonViewer({ data }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);

  let jsonString = "";
  try {
    jsonString = JSON.stringify(data, null, 2);
  } catch {
    jsonString = String(data);
  }

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(jsonString);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {
      // Swallow clipboard errors — some browsers block it in non-secure contexts.
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 px-3 py-1 text-xs font-bold rounded-lg bg-slate-700 text-slate-100 hover:bg-slate-600 transition-colors"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-auto max-h-[70vh] text-xs font-mono whitespace-pre">
        {jsonString}
      </pre>
    </div>
  );
}
