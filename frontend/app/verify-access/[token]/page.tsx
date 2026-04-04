'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_BASE } from '@/lib/api';

interface VerificationStatus {
  valid: boolean;
  is_otp_verified: boolean;
  is_dob_verified: boolean;
  is_fully_verified: boolean;
  student_name: string | null;
  expires_at: string;
  otp_attempts_remaining: number;
  dob_attempts_remaining: number;
}

export default function VerifyAccessPage() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch verification status
  useEffect(() => {
    if (token) {
      checkVerificationStatus();
    }
  }, [token]);

  const checkVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/verification/status/${token}`);

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || 'Invalid or expired verification link');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setVerificationStatus(data);

      // If already OTP verified, redirect to DOB page
      if (data.is_otp_verified && !data.is_fully_verified) {
        router.push(`/verify-dob/${token}`);
      }

      // If fully verified, redirect to assessment
      if (data.is_fully_verified) {
        setError('Verification already complete. Redirecting to assessment...');
        setTimeout(() => {
          // TODO: Get actual assignment ID from API
          router.push(`/assessment/${token}`);
        }, 2000);
      }

      setLoading(false);
    } catch (err) {
      setError('Failed to check verification status. Please try again.');
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE}/verification/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          secure_token: token,
          otp_code: otpCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || 'Invalid OTP code');
        setSubmitting(false);
        // Refresh status to update attempts remaining
        await checkVerificationStatus();
        return;
      }

      // OTP verified successfully - redirect to DOB page
      router.push(`/verify-dob/${token}`);
    } catch (err) {
      setError('Failed to verify OTP. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verifying access link...</p>
        </div>
      </div>
    );
  }

  if (error && !verificationStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">
              Please contact your psychologist for a new verification link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 py-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4 shadow-lg">
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Verify Your Access</h1>
          <p className="text-sm md:text-base text-gray-600">
            Enter the 6-digit OTP code sent to you
          </p>
          {verificationStatus?.student_name && (
            <p className="text-sm text-gray-500 mt-2">
              Assessment for: <span className="font-semibold">{verificationStatus.student_name}</span>
            </p>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold">
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">OTP Verification</span>
              </div>
              <div className="flex items-center text-gray-400">
                <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-gray-300 text-sm font-semibold">
                  2
                </div>
                <span className="ml-2 text-sm font-medium">DOB Verification</span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }}></div>
            </div>
          </div>

          {/* OTP Form */}
          <form onSubmit={handleOtpSubmit}>
            <div className="mb-6">
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                OTP Code
              </label>
              <input
                type="text"
                id="otp"
                maxLength={6}
                pattern="[0-9]{6}"
                value={otpCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setOtpCode(value);
                  setError('');
                }}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-center text-2xl font-semibold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                required
                disabled={submitting}
              />
              {verificationStatus && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Attempts remaining: {verificationStatus.otp_attempts_remaining}
                </p>
              )}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || otpCode.length !== 6}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Did not receive the code?{' '}
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Resend OTP
              </button>
            </p>
          </div>
        </div>

        {/* Expiration Notice */}
        {verificationStatus && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              This link expires on {new Date(verificationStatus.expires_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
