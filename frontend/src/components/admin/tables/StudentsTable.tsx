"use client";

import { useState } from "react";
import DetailDrawer from "../DetailDrawer";
import JsonViewer from "../JsonViewer";
import type { AdminStudentRow } from "../types";

interface StudentsTableProps {
  rows: AdminStudentRow[];
}

export default function StudentsTable({ rows }: StudentsTableProps) {
  const [selected, setSelected] = useState<AdminStudentRow | null>(null);

  if (!rows || rows.length === 0) {
    return <EmptyState label="students" />;
  }

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
              <tr>
                <Th>Name</Th>
                <Th>Grade</Th>
                <Th>School</Th>
                <Th>Primary Guardian</Th>
                <Th>Sessions</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(row)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-bold text-on-background">
                      {row.first_name} {row.last_name}
                    </p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row.grade_level || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row.school_name || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.primary_guardian ? (
                      <div>
                        <p className="text-sm font-medium text-on-background">
                          {row.primary_guardian.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {row.primary_guardian.email}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row.sessions_count ?? 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row.created_at
                      ? new Date(row.created_at).toLocaleDateString()
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DetailDrawer
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={
          selected
            ? `${selected.first_name} ${selected.last_name}`
            : "Student"
        }
      >
        {selected && <JsonViewer data={selected} />}
      </DetailDrawer>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
      {children}
    </th>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="glass-card p-12 rounded-2xl text-center border border-slate-200">
      <svg
        className="w-16 h-16 text-slate-300 mx-auto mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <p className="text-slate-500 font-medium">No {label} found</p>
    </div>
  );
}
