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
import { apiCall } from '@/lib/utils/http/SpaApiClient';
import { GlobalLogoTile } from '@/app/[locale]/(global)/(tiles)/GlobalLogoTile';
import Image
  from 'next/image';
import { parseCookies } from 'nookies';
import { ConsoleLogger } from '@/lib/logging/ConsoleLogger';
import {
  formatPhoneNumber,
  cleanPhoneNumber,
  validateAzerbaijanPhone
} from '@/lib/utils/formatting/PhoneFormatterUtil';

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
      const response = await apiCall<any>({
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

      const response = await apiCall<any>({
        url: '/api/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: submissionData,
      });

      // apiCall throws on error — success if we reach here
      // Show success message
      toast.success(response?.message || t('registration_successful'));

      // Since new accounts require verification, redirecting to /workspaces 
      // will trigger the appropriate verification flow if needed via middleware/UI wrapper
      const targetPath = '/workspaces';

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

  return (
    <section className="min-h-screen bg-linear-to-b from-brand/5 via-white to-surface">
      <div className="max-w-lg mx-auto px-4 py-10 md:py-14 lg:py-16">
        <div className="bg-white/90 backdrop-blur rounded-primary border border-border shadow-xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-dark hover:text-brand">
              <GlobalLogoTile width={120} height={40} />
            </Link>
            <Link href="/auth/login" className="text-sm font-semibold text-brand hover:text-brand/80">
              {t('already_registered')}
            </Link>
          </div>

          <div className="space-y-1 mb-8">
            <h1 className="text-3xl font-bold text-dark tracking-tight">{t('create_account')}</h1>
            <p className="text-sm text-body">{t('join_description')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-dark/80 ml-1" htmlFor="name">{t('full_name')}</label>
              <input
                className={`w-full rounded-primary border bg-surface py-3 px-4 text-dark placeholder:text-body/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all ${errors.name ? 'border-danger ring-danger/10' : 'border-border focus:border-brand'}`}
                id="name"
                name="name"
                type="text"
                placeholder={t('full_name_placeholder')}
                value={formData.name}
                onChange={handleChange}
                required
              />
              {errors.name && <p className="text-danger text-xs font-semibold ml-1">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-dark/80 ml-1" htmlFor="email">{t('email')}</label>
              <input
                className={`w-full rounded-primary border bg-surface py-3 px-4 text-dark placeholder:text-body/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all ${errors.email ? 'border-danger ring-danger/10' : 'border-border focus:border-brand'}`}
                id="email"
                name="email"
                type="email"
                placeholder={t('email_placeholder')}
                value={formData.email}
                onChange={handleChange}
                required
              />
              {errors.email && <p className="text-danger text-xs font-semibold ml-1">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-dark/80 ml-1" htmlFor="phone">{t('phone_az')}</label>
              <input
                className={`w-full rounded-primary border bg-surface py-3 px-4 text-dark placeholder:text-body/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all ${errors.phone ? 'border-danger ring-danger/10' : 'border-border focus:border-brand'}`}
                id="phone"
                name="phone"
                type="text"
                placeholder={t('phone_placeholder')}
                value={formData.phone}
                onChange={handleChange}
                required
              />
              {errors.phone && <p className="text-danger text-xs font-semibold ml-1">{errors.phone}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-dark/80 ml-1" htmlFor="password">{t('password')}</label>
              <input
                className={`w-full rounded-primary border bg-surface py-3 px-4 text-dark placeholder:text-body/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all ${errors.password.length > 0 ? 'border-danger ring-danger/10' : 'border-border focus:border-brand'}`}
                id="password"
                name="password"
                type="password"
                placeholder={t('password_placeholder')}
                value={formData.password}
                onChange={handleChange}
                required
              />
              {errors.password.length > 0 && (
                <div className="space-y-1 ml-1">
                  {errors.password.map((error, index) => (
                    <p key={index} className="text-danger text-xs font-semibold">{error}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-dark/80 ml-1" htmlFor="confirmPassword">{t('repeat_password')}</label>
              <input
                className={`w-full rounded-primary border bg-surface py-3 px-4 text-dark placeholder:text-body/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all ${errors.confirmPassword ? 'border-danger ring-danger/10' : 'border-border focus:border-brand'}`}
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder={t('password_placeholder')}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {errors.confirmPassword && <p className="text-danger text-xs font-semibold ml-1">{errors.confirmPassword}</p>}
            </div>

            <div className="rounded-primary border border-border bg-gray-50/50 px-4 py-4 text-xs text-body shadow-inner">
              <p className="font-semibold text-dark/80 mb-2 uppercase tracking-wider">{t('password_must_contain')}</p>
              <ul className="space-y-1.5">
                <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-success font-semibold' : 'text-body/70'}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${formData.password.length >= 8 ? 'bg-success' : 'bg-body/30'}`} />
                  {t('password_rule_length')}
                </li>
                <li className={`flex items-center gap-2 ${/\d/.test(formData.password) ? 'text-success font-semibold' : 'text-body/70'}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${/\d/.test(formData.password) ? 'bg-success' : 'bg-body/30'}`} />
                  {t('password_rule_number')}
                </li>
                <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-success font-semibold' : 'text-body/70'}`}>
                  <div className={`h-1.5 w-1.5 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-success' : 'bg-body/30'}`} />
                  {t('password_rule_uppercase')}
                </li>
              </ul>
            </div>

            <button
              className="w-full rounded-primary bg-brand hover:bg-brand/90 text-white font-semibold py-3.5 px-4 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              type="submit"
              disabled={loading}
            >
              {loading ? t('creating_account') : t('create_account')}
            </button>
            <p className="text-center text-sm text-body/80 pt-2">
              {t('already_have_account')} <Link href="/auth/login" className="text-brand font-bold hover:text-brand/80 transition-colors">{t('log_in')}</Link>
            </p>
          </form>

          <div className="mt-8">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium uppercase tracking-wider text-body/60">{t('social_login_soon')}</span>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
              <button
                onClick={() => handleOAuthLogin('google')}
                disabled
                className="flex items-center justify-center gap-2 rounded-primary border border-border bg-surface py-2.5 px-3 text-sm font-semibold text-dark hover:bg-white transition-colors shadow-sm disabled:opacity-50"
              >
                <Image src={"/google.svg"} alt="Google" width="22" height="22" /> {t('google')}
              </button>
              <button
                onClick={() => handleOAuthLogin('facebook')}
                disabled
                className="flex items-center justify-center gap-2 rounded-primary border border-border bg-surface py-2.5 px-3 text-sm font-semibold text-dark hover:bg-white transition-colors shadow-sm disabled:opacity-50"
              >
                <Image src={"/facebook.svg"} alt="Facebook" width="18" height="22" /> {t('facebook')}
              </button>
              <button
                onClick={() => handleOAuthLogin('apple')}
                disabled
                className="flex items-center justify-center gap-2 rounded-primary border border-border bg-surface py-2.5 px-3 text-sm font-semibold text-dark hover:bg-white transition-colors shadow-sm disabled:opacity-50"
              >
                <Image src={"/apple.svg"} alt="Apple" width="22" height="22" /> {t('apple')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}