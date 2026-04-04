"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";

const YEAR_OPTIONS = [
  "Reception",
  "Year 1",
  "Year 2",
  "Year 3",
  "Year 4",
  "Year 5",
  "Year 6",
  "Year 7",
  "Year 8",
  "Year 9",
  "Year 10",
  "Year 11",
  "Year 12",
  "Year 13",
];

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [confirmInfo, setConfirmInfo] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    relationship: "",
    student_first_name: "",
    student_last_name: "",
    date_of_birth: "",
    gender: "",
    school_name: "",
    year_group: "",
  });

  const update = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // --- Validation per step ---
  const validateStep1 = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.full_name.trim()) errs.full_name = "Full name is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) errs.email = "Please enter a valid email address";
    if (formData.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = "Passwords do not match";
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (!formData.phone.trim() || phoneDigits.length < 10) errs.phone = "Please enter a valid phone number (at least 10 digits)";
    if (!formData.relationship) errs.relationship = "Please select your relationship to the child";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: { [key: string]: string } = {};
    if (!formData.student_first_name.trim()) errs.student_first_name = "Child's first name is required";
    if (!formData.student_last_name.trim()) errs.student_last_name = "Child's last name is required";
    if (!formData.date_of_birth) errs.date_of_birth = "Date of birth is required";
    // Gender, School Name, and Year/Grade are optional — no validation needed
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    setErrors({});
    setApiError("");
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!confirmInfo) {
      setErrors({ confirmInfo: "You must confirm the information is accurate" });
      return;
    }
    setErrors({});
    setApiError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/register-parent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          phone: formData.phone,
          relationship: formData.relationship,
          student_first_name: formData.student_first_name,
          student_last_name: formData.student_last_name,
          date_of_birth: formData.date_of_birth,
          gender: formData.gender,
          school_name: formData.school_name,
          year_group: formData.year_group,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push(`/chat/${data.assignment_id}`);
      } else {
        const errorData = await response.json().catch(() => null);
        let errorMessage = "Registration failed. Please try again.";
        if (errorData?.detail) {
          if (typeof errorData.detail === "string") {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail
              .map((err: any) => `${err.loc?.join(".") ?? ""}: ${err.msg}`)
              .join(". ");
          }
        }
        setApiError(errorMessage);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setApiError("An error occurred. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- Shared input classes ---
  const inputCls = (field: string) =>
    `w-full px-4 py-3 bg-surface border ${errors[field] ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all duration-300 text-on-surface outline-none text-sm`;

  const selectCls = (field: string) =>
    `w-full px-4 py-3 bg-surface border ${errors[field] ? "border-red-500" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all duration-300 text-on-surface outline-none text-sm appearance-none`;

  const labelCls = "block text-xs font-medium text-slate-700 mb-1.5";
  const errorCls = "text-red-500 text-xs mt-1";

  // --- Step indicator ---
  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                s < step
                  ? "bg-emerald-500 text-white"
                  : s === step
                  ? "bg-on-background text-white shadow-lg"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {s < step ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </div>
            {s < 3 && (
              <div className={`flex-1 h-0.5 mx-2 rounded transition-all duration-300 ${s < step ? "bg-emerald-500" : "bg-slate-200"}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span className={step >= 1 ? "text-on-background" : ""}>Parent Details</span>
        <span className={step >= 2 ? "text-on-background" : ""}>Student Details</span>
        <span className={step >= 3 ? "text-on-background" : ""}>Review</span>
      </div>
    </div>
  );

  // --- Step 1: Parent Details ---
  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="full_name" className={labelCls}>Full Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          id="full_name"
          value={formData.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          className={inputCls("full_name")}
          placeholder="Enter your full name"
          required
        />
        {errors.full_name && <p className={errorCls}>{errors.full_name}</p>}
      </div>

      <div>
        <label htmlFor="email" className={labelCls}>Email Address <span className="text-red-500">*</span></label>
        <input
          type="email"
          id="email"
          value={formData.email}
          onChange={(e) => update("email", e.target.value)}
          className={inputCls("email")}
          placeholder="you@example.com"
          required
        />
        {errors.email && <p className={errorCls}>{errors.email}</p>}
      </div>

      <div className="relative">
        <label htmlFor="password" className={labelCls}>Password <span className="text-red-500">*</span></label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            id="password"
            value={formData.password}
            onChange={(e) => update("password", e.target.value)}
            className={inputCls("password")}
            placeholder="Min. 8 characters"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-slate-400 hover:text-primary transition-colors"
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
        {errors.password && <p className={errorCls}>{errors.password}</p>}
      </div>

      <div className="relative">
        <label htmlFor="confirmPassword" className={labelCls}>Confirm Password <span className="text-red-500">*</span></label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            className={inputCls("confirmPassword")}
            placeholder="Re-enter password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-slate-400 hover:text-primary transition-colors"
          >
            {showConfirmPassword ? (
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
        {errors.confirmPassword && <p className={errorCls}>{errors.confirmPassword}</p>}
      </div>

      <div>
        <label htmlFor="phone" className={labelCls}>Phone Number <span className="text-red-500">*</span></label>
        <input
          type="tel"
          id="phone"
          pattern="[0-9]*"
          value={formData.phone}
          onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))}
          className={inputCls("phone")}
          placeholder="+44 7700 900000"
          required
        />
        {errors.phone && <p className={errorCls}>{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="relationship" className={labelCls}>Relationship to Child <span className="text-red-500">*</span></label>
        <select
          id="relationship"
          value={formData.relationship}
          onChange={(e) => update("relationship", e.target.value)}
          className={selectCls("relationship")}
          required
        >
          <option value="">Select relationship...</option>
          <option value="Mother">Mother</option>
          <option value="Father">Father</option>
          <option value="Guardian">Guardian</option>
          <option value="Other">Other</option>
        </select>
        {errors.relationship && <p className={errorCls}>{errors.relationship}</p>}
      </div>
    </div>
  );

  // --- Step 2: Student Details ---
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="student_first_name" className={labelCls}>Child&apos;s First Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="student_first_name"
            value={formData.student_first_name}
            onChange={(e) => update("student_first_name", e.target.value)}
            className={inputCls("student_first_name")}
            placeholder="First name"
            required
          />
          {errors.student_first_name && <p className={errorCls}>{errors.student_first_name}</p>}
        </div>
        <div>
          <label htmlFor="student_last_name" className={labelCls}>Child&apos;s Last Name <span className="text-red-500">*</span></label>
          <input
            type="text"
            id="student_last_name"
            value={formData.student_last_name}
            onChange={(e) => update("student_last_name", e.target.value)}
            className={inputCls("student_last_name")}
            placeholder="Last name"
            required
          />
          {errors.student_last_name && <p className={errorCls}>{errors.student_last_name}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="date_of_birth" className={labelCls}>Date of Birth <span className="text-red-500">*</span></label>
        <input
          type="date"
          id="date_of_birth"
          value={formData.date_of_birth}
          onChange={(e) => update("date_of_birth", e.target.value)}
          className={inputCls("date_of_birth")}
          required
        />
        {errors.date_of_birth && <p className={errorCls}>{errors.date_of_birth}</p>}
      </div>

      <div>
        <label htmlFor="gender" className={labelCls}>Gender</label>
        <select
          id="gender"
          value={formData.gender}
          onChange={(e) => update("gender", e.target.value)}
          className={selectCls("gender")}
        >
          <option value="">Select gender...</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>

      <div>
        <label htmlFor="school_name" className={labelCls}>School Name</label>
        <input
          type="text"
          id="school_name"
          value={formData.school_name}
          onChange={(e) => update("school_name", e.target.value)}
          className={inputCls("school_name")}
          placeholder="Enter school name"
        />
      </div>

      <div>
        <label htmlFor="year_group" className={labelCls}>Year / Grade</label>
        <select
          id="year_group"
          value={formData.year_group}
          onChange={(e) => update("year_group", e.target.value)}
          className={selectCls("year_group")}
        >
          <option value="">Select year group...</option>
          {YEAR_OPTIONS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    </div>
  );

  // --- Step 3: Review & Submit ---
  const SummaryRow = ({ label, value }: { label: string; value: string }) => (
    <div className="flex justify-between py-2 border-b border-slate-100 last:border-0">
      <span className="text-xs font-medium text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-on-surface text-right max-w-[60%] break-words">{value}</span>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div className="bg-surface border border-slate-200 rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Parent / Guardian</h4>
        <SummaryRow label="Full Name" value={formData.full_name} />
        <SummaryRow label="Email" value={formData.email} />
        <SummaryRow label="Phone" value={formData.phone} />
        <SummaryRow label="Relationship" value={formData.relationship} />
      </div>

      <div className="bg-surface border border-slate-200 rounded-xl p-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Student</h4>
        <SummaryRow label="Name" value={`${formData.student_first_name} ${formData.student_last_name}`} />
        <SummaryRow label="Date of Birth" value={formData.date_of_birth} />
        <SummaryRow label="Gender" value={formData.gender} />
        <SummaryRow label="School" value={formData.school_name} />
        <SummaryRow label="Year Group" value={formData.year_group} />
      </div>

      <label className="flex items-start gap-3 group cursor-pointer">
        <input
          type="checkbox"
          checked={confirmInfo}
          onChange={(e) => {
            setConfirmInfo(e.target.checked);
            if (errors.confirmInfo) {
              setErrors((prev) => {
                const next = { ...prev };
                delete next.confirmInfo;
                return next;
              });
            }
          }}
          className={`w-5 h-5 mt-0.5 rounded border-slate-300 text-primary focus:ring-primary/20 transition-all cursor-pointer ${errors.confirmInfo ? "border-red-500" : ""}`}
        />
        <span className="text-xs text-slate-500 group-hover:text-on-background transition-colors leading-relaxed">
          I confirm the information provided above is accurate. I agree to the{" "}
          <a href="#" className="text-primary font-bold hover:underline">Terms of Service</a> and{" "}
          <a href="#" className="text-primary font-bold hover:underline">Privacy Policy</a>.
        </span>
      </label>
      {errors.confirmInfo && <p className={errorCls}>{errors.confirmInfo}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-stretch overflow-hidden">
      {/* Left Section: Visual Branding */}
      <section className="hidden lg:flex w-7/12 relative bg-surface items-center justify-center p-16 overflow-hidden border-r border-slate-200">
        {/* Background decorative elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-100 rounded-full blur-[160px] opacity-60" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-teal-100 rounded-full blur-[140px] opacity-40" />
        </div>

        <div className="relative z-10 max-w-2xl w-full">
          <header className="mb-16">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <span className="text-on-background text-2xl font-black tracking-tighter">The EdPsych</span>
            </div>
            <h1 className="text-on-background text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
              Register Your <span className="brand-accent">Child&apos;s Journey</span> Today.
            </h1>
            <p className="text-slate-500 text-lg lg:text-xl leading-relaxed font-normal max-w-lg">
              Create a parent account and enrol your child for personalised educational psychology support.
            </p>
          </header>

          {/* Illustration Card */}
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] bg-white p-2 border border-slate-200">
            <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-50 h-[450px] flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <svg className="w-24 h-24 text-emerald-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="text-2xl font-bold text-on-surface mb-2 text-center">Secure & Confidential</h3>
                <p className="text-slate-500 text-center text-sm">HIPAA-compliant data protection</p>
              </div>

              <div className="p-4 bg-gradient-to-t from-black/5 to-transparent">
                <div className="flex gap-3">
                  <div className="glass-card p-4 rounded-xl shadow-xl flex-1 backdrop-blur-md">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 mb-1">ENCRYPTED</div>
                        <div className="text-xs text-slate-800 font-semibold leading-tight">End-to-end security</div>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-4 rounded-xl shadow-xl flex-1 backdrop-blur-md hidden lg:block">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-teal-700 mb-1">COMMUNITY</div>
                        <div className="text-xs text-slate-800 font-semibold leading-tight">500+ Practitioners</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Right Section: Multi-Step Registration Form */}
      <main className="w-full lg:w-5/12 bg-background flex flex-col items-center justify-center p-8 sm:p-16 relative overflow-y-auto">
        {/* Header for mobile */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-slate-100">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-on-background font-black text-xl tracking-tighter">The EdPsych</span>
        </div>

        <div className="max-w-md w-full mt-16 lg:mt-0">
          <div className="mb-6">
            <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-on-background mb-2">
              {step === 1 && "Parent Details"}
              {step === 2 && "Student Details"}
              {step === 3 && "Review & Submit"}
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              {step === 1 && "Tell us about yourself to get started."}
              {step === 2 && "Now let's add your child's information."}
              {step === 3 && "Please review the details before submitting."}
            </p>
          </div>

          <StepIndicator />

          {apiError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
              {apiError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step < 3) handleNext();
              else handleSubmit();
            }}
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-3 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] transition-all text-sm"
                >
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  type="submit"
                  className="flex-1 py-3 bg-on-background text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all duration-300 text-sm"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-on-background text-white font-bold rounded-xl shadow-lg hover:bg-slate-800 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  <span>{loading ? "Creating account..." : "Create Account"}</span>
                </button>
              )}
            </div>
          </form>

          <div className="relative py-5 mt-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[9px] lg:text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
              <span className="bg-background px-4">Already have an account?</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all text-sm"
          >
            Login
          </button>

          <footer className="mt-10 text-center">
            <div className="flex justify-center gap-6 lg:gap-8 text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
              <a href="#" className="hover:text-primary transition-colors">Documentation</a>
              <a href="#" className="hover:text-primary transition-colors">Support</a>
              <a href="#" className="hover:text-primary transition-colors">Privacy</a>
            </div>
            <div className="mt-6 text-[9px] lg:text-[10px] text-slate-400 font-medium">
              &copy; 2024 The EdPsych. All clinical data encrypted.
            </div>
          </footer>
        </div>
      </main>

      {/* Floating Elements */}
      <div className="fixed top-20 right-[48%] translate-x-1/2 w-48 h-48 bg-emerald-400/5 rounded-full blur-[80px] pointer-events-none z-0" />
      <div className="fixed bottom-20 left-[48%] translate-x-1/2 w-64 h-64 bg-teal-400/5 rounded-full blur-[100px] pointer-events-none z-0" />
    </div>
  );
}
