import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  Settings,
  Users,
  RotateCcw,
  Download,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const SettingsView = () => {
  const { currentUser, allUsers } = useAuth();
  const { addToast } = useApp();

  const handleResetData = () => {
    addToast('Fitur reset dinonaktifkan pada mode Supabase.', 'error');
  };

  const handleExportData = () => {
    addToast('Fitur export sedang dinonaktifkan pada mode Supabase.', 'error');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            Pengaturan Sistem & Manajemen Hak Akses (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi tim, matriks izin keamanan PRD, dan pemeliharaan database Command Center.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Backup JSON</span>
          </button>
          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Reset ke Sample Seed Data</span>
          </button>
        </div>
      </div>

      {/* User & Role Management Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Daftar Pengguna & Penetapan Role
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Role mengatur hak akses dan batasan menu secara ketat di frontend dan backend.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Jabatan</th>
                <th className="py-3 px-4">Divisi</th>
                <th className="py-3 px-4">Role Sistem</th>
                <th className="py-3 px-4 text-center">Status Akses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-200"
                    />
                    <span>{user.name}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{user.email}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{user.title}</td>
                  <td className="py-3 px-4 text-slate-600 capitalize">{user.division}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10px] capitalize ${
                        user.role === 'owner'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : user.role === 'developer'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Aktif
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Matriks Permission PRD Section 2.4 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            Matriks Hak Akses & Izin (PRD Section 2.4 Specification)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Validasi keamanan diterapkan di layer backend/database, bukan sekadar menyembunyikan tombol.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">Resource / Modul</th>
                <th className="py-3 px-4">Owner (Bram)</th>
                <th className="py-3 px-4">Developer (Alex & Reza)</th>
                <th className="py-3 px-4">Marketing (Sarah & Dini)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-bold text-slate-800">Personal Finance</td>
                <td className="py-3 px-4 text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full Access
                </td>
                <td className="py-3 px-4 text-rose-600 font-bold">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-rose-500" /> No Access (Blocked)
                  </span>
                </td>
                <td className="py-3 px-4 text-rose-600 font-bold">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-rose-500" /> No Access (Blocked)
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-slate-800">Personal Tasks</td>
                <td className="py-3 px-4 text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full Access
                </td>
                <td className="py-3 px-4 text-rose-600 font-bold">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-rose-500" /> No Access (Blocked)
                  </span>
                </td>
                <td className="py-3 px-4 text-rose-600 font-bold">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-rose-500" /> No Access (Blocked)
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-slate-800">Developer Tasks & Requirements</td>
                <td className="py-3 px-4 text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full Access
                </td>
                <td className="py-3 px-4 text-blue-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" /> Divisi Sendiri
                </td>
                <td className="py-3 px-4 text-rose-600 font-bold">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-rose-500" /> No Access (Blocked)
                  </span>
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-slate-800">Marketing Tasks & Content</td>
                <td className="py-3 px-4 text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full Access
                </td>
                <td className="py-3 px-4 text-rose-600 font-bold">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-rose-500" /> No Access (Blocked)
                  </span>
                </td>
                <td className="py-3 px-4 text-purple-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" /> Divisi Sendiri
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-slate-800">Unified Calendar</td>
                <td className="py-3 px-4 text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Seluruh Event & Finance
                </td>
                <td className="py-3 px-4 text-blue-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" /> Event Relevan Dev
                </td>
                <td className="py-3 px-4 text-purple-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" /> Event Relevan Marketing
                </td>
              </tr>

              <tr>
                <td className="py-3 px-4 font-bold text-slate-800">Final Approval</td>
                <td className="py-3 px-4 text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full Authority
                </td>
                <td className="py-3 px-4 text-rose-600 font-bold">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-rose-500" /> Tidak Berwenang
                  </span>
                </td>
                <td className="py-3 px-4 text-rose-600 font-bold">
                  <span className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-rose-500" /> Tidak Berwenang
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
