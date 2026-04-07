"use client";

import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Branding */}
        <div className="flex items-center gap-3 justify-center mb-10">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <span className="text-on-background text-2xl font-black tracking-tighter">The EdPsych Practice</span>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 p-8 sm:p-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-on-background mb-3 text-center">
            Parent Registration
          </h1>

          <p className="text-slate-500 text-sm leading-relaxed text-center mb-8">
            Parent accounts are created by your assigned educational psychologist. When an assessment is assigned to your child, you&apos;ll receive a secure invitation link via email.
          </p>

          {/* How it works */}
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">How it works</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <p className="text-sm text-slate-600 pt-1">Your psychologist creates a profile for your child</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <p className="text-sm text-slate-600 pt-1">You receive a secure magic link via email</p>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <p className="text-sm text-slate-600 pt-1">Click the link to set up your password and access the assessment</p>
              </div>
            </div>
          </div>

          {/* Already have an account */}
          <div className="relative py-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[9px] lg:text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
              <span className="bg-white px-4">Already have an account?</span>
            </div>
          </div>

          <Link
            href="/login"
            className="block w-full py-3 border-2 border-primary text-primary font-bold rounded-xl hover:bg-primary hover:text-white transition-all text-sm text-center"
          >
            Login
          </Link>

          <p className="text-xs text-slate-400 text-center mt-6">
            Didn&apos;t receive an invitation? Contact your psychologist directly.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center">
          <div className="flex justify-center gap-6 lg:gap-8 text-[9px] lg:text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
            <a href="#" className="hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          </div>
          <div className="mt-6 text-[9px] lg:text-[10px] text-slate-400 font-medium">
            &copy; 2024 The EdPsych Practice. All clinical data encrypted.
          </div>
        </footer>
      </div>
    </div>
  );
}
