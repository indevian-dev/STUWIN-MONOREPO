"use client";

import { useState } from 'react';
import {
  useRouter,
  Link
} from '@/i18n/routing';
import { toast } from 'react-toastify';
import { apiCall } from '@/lib/utils/http/SpaApiClient';
import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
import { GlobalLogoTile } from '@/app/[locale]/(global)/(tiles)/GlobalLogoTile';
import Image
  from 'next/image';

interface FormErrors {
  email?: string;
  otp?: string;
  password?: string;
  confirmPassword?: string;
}

export default function AuthResetWidget() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1); // Step 1: Email only, Step 2: OTP, password, confirmPassword
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name in formErrors) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validateStep1 = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Valid email is required';
    }
    return errors;
  };

  const validateStep2 = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.otp || formData.otp.length !== 6) {
      errors.otp = 'Valid 6-digit code is required';
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (!/\d/.test(formData.password)) {
      errors.password = 'Password must contain at least one number';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const handleRequestOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors = validateStep1();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiCall<any>({
        method: 'POST',
        url: '/api/auth/reset/request',
        body: { email: formData.email }
      });

      if (true) { // apiCall ensures success
        toast.success('If your email is registered, you will receive a reset code');
        setStep(2);
      } else {
        toast.error(response?.error || 'Failed to send reset code');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again later.';
      toast.error(errorMessage);
      ConsoleLogger.error('Reset request error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errors = validateStep2();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiCall<any>({
        method: 'POST',
        url: '/api/auth/reset/set',
        body: {
          email: formData.email,
          otp: formData.otp,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }
      });

      if (true) { // apiCall ensures success
        toast.success('Password has been reset successfully');
        setTimeout(() => {
          router.push('/auth/login');
        }, 1500);
      } else {
        toast.error(response?.error || 'Failed to reset password');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again later.';
      toast.error(errorMessage);
      ConsoleLogger.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full max-w-screen-xl m-auto py-4 px-4 my-4 md:my-6 lg:my-8 flex justify-center items-center">
      <div className="w-full max-w-md grid grid-cols-1 justify-center items-center gap-2">
        <Link href="/" className="text-sm text-dark mb-4 grid grid-cols-1 justify-center items-center gap-2">
          <div className="col-span-1 flex justify-center items-center">
            <GlobalLogoTile width={140} height={50} />
          </div>
          <div className="col-span-1 text-sm text-dark text-center">Back to home page</div>
        </Link>

        <h1 className="text-2xl font-bold mb-4 text-dark text-center">
          {step === 1 ? 'Reset Password' : 'Enter Reset Code'}
        </h1>

        {step === 1 ? (
          // Step 1: Email input only
          <form className="bg-white rounded px-4 pt-6 pb-8 w-full" onSubmit={handleRequestOtp}>
            <div className="mb-6">
              <label className="block text-dark text-sm font-light mb-2" htmlFor="email">
                Email
              </label>
              <input
                className="appearance-none border rounded w-full py-2 px-3 text-dark mb-3 leading-tight focus:outline-none focus:-outline"
                id="email"
                type="email"
                name="email"
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
              {formErrors.email && <p className="text-red-500 text-sm italic font-bold">{formErrors.email}</p>}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                className="bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:-outline w-full"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </div>

            <div className="text-center mt-4">
              <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-800 text-sm">
                Back to login
              </Link>
            </div>
          </form>
        ) : (
          // Step 2: OTP, password and confirm password inputs
          <form className="bg-white rounded px-4 pt-6 pb-8 w-full" onSubmit={handleResetPassword}>
            <div className="mb-6">
              <label className="block text-dark text-sm font-light mb-2" htmlFor="otp">
                Reset Code
              </label>
              <input
                className="appearance-none border rounded w-full py-2 px-3 text-dark mb-3 leading-tight focus:outline-none focus:-outline"
                id="otp"
                type="text"
                name="otp"
                placeholder="Enter the 6-digit code"
                value={formData.otp}
                onChange={handleChange}
                maxLength={6}
                required
              />
              {formErrors.otp && <p className="text-red-500 text-sm italic font-bold">{formErrors.otp}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-dark text-sm font-light mb-2" htmlFor="password">
                New Password
              </label>
              <input
                className="appearance-none border rounded w-full py-2 px-3 text-dark mb-3 leading-tight focus:outline-none focus:-outline"
                id="password"
                type="password"
                name="password"
                placeholder="********"
                value={formData.password}
                onChange={handleChange}
                required
              />
              {formErrors.password && <p className="text-red-500 text-sm italic font-bold">{formErrors.password}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-dark text-sm font-light mb-2" htmlFor="confirmPassword">
                Confirm New Password
              </label>
              <input
                className="appearance-none border rounded w-full py-2 px-3 text-dark mb-3 leading-tight focus:outline-none focus:-outline"
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                placeholder="********"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {formErrors.confirmPassword && <p className="text-red-500 text-sm italic font-bold">{formErrors.confirmPassword}</p>}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                className="bg-emerald-500 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:-outline w-full"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>

            <div className="text-center mt-4">
              <button
                className="text-indigo-600 hover:text-indigo-800 text-sm"
                onClick={(e) => {
                  e.preventDefault();
                  setStep(1);
                }}
              >
                Try a different email
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
