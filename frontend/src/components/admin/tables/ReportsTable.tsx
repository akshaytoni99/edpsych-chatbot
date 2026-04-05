"use client";

import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/api";
import DetailDrawer from "../DetailDrawer";
import JsonViewer from "../JsonViewer";
import type { AdminReportRow, ReportType } from "../types";

type ReportFilter = "all" | ReportType;

interface ReportsTableProps {
  initialRows: AdminReportRow[];
}

export default function ReportsTable({ initialRows }: ReportsTableProps) {
  const [rows, setRows] = useState<AdminReportRow[]>(initialRows);
  const [filter, setFilter] = useState<ReportFilter>("all");
  const [filterLoading, setFilterLoading] = useState(false);
  const [selected, setSelected] = useState<AdminReportRow | null>(null);
  const [detail, setDetail] = useState<AdminReportRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const applyFilter = async (next: ReportFilter) => {
    setFilter(next);
    setFilterLoading(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;
      const qs = new URLSearchParams({ limit: "100" });
      if (next !== "all") qs.set("report_type", next);
      const res = await fetch(
        `${API_BASE}/admin/psychologist-reports?${qs.toString()}`,
        { headers: { Authorization: `Bearer ${token ?? ""}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setRows(Array.isArray(data) ? data : data.items ?? []);
      }
    } catch {
      // Keep previous rows on error.
    } finally {
      setFilterLoading(false);
    }
  };

  const openRow = async (row: AdminReportRow) => {
    setSelected(row);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;
      const res = await fetch(
        `${API_BASE}/admin/psychologist-reports/${row.id}`,
        { headers: { Authorization: `Bearer ${token ?? ""}` } }
      );
      if (res.ok) {
        setDetail(await res.json());
      } else {
        setDetailError(`Failed to load report (${res.status})`);
      }
    } catch {
      setDetailError("Network error loading report");
    } finally {
      setDetailLoading(false);
    }
  };

  const close = () => {
    setSelected(null);
    setDetail(null);
    setDetailError(null);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        <FilterPill
          active={filter === "all"}
          onClick={() => applyFilter("all")}
        >
          All
        </FilterPill>
        <FilterPill
          active={filter === "background_summary"}
          onClick={() => applyFilter("background_summary")}
        >
          Background
        </FilterPill>
        <FilterPill
          active={filter === "cognitive_report"}
          onClick={() => applyFilter("cognitive_report")}
        >
          Cognitive
        </FilterPill>
        <FilterPill
          active={filter === "unified_insights"}
          onClick={() => applyFilter("unified_insights")}
        >
          Unified
        </FilterPill>
      </div>

      {filterLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-slate-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="glass-card p-12 rounded-2xl text-center border border-slate-200">
          <p className="text-slate-500 font-medium">No reports found</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                <tr>
                  <Th>Student</Th>
                  <Th>Type</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th>Updated</Th>
                  <Th>Preview</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => openRow(row)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-on-background">
                      {row.student_name || "—"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ReportTypeBadge type={row.report_type} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {row.status}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                      {row.updated_at
                        ? new Date(row.updated_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">
                      {(row.content_preview || "").slice(0, 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DetailDrawer
        isOpen={selected !== null}
        onClose={close}
        title={
          selected
            ? `${selected.student_name || "Report"} — ${formatType(
                selected.report_type
              )}`
            : "Report"
        }
      >
        {detailLoading && (
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded animate-pulse" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-slate-100 rounded animate-pulse w-4/6" />
          </div>
        )}

        {detailError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
            {detailError}
          </div>
        )}

        {!detailLoading && detail && (
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                content_markdown
              </h4>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <pre className="whitespace-pre-wrap font-mono text-sm text-on-background">
                  {detail.content_markdown || "(empty)"}
                </pre>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">
                source_data
              </h4>
              <JsonViewer data={detail.source_data ?? {}} />
            </div>
          </div>
        )}
      </DetailDrawer>
    </>
  );
}

function formatType(type: string) {
  switch (type) {
    case "background_summary":
      return "Background";
    case "cognitive_report":
      return "Cognitive";
    case "unified_insights":
      return "Unified";
    default:
      return type;
  }
}

function ReportTypeBadge({ type }: { type: string }) {
  let classes = "bg-slate-100 text-slate-700 border-slate-200";
  let label = type;
  switch (type) {
    case "background_summary":
      classes = "bg-blue-100 text-blue-700 border-blue-200";
      label = "Background";
      break;
    case "cognitive_report":
      classes = "bg-purple-100 text-purple-700 border-purple-200";
      label = "Cognitive";
      break;
    case "unified_insights":
      classes = "bg-emerald-100 text-emerald-700 border-emerald-200";
      label = "Unified";
      break;
  }
  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${classes}`}
    >
      {label}
    </span>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
        active
          ? "bg-on-background text-white"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
      {children}
    </th>
  );
}
