"use client";

import { useState } from "react";
import DetailDrawer from "../DetailDrawer";
import JsonViewer from "../JsonViewer";
import type { AdminCognitiveRow } from "../types";

interface CognitiveTableProps {
  rows: AdminCognitiveRow[];
}

export default function CognitiveTable({ rows }: CognitiveTableProps) {
  const [selected, setSelected] = useState<AdminCognitiveRow | null>(null);

  if (!rows || rows.length === 0) {
    return (
      <div className="glass-card p-12 rounded-2xl text-center border border-slate-200">
        <p className="text-slate-500 font-medium">No cognitive profiles found</p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <Th>Student</Th>
                <Th>Test Name</Th>
                <Th>Test Date</Th>
                <Th>FSIQ</Th>
                <Th>Confidence</Th>
                <Th>OCR Length</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => {
                const fsiq = row.parsed_scores?.full_scale_iq ?? null;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(row)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-on-background">
                      {row.student_name || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {row.test_name || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {row.test_date
                        ? new Date(row.test_date).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-on-background">
                      {fsiq ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ConfidenceBadge
                        confidence={row.confidence}
                        requiresReview={row.requires_review}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {row.ocr_text_length ?? "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <DetailDrawer
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected?.student_name
            ? `Cognitive — ${selected.student_name}`
            : "Cognitive Profile"
        }
      >
        {selected && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                parsed_scores
              </h4>
              <JsonViewer data={selected.parsed_scores ?? {}} />
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}

function ConfidenceBadge({
  confidence,
  requiresReview,
}: {
  confidence: number | null | undefined;
  requiresReview: boolean | null | undefined;
}) {
  if (confidence === null || confidence === undefined) {
    return <span className="text-sm text-slate-400">—</span>;
  }
  let classes = "bg-red-100 text-red-700 border-red-200";
  if (confidence >= 0.9) classes = "bg-emerald-100 text-emerald-700 border-emerald-200";
  else if (confidence >= 0.7) classes = "bg-amber-100 text-amber-700 border-amber-200";

  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex items-center gap-1 ${classes}`}
    >
      {(confidence * 100).toFixed(0)}%
      {requiresReview && (
        <span title="Requires review" aria-label="Requires review">
          {"\u26A0"} review
        </span>
      )}
    </span>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
      {children}
    </th>
  );
}
