"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";
import DataExplorer from "@/src/components/admin/DataExplorer";

interface User {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone: string | null;
  organization: string | null;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

interface SystemStats {
  total_users: number;
  total_students: number;
  total_assessments: number;
  total_reports: number;
  active_sessions: number;
  users_by_role: {
    PARENT: number;
    PSYCHOLOGIST: number;
    SCHOOL: number;
    ADMIN: number;
  };
}

// --- Reusable dialog component (replaces native confirm/alert) ---
function Dialog({
  open,
  title,
  message,
  variant = "info",
  confirmLabel = "OK",
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  variant?: "info" | "warning" | "danger" | "success";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}) {
  if (!open) return null;
  const colors = {
    info: "bg-blue-600 hover:bg-blue-700",
    warning: "bg-amber-600 hover:bg-amber-700",
    danger: "bg-red-600 hover:bg-red-700",
    success: "bg-emerald-600 hover:bg-emerald-700",
  };
  const icons = {
    info: (
      <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
    warning: (
      <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
    ),
    danger: (
      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    ),
    success: (
      <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    ),
  };
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            {icons[variant]}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-on-background">{title}</h3>
            <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          {cancelLabel && onCancel && (
            <button
              onClick={onCancel}
              className="px-5 py-2.5 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
            >
              {cancelLabel}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 text-white font-bold rounded-xl transition-all text-sm ${colors[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "PSYCHOLOGIST",
    phone: "",
    organization: "",
  });
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    organization: "",
    role: "",
  });
  const [editError, setEditError] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);

  // Dialog state (replaces native confirm/alert)
  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "info" | "warning" | "danger" | "success";
    confirmLabel: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }>({ open: false, title: "", message: "", variant: "info", confirmLabel: "OK", onConfirm: () => {} });

  const showAlert = (title: string, message: string, variant: "info" | "warning" | "danger" | "success" = "info") => {
    setDialog({ open: true, title, message, variant, confirmLabel: "OK", onConfirm: () => setDialog((d) => ({ ...d, open: false })) });
  };

