'use client'

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function GlobalToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      newestOnTop
      closeButton={false}
      toastClassName={() => 'backdrop-blur-md bg-app-bright-green-dark/80 text-white rounded-app-primary border border-black/10 dark:border-white/10 shadow-2xl flex p-3 min-h-[64px] text-sm leading-relaxed font-semibold'}
      progressClassName="bg-app-bright-green"
      icon={false}
    />
  );
}