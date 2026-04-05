"use client";

import { useMemo } from "react";
import type { ParsedScores, SubtestScore } from "./types";

interface ScoresTableProps {
  scores: ParsedScores | null;
  confidence: number;
  editable?: boolean;
  onScoresChange?: (scores: ParsedScores) => void;
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export default function ScoresTable({
  scores,
  confidence,
  editable = false,
  onScoresChange,
}: ScoresTableProps) {
  const confidenceBadge = useMemo(() => {
    if (confidence >= 0.9) {
      return {
        label: `High confidence (${Math.round(confidence * 100)}%)`,
        classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
      };
    }
    if (confidence >= 0.7) {
      return {
        label: `Moderate confidence (${Math.round(confidence * 100)}%)`,
        classes: "bg-amber-100 text-amber-700 border-amber-200",
      };
    }
    return {
      label: `Low confidence (${Math.round(confidence * 100)}%) · requires review`,
      classes: "bg-red-100 text-red-700 border-red-200",
    };
  }, [confidence]);

  if (!scores) {
    return (
      <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center text-sm text-slate-500">
        No scores extracted yet.
      </div>
    );
  }

  const subtests: SubtestScore[] = Array.isArray(scores.subtests) ? scores.subtests : [];

  const updateTopField = (key: "test_name" | "full_scale_iq", value: string) => {
    if (!onScoresChange) return;
    onScoresChange({ ...scores, [key]: value });
  };

  const updateSubtest = (index: number, key: keyof SubtestScore, value: string) => {
    if (!onScoresChange) return;
    const nextSubtests = subtests.map((s, i) => (i === index ? { ...s, [key]: value } : s));
    onScoresChange({ ...scores, subtests: nextSubtests });
  };

  return (
    <div className="space-y-4">
      {/* FSIQ + confidence */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
        <div>
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            Full Scale IQ
          </p>
          {editable ? (
            <input
              type="text"
              value={formatValue(scores.full_scale_iq) === "—" ? "" : String(scores.full_scale_iq)}
              onBlur={(e) => updateTopField("full_scale_iq", e.target.value)}
              onChange={(e) => updateTopField("full_scale_iq", e.target.value)}
              className="mt-1 text-4xl font-extrabold text-slate-900 bg-transparent border-b border-blue-200 focus:outline-none focus:border-blue-500 w-32"
              placeholder="—"
            />
          ) : (
            <p className="mt-1 text-4xl font-extrabold text-slate-900">
              {formatValue(scores.full_scale_iq)}
            </p>
          )}
          <div className="mt-2 text-xs text-slate-600">
            <span className="font-semibold">Test:</span>{" "}
            {editable ? (
              <input
                type="text"
                defaultValue={formatValue(scores.test_name) === "—" ? "" : String(scores.test_name ?? "")}
                onBlur={(e) => updateTopField("test_name", e.target.value)}
                className="ml-1 bg-transparent border-b border-slate-200 focus:outline-none focus:border-blue-500"
                placeholder="—"
              />
            ) : (
              <span>{formatValue(scores.test_name)}</span>
            )}
          </div>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-bold border ${confidenceBadge.classes}`}
        >
          {confidenceBadge.label}
        </span>
      </div>

      {/* Subtests table */}
      {subtests.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-bold text-slate-600 uppercase tracking-wide">
                <th className="px-4 py-3">Test / Subtest</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Percentile</th>
                <th className="px-4 py-3">95% CI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subtests.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {editable ? (
                      <input
                        type="text"
                        defaultValue={formatValue(row.name) === "—" ? "" : String(row.name ?? "")}
                        onBlur={(e) => updateSubtest(idx, "name", e.target.value)}
                        className="w-full bg-transparent focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                      />
                    ) : (
                      formatValue(row.name)
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {editable ? (
                      <input
                        type="text"
                        defaultValue={formatValue(row.score) === "—" ? "" : String(row.score ?? "")}
                        onBlur={(e) => updateSubtest(idx, "score", e.target.value)}
                        className="w-20 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                      />
                    ) : (
                      formatValue(row.score)
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {editable ? (
                      <input
                        type="text"
                        defaultValue={formatValue(row.percentile) === "—" ? "" : String(row.percentile ?? "")}
                        onBlur={(e) => updateSubtest(idx, "percentile", e.target.value)}
                        className="w-20 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                      />
                    ) : (
                      formatValue(row.percentile)
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {editable ? (
                      <input
                        type="text"
                        defaultValue={
                          formatValue(row.confidence_interval) === "—"
                            ? ""
                            : String(row.confidence_interval ?? "")
                        }
                        onBlur={(e) => updateSubtest(idx, "confidence_interval", e.target.value)}
                        className="w-24 bg-transparent focus:outline-none focus:ring-2 focus:ring-primary rounded px-1"
                      />
                    ) : (
                      formatValue(row.confidence_interval)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-500">
          No subtest scores extracted.
        </div>
      )}
    </div>
  );
}
