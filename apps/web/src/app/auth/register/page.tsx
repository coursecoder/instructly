'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { signUpSchema } from '@instructly/shared/schemas';
import type { SignUpData } from '@instructly/shared/types';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, isLoading, error } = useAuthStore();
  
  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: '',
    name: '',
    organization: '',
    role: 'designer'
  });
  
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    // Validate form data
    const validation = signUpSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0] as string] = issue.message;
        }
      });
      setValidationErrors(errors);
      return;
    }

    try {
      const result = await signUp(formData);
      
      if (result.emailConfirmationRequired) {
        setShowSuccess(true);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      // Error is handled by the store
      console.error('Registration failed:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendMessage('');

    try {
      // We need to import and use the tRPC client directly here
      const { createTRPCProxyClient, httpBatchLink } = await import('@trpc/client');
      
      const trpcClient = createTRPCProxyClient<any>({
        links: [
          httpBatchLink({
            url: process.env.NODE_ENV === 'development' 
              ? 'http://localhost:3001/api/trpc'
              : '/api/trpc',
          }),
        ],
      });

      // TODO: Implement resendVerification endpoint in tRPC auth router
      // await trpcClient.auth.resendVerification.mutate({ email: formData.email });
      setResendMessage('Verification email sent successfully!');
    } catch (error) {
      setResendMessage('Failed to resend verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We&apos;ve sent a confirmation link to <strong>{formData.email}</strong>
            </p>
            <p className="mt-4 text-center text-sm text-gray-600">
              Please check your email and click the confirmation link to activate your account.
            </p>
            
            {resendMessage && (
              <div className={`mt-4 text-center text-sm ${
                resendMessage.includes('successfully') ? 'text-green-600' : 'text-red-600'
              }`}>
                {resendMessage}
              </div>
            )}
            
            <div className="mt-6 space-y-3">
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading ? 'Sending...' : 'Resend verification email'}
              </button>
              
              <Link
                href="/auth/login"
                className="block text-center text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
              >
                Return to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join the evidence-based instructional design revolution
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full name *
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                aria-invalid={validationErrors.name ? 'true' : 'false'}
                aria-describedby={validationErrors.name ? 'name-error' : undefined}
                className={`mt-1 block w-full px-3 py-2 border ${
                  validationErrors.name ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
              />
              {validationErrors.name && (
                <p id="name-error" className="mt-2 text-sm text-red-600" role="alert">
                  {validationErrors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-invalid={validationErrors.email ? 'true' : 'false'}
                aria-describedby={validationErrors.email ? 'email-error' : undefined}
                className={`mt-1 block w-full px-3 py-2 border ${
                  validationErrors.email ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
              />
              {validationErrors.email && (
                <p id="email-error" className="mt-2 text-sm text-red-600" role="alert">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                aria-invalid={validationErrors.password ? 'true' : 'false'}
                aria-describedby={validationErrors.password ? 'password-error password-help' : 'password-help'}
                className={`mt-1 block w-full px-3 py-2 border ${
                  validationErrors.password ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleInputChange}
              />
              <p id="password-help" className="mt-1 text-xs text-gray-500">
                Must contain uppercase, lowercase, number, and special character
              </p>
              {validationErrors.password && (
                <p id="password-error" className="mt-2 text-sm text-red-600" role="alert">
                  {validationErrors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700">
                Organization
              </label>
              <input
                id="organization"
                name="organization"
                type="text"
                autoComplete="organization"
                aria-invalid={validationErrors.organization ? 'true' : 'false'}
                aria-describedby={validationErrors.organization ? 'organization-error' : undefined}
                className={`mt-1 block w-full px-3 py-2 border ${
                  validationErrors.organization ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Your company or institution (optional)"
                value={formData.organization}
                onChange={handleInputChange}
              />
              {validationErrors.organization && (
                <p id="organization-error" className="mt-2 text-sm text-red-600" role="alert">
                  {validationErrors.organization}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role *
              </label>
              <select
                id="role"
                name="role"
                required
                aria-invalid={validationErrors.role ? 'true' : 'false'}
                aria-describedby={validationErrors.role ? 'role-error' : undefined}
                className={`mt-1 block w-full px-3 py-2 border ${
                  validationErrors.role ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="designer">Instructional Designer</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
              </select>
              {validationErrors.role && (
                <p id="role-error" className="mt-2 text-sm text-red-600" role="alert">
                  {validationErrors.role}
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Registration failed
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              aria-label="Create your account"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
              >
                Sign in here
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}