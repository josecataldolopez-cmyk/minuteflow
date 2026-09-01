import React from 'react';

interface ToastProps {
  message: string | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-medium border border-slate-800">
        <span className="material-symbols-outlined text-emerald-400 text-[20px] material-symbols-fill">
          check_circle
        </span>
        <span>{message}</span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white ml-2 text-base leading-none cursor-pointer"
        >
          ×
        </button>
      </div>
    </div>
  );
};
