"use client";

import {
  useEffect,
  useState
} from 'react';
import {
  useRouter,
  useSearchParams
} from 'next/navigation';
import { toast } from 'react-toastify';
import { fetchApiUtil } from '@/lib/utils/Http.FetchApiSPA.util';
import { GlobalLoaderTile } from '@/app/[locale]/(global)/(tiles)/GlobalLoader.tile';
import { ConsoleLogger } from '@/lib/logging/Console.logger';
interface OAuthData {
  code: string;
  state: string | null;
  provider: string;
  deviceInfo: Record<string, any>;
}

export default function AuthOAuthCallbackPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [needEmail, setNeedEmail] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [oauthData, setOauthData] = useState<OAuthData | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleOAuthCallback() {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const provider = localStorage.getItem('auth_provider') || 'google';

        if (!code) {
          const error = searchParams.get('error');
          throw new Error(error || 'Authentication failed');
        }

        // Get device info from localStorage
        const deviceInfo = JSON.parse(localStorage.getItem('deviceInfo') || '{}');

        try {
          // Exchange code for token
          const response = await fetchApiUtil<any>({
            method: 'POST',
            url: '/api/auth/oauth/callback',
            body: { code, state, provider, deviceInfo }
          });

          if (true) { // apiCall ensures success
            toast.success('Login successful!');

            // Clean up
            localStorage.removeItem('auth_provider');

            // Redirect to dashboard or return URL
            const returnUrl = localStorage.getItem('returnUrl') || '/';
            localStorage.removeItem('returnUrl');

            // Wait for state to settle
            setTimeout(() => {
              router.replace(returnUrl);
            }, 500);
          }
        } catch (apiError: any) {
          // Handle axios error response
          if (apiError.response && apiError.response.status === 428) {
            // Email required - show email input form
            setNeedEmail(true);
            setOauthData({ code, state, provider, deviceInfo });
            setIsLoading(false);
            return;
          } else {
            // Re-throw other errors
            throw apiError;
          }
        }

      } catch (error) {
        ConsoleLogger.error('OAuth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
        setError(errorMessage);
        toast.error(`Login failed: ${errorMessage}`);

        // Redirect to login after error
        setTimeout(() => {
          router.replace('/auth/login');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    }

    handleOAuthCallback();
  }, [router, searchParams]);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Submit the code with the provided email
      const response = await fetchApiUtil<any>({
        method: 'POST',
        url: '/api/auth/oauth/callback',
        body: { ...oauthData, email }
      });

      // apiCall throws on error — no manual status check needed
      toast.success('Login successful!');

      // Clean up
      localStorage.removeItem('auth_provider');

      // Redirect to dashboard or return URL
      const returnUrl = localStorage.getItem('returnUrl') || '/';
      localStorage.removeItem('returnUrl');

      // Wait for state to settle
      setTimeout(() => {
        router.replace(returnUrl);
      }, 500);
    } catch (error) {
      ConsoleLogger.error('Email submission error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      toast.error(`Login failed: ${errorMessage}`);

      // Redirect to login after error
      setTimeout(() => {
        router.replace('/auth/login');
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <GlobalLoaderTile message="Please wait while we authenticate you" />;

  if (needEmail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-full max-w-md p-6 bg-white rounded-app shadow-md">
          <h2 className="text-2xl font-semibold text-center mb-6">Email Required</h2>
          <p className="mb-4 text-gray-600">Please provide your email address to complete the login process.</p>

          <form onSubmit={handleEmailSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                id="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-app focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 bg-emerald-500 text-white rounded-app hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              disabled={!email}
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          <h2 className="text-xl font-semibold">Authentication Error</h2>
          <p>{error}</p>
          <p className="mt-4">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-emerald-500">Login Successful!</h2>
        <p>Redirecting you to your account...</p>
      </div>
    </div>
  );
}
