"use client";

import { useState } from "react";
import { API_BASE } from "@/lib/api";
import DetailDrawer from "../DetailDrawer";
import JsonViewer from "../JsonViewer";
import type { AdminAssessmentRow } from "../types";

interface AssessmentsTableProps {
  rows: AdminAssessmentRow[];
}

type DrawerTab = "overview" | "context";

export default function AssessmentsTable({ rows }: AssessmentsTableProps) {
  const [selected, setSelected] = useState<AdminAssessmentRow | null>(null);
  const [detail, setDetail] = useState<AdminAssessmentRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<DrawerTab>("overview");

  const openRow = async (row: AdminAssessmentRow) => {
    setSelected(row);
    setDetail(null);
    setDrawerTab("overview");
    setDetailError(null);
    setDetailLoading(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("access_token")
          : null;
      const res = await fetch(`${API_BASE}/admin/chat-sessions/${row.id}`, {
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      if (res.ok) {
        setDetail(await res.json());
      } else {
        setDetailError(`Failed to load details (${res.status})`);
      }
    } catch {
      setDetailError("Network error loading details");
    } finally {
      setDetailLoading(false);
    }
  };

  const close = () => {
    setSelected(null);
    setDetail(null);
    setDetailError(null);
  };

  if (!rows || rows.length === 0) {
    return (
      <div className="glass-card p-12 rounded-2xl text-center border border-slate-200">
        <p className="text-slate-500 font-medium">No assessments found</p>
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
                <Th>Parent Email</Th>
                <Th>Status</Th>
                <Th>Flow Type</Th>
                <Th>Step</Th>
                <Th>Started</Th>
                <Th>Last Activity</Th>
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row.parent_email || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row.flow_type || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row.current_step ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row.started_at
                      ? new Date(row.started_at).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                    {row.last_activity_at
                      ? new Date(row.last_activity_at).toLocaleString()
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
        onClose={close}
        title={
          selected?.student_name
            ? `Assessment — ${selected.student_name}`
            : "Assessment"
        }
      >
        {selected && (
          <div>
            <div className="flex gap-2 mb-4">
              <DrawerTabButton
                active={drawerTab === "overview"}
                onClick={() => setDrawerTab("overview")}
              >
                Overview
              </DrawerTabButton>
              <DrawerTabButton
                active={drawerTab === "context"}
                onClick={() => setDrawerTab("context")}
              >
                context_data
              </DrawerTabButton>
            </div>

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

            {!detailLoading && drawerTab === "overview" && (
              <div className="space-y-3 text-sm">
                <OverviewRow label="ID" value={selected.id} />
                <OverviewRow
                  label="Student"
                  value={selected.student_name || "—"}
                />
                <OverviewRow
                  label="Parent Email"
                  value={selected.parent_email || "—"}
                />
                <OverviewRow label="Status" value={selected.status} />
                <OverviewRow
                  label="Flow Type"
                  value={selected.flow_type || "—"}
                />
                <OverviewRow
                  label="Current Step"
                  value={String(selected.current_step ?? "—")}
                />
                <OverviewRow
                  label="Started"
                  value={
                    selected.started_at
                      ? new Date(selected.started_at).toLocaleString()
                      : "—"
                  }
                />
                <OverviewRow
                  label="Last Activity"
                  value={
                    selected.last_activity_at
                      ? new Date(selected.last_activity_at).toLocaleString()
                      : "—"
                  }
                />
              </div>
            )}

            {!detailLoading && drawerTab === "context" && (
              <JsonViewer data={detail?.context_data ?? selected.context_data ?? {}} />
            )}
          </div>
        )}
      </DetailDrawer>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = (status || "").toLowerCase();
  let classes = "bg-slate-100 text-slate-700 border-slate-200";
  if (normalized === "active" || normalized === "in_progress") {
    classes = "bg-blue-100 text-blue-700 border-blue-200";
  } else if (normalized === "completed") {
    classes = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (normalized === "abandoned") {
    classes = "bg-amber-100 text-amber-700 border-amber-200";
  }
  return (
    <span
      className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${classes}`}
    >
      {status || "—"}
    </span>
  );
}

function DrawerTabButton({
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

function OverviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
      <span className="text-xs font-bold uppercase text-slate-500">
        {label}
      </span>
      <span className="text-sm text-on-background text-right break-all">
        {value}
      </span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
      {children}
    </th>
  );
}
