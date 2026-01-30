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
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import { GlobalLogoTile } from '@/app/[locale]/(global)/(tiles)/GlobalLogoTile';
import Image
  from 'next/image';
import { parseCookies } from 'nookies';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import {
  formatPhoneNumber,
  cleanPhoneNumber,
  validateAzerbaijanPhone
} from '@/lib/utilities/phoneFormatterUtility';

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
      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: `/api/auth/oauth/initiate`,
        body: { deviceInfo, provider }
      });

      if (response.status !== 200) {
        throw new Error(response.data?.error || t('login_failed_oauth'));
      }

      const url = response.data.url;
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

      const response = await apiCallForSpaHelper({
        url: '/api/auth/register',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: submissionData,
      });

      const result = await response.data;

      if (!result.success) {
        if (result.field && result.error) {
          const newErrors = { ...errors };

          // Handle field-specific errors
          if (result.field === 'password' && result.validationErrors) {
            newErrors.password = result.validationErrors;
          } else if (result.field === 'confirmPassword') {
            newErrors.confirmPassword = result.error;
          } else if (result.field === 'name') {
            newErrors.name = result.error;
          } else if (result.field === 'email') {
            newErrors.email = result.error;
          } else if (result.field === 'phone') {
            newErrors.phone = result.error;
          } else {
            // For system errors (session, scope, tokens, registration), show toast
            toast.error(result.error || t('registration_failed'));
          }

          setErrors(newErrors);
        } else {
          toast.error(result.message || result.error || t('registration_failed'));
        }
        setLoading(false);
        return;
      }

      // Auth context is automatically updated by apiCallForSpaHelper via authContextPayload
      // No need to manually call updateProfileFromLogin

      // Show success message
      toast.success(result.message || t('registration_successful'));

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
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-14 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          <div className="hidden lg:flex flex-col gap-4 rounded-primary bg-linear-to-br from-brand/60 to-brand-dark/40 text-white p-6 shadow-2xl">
            <Link href="/" className="flex items-center gap-3 text-white hover:text-light">
              <div>
                <p className="text-xs uppercase tracking-wide opacity-80">{t('navigate_back')}</p>
                <p className="text-lg font-semibold">{t('stuwin_ai_home')}</p>
              </div>
            </Link>
            <div className="space-y-3 pt-4">
              <h2 className="text-2xl font-bold">{t('create_your_account')}</h2>
              <p className="text-sm text-white/80">{t('secure_onboarding_description')}</p>
              <ul className="space-y-2 text-sm text-white/85">
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-white/70" /> {t('feature_password_strength')}</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-white/70" /> {t('feature_phone_formatting')}</li>
                <li className="flex items-start gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-white/70" /> {t('feature_email_verification')}</li>
              </ul>
            </div>
            <div className="mt-auto space-y-2">
              <p className="text-sm text-white/70">{t('already_have_account')}</p>
              <button
                type="button"
                className="w-full rounded-primary bg-white text-brand font-semibold py-3 px-4 hover:bg-light/90 transition"
                onClick={() => router.push('/auth/login')}
              >
                {t('go_to_login')}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-primary shadow-xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <Link href="/" className="inline-flex items-center gap-2 text-dark hover:text-brand">
                <GlobalLogoTile width={120} height={40} />
              </Link>
              <Link href="/auth/login" className="text-sm font-semibold text-brand hover:text-brand/80">
                {t('already_registered')}
              </Link>
            </div>

            <div className="space-y-1 mb-6">
              <h1 className="text-3xl font-bold text-dark">{t('create_account')}</h1>
              <p className="text-sm text-body">{t('join_description')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-dark" htmlFor="name">{t('full_name')}</label>
                <input
                  className={`w-full rounded-lg bg-white py-3 px-3 text-dark placeholder:text-body focus:outline-none focus:ring-1 ${errors.name ? 'ring-1 ring-danger' : 'focus:ring-brand-soft'}`}
                  id="name"
                  name="name"
                  type="text"
                  placeholder={t('full_name_placeholder')}
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                {errors.name && <p className="text-danger text-xs font-semibold">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-dark" htmlFor="email">{t('email')}</label>
                <input
                  className={`w-full rounded-lg bg-white py-3 px-3 text-dark placeholder:text-body focus:outline-none focus:ring-1 ${errors.email ? 'ring-1 ring-danger' : 'focus:ring-brand-soft'}`}
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('email_placeholder')}
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {errors.email && <p className="text-danger text-xs font-semibold">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-dark" htmlFor="phone">{t('phone_az')}</label>
                <input
                  className={`w-full rounded-lg bg-white py-3 px-3 text-dark placeholder:text-body focus:outline-none focus:ring-1 ${errors.phone ? 'ring-1 ring-danger' : 'focus:ring-brand-soft'}`}
                  id="phone"
                  name="phone"
                  type="text"
                  placeholder={t('phone_placeholder')}
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
                {errors.phone && <p className="text-danger text-xs font-semibold">{errors.phone}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-dark" htmlFor="password">{t('password')}</label>
                <input
                  className={`w-full rounded-lg bg-white py-3 px-3 text-dark placeholder:text-body focus:outline-none focus:ring-1 ${errors.password.length > 0 ? 'ring-1 ring-danger' : 'focus:ring-brand-soft'}`}
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t('password_placeholder')}
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                {errors.password.length > 0 && (
                  <div className="space-y-1">
                    {errors.password.map((error, index) => (
                      <p key={index} className="text-danger text-xs font-semibold">{error}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-dark" htmlFor="confirmPassword">{t('repeat_password')}</label>
                <input
                  className={`w-full rounded-lg bg-white py-3 px-3 text-dark placeholder:text-body focus:outline-none focus:ring-1 ${errors.confirmPassword ? 'ring-1 ring-danger' : 'focus:ring-brand-soft'}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder={t('password_placeholder')}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {errors.confirmPassword && <p className="text-danger text-xs font-semibold">{errors.confirmPassword}</p>}
              </div>

              <div className="rounded-lg bg-gray-50 px-3 py-3 text-xs text-body">
                <p className="font-semibold text-dark mb-1">{t('password_must_contain')}</p>
                <ul className="space-y-1">
                  <li className={formData.password.length >= 8 ? 'text-success font-semibold' : ''}>{t('password_rule_length')}</li>
                  <li className={/\d/.test(formData.password) ? 'text-success font-semibold' : ''}>{t('password_rule_number')}</li>
                  <li className={/[A-Z]/.test(formData.password) ? 'text-success font-semibold' : ''}>{t('password_rule_uppercase')}</li>
                </ul>
              </div>

              <button
                className="w-full rounded-primary bg-brand-soft hover:bg-brand/90 text-white font-semibold py-3 px-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? t('creating_account') : t('create_account')}
              </button>
              <p className="text-center text-sm text-body">
                {t('already_have_account')} <Link href="/auth/login" className="text-brand font-semibold hover:text-brand/80">{t('log_in')}</Link>
              </p>
            </form>

            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wide text-body">{t('social_login_soon')}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                <button
                  onClick={() => handleOAuthLogin('google')}
                  disabled
                  className="flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 px-3 text-sm font-semibold text-dark disabled:opacity-50 shadow-sm"
                >
                  <Image src={"/google.svg"} alt="Google" width="22" height="22" /> {t('google')}
                </button>
                <button
                  onClick={() => handleOAuthLogin('facebook')}
                  disabled
                  className="flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 px-3 text-sm font-semibold text-dark disabled:opacity-50 shadow-sm"
                >
                  <Image src={"/facebook.svg"} alt="Facebook" width="18" height="22" /> {t('facebook')}
                </button>
                <button
                  onClick={() => handleOAuthLogin('apple')}
                  disabled
                  className="flex items-center justify-center gap-2 rounded-lg bg-white py-2.5 px-3 text-sm font-semibold text-dark disabled:opacity-50 shadow-sm"
                >
                  <Image src={"/apple.svg"} alt="Apple" width="22" height="22" /> {t('apple')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}