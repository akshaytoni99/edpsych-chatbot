"use client";

import type { AdminIqUploadRow } from "../types";

interface IqUploadsTableProps {
  rows: AdminIqUploadRow[];
}

export default function IqUploadsTable({ rows }: IqUploadsTableProps) {
  return (
    <>
      <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-800">
        Original PDFs are deleted after extraction for privacy. Only metadata
        and parsed scores are retained.
      </div>

      {!rows || rows.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center border border-slate-200">
          <p className="text-slate-500 font-medium">No IQ uploads found</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <Th>Student</Th>
                  <Th>Filename</Th>
                  <Th>Size</Th>
                  <Th>Status</Th>
                  <Th>Uploaded By</Th>
                  <Th>Uploaded At</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-on-background">
                      {row.student_name || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 font-mono">
                      {row.filename}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {formatBytes(row.file_size)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {row.status || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {row.uploaded_by_name ? (
                        <div>
                          <p className="text-sm font-medium text-on-background">
                            {row.uploaded_by_name}
                          </p>
                          {row.uploaded_by_email && (
                            <p className="text-xs text-slate-500">
                              {row.uploaded_by_email}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {row.uploaded_at || row.created_at
                        ? new Date(
                            (row.uploaded_at || row.created_at) as string
                          ).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
      {children}
    </th>
  );
}
