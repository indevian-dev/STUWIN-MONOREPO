"use client";

import {
  useState,
  useEffect
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { apiCallForSpaHelper } from '@/lib/helpers/apiCallForSpaHelper';
import Image
  from 'next/image';
import { Link } from '@/i18n/routing';
import { useGlobalAuthProfileContext } from '@/app/[locale]/(global)/(context)/GlobalAuthProfileContext';
import { ConsoleLogger } from '@/lib/app-infrastructure/loggers/ConsoleLogger';
import { GlobalLogoTile } from '@/app/[locale]/(global)/(tiles)/GlobalLogoTile';
import { loadClientSideCoLocatedTranslations }
  from '@/i18n/i18nClientSide';

interface DeviceInfo {
  userAgent?: string;
  browser?: string;
  os?: string;
}

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email: string;
  password: string;
}

export function AuthLoginWidget() {
  const { t } = loadClientSideCoLocatedTranslations('AuthLoginWidget');
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [returnUrl, setReturnUrl] = useState<string>('/');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({});
  const [formErrors, setFormErrors] = useState<FormErrors>({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { refreshProfile } = useGlobalAuthProfileContext();

  // get device info from local storage
  useEffect(() => {
    const deviceInfoStr = localStorage.getItem('deviceInfo');
    if (deviceInfoStr) {
      const deviceInfo = JSON.parse(deviceInfoStr) as DeviceInfo;
      setDeviceInfo(deviceInfo);
    }
  }, []);

  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get("returnUrl");
    if (url) setReturnUrl(url);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOAuthLogin = async (provider: string) => {
    try {
      // Save return URL for after authentication
      if (returnUrl) {
        localStorage.setItem('returnUrl', returnUrl);
      }

      localStorage.setItem('auth_provider', provider);

      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: `/api/auth/oauth/initiate`,
        body: { deviceInfo, provider }
      });

      if (response.status !== 200) {
        throw new Error(t('login_failed_credentials'));
      }

      const url = response.data.url;
      if (url) {
        window.location.href = url; // Navigate to the URL returned by the OAuth response
      } else {
        throw new Error('No URL returned from OAuth provider');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(t('login_error', { message: errorMessage }));
      ConsoleLogger.error('Login error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiCallForSpaHelper({
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          email: formData.email,
          password: formData.password,
          deviceInfo
        },
      });

      ConsoleLogger.log('response', response);

      if (response.status === 200) {
        ConsoleLogger.log('Login successful!');
        toast.success(t('login_successful'));

        // Update auth profile context using refreshProfile
        await refreshProfile();
        ConsoleLogger.log('✅ Auth context updated via refreshProfile');

        // Wait for auth state to settle and toast to show
        await new Promise(resolve => setTimeout(resolve, 800));

        const redirectPath = (returnUrl && returnUrl !== '/') ? returnUrl : '/workspaces';
        router.replace(redirectPath);

      } else if (response.status === 201) {
        // Form validation errors
        setFormErrors({
          email: response.data.formError.email,
          password: response.data.formError.password
        });
        toast.error(t('login_failed_credentials'));
      } else {
        // Other errors
        const errorMsg = response.data?.error || 'Unknown error';
        toast.error(t('login_error', { message: errorMsg }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(t('login_error', { message: errorMessage }));
      ConsoleLogger.error('Login error:', error);
    } finally {
      setIsLoading(false);
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
            <Link href="/auth/register" className="text-sm font-semibold text-brand hover:text-brand/80">
              {t('need_account')}
            </Link>
          </div>

          <div className="space-y-1 mb-8">
            <h1 className="text-3xl font-bold text-dark tracking-tight">{t('sign_in')}</h1>
            <p className="text-sm text-body">{t('sign_in_description')}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-dark/80 ml-1" htmlFor="email">{t('email')}</label>
              <input
                className="w-full rounded-primary border border-border bg-surface py-3 px-4 text-dark placeholder:text-body/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                id="email"
                type="email"
                name="email"
                placeholder={t('email_placeholder')}
                value={formData.email}
                onChange={handleChange}
                required
              />
              {formErrors.email && <p className="text-danger text-xs font-semibold ml-1">{formErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-dark/80 ml-1" htmlFor="password">{t('password')}</label>
              <input
                className="w-full rounded-primary border border-border bg-surface py-3 px-4 text-dark placeholder:text-body/60 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all"
                id="password"
                type="password"
                name="password"
                placeholder={t('password_placeholder')}
                value={formData.password}
                onChange={handleChange}
                required
              />
              {formErrors.password && <p className="text-danger text-xs font-semibold ml-1">{formErrors.password}</p>}
            </div>

            <div className="flex items-center justify-between pt-1">
              <Link href="/auth/reset" className="text-sm font-semibold text-brand hover:text-brand/80">
                {t('forgot_password')}
              </Link>
              <span className="text-xs text-body/70">{t('secured_with_device')}</span>
            </div>

            <button
              className="w-full rounded-primary bg-brand hover:bg-brand/90 text-white font-semibold py-3.5 px-4 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? t('signing_in') : t('sign_in_button')}
            </button>
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