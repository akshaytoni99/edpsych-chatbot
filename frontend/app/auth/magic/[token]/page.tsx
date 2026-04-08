"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

type PageState =
  | { kind: "loading" }
  | { kind: "password_setup"; user_email: string; assignment_id?: string }
  | { kind: "auto_login" }
  | { kind: "error"; message: string };

export default function MagicLinkPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [state, setState] = useState<PageState>({ kind: "loading" });

  // Password setup form
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Store response data for later use
  const [responseData, setResponseData] = useState<{
    access_token?: string;
    user?: Record<string, unknown>;
    assignment_id?: string;
  }>({});

  useEffect(() => {
    if (!token) return;

    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_BASE}/auth/magic-login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          setState({
            kind: "error",
            message: "This link has expired or is invalid.",
          });
          return;
        }

        const data = await response.json();
        setResponseData(data);

        if (data.needs_password_setup) {
          setState({
            kind: "password_setup",
            user_email: data.user_email || "",
            assignment_id: data.assignment_id,
          });
        } else {
          // Auto-login
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("user", JSON.stringify(data.user));
          setState({ kind: "auto_login" });

          setTimeout(() => {
            if (data.assignment_id) {
              router.push(`/chat/${data.assignment_id}`);
            } else {
              router.push("/dashboard");
            }
          }, 1200);
        }
      } catch {
        setState({
          kind: "error",
          message: "This link has expired or is invalid.",
        });
      }
    };

    verifyToken();
  }, [token, router]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/auth/setup-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, confirm_password: confirmPassword }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        setFormError(err?.detail || "Failed to set password. Please try again.");
        setSubmitting(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      const assignmentId = data.assignment_id || responseData.assignment_id;
      if (assignmentId) {
        router.push(`/chat/${assignmentId}`);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setFormError("An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  // --- Eye icon SVGs (matching login/register pattern) ---
  const EyeOpen = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const EyeClosed = (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );

  // --- Render states ---

  const renderLoading = () => (
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin mx-auto mb-6" />
      <h2 className="text-2xl font-extrabold tracking-tight text-on-background mb-2">
        Verifying your link...
      </h2>
      <p className="text-slate-500 text-sm">Please wait while we verify your invitation.</p>
    </div>
  );

  const renderAutoLogin = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-extrabold tracking-tight text-on-background mb-2">
        Logging you in...
      </h2>
      <p className="text-slate-500 text-sm">You will be redirected momentarily.</p>
    </div>
  );

  const renderError = (message: string) => (
    <div className="text-center">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-xl font-extrabold tracking-tight text-on-background mb-2">
          {message}
        </h2>
        <p className="text-slate-500 text-sm">
          Please contact your psychologist for a new invitation link.
        </p>
      </div>
      <button
        onClick={() => router.push("/login")}
        className="w-full py-3 lg:py-4 bg-on-background text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all duration-300 text-sm lg:text-base"
      >
        Go to Login
      </button>
    </div>
  );

  const renderPasswordSetup = (userEmail: string) => (
    <div>
      <div className="mb-8 lg:mb-10">
        <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-on-background mb-3">
          Welcome to The EdPsych Practice
        </h2>
        <p className="text-slate-500 font-medium text-sm lg:text-base">
          Set up your password to access your child&apos;s assessment.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
        <span className="text-sm text-blue-800 font-medium truncate">{userEmail}</span>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-5 lg:space-y-6">
        {formError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">
            {formError}
          </div>
        )}

        {/* Password Field */}
        <div className="floating-label-group">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 lg:py-4 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all duration-300 text-on-surface outline-none text-sm lg:text-base"
            placeholder=" "
            required
            minLength={8}
          />
          <label htmlFor="password" className="text-xs lg:text-sm font-medium">Password (min 8 characters)</label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 lg:right-4 top-3 lg:top-4 text-slate-400 hover:text-primary transition-colors"
          >
            {showPassword ? EyeClosed : EyeOpen}
          </button>
        </div>

        {/* Confirm Password Field */}
        <div className="floating-label-group">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 lg:py-4 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all duration-300 text-on-surface outline-none text-sm lg:text-base"
            placeholder=" "
            required
            minLength={8}
          />
          <label htmlFor="confirmPassword" className="text-xs lg:text-sm font-medium">Confirm Password</label>
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 lg:right-4 top-3 lg:top-4 text-slate-400 hover:text-primary transition-colors"
          >
            {showConfirmPassword ? EyeClosed : EyeOpen}
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 lg:py-4 bg-on-background text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 text-sm lg:text-base"
        >
          <span>{submitting ? "Setting up..." : "Create Password & Continue"}</span>
        </button>
      </form>
    </div>
  );

  // --- Main content selector ---
  const renderContent = () => {
    switch (state.kind) {
      case "loading":
        return renderLoading();
      case "auto_login":
        return renderAutoLogin();
      case "error":
        return renderError(state.message);
      case "password_setup":
        return renderPasswordSetup(state.user_email);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch overflow-hidden">
      {/* Left Section: Visual Branding */}
      <section className="hidden lg:flex w-7/12 relative bg-surface items-center justify-center p-16 overflow-hidden border-r border-slate-200">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-100 rounded-full blur-[160px] opacity-60" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100 rounded-full blur-[140px] opacity-40" />
        </div>

        <div className="relative z-10 max-w-2xl w-full">
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-on-background text-2xl font-black tracking-tighter">The EdPsych Practice</span>
            </div>
            <h1 className="text-on-background text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
              Welcome to your <span className="brand-accent">Assessment Portal</span>.
            </h1>
            <p className="text-slate-500 text-lg lg:text-xl leading-relaxed font-normal max-w-lg">
              Your psychologist has invited you to securely access your child&apos;s assessment. Set up your account to get started.
            </p>
          </header>

          {/* Illustration Card */}
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-white p-2 border border-slate-200">
            <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-emerald-50 to-blue-50 h-[300px] flex flex-col items-center justify-center p-8">
              <svg className="w-20 h-20 text-emerald-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <h3 className="text-2xl font-bold text-on-surface mb-2 text-center">Secure Access</h3>
              <p className="text-slate-500 text-center text-sm">Your data is encrypted and protected</p>
            </div>
          </div>
        </div>
      </section>

      {/* Right Section: Content */}
      <main className="w-full lg:w-5/12 bg-background flex flex-col items-center justify-center p-8 sm:p-16 relative">
        {/* Header for mobile */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-slate-100">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-on-background font-black text-xl tracking-tighter">The EdPsych Practice</span>
        </div>

        <div className="max-w-md w-full mt-16 lg:mt-0">
          {renderContent()}

          <footer className="mt-12 lg:mt-16 text-center">
            <div className="flex justify-center gap-6 lg:gap-8 text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              <a href="#" className="hover:text-primary transition-colors">Documentation</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            </div>
            <div className="mt-6 lg:mt-8 text-[9px] lg:text-[10px] text-slate-400 font-medium">
              &copy; 2026 The EdPsych Practice. All clinical data encrypted.
            </div>
          </footer>
        </div>
      </main>

      {/* Floating Elements */}
      <div className="fixed top-20 right-[48%] translate-x-1/2 w-48 h-48 bg-blue-400/5 rounded-full blur-[80px] pointer-events-none z-0" />
      <div className="fixed bottom-20 left-[48%] translate-x-1/2 w-64 h-64 bg-indigo-400/5 rounded-full blur-[100px] pointer-events-none z-0" />
    </div>
  );
}
