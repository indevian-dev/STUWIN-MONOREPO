// pages/register.tsx
"use client";

import {
  useState,
  useEffect
} from 'react';
import {
  useRouter,
  Link
} from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { GlobalLogoTile } from '@/app/[locale]/(global)/(tiles)/GlobalLogo.tile';
import Image
  from 'next/image';
import { parseCookies } from 'nookies';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
import {
  formatPhoneNumber,
  cleanPhoneNumber,
  validateAzerbaijanPhone
} from '@/lib/utils/Formatter.Phone.util';

export default function AuthRegisterWidget() {
  const t = useTranslations('AuthRegisterWidget');
  const router = useRouter();
  const params = useParams();
  const defaultLocale = 'az';
  const locale = (params?.locale as string) || defaultLocale;

  // Password validation function
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push(t('password_length_error'));
    }

    if (!/\d/.test(password)) {
      errors.push(t('password_number_error'));
    }

    if (!/[A-Z]/.test(password)) {
      errors.push(t('password_uppercase_error'));
    }

    return errors;
  };

  const [deviceInfo, setDeviceInfo] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    name: string;
    email: string;
    password: string[];
    confirmPassword: string;
    phone: string;
  }>({
    name: '',
    email: '',
    password: [],
    confirmPassword: '',
    phone: '',
  });

  useEffect(() => {
    try {
      const cookies = parseCookies();
      const token = cookies.token;
      if (token) {
        const targetPath = '/workspaces';
        const dashboardPath = locale !== defaultLocale ? `/${locale}${targetPath}` : targetPath;
        router.push(dashboardPath);
        toast.success(t('already_logged_in'));
      }
    } catch { }
  }, [router, locale]);

  useEffect(() => {
    try {
      const deviceInfoString = localStorage.getItem('deviceInfo');
      if (deviceInfoString) {
        const storedDeviceInfo = JSON.parse(deviceInfoString);
        if (storedDeviceInfo) setDeviceInfo(storedDeviceInfo);
      }
    } catch { }
  }, []);

  const handleOAuthLogin = async (provider: string) => {
    try {
      const response = await fetchApiUtil<any>({
        method: 'POST',
        url: `/api/auth/oauth/initiate`,
        body: { deviceInfo, provider }
      });

      const url = response.url;
      if (url) {
        window.location.href = url;
      } else {
        throw new Error(t('oauth_no_url'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('login_error');
      toast.error(errorMessage);
      ConsoleLogger.error('Login error:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      const formatted = formatPhoneNumber(value);
      setFormData({ ...formData, [name]: formatted });
    } else {
      setFormData({ ...formData, [name]: value });
    }

    // Type guard for errors object keys
    type ErrorKey = keyof typeof errors;
    if (name in errors) {
      const errorKey = name as ErrorKey;
      setErrors({ ...errors, [errorKey]: name === 'password' ? [] : '' } as typeof errors);
    }

    if (name === 'password') {
      const passwordErrors = validatePassword(value);
      setErrors({ ...errors, password: passwordErrors });
    }

    if (name === 'confirmPassword') {
      const confirmError = value !== formData.password ? t('passwords_no_match') : '';
      setErrors({ ...errors, confirmPassword: confirmError });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrors({
      name: '',
      email: '',
      password: [],
      confirmPassword: '',
      phone: '',
    });

    let hasErrors = false;
    const newErrors = { ...errors };

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      newErrors.password = passwordErrors;
      hasErrors = true;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwords_no_match');
      hasErrors = true;
    }

    if (!validateAzerbaijanPhone(formData.phone)) {
      newErrors.phone = t('phone_invalid');
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      const cleanedPhone = cleanPhoneNumber(formData.phone);
      const submissionData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: cleanedPhone,
      };

      const response = await fetchApiUtil<any>({
        url: '/api/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: submissionData,
      });

      // apiCall throws on error — success if we reach here
      // Clear stale profile cache so the verify page loads fresh data for the new user
      localStorage.removeItem('stuwin.ai_profile');

      // Show success message
      toast.success(response?.message || t('registration_successful'));

      // Redirect to verification page — OTP is not auto-sent, user clicks "Send Code"
      // Pass email & phone as query params so the verification widget can pre-fill them
      const email = encodeURIComponent(formData.email.trim());
      const phone = encodeURIComponent(cleanedPhone);
      const targetPath = `/auth/verify?type=email&email=${email}&phone=${phone}`;

      if (locale !== defaultLocale) {
        router.push(`/${locale}${targetPath}`);
      } else {
        router.push(targetPath);
      }
    } catch (error) {
      ConsoleLogger.error(error);
      const errorMessage = error instanceof Error ? error.message : t('unknown_error');
      toast.error(t('registration_error', { message: errorMessage }));
    } finally {
      setLoading(false);
    }
  };

  // Password strength checks
  const hasLength = formData.password.length >= 8;
  const hasNumber = /\d/.test(formData.password);
  const hasUppercase = /[A-Z]/.test(formData.password);

  // Shared input classes
  const inputBase = "w-full rounded border bg-black/5 dark:bg-white/5 backdrop-blur-md/50 py-3 px-4 text-sm text-app-dark-blue dark:text-white placeholder:text-app-dark-blue/70 dark:text-white/70/40 focus:outline-none focus:ring-2 focus:ring-app/20 focus:border-app focus:bg-white transition-all";
  const inputError = "border-app-danger ring-1 ring-app-danger/10";
  const inputNormal = "border-black/10 dark:border-white/10";

  return (
    <section className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-app/5 via-white to-app-surface px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-app shadow-lg border border-black/10 dark:border-white/10/60 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center justify-between mb-10">
              <Link href="/" className="inline-flex items-center text-app-dark-blue dark:text-white hover:opacity-80 transition-opacity">
                <GlobalLogoTile width={110} height={36} />
              </Link>
              <Link href="/auth/login" className="text-xs font-semibold text-app-bright-green hover:text-app-bright-green/70 transition-colors">
                {t('already_registered')}
              </Link>
            </div>

            <h1 className="text-2xl font-bold text-app-dark-blue dark:text-white">{t('create_account')}</h1>
            <p className="text-sm text-app-dark-blue/70 dark:text-white/70/70 mt-1">{t('join_description')}</p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-app-dark-blue dark:text-white/60 uppercase tracking-wider mb-2" htmlFor="name">
                  {t('full_name')}
                </label>
                <input
                  className={`${inputBase} ${errors.name ? inputError : inputNormal}`}
                  id="name"
                  name="name"
                  type="text"
                  placeholder={t('full_name_placeholder')}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                {errors.name && <p className="text-app-bright-green-danger text-xs mt-1.5 ml-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-app-dark-blue dark:text-white/60 uppercase tracking-wider mb-2" htmlFor="email">
                  {t('email')}
                </label>
                <input
                  className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('email_placeholder')}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <p className="text-app-bright-green-danger text-xs mt-1.5 ml-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-app-dark-blue dark:text-white/60 uppercase tracking-wider mb-2" htmlFor="phone">
                  {t('phone_az')}
                </label>
                <input
                  className={`${inputBase} ${errors.phone ? inputError : inputNormal}`}
                  id="phone"
                  name="phone"
                  type="text"
                  placeholder={t('phone_placeholder')}
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                {errors.phone && <p className="text-app-bright-green-danger text-xs mt-1.5 ml-1">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-app-dark-blue dark:text-white/60 uppercase tracking-wider mb-2" htmlFor="password">
                  {t('password')}
                </label>
                <input
                  className={`${inputBase} ${errors.password.length > 0 ? inputError : inputNormal}`}
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t('password_placeholder')}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {errors.password.length > 0 && (
                  <div className="mt-1.5 ml-1 space-y-0.5">
                    {errors.password.map((error, index) => (
                      <p key={index} className="text-app-bright-green-danger text-xs">{error}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-app-dark-blue dark:text-white/60 uppercase tracking-wider mb-2" htmlFor="confirmPassword">
                  {t('repeat_password')}
                </label>
                <input
                  className={`${inputBase} ${errors.confirmPassword ? inputError : inputNormal}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder={t('password_placeholder')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {errors.confirmPassword && <p className="text-app-bright-green-danger text-xs mt-1.5 ml-1">{errors.confirmPassword}</p>}
              </div>

              {/* Password Strength Indicator */}
              <div className="rounded bg-black/5 dark:bg-white/5 backdrop-blur-md/60 border border-black/10 dark:border-white/10/40 px-4 py-3.5">
                <p className="text-[10px] font-semibold text-app-dark-blue dark:text-white/50 uppercase tracking-widest mb-2.5">{t('password_must_contain')}</p>
                <div className="space-y-1.5">
                  <PasswordRule met={hasLength} label={t('password_rule_length')} />
                  <PasswordRule met={hasNumber} label={t('password_rule_number')} />
                  <PasswordRule met={hasUppercase} label={t('password_rule_uppercase')} />
                </div>
              </div>

              {/* Submit */}
              <button
                className="w-full rounded bg-app-bright-green hover:bg-app-bright-green/90 text-white font-semibold py-3 text-sm transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? t('creating_account') : t('create_account')}
              </button>

              <p className="text-center text-xs text-app-dark-blue/70 dark:text-white/70/60 pt-1">
                {t('already_have_account')}{' '}
                <Link href="/auth/login" className="text-app-bright-green font-semibold hover:text-app-bright-green/70 transition-colors">
                  {t('log_in')}
                </Link>
              </p>
            </form>

            {/* Social login */}
            <div className="mt-8">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-app-bright-green-border/60" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-app-dark-blue/70 dark:text-white/70/40">{t('social_login_soon')}</span>
                <div className="h-px flex-1 bg-app-bright-green-border/60" />
              </div>
              <div className="grid grid-cols-3 gap-2.5 mt-5">
                <button
                  onClick={() => handleOAuthLogin('google')}
                  disabled
                  className="flex items-center justify-center gap-1.5 rounded border border-black/10 dark:border-white/10/60 bg-white py-2.5 text-xs font-semibold text-app-dark-blue dark:text-white/70 hover:bg-black/5 dark:bg-white/5 backdrop-blur-md transition-colors disabled:opacity-40"
                >
                  <Image src={"/google.svg"} alt="Google" width="18" height="18" /> {t('google')}
                </button>
                <button
                  onClick={() => handleOAuthLogin('facebook')}
                  disabled
                  className="flex items-center justify-center gap-1.5 rounded border border-black/10 dark:border-white/10/60 bg-white py-2.5 text-xs font-semibold text-app-dark-blue dark:text-white/70 hover:bg-black/5 dark:bg-white/5 backdrop-blur-md transition-colors disabled:opacity-40"
                >
                  <Image src={"/facebook.svg"} alt="Facebook" width="16" height="18" /> {t('facebook')}
                </button>
                <button
                  onClick={() => handleOAuthLogin('apple')}
                  disabled
                  className="flex items-center justify-center gap-1.5 rounded border border-black/10 dark:border-white/10/60 bg-white py-2.5 text-xs font-semibold text-app-dark-blue dark:text-white/70 hover:bg-black/5 dark:bg-white/5 backdrop-blur-md transition-colors disabled:opacity-40"
                >
                  <Image src={"/apple.svg"} alt="Apple" width="18" height="18" /> {t('apple')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Reusable sub-component ──

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-app-bright-green font-semibold' : 'text-app-dark-blue/70 dark:text-white/70/50'}`}>
      <div className={`h-1.5 w-1.5 rounded-app-full transition-colors ${met ? 'bg-app-bright-green' : 'bg-app-bright-green-body/25'}`} />
      {label}
    </div>
  );
}