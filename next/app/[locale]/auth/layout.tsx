

'use client';

import {
  useState,
  useEffect
} from 'react';

interface DeviceInfo {
  userAgent: string;
  browser: string;
  os: string;
}

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Auth Layout - Client Component (Public)
 * Handles device info collection for auth flows
 * This is a public layout - no auth required
 * 
 * @withLayoutAuth { layoutPath: '/auth', isPublic: true }
 */
const AuthLayout = ({ children }: AuthLayoutProps) => {
  const [deviceInfo, setDeviceInfo] = useState<Partial<DeviceInfo>>({});

  useEffect(() => {
    getDeviceInfo();
  }, []);

  useEffect(() => {
    localStorage.setItem('deviceInfo', JSON.stringify(deviceInfo));
  }, [deviceInfo]);

  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);
    setDeviceInfo({
      userAgent: userAgent,
      browser: browser,
      os: os
    });
  }

  const getBrowser = (userAgent: string): string => {
    const browsers = [
      { name: 'Chrome', regex: /Chrome/ },
      { name: 'Firefox', regex: /Firefox/ },
      { name: 'Safari', regex: /Safari/ },
      { name: 'Edge', regex: /Edge/ },
      { name: 'IE', regex: /Trident/ },
      { name: 'Opera', regex: /Opera/ }
    ];
    return browsers.find(browser => browser.regex.test(userAgent))?.name || 'Unknown';
  }

  const getOS = (userAgent: string): string => {
    const oses = [
      { name: 'Windows', regex: /Windows/ },
      { name: 'Mac', regex: /Macintosh/ },
      { name: 'Linux', regex: /Linux/ },
      { name: 'Android', regex: /Android/ },
      { name: 'iOS', regex: /iPhone|iPad|iPod/ }
    ];
    return oses.find(os => os.regex.test(userAgent))?.name || 'Unknown';
  }

  return (
    <main className="relative w-full min-h-screen bg-section-gradient-app text-app-dark-blue dark:text-white overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-app-bright-green/10 rounded-app-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-app-bright-green-soft/10 rounded-app-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brandSoftDanger/20 rounded-app-full blur-3xl" />
      </div>
      {/* Content */}
      <div className="relative z-10 flex justify-center items-center min-h-screen">
        {children}
      </div>
    </main>
  );
};

export default AuthLayout;
