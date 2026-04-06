"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Redirect based on role
        switch (data.user.role.toUpperCase()) {
          case "PSYCHOLOGIST":
            router.push("/psychologist/dashboard");
            break;
          case "SCHOOL":
            router.push("/school/dashboard");
            break;
          case "ADMIN":
            router.push("/admin/dashboard");
            break;
          case "PARENT":
          default:
            router.push("/dashboard");
            break;
        }
      } else {
        alert("Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
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
              The <span className="brand-accent">Cognitive Sanctuary</span> for Educational Psychologists.
            </h1>
            <p className="text-slate-500 text-lg lg:text-xl leading-relaxed font-normal max-w-lg">
              Transforming assessment data into precise, actionable insights. Built for practitioners who value clarity and depth.
            </p>
          </header>

          {/* Illustration Card - Fixed layout */}
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-white p-2 border border-slate-200">
            <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 h-[450px] flex flex-col">
              {/* Main content - takes upper portion */}
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <svg className="w-24 h-24 text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                </svg>
                <h3 className="text-2xl font-bold text-on-surface mb-2 text-center">Assessment Intelligence</h3>
                <p className="text-slate-500 text-center text-sm">Professional report generation</p>
              </div>

              {/* Info cards at bottom - no absolute positioning */}
              <div className="p-4 bg-gradient-to-t from-black/5 to-transparent">
                <div className="flex gap-3">
                  <div className="glass-card p-4 rounded-xl shadow-xl flex-1 backdrop-blur-md">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-blue-700 mb-1">INSIGHT</div>
                        <div className="text-xs text-slate-800 font-semibold leading-tight">Neural synthesis</div>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-4 rounded-xl shadow-xl flex-1 backdrop-blur-md hidden lg:block">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 mb-1">RELIABILITY</div>
                        <div className="text-xs text-slate-800 font-semibold leading-tight">98.4% Confidence</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Section: Login Form */}
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
          <div className="mb-8 lg:mb-12">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-on-background mb-3">Welcome Back</h2>
            <p className="text-slate-500 font-medium text-sm lg:text-base">Access your dashboard and student assessments.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
            {/* Email Field */}
            <div className="floating-label-group">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 lg:py-4 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all duration-300 text-on-surface outline-none text-sm lg:text-base"
                placeholder=" "
                required
              />
              <label htmlFor="email" className="text-xs lg:text-sm font-medium">Email Address</label>
            </div>

            {/* Password Field */}
            <div className="floating-label-group">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 lg:py-4 bg-surface border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all duration-300 text-on-surface outline-none text-sm lg:text-base"
                placeholder=" "
                required
              />
              <label htmlFor="password" className="text-xs lg:text-sm font-medium">Password</label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 lg:right-4 top-3 lg:top-4 text-slate-400 hover:text-primary transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 lg:gap-3 group cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.remember}
                  onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
                  className="w-4 h-4 lg:w-5 lg:h-5 rounded border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                />
                <span className="text-xs lg:text-sm font-medium text-slate-500 group-hover:text-on-background transition-colors">
                  Remember me
                </span>
              </label>
              <a href="#" className="text-xs lg:text-sm font-bold text-primary hover:text-blue-700 transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 lg:py-4 bg-on-background text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 text-sm lg:text-base"
            >
              <span>{loading ? "Signing in..." : "Sign in to The EdPsych Practice"}</span>
            </button>

            <div className="relative py-4 lg:py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[9px] lg:text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
                <span className="bg-background px-4">or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => router.push("/register")}
              className="w-full py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all text-sm lg:text-base"
            >
              Create New Account
            </button>
          </form>

          <footer className="mt-12 lg:mt-16 text-center">
            <div className="flex justify-center gap-6 lg:gap-8 text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              <a href="#" className="hover:text-primary transition-colors">Documentation</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            </div>
            <div className="mt-6 lg:mt-8 text-[9px] lg:text-[10px] text-slate-400 font-medium">
              © 2024 The EdPsych Practice. All clinical data encrypted.
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
