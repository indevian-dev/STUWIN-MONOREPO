'use client'

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function GlobalToastProvider() {
  return (
    <ToastContainer
      position="top-right"
      newestOnTop
      closeButton={false}
      toastClassName={() => 'backdrop-blur-md bg-dark/80 text-white rounded-primary border border-border shadow-2xl flex p-3 min-h-[64px] text-sm leading-relaxed font-semibold'}
      progressClassName="bg-brand"
      icon={false}
    />
  );
}