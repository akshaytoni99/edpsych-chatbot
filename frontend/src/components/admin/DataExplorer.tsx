"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";
import StudentsTable from "./tables/StudentsTable";
import AssessmentsTable from "./tables/AssessmentsTable";
import ReportsTable from "./tables/ReportsTable";
import CognitiveTable from "./tables/CognitiveTable";
import IqUploadsTable from "./tables/IqUploadsTable";
import type { DataExplorerTab } from "./types";

const TAB_ENDPOINTS: Record<DataExplorerTab, string> = {
  students: "/admin/students",
  assessments: "/admin/chat-sessions?limit=100&offset=0",
  reports: "/admin/psychologist-reports?limit=100",
  cognitive: "/admin/cognitive-profiles",
  iq: "/admin/iq-uploads",
};

const TAB_LABELS: { key: DataExplorerTab; label: string }[] = [
  { key: "students", label: "Students" },
  { key: "assessments", label: "Assessments" },
  { key: "reports", label: "Reports" },
  { key: "cognitive", label: "Cognitive" },
  { key: "iq", label: "IQ" },
];

type CacheState = Partial<Record<DataExplorerTab, any[]>>;

export default function DataExplorer() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DataExplorerTab>("students");
  const [cache, setCache] = useState<CacheState>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cache[activeTab] !== undefined) {
      return; // Already fetched for this tab.
    }

    const controller = new AbortController();
    const fetchTab = async () => {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("access_token")
            : null;
        if (!token) {
          router.push("/login");
          return;
        }
        const res = await fetch(`${API_BASE}${TAB_ENDPOINTS[activeTab]}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        if (!res.ok) {
          throw new Error(`Request failed (${res.status})`);
        }
        const data = await res.json();
        const rows: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.results)
          ? data.results
          : [];
        setCache((prev) => ({ ...prev, [activeTab]: rows }));
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setError(err?.message || "Failed to load data");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTab();
    return () => controller.abort();
  }, [activeTab, cache, router]);

  const currentRows = cache[activeTab] ?? [];

  return (
    <div className="glass-card rounded-2xl border border-slate-200 bg-white p-6">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TAB_LABELS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.key
                ? "bg-on-background text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Row count */}
      {!loading && !error && (
        <p className="text-xs font-medium text-slate-500 mb-3">
          {currentRows.length}{" "}
          {currentRows.length === 1 ? "row" : "rows"}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-slate-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Tab content */}
      {!loading && !error && (
        <>
          {activeTab === "students" && <StudentsTable rows={currentRows} />}
          {activeTab === "assessments" && (
            <AssessmentsTable rows={currentRows} />
          )}
          {activeTab === "reports" && (
            <ReportsTable initialRows={currentRows} />
          )}
          {activeTab === "cognitive" && (
            <CognitiveTable rows={currentRows} />
          )}
          {activeTab === "iq" && <IqUploadsTable rows={currentRows} />}
        </>
      )}
    </div>
  );
}
