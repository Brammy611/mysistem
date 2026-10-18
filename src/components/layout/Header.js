import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  Search,
  UserCheck,
  ChevronDown,
  Plus,
  ShieldCheck,
  Code,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  X,
} from 'lucide-react';

export const Header = ({ onToggleSidebar }) => {
  const { currentUser, allUsers, switchUser, isDeveloper, isMarketing } = useAuth();
  const { searchQuery, setSearchQuery, notifications, openModal, setCurrentView } = useApp();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <ShieldCheck className="w-3 h-3 text-amber-600" /> Owner
          </span>
        );
      case 'developer':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Code className="w-3 h-3 text-blue-600" /> Developer
          </span>
        );
      case 'marketing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <Megaphone className="w-3 h-3 text-purple-600" /> Marketing
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white border-b border-slate-200 shadow-sm">
      {/* Left: Mobile sidebar toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100 focus:outline-none"
          title="Toggle Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari task, brief, transaksi, atau event..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Actions: Quick Add, Notifications, Role Switcher */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Quick Add Button */}
        <div className="relative">
          <button
            onClick={() => {
              if (isMarketing) {
                openModal('content_form', { division: 'marketing' });
              } else if (isDeveloper) {
                openModal('task_form', { division: 'developer' });
              } else {
                openModal('task_form', { division: 'developer' });
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">
              {isMarketing ? 'Buat Konten' : isDeveloper ? 'Buat Task' : 'Buat Baru'}
            </span>
          </button>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowUserDropdown(false);
            }}
            className="relative p-2 text-slate-600 rounded-lg hover:bg-slate-100 focus:outline-none transition-colors"
            title="Notifikasi & Pengingat"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-800">
                  Notifikasi & Pengingat ({notifications.length})
                </span>
                <span className="text-xs text-slate-500">Real-time alerts</span>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2" />
                    Semua task dan jadwal berjalan lancar!
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setShowNotifDropdown(false);
                        if (n.linkView) setCurrentView(n.linkView);
                      }}
                      className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            n.type === 'danger'
                              ? 'text-rose-500'
                              : n.type === 'warning'
                              ? 'text-amber-500'
                              : 'text-indigo-500'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-800 leading-snug">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User / Role Switcher Widget */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2 p-1.5 pl-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200/80"
          >
            <img
              src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.name || currentUser?.email || 'User')}&background=random`}
              alt={currentUser?.name || 'User'}
              className="w-7 h-7 rounded-lg object-cover ring-1 ring-slate-300"
            />
            <div className="text-left hidden lg:block leading-tight pr-1">
              <div className="text-xs font-bold text-slate-800">{currentUser?.name || currentUser?.email || 'User'}</div>
              <div className="text-[10px] text-slate-500 capitalize">{currentUser?.role || ''}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Simulasi Multi-Role</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Ganti profil untuk memvalidasi hak akses & batasan security PRD.
                </p>
              </div>

              <div className="py-1">
                {allUsers.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        switchUser(user.id);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-indigo-50/60 transition-colors ${
                        isCurrent ? 'bg-indigo-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email || 'User')}&background=random`}
                          alt={user.name || 'User'}
                          className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            {user.name || user.email || 'User'}
                            {isCurrent && <UserCheck className="w-3.5 h-3.5 text-indigo-600" />}
                          </p>
                          <p className="text-[11px] text-slate-500">{user.title}</p>
                        </div>
                      </div>
                      <div>{getRoleBadge(user.role)}</div>
                    </button>
                  );
                })}
              </div>

              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50 rounded-b-xl flex items-center justify-between text-[11px] text-slate-500">
                <span>Role aktif: <strong>{currentUser.role}</strong></span>
                <span className="text-emerald-600 font-medium">RBAC Aktif</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
