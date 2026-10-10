import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, X, Lock } from 'lucide-react';

export const AccessDeniedModal = () => {
  const { accessDeniedMessage, clearAccessDenied, currentUser } = useAuth();

  if (!accessDeniedMessage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-100 overflow-hidden">
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-rose-500 to-red-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Security & Permission Guard</h3>
              <p className="text-[11px] text-white/80">PRD 2.4 / 9.1 / 10.4 Restriction</p>
            </div>
          </div>
          <button
            onClick={clearAccessDenied}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="p-2 bg-rose-50 rounded-xl text-rose-600 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Akses Ditolak oleh Sistem</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {accessDeniedMessage}
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Pengguna Aktif:</span>
              <span className="font-semibold text-slate-800">{currentUser?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Role:</span>
              <span className="font-semibold capitalize text-slate-800">{currentUser?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Divisi:</span>
              <span className="font-semibold capitalize text-slate-800">{currentUser?.division}</span>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={clearAccessDenied}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-all"
            >
              Mengerti & Kembali
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
