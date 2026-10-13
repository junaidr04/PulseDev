import React from 'react';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info' }) => {
  const styles = {
    info: 'border-slate-700 bg-slate-900 text-slate-200',
    success: 'border-emerald-500/30 bg-emerald-950/90 text-emerald-300',
    error: 'border-rose-500/30 bg-rose-950/90 text-rose-300',
  };

  return (
    <div className={`rounded-xl border px-4 py-2.5 text-xs font-medium shadow-xl ${styles[type]}`}>
      {message}
    </div>
  );
};