  const showConfirm = (
    title: string,
    message: string,
    variant: "warning" | "danger",
    confirmLabel: string,
    onConfirm: () => void,
  ) => {
    setDialog({
      open: true,
      title,
      message,
      variant,
      confirmLabel,
      cancelLabel: "Cancel",
      onConfirm: () => { setDialog((d) => ({ ...d, open: false })); onConfirm(); },
      onCancel: () => setDialog((d) => ({ ...d, open: false })),
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: createForm.email,
          password: createForm.password,
          full_name: createForm.full_name,
          role: createForm.role,
          phone: createForm.phone || null,
          organization: createForm.organization || null,
        }),
      });
      if (response.ok) {
        setShowAddUser(false);
        setCreateForm({ full_name: "", email: "", password: "", role: "PSYCHOLOGIST", phone: "", organization: "" });
        fetchAdminData(token!);
      } else {
        const data = await response.json().catch(() => null);
        setCreateError(data?.detail || "Failed to create user");
      }
    } catch (err) {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    setUser(parsedUser);
    fetchAdminData(token);
  }, [router]);

  const fetchAdminData = async (token: string) => {
    try {
      // Fetch all users
      const usersResponse = await fetch(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
        calculateStats(usersData);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData: User[]) => {
    const usersByRole = {
      PARENT: usersData.filter((u) => u.role === "PARENT").length,
      PSYCHOLOGIST: usersData.filter((u) => u.role === "PSYCHOLOGIST").length,
      SCHOOL: usersData.filter((u) => u.role === "SCHOOL").length,
      ADMIN: usersData.filter((u) => u.role === "ADMIN").length,
    };

    const stats: SystemStats = {
      total_users: usersData.length,
      total_students: usersByRole.PARENT * 2, // Mock: avg 2 students per parent
      total_assessments: usersByRole.PARENT * 3, // Mock data
      total_reports: usersByRole.PARENT * 2, // Mock data
      active_sessions: 5, // Mock data
      users_by_role: usersByRole,
    };
    setStats(stats);
  };

  const handleToggleUserStatus = (userId: string, currentStatus: boolean) => {
    showConfirm(
      currentStatus ? "Deactivate User" : "Activate User",
      `Are you sure you want to ${currentStatus ? "deactivate" : "activate"} this user?`,
      "warning",
      currentStatus ? "Deactivate" : "Activate",
      async () => {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(`${API_BASE}/admin/users/${userId}/toggle-status`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            fetchAdminData(token!);
          } else {
            showAlert("Error", "Failed to update user status", "danger");
          }
        } catch (error) {
          console.error("Error toggling user status:", error);
          showAlert("Error", "An error occurred", "danger");
        }
      },
    );
  };

  const handleDeleteUser = (userId: string) => {
    showConfirm(
      "Delete User",
      "Are you sure you want to delete this user? This action cannot be undone.",
      "danger",
      "Delete",
      async () => {
        try {
          const token = localStorage.getItem("access_token");
          const response = await fetch(`${API_BASE}/admin/users/${userId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            fetchAdminData(token!);
            showAlert("Deleted", "User deleted successfully.", "success");
          } else {
            showAlert("Error", "Failed to delete user", "danger");
          }
        } catch (error) {
          console.error("Error deleting user:", error);
          showAlert("Error", "An error occurred", "danger");
        }
      },
    );
  };

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setEditForm({
      full_name: u.full_name || "",
      email: u.email || "",
      phone: u.phone || "",
      organization: u.organization || "",
      role: u.role || "",
    });
    setEditError("");
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError("");
    setSaving(true);
    try {
      const token = localStorage.getItem("access_token");
      // Only send changed fields
      const body: Record<string, string> = {};
      if (editForm.full_name !== (selectedUser.full_name || "")) body.full_name = editForm.full_name;
      if (editForm.email !== (selectedUser.email || "")) body.email = editForm.email;
      if (editForm.phone !== (selectedUser.phone || "")) body.phone = editForm.phone;
      if (editForm.organization !== (selectedUser.organization || "")) body.organization = editForm.organization;
      if (editForm.role !== (selectedUser.role || "")) body.role = editForm.role;

      if (Object.keys(body).length === 0) {
        setSelectedUser(null);
        return;
      }

      const response = await fetch(`${API_BASE}/admin/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        setSelectedUser(null);
        fetchAdminData(token!);
      } else {
        const data = await response.json().catch(() => null);
        setEditError(data?.detail || "Failed to update user");
      }
    } catch (err) {
      setEditError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleResetAssessment = async (u: User) => {
    setResetting(u.id);
    try {
      const token = localStorage.getItem("access_token");
      const studentsRes = await fetch(`${API_BASE}/admin/students`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!studentsRes.ok) {
        showAlert("Error", "Failed to fetch students", "danger");
        setResetting(null);
        return;
      }
      const allStudents = await studentsRes.json();
      const matched = allStudents.filter(
        (s: any) => s.primary_guardian_email === u.email
      );
      if (matched.length === 0) {
        showAlert("No Students", "No students found for this parent.", "info");
        setResetting(null);
        return;
      }

      const names = matched.map((s: any) => `${s.first_name} ${s.last_name}`).join("\n");
      setResetting(null);
      showConfirm(
        "Reset Assessment",
        `This will reset assessments for:\n${names}\n\nAll chat history will be deleted.`,
        "danger",
        "Reset All",
        async () => {
          setResetting(u.id);
          let totalReset = 0;
          for (const s of matched) {
            const res = await fetch(`${API_BASE}/admin/students/${s.id}/reset-assessment`, {
              method: "POST",
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
              const data = await res.json();
              totalReset += data.sessions_reset;
            } else {
              const err = await res.json().catch(() => null);
              showAlert("Reset Failed", `Failed to reset for ${s.first_name}: ${err?.detail || "Unknown error"}`, "danger");
            }
          }
          showAlert("Reset Complete", `${totalReset} session(s) reset successfully.`, "success");
          fetchAdminData(token!);
          setResetting(null);
        },
      );
    } catch (err) {
      showAlert("Network Error", "Network error during reset.", "danger");
      setResetting(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-700 border-red-200";
      case "PSYCHOLOGIST":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "SCHOOL":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "PARENT":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const filteredUsers =
    filterRole === "all" ? users : users.filter((u) => u.role === filterRole);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-on-background tracking-tight">The EdPsych</h1>
                <p className="text-xs text-red-600 font-bold">ADMIN DASHBOARD</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-on-background">{user?.full_name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-on-background transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-12">
        {/* Welcome Section */}
        <div className="mb-8 lg:mb-12">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-on-background mb-3">
            System Administration
          </h2>
          <p className="text-slate-500 text-lg">
            Manage users, monitor system activity, and configure platform settings.
          </p>
        </div>

        {/* System Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-on-background">{stats.total_users}</p>
                  <p className="text-sm text-slate-500 font-medium">Total Users</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-on-background">{stats.total_students}</p>
                  <p className="text-sm text-slate-500 font-medium">Total Students</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-on-background">{stats.total_assessments}</p>
                  <p className="text-sm text-slate-500 font-medium">Assessments</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-on-background">{stats.total_reports}</p>
                  <p className="text-sm text-slate-500 font-medium">Reports Generated</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users by Role */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="glass-card p-4 rounded-xl border-l-4 border-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Parents</p>
                  <p className="text-2xl font-black text-on-background">{stats.users_by_role.PARENT}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Psychologists</p>
                  <p className="text-2xl font-black text-on-background">{stats.users_by_role.PSYCHOLOGIST}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Schools</p>
                  <p className="text-2xl font-black text-on-background">{stats.users_by_role.SCHOOL}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-xl border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase">Admins</p>
                  <p className="text-2xl font-black text-on-background">{stats.users_by_role.ADMIN}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Management */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-on-background">User Management</h3>
              <p className="text-sm text-slate-500 mt-1">
                {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm font-medium"
              >
                <option value="all">All Roles</option>
                <option value="PARENT">Parents</option>
                <option value="PSYCHOLOGIST">Psychologists</option>
                <option value="SCHOOL">Schools</option>
                <option value="ADMIN">Admins</option>
              </select>
              <button
                onClick={() => setShowAddUser(true)}
                className="px-6 py-2 bg-on-background text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center">
            <svg className="w-20 h-20 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="text-xl font-bold text-on-background mb-2">No users found</h3>
            <p className="text-slate-500">No users match the selected filter.</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-bold text-on-background">{u.full_name}</p>
                          <p className="text-sm text-slate-500">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${getRoleBadgeColor(u.role)}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {u.organization || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {u.phone || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                          <span className="text-sm text-slate-600">
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleUserStatus(u.id, u.is_active)}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                              u.is_active
                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            }`}
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>
                          {u.role === "PARENT" && (
                            <button
                              onClick={() => handleResetAssessment(u)}
                              disabled={resetting === u.id}
                              className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-lg hover:bg-orange-200 transition-all disabled:opacity-50"
                            >
                              {resetting === u.id ? "Resetting..." : "Reset"}
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(u)}
                            className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-200 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Data Explorer */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-on-background mb-4">Data Explorer</h3>
          <p className="text-sm text-slate-500 mb-6">
            Read-only view of all records in the database. All admin access is logged.
          </p>
          <DataExplorer />
        </div>
      </main>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-extrabold text-on-background mb-2">Add New User</h3>
            <p className="text-slate-500 text-sm mb-6">
              Create an account for a psychologist, school, parent, or admin.
            </p>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Role *</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                >
                  <option value="PSYCHOLOGIST">Psychologist</option>
                  <option value="SCHOOL">School</option>
                  <option value="PARENT">Parent</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="Dr. Jane Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Temporary Password *</label>
                <input
                  type="text"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-mono"
                  placeholder="Min 8 characters"
                />
                <p className="text-[10px] text-slate-400 mt-1">Share this with the user; they should change it on first login.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="+44 7700 900000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Organization</label>
                <input
                  type="text"
                  value={createForm.organization}
                  onChange={(e) => setCreateForm({ ...createForm, organization: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                  placeholder="Clinic or practice name"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUser(false);
                    setCreateError("");
                  }}
                  className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-on-background text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-extrabold text-on-background mb-2">Edit User</h3>
            <p className="text-slate-500 text-sm mb-6">
              Update details for {selectedUser.full_name}.
            </p>

            {editError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Organization</label>
                <input
                  type="text"
                  value={editForm.organization}
                  onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-3 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
                >
                  <option value="PARENT">Parent</option>
                  <option value="PSYCHOLOGIST">Psychologist</option>
                  <option value="SCHOOL">School</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setEditError("");
                  }}
                  className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-on-background text-white font-bold rounded-xl hover:bg-slate-800 transition-all text-sm disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Dialog (replaces native confirm/alert) */}
      <Dialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        variant={dialog.variant}
        confirmLabel={dialog.confirmLabel}
        cancelLabel={dialog.cancelLabel}
        onConfirm={dialog.onConfirm}
        onCancel={dialog.onCancel}
      />
    </div>
  );
}
