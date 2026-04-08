"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

interface Report {
  id: number;
  student_id: number;
  chatbot_session_id: number;
  status: string;
  created_at: string;
  profile_text: string | null;
  impact_text: string | null;
  recommendations_text: string | null;
  student: {
    first_name: string;
    last_name: string;
    grade_level: string;
    school_name: string;
  };
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  school_name: string;
  parent: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  guardians?: {
    id: string;
    name: string;
    email: string;
    role: string;
    relationship_type: string;
    is_primary: string;
  }[];
  has_active_assignment: boolean;
}

interface Assignment {
  id: string;
  student: {
    id: string;
    first_name: string;
    last_name: string;
    grade_level: string;
  } | null;
  assigned_to: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  status: string;
  notes: string | null;
  due_date: string | null;
  assigned_at: string;
}

export default function PsychologistDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"reports" | "assignments" | "students">("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedReport, setEditedReport] = useState<{
    profile_text: string;
    impact_text: string;
    recommendations_text: string;
  } | null>(null);

  // Search state
  const [studentSearch, setStudentSearch] = useState("");

  // Assignment state
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedParent, setSelectedParent] = useState<string>("");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);

  // Invite parent state
  const [showInviteParentForm, setShowInviteParentForm] = useState(false);
  const [inviteParentData, setInviteParentData] = useState({
    parent_email: "",
    parent_name: "",
    relationship_type: "Mother",
  });

  // Student creation state
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentFormData, setStudentFormData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "",
    school_name: "",
    year_group: "",
    // Parent fields (inline entry, no dropdown)
    parent_name: "",
    parent_email: "",
    parent_phone: "",
    relationship_type: "Mother",
  });
  const [parentUsers, setParentUsers] = useState<any[]>([]);

  // Guardian management state
  const [selectedStudentForGuardians, setSelectedStudentForGuardians] = useState<string | null>(null);
  const [guardians, setGuardians] = useState<any[]>([]);
  const [showAddGuardianForm, setShowAddGuardianForm] = useState(false);
  const [newGuardianData, setNewGuardianData] = useState({
    guardian_user_id: "",
    relationship_type: "",
    is_primary: "false",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role.toUpperCase() !== "PSYCHOLOGIST") {
      router.push("/dashboard");
      return;
    }

    setUser(parsedUser);
    fetchReports(token);
    fetchStudents(token);
    fetchAssignments(token);
    fetchParentUsers(token);
  }, [router]);

  const fetchReports = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/reports/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data);
        if (data.length > 0) {
          setSelectedReport(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/students-for-assignment`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchAssignments = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/assignments/psychologist/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const fetchParentUsers = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/student-guardians/parent-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setParentUsers(data);
      }
    } catch (error) {
      console.error("Error fetching parent users:", error);
    }
  };

  const fetchGuardiansForStudent = async (studentId: string) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/student-guardians/student/${studentId}/guardians`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setGuardians(data);
      }
    } catch (error) {
      console.error("Error fetching guardians:", error);
    }
  };

  const handleViewGuardians = (studentId: string) => {
    setSelectedStudentForGuardians(studentId);
    setShowAddGuardianForm(false);
    fetchGuardiansForStudent(studentId);
  };

  const handleAddGuardian = async () => {
    if (!selectedStudentForGuardians || !newGuardianData.guardian_user_id) {
      alert("Please select a parent/guardian");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/student-guardians/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: selectedStudentForGuardians,
          guardian_user_id: newGuardianData.guardian_user_id,
          relationship_type: newGuardianData.relationship_type || "Guardian",
          is_primary: newGuardianData.is_primary,
        }),
      });

      if (response.ok) {
        alert("Guardian added successfully!");
        setShowAddGuardianForm(false);
        setNewGuardianData({
          guardian_user_id: "",
          relationship_type: "",
          is_primary: "false",
        });
        if (selectedStudentForGuardians) {
          fetchGuardiansForStudent(selectedStudentForGuardians);
        }
        if (token) {
          fetchStudents(token);
        }
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to add guardian");
      }
    } catch (error) {
      console.error("Error adding guardian:", error);
      alert("An error occurred while adding guardian");
    }
  };

  const handleRemoveGuardian = async (relationshipId: string) => {
    if (!confirm("Are you sure you want to remove this guardian relationship?")) {
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/student-guardians/${relationshipId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Guardian removed successfully!");
        if (selectedStudentForGuardians) {
          fetchGuardiansForStudent(selectedStudentForGuardians);
        }
        if (token) {
          fetchStudents(token);
        }
      } else {
        alert("Failed to remove guardian");
      }
    } catch (error) {
      console.error("Error removing guardian:", error);
      alert("An error occurred while removing guardian");
    }
  };

  const handleEditReport = () => {
    if (selectedReport) {
      setEditedReport({
        profile_text: selectedReport.profile_text || "",
        impact_text: selectedReport.impact_text || "",
        recommendations_text: selectedReport.recommendations_text || "",
      });
      setEditMode(true);
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedReport || !editedReport) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/reports/${selectedReport.id}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editedReport),
      });

      if (response.ok) {
        const updatedReport = await response.json();
        setSelectedReport(updatedReport);
        setEditMode(false);
        alert("Changes saved successfully!");
      } else {
        alert("Failed to save changes. Please try again.");
      }
    } catch (error) {
      console.error("Error saving edits:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleApproveReport = async () => {
    if (!selectedReport) return;

    const confirmed = confirm(
      "Are you sure you want to approve this report? Once approved, it will be sent to the parent."
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/reports/${selectedReport.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("Report approved successfully!");
        // Refresh reports
        await fetchReports(token!);
        setSelectedReport(null);
      } else {
        alert("Failed to approve report. Please try again.");
      }
    } catch (error) {
      console.error("Error approving report:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedStudent) {
      alert("Please select a student");
      return;
    }

    if (!selectedParent) {
      alert("Please select a guardian to assign the assessment to");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/assignments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: selectedStudent,
          assigned_to_user_id: selectedParent,
          notes: assignmentNotes || null,
          due_date: dueDate || null,
        }),
      });

      if (response.ok) {
        alert("Assessment assigned successfully!");
        setShowAssignmentForm(false);
        setSelectedStudent("");
        setSelectedParent("");
        setAssignmentNotes("");
        setDueDate("");
        fetchStudents(token!);
        fetchAssignments(token!);
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to create assignment");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleCancelAssignment = async (assignmentId: string) => {
    const confirmed = confirm("Are you sure you want to cancel this assignment?");
    if (!confirmed) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/assignments/${assignmentId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("Assignment cancelled successfully");
        fetchAssignments(token!);
      } else {
        alert("Failed to cancel assignment");
      }
    } catch (error) {
      console.error("Error cancelling assignment:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleInviteParent = async () => {
    if (!selectedStudent) {
      alert("Please select a student first");
      return;
    }

    if (!inviteParentData.parent_email || !inviteParentData.parent_name) {
      alert("Please provide parent email and name");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/student-guardians/invite-parent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: selectedStudent,
          parent_email: inviteParentData.parent_email,
          parent_name: inviteParentData.parent_name,
          relationship_type: inviteParentData.relationship_type,
          is_primary: "true",
        }),
      });

      if (response.ok) {
        const data = await response.json();

        if (data.parent.already_existed) {
          alert(`Success! ${data.parent.name} has been linked to the student.`);
        } else {
          alert(
            `Success! Parent account created and linked.\n\n` +
            `Email: ${data.parent.email}\n` +
            `Temporary Password: ${data.parent.temporary_password}\n\n` +
            `Please share these credentials with the parent.`
          );
        }

        setShowInviteParentForm(false);
        setInviteParentData({
          parent_email: "",
          parent_name: "",
          relationship_type: "Mother",
        });

        // Refresh students to show new guardian
        if (token) {
          fetchStudents(token);
        }
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to invite parent");
      }
    } catch (error) {
      console.error("Error inviting parent:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleCreateStudent = async () => {
    // Validate required fields
    if (!studentFormData.first_name || !studentFormData.last_name || !studentFormData.date_of_birth) {
      alert("Please fill in all required fields (First Name, Last Name, Date of Birth)");
      return;
    }
    if (!studentFormData.parent_name || !studentFormData.parent_email) {
      alert("Please fill in parent name and email (required)");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE}/psychologist/students/create-with-parents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_first_name: studentFormData.first_name,
          student_last_name: studentFormData.last_name,
          date_of_birth: studentFormData.date_of_birth,
          gender: studentFormData.gender || null,
          grade: studentFormData.year_group || null,
          school_name: studentFormData.school_name || null,
          parents: [
            {
              type: "parent",
              full_name: studentFormData.parent_name,
              email: studentFormData.parent_email,
              phone: studentFormData.parent_phone || "",
              relationship: studentFormData.relationship_type || "Mother",
              is_primary: true,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `Student "${data.student_name}" created successfully!\n\n` +
          `Parent account created for ${studentFormData.parent_email}.\n` +
          `They will receive an invitation email when you assign an assessment.`
        );
        setShowStudentForm(false);
        setStudentFormData({
          first_name: "",
          last_name: "",
          date_of_birth: "",
          gender: "",
          school_name: "",
          year_group: "",
          parent_name: "",
          parent_email: "",
          parent_phone: "",
          relationship_type: "Mother",
        });
        fetchStudents(token!);
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to create student");
      }
    } catch (error) {
      console.error("Error creating student:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "pending_review":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "draft":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getAssignmentStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "ASSIGNED":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

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
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-black text-on-background tracking-tight">The EdPsych Practice</h1>
                <p className="text-xs text-slate-500 font-medium">Psychologist Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-on-background">
                  Dr. {user?.first_name} {user?.last_name}
                </p>
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
            Welcome back, Dr. {user?.first_name}
          </h2>
          <p className="text-slate-500 text-lg">
            {activeTab === "reports"
              ? "Review and approve generated assessment reports."
              : activeTab === "assignments"
              ? "Assign assessments to parents and schools."
              : "Manage student profiles and information."}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === "reports"
                ? "bg-primary text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            📋 Reports Review
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === "assignments"
                ? "bg-primary text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            📝 Assignments
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === "students"
                ? "bg-primary text-white shadow-lg"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            👥 Students
          </button>
        </div>

        {/* Stats */}
        {activeTab === "reports" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-on-background">
                    {reports.filter((r) => r.status === "pending_review").length}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Pending Review</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-on-background">
                    {reports.filter((r) => r.status === "approved").length}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Approved Today</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-on-background">{reports.length}</p>
                  <p className="text-sm text-slate-500 font-medium">Total Reports</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-on-background">{students.length}</p>
                  <p className="text-sm text-slate-500 font-medium">Total Students</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-on-background">
                    {assignments.filter((a) => a.status === "ASSIGNED" || a.status === "IN_PROGRESS").length}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Active Assignments</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-black text-on-background">
                    {assignments.filter((a) => a.status === "COMPLETED").length}
                  </p>
                  <p className="text-sm text-slate-500 font-medium">Completed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Review */}
        {activeTab === "reports" && (
          reports.length === 0 ? (
          <div className="glass-card p-12 rounded-2xl text-center">
            <svg className="w-20 h-20 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-bold text-on-background mb-2">No reports to review</h3>
            <p className="text-slate-500">All reports have been reviewed and approved.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reports List */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-bold text-on-background mb-4">Reports Queue</h3>
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    onClick={() => {
                      setSelectedReport(report);
                      setEditMode(false);
                    }}
                    className={`glass-card p-4 rounded-xl cursor-pointer transition-all ${
                      selectedReport?.id === report.id
                        ? "ring-2 ring-primary shadow-lg"
                        : "hover:shadow-md"
                    }`}
                  >
                    <div className="mb-2">
                      <h4 className="font-bold text-on-background">
                        {report.student.first_name} {report.student.last_name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Grade {report.student.grade_level} • {report.student.school_name}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(report.status)}`}>
                        {report.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Report Review */}
            <div className="lg:col-span-2">
              {selectedReport ? (
                <div className="space-y-6">
                  {/* Report Header */}
                  <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-extrabold text-on-background mb-2">
                          {selectedReport.student.first_name} {selectedReport.student.last_name}
                        </h3>
                        <p className="text-slate-600">
                          Grade {selectedReport.student.grade_level} • {selectedReport.student.school_name}
                        </p>
                      </div>
                      <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status.replace("_", " ")}
                      </span>
                    </div>

                    {!editMode ? (
                      <div className="flex gap-3">
                        <button
                          onClick={handleEditReport}
                          className="flex-1 px-6 py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all"
                        >
                          Edit Report
                        </button>
                        <button
                          onClick={handleApproveReport}
                          className="flex-1 px-6 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all"
                        >
                          Approve & Send
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setEditMode(false)}
                          className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-bold rounded-xl hover:border-slate-400 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdits}
                          className="flex-1 px-6 py-3 bg-on-background text-white font-bold rounded-xl hover:bg-slate-800 transition-all"
                        >
                          Save Changes
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile Section */}
                  <div className="glass-card p-8 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-on-background">Student Profile</h4>
                    </div>
                    {editMode ? (
                      <textarea
                        value={editedReport?.profile_text}
                        onChange={(e) =>
                          setEditedReport({ ...editedReport!, profile_text: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                        rows={8}
                      />
                    ) : (
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedReport.profile_text}
                      </p>
                    )}
                  </div>

                  {/* Impact Section */}
                  <div className="glass-card p-8 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-on-background">Educational Impact</h4>
                    </div>
                    {editMode ? (
                      <textarea
                        value={editedReport?.impact_text}
                        onChange={(e) =>
                          setEditedReport({ ...editedReport!, impact_text: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                        rows={8}
                      />
                    ) : (
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedReport.impact_text}
                      </p>
                    )}
                  </div>

                  {/* Recommendations Section */}
                  <div className="glass-card p-8 rounded-2xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-bold text-on-background">Recommendations</h4>
                    </div>
                    {editMode ? (
                      <textarea
                        value={editedReport?.recommendations_text}
                        onChange={(e) =>
                          setEditedReport({ ...editedReport!, recommendations_text: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                        rows={8}
                      />
                    ) : (
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {selectedReport.recommendations_text}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-card p-12 rounded-2xl text-center">
                  <p className="text-slate-500">Select a report to review</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Assignments Section */}
        {activeTab === "assignments" && (
          <div className="space-y-6">
            {/* Create Assignment Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-on-background">Assessment Assignments</h3>
              <button
                onClick={() => setShowAssignmentForm(!showAssignmentForm)}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg"
              >
                {showAssignmentForm ? "Cancel" : "+ New Assignment"}
              </button>
            </div>

            {/* Assignment Form */}
            {showAssignmentForm && (
              <div className="glass-card p-8 rounded-2xl">
                <h4 className="text-lg font-bold text-on-background mb-6">Assign Assessment to Student</h4>

                <div className="space-y-4">
                  {/* Student Selection */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      Select Student *
                    </label>
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    >
                      <option value="">Choose a student...</option>
                      {students.map((student) => {
                        const guardianNames = student.guardians?.map((g: any) => g.name).join(", ") || "No guardian";

                        return (
                          <option
                            key={student.id}
                            value={student.id}
                            disabled={student.has_active_assignment}
                          >
                            {student.first_name} {student.last_name} - {student.school_name || "No School"} - Parents: {guardianNames}
                            {student.has_active_assignment ? " [Already Assigned]" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Guardian Selection */}
                  {selectedStudent && (() => {
                    const student = students.find(s => s.id === selectedStudent);
                    const guardiansAvailable = student?.guardians && student.guardians.length > 0;

                    if (!guardiansAvailable) {
                      return (
                        <div className="space-y-3">
                          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <p className="text-sm font-bold text-yellow-900 mb-1">⚠️ No Guardians Linked</p>
                            <p className="text-xs text-yellow-700 mb-2">
                              This student has no parents/guardians linked. You need to link a guardian before assigning an assessment.
                            </p>
                            <button
                              onClick={() => setShowInviteParentForm(!showInviteParentForm)}
                              className="text-sm font-medium text-primary hover:underline"
                            >
                              {showInviteParentForm ? "Cancel" : "+ Invite & Link Parent"}
                            </button>
                          </div>

                          {showInviteParentForm && (
                            <div className="p-4 border border-slate-200 rounded-xl bg-white space-y-3">
                              <h5 className="text-sm font-bold text-on-background">Invite Parent</h5>

                              <div>
                                <label className="block text-xs font-medium text-on-background mb-1">
                                  Parent Email *
                                </label>
                                <input
                                  type="email"
                                  value={inviteParentData.parent_email}
                                  onChange={(e) => setInviteParentData({ ...inviteParentData, parent_email: e.target.value })}
                                  placeholder="parent@example.com"
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-on-background mb-1">
                                  Parent Name *
                                </label>
                                <input
                                  type="text"
                                  value={inviteParentData.parent_name}
                                  onChange={(e) => setInviteParentData({ ...inviteParentData, parent_name: e.target.value })}
                                  placeholder="John Doe"
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-on-background mb-1">
                                  Relationship Type
                                </label>
                                <select
                                  value={inviteParentData.relationship_type}
                                  onChange={(e) => setInviteParentData({ ...inviteParentData, relationship_type: e.target.value })}
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                >
                                  <option value="Mother">Mother</option>
                                  <option value="Father">Father</option>
                                  <option value="Guardian">Guardian</option>
                                  <option value="Grandparent">Grandparent</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>

                              <button
                                onClick={handleInviteParent}
                                className="w-full px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                              >
                                Invite & Link Parent
                              </button>

                              <p className="text-xs text-slate-500 italic">
                                If parent email exists, they'll be linked. Otherwise, a new account will be created with a temporary password.
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div>
                        <label className="block text-sm font-bold text-on-background mb-2">
                          Select Guardian to Assign *
                        </label>
                        <select
                          value={selectedParent}
                          onChange={(e) => setSelectedParent(e.target.value)}
                          className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        >
                          <option value="">Choose a guardian...</option>
                          {student.guardians?.map((guardian) => (
                            <option key={guardian.id} value={guardian.id}>
                              {guardian.name} - {guardian.relationship_type || guardian.role}
                              {guardian.is_primary === "true" ? " (Primary)" : ""}
                            </option>
                          ))}
                        </select>
                        {selectedParent && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-xs text-blue-700">
                              📧 {student.guardians?.find(g => g.id === selectedParent)?.email}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      Notes (Optional)
                    </label>
                    <textarea
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      placeholder="Add any special instructions or context..."
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      Due Date (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleCreateAssignment}
                    className="w-full px-6 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg"
                  >
                    Assign Assessment
                  </button>
                </div>
              </div>
            )}

            {/* Assignments List */}
            <div className="glass-card p-8 rounded-2xl">
              <h4 className="text-lg font-bold text-on-background mb-6">All Assignments</h4>

              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-500">No assignments yet. Create your first assignment above.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-bold text-on-background">Student</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-on-background">Assigned To</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-on-background">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-on-background">Due Date</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-on-background">Assigned</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-on-background">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((assignment) => (
                        <tr key={assignment.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-bold text-on-background">
                                {assignment.student?.first_name} {assignment.student?.last_name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Grade {assignment.student?.grade_level}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm font-medium text-on-background">
                                {assignment.assigned_to?.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {assignment.assigned_to?.role}
                              </p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${
                              assignment.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                : assignment.status === "IN_PROGRESS"
                                ? "bg-blue-100 text-blue-700 border-blue-200"
                                : assignment.status === "ASSIGNED"
                                ? "bg-amber-100 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}>
                              {assignment.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600">
                            {assignment.due_date
                              ? new Date(assignment.due_date).toLocaleDateString()
                              : "No deadline"}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600">
                            {new Date(assignment.assigned_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              {assignment.status === "ASSIGNED" && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const token = localStorage.getItem("access_token");
                                      const res = await fetch(`${API_BASE}/psychologist/assignments/${assignment.id}/resend-link`, {
                                        method: "POST",
                                        headers: { Authorization: `Bearer ${token}` },
                                      });
                                      if (res.ok) {
                                        const data = await res.json();
                                        alert(`Link resent to ${data.sent_to || assignment.assigned_to?.email || "parent"}`);
                                      } else {
                                        const err = await res.json().catch(() => null);
                                        alert(err?.detail || "Failed to resend invite link.");
                                      }
                                    } catch {
                                      alert("An error occurred while resending the invite link.");
                                    }
                                  }}
                                  className="px-4 py-2 text-xs font-bold text-primary hover:bg-primary/10 rounded-lg transition-all flex items-center gap-1"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  Resend Invite
                                </button>
                              )}
                              {assignment.status !== "COMPLETED" && assignment.status !== "CANCELLED" && (
                                <button
                                  onClick={() => handleCancelAssignment(assignment.id)}
                                  className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Section */}
        {activeTab === "students" && (
          <div className="space-y-6">
            {/* Create Student Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-on-background">Student Management</h3>
              <button
                onClick={() => setShowStudentForm(!showStudentForm)}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg"
              >
                {showStudentForm ? "Cancel" : "+ Add New Student"}
              </button>
            </div>

            {/* Student Creation Form */}
            {showStudentForm && (
              <div className="glass-card p-8 rounded-2xl">
                <h4 className="text-lg font-bold text-on-background mb-4">Create New Student Profile</h4>

                {/* Info Message */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-900">
                      <p className="font-bold mb-1">How it works:</p>
                      <ol className="list-decimal ml-4 space-y-1 text-blue-800">
                        <li>Create the student profile here</li>
                        <li>Go to the <span className="font-bold">Assignments tab</span></li>
                        <li>Assign an assessment to a parent for this student</li>
                        <li>The parent will receive the assignment and can complete the assessment</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={studentFormData.first_name}
                      onChange={(e) =>
                        setStudentFormData({ ...studentFormData, first_name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="Enter first name"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={studentFormData.last_name}
                      onChange={(e) =>
                        setStudentFormData({ ...studentFormData, last_name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="Enter last name"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      Date of Birth *
                    </label>
                    <input
                      type="date"
                      value={studentFormData.date_of_birth}
                      onChange={(e) =>
                        setStudentFormData({ ...studentFormData, date_of_birth: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    />
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      Gender (Optional)
                    </label>
                    <select
                      value={studentFormData.gender}
                      onChange={(e) =>
                        setStudentFormData({ ...studentFormData, gender: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    >
                      <option value="">Select gender...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>

                  {/* School Name */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      School Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={studentFormData.school_name}
                      onChange={(e) =>
                        setStudentFormData({ ...studentFormData, school_name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="Enter school name"
                    />
                  </div>

                  {/* Grade Level */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      Grade Level (Optional)
                    </label>
                    <input
                      type="text"
                      value={studentFormData.year_group}
                      onChange={(e) =>
                        setStudentFormData({ ...studentFormData, year_group: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="e.g., 5, 6, 7"
                    />
                  </div>

                  {/* Parent/Guardian Section Header */}
                  <div className="col-span-2 mt-2">
                    <div className="border-t border-slate-200 pt-4">
                      <h4 className="text-sm font-bold text-on-background uppercase tracking-wider text-slate-500">Parent / Guardian Details</h4>
                    </div>
                  </div>

                  {/* Parent Name */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      Parent / Organisation Name *
                    </label>
                    <input
                      type="text"
                      value={studentFormData.parent_name}
                      onChange={(e) =>
                        setStudentFormData({ ...studentFormData, parent_name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="Enter parent's full name"
                    />
                  </div>

                  {/* Parent Email */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      Parent Email *
                    </label>
                    <input
                      type="email"
                      value={studentFormData.parent_email}
                      onChange={(e) =>
                        setStudentFormData({ ...studentFormData, parent_email: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="parent@example.com"
                    />
                  </div>

                  {/* Parent Phone */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={studentFormData.parent_phone}
                      onChange={(e) =>
                        setStudentFormData({ ...studentFormData, parent_phone: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="+44 7700 900000"
                    />
                  </div>

                  {/* Relationship Type */}
                  <div>
                    <label className="block text-sm font-bold text-on-background mb-2">
                      Relationship to Child
                    </label>
                    <select
                      value={studentFormData.relationship_type}
                      onChange={(e) =>
                        setStudentFormData({ ...studentFormData, relationship_type: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-surface border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    >
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Grandparent">Grandparent</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleCreateStudent}
                  className="w-full mt-6 px-6 py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg"
                >
                  Create Student Profile
                </button>
              </div>
            )}

            {/* Students List */}
            <div className="glass-card p-8 rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h4 className="text-lg font-bold text-on-background">All Students</h4>
                <div className="relative w-full sm:w-80">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by student or parent name..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-on-background bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                  {studentSearch && (
                    <button
                      onClick={() => setStudentSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {(() => {
                const q = studentSearch.toLowerCase().trim();
                const filteredStudents = q
                  ? students.filter((s) => {
                      const studentName = `${s.first_name} ${s.last_name}`.toLowerCase();
                      const guardianNames = (s.guardians || []).map((g) => g.name.toLowerCase()).join(" ");
                      const parentName = s.parent?.name?.toLowerCase() || "";
                      const parentEmail = s.parent?.email?.toLowerCase() || "";
                      const guardianEmails = (s.guardians || []).map((g) => g.email.toLowerCase()).join(" ");
                      return (
                        studentName.includes(q) ||
                        guardianNames.includes(q) ||
                        parentName.includes(q) ||
                        parentEmail.includes(q) ||
                        guardianEmails.includes(q)
                      );
                    })
                  : students;

                return filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p className="text-slate-500">{q ? `No students matching "${studentSearch}"` : "No students yet. Create your first student profile above."}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-bold text-on-background">Student Name</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-on-background">Grade</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-on-background">School</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-on-background">Parent/Guardian</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-on-background">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-bold text-on-background">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-4 px-4">
                            <p className="font-bold text-on-background">
                              {student.first_name} {student.last_name}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600">
                            {student.grade_level || "-"}
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600">
                            {student.school_name || "-"}
                          </td>
                          <td className="py-4 px-4">
                            {student.guardians && student.guardians.length > 0 ? (
                              <div className="space-y-1">
                                {student.guardians.map((guardian, idx) => (
                                  <div key={guardian.id}>
                                    <p className="text-sm font-medium text-on-background">
                                      {guardian.name}
                                      {guardian.is_primary === "true" && (
                                        <span className="ml-1 text-xs text-primary">(Primary)</span>
                                      )}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {guardian.relationship_type || guardian.role} • {guardian.email}
                                    </p>
                                    {idx < (student.guardians?.length ?? 0) - 1 && (
                                      <div className="my-1 border-t border-slate-200"></div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">No guardians linked</span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {student.has_active_assignment ? (
                              <div className="flex flex-col gap-1.5 min-w-[120px]">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    student.assignment_status === "COMPLETED"
                                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                                      : student.assignment_status === "IN_PROGRESS"
                                      ? "bg-blue-100 text-blue-700 border-blue-200"
                                      : "bg-amber-100 text-amber-700 border-amber-200"
                                  }`}>
                                    {student.assignment_status === "COMPLETED" ? "Completed" : student.assignment_status === "IN_PROGRESS" ? "In Progress" : "Assigned"}
                                  </span>
                                  <span className="text-[11px] font-semibold text-slate-500">{student.progress_percentage || 0}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full transition-all duration-500 ${
                                      (student.progress_percentage || 0) === 100
                                        ? "bg-emerald-500"
                                        : (student.progress_percentage || 0) > 50
                                        ? "bg-blue-500"
                                        : (student.progress_percentage || 0) > 0
                                        ? "bg-amber-500"
                                        : "bg-slate-300"
                                    }`}
                                    style={{ width: `${student.progress_percentage || 0}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="px-3 py-1 rounded-lg text-xs font-bold border bg-slate-100 text-slate-700 border-slate-200">
                                No Assignment
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              <a
                                href={`/student/${student.id}/workspace`}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Reports Workspace
                              </a>
                              <button
                                onClick={() => handleViewGuardians(student.id)}
                                className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                Manage Guardians
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
              })()}
            </div>

            {/* Guardian Management Modal */}
            {selectedStudentForGuardians && (
              <div className="glass-card p-8 rounded-2xl mt-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-bold text-on-background">
                    Manage Guardians for {students.find(s => s.id === selectedStudentForGuardians)?.first_name} {students.find(s => s.id === selectedStudentForGuardians)?.last_name}
                  </h4>
                  <button
                    onClick={() => setSelectedStudentForGuardians(null)}
                    className="text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Current Guardians List */}
                <div className="mb-6">
                  <h5 className="text-sm font-bold text-on-background mb-3">Current Guardians</h5>
                  {guardians.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">No guardians assigned yet</p>
                  ) : (
                    <div className="space-y-2">
                      {guardians.map((guardian) => (
                        <div key={guardian.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                          <div>
                            <p className="font-medium text-on-background">{guardian.guardian.name}</p>
                            <p className="text-sm text-slate-600">{guardian.guardian.email}</p>
                            {guardian.relationship_type && (
                              <span className="text-xs text-slate-500">Relationship: {guardian.relationship_type}</span>
                            )}
                            {guardian.is_primary === "true" && (
                              <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">Primary</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveGuardian(guardian.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Guardian Button */}
                {!showAddGuardianForm && (
                  <button
                    onClick={() => setShowAddGuardianForm(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    + Add Another Guardian
                  </button>
                )}

                {/* Add Guardian Form */}
                {showAddGuardianForm && (
                  <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-white">
                    <h5 className="text-sm font-bold text-on-background mb-3">Add New Guardian</h5>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-on-background mb-2">
                          Select Parent/Guardian
                        </label>
                        <select
                          value={newGuardianData.guardian_user_id}
                          onChange={(e) => setNewGuardianData({ ...newGuardianData, guardian_user_id: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        >
                          <option value="">Select parent/guardian...</option>
                          {parentUsers
                            .filter(parent => !guardians.find(g => g.guardian_user_id === parent.id))
                            .map((parent) => (
                              <option key={parent.id} value={parent.id}>
                                {parent.name} ({parent.email})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-on-background mb-2">
                          Relationship Type (Optional)
                        </label>
                        <select
                          value={newGuardianData.relationship_type}
                          onChange={(e) => setNewGuardianData({ ...newGuardianData, relationship_type: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        >
                          <option value="">Select relationship...</option>
                          <option value="Mother">Mother</option>
                          <option value="Father">Father</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Grandparent">Grandparent</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newGuardianData.is_primary === "true"}
                          onChange={(e) => setNewGuardianData({ ...newGuardianData, is_primary: e.target.checked ? "true" : "false" })}
                          className="mr-2"
                        />
                        <label className="text-sm text-on-background">Set as primary contact</label>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleAddGuardian}
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Add Guardian
                        </button>
                        <button
                          onClick={() => {
                            setShowAddGuardianForm(false);
                            setNewGuardianData({ guardian_user_id: "", relationship_type: "", is_primary: "false" });
                          }}
                          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
