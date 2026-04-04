'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { API_DOCS_URL } from '@/lib/api';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Auto-redirect based on role
      if (parsedUser.role === 'PSYCHOLOGIST') {
        router.push('/psychologist/dashboard');
      } else if (parsedUser.role === 'PARENT') {
        router.push('/dashboard');
      } else if (parsedUser.role === 'ADMIN') {
        router.push('/admin/dashboard');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-8 md:mb-16">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3 md:mb-4">
            EdPsych AI
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-2">
            Educational Psychology Assessment Platform
          </p>
          <p className="text-base md:text-lg text-gray-600 px-4">
            Secure, AI-Powered Assessment with Multi-Layer Verification
          </p>
        </div>

        {/* Main Cards */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
          {/* Psychologist Portal */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 hover:shadow-2xl transition-all duration-300 border-2 border-indigo-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4 shadow-lg">
                <svg
                  className="w-8 h-8 md:w-10 md:h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Psychologist Portal</h2>
              <p className="text-gray-600 text-sm">
                Manage students, assign assessments, and review reports
              </p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <span className="text-indigo-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700 text-sm">Create students & parents</span>
              </div>
              <div className="flex items-start">
                <span className="text-indigo-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700 text-sm">Assign secure assessments</span>
              </div>
              <div className="flex items-start">
                <span className="text-indigo-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700 text-sm">Upload IQ test reports</span>
              </div>
              <div className="flex items-start">
                <span className="text-indigo-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700 text-sm">Review AI-generated reports</span>
              </div>
            </div>
            <Link href="/login">
              <button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                Login as Psychologist
              </button>
            </Link>
          </div>

          {/* Parent/School Access */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 hover:shadow-2xl transition-all duration-300 border-2 border-green-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mb-4 shadow-lg">
                <svg
                  className="w-8 h-8 md:w-10 md:h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Parent/School Access</h2>
              <p className="text-gray-600 text-sm">
                Secure verification & assessment completion
              </p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700 text-sm">Multi-layer verification (OTP + DOB)</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700 text-sm">Hybrid chatbot assessments</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700 text-sm">View final reports</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700 text-sm">Secure, one-time links</span>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm text-green-800 font-medium mb-2">
                Access via secure link
              </p>
              <p className="text-xs text-green-700">
                You will receive a verification link from your psychologist
              </p>
            </div>
          </div>

          {/* Admin Portal */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border-2 border-blue-100">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full mb-4 shadow-lg">
                <svg
                  className="w-8 h-8 md:w-10 md:h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">Admin Portal</h2>
              <p className="text-gray-600 text-sm">
                Master control over the entire system
              </p>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700 text-sm">User management</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700 text-sm">System configuration</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700 text-sm">Analytics & reports</span>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 mt-1">✓</span>
                <span className="text-gray-700 text-sm">Full system oversight</span>
              </div>
            </div>
            <Link href="/login">
              <button className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                Login as Admin
              </button>
            </Link>
          </div>
        </div>

        {/* Workflow Explanation */}
        <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-lg rounded-2xl p-6 md:p-8 shadow-xl border-2 border-purple-100">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 text-center mb-6">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full font-bold text-lg mb-3">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Psychologist Creates</h4>
              <p className="text-sm text-gray-600">
                Add student details and parent information, then assign assessments
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 text-green-600 rounded-full font-bold text-lg mb-3">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Parent Verifies</h4>
              <p className="text-sm text-gray-600">
                Parents receive secure link, verify with OTP + student DOB
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 text-purple-600 rounded-full font-bold text-lg mb-3">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Reports</h4>
              <p className="text-sm text-gray-600">
                Complete hybrid assessment, AI generates report, psychologist reviews
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 md:mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-gray-700 text-sm md:text-base">
            <Link href="/login" className="hover:text-indigo-600 transition-colors font-medium">
              Login
            </Link>
            <span className="text-gray-400">•</span>
            <a
              href={API_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors font-medium"
            >
              API Documentation
            </a>
            <span className="text-gray-400">•</span>
            <Link href="/chat/test" className="hover:text-indigo-600 transition-colors font-medium">
              Test Hybrid Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
