import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Layers,
  Code2,
  Megaphone,
  Calendar,
  Users,
  Wallet,
  ArrowLeftRight,
  Landmark,
  PieChart,
  Receipt,
  CheckSquare,
  CalendarDays,
  Settings,
  FileCode,
  Bug,
  Kanban,
  FileText,
  User,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  LogOut,
  TrendingUp,
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { currentUser, isOwner, isDeveloper, isMarketing, logout } = useAuth();
  const { currentView, setCurrentView } = useApp();

  // Collapsible sections for Owner
  const [openSections, setOpenSections] = useState({
    bookqu: true,
    finance: true,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navigateTo = (viewKey) => {
    setCurrentView(viewKey);
    if (onClose) onClose();
  };

  const isActive = (key) => currentView === key;

  const navItemClass = (active) =>
    `flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const subNavItemClass = (active) =>
    `flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
      active
        ? 'bg-indigo-50 text-indigo-700 font-semibold'
        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand / Workspace Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="leading-tight">
            <span className="font-extrabold text-sm text-slate-900 tracking-tight block">
              Command Center
            </span>
            <span className="text-[11px] font-medium text-indigo-600">
              Personal & BookQu
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {/* ==================== OWNER NAVIGATION ==================== */}
          {isOwner && (
            <>
              {/* 1. Overview */}
              <button
                onClick={() => navigateTo('overview')}
                className={navItemClass(isActive('overview'))}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Overview Master</span>
              </button>

              {/* 2. BookQu Workspace (Collapsible) */}
              <div className="pt-2">
                <button
                  onClick={() => toggleSection('bookqu')}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> BookQu Workspace
                  </span>
                  {openSections.bookqu ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                {openSections.bookqu && (
                  <div className="mt-1 pl-2 space-y-0.5 border-l border-slate-100 ml-3">
                    <button
                      onClick={() => navigateTo('bookqu-dev')}
                      className={subNavItemClass(isActive('bookqu-dev'))}
                    >
                      <Code2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Developer</span>
                    </button>
                    <button
                      onClick={() => navigateTo('bookqu-marketing')}
                      className={subNavItemClass(isActive('bookqu-marketing'))}
                    >
                      <Megaphone className="w-3.5 h-3.5 text-purple-500" />
                      <span>Marketing</span>
                    </button>
                    <button
                      onClick={() => navigateTo('bookqu-calendar')}
                      className={subNavItemClass(isActive('bookqu-calendar'))}
                    >
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Team Calendar</span>
                    </button>
                    <button
                      onClick={() => navigateTo('bookqu-team')}
                      className={subNavItemClass(isActive('bookqu-team'))}
                    >
                      <Users className="w-3.5 h-3.5 text-amber-500" />
                      <span>Team Overview</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Personal Finance (Collapsible) */}
              <div className="pt-2">
                <button
                  onClick={() => toggleSection('finance')}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600"
                >
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> Personal Finance
                  </span>
                  {openSections.finance ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>

                {openSections.finance && (
                  <div className="mt-1 pl-2 space-y-0.5 border-l border-slate-100 ml-3">
                    <button
                      onClick={() => navigateTo('finance-overview')}
                      className={subNavItemClass(isActive('finance-overview'))}
                    >
                      <PieChart className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Financial Overview</span>
                    </button>
                    <button
                      onClick={() => navigateTo('finance-transactions')}
                      className={subNavItemClass(isActive('finance-transactions'))}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                      <span>Transactions</span>
                    </button>
                    <button
                      onClick={() => navigateTo('finance-accounts')}
                      className={subNavItemClass(isActive('finance-accounts'))}
                    >
                      <Landmark className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Accounts</span>
                    </button>
                    <button
                      onClick={() => navigateTo('finance-budgets')}
                      className={subNavItemClass(isActive('finance-budgets'))}
                    >
                      <PieChart className="w-3.5 h-3.5 text-amber-600" />
                      <span>Budgets</span>
                    </button>
                    <button
                      onClick={() => navigateTo('finance-planner')}
                      className={subNavItemClass(isActive('finance-planner'))}
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Budget Planner</span>
                    </button>
                    <button
                      onClick={() => navigateTo('finance-obligations')}
                      className={subNavItemClass(isActive('finance-obligations'))}
                    >
                      <Receipt className="w-3.5 h-3.5 text-rose-600" />
                      <span>Obligations & Bills</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 4. My Tasks */}
              <div className="pt-2">
                <button
                  onClick={() => navigateTo('personal-tasks')}
                  className={navItemClass(isActive('personal-tasks'))}
                >
                  <CheckSquare className="w-4 h-4 text-slate-500" />
                  <span>My Tasks (Personal)</span>
                </button>
              </div>

              {/* 5. My Calendar */}
              <button
                onClick={() => navigateTo('personal-calendar')}
                className={navItemClass(isActive('personal-calendar'))}
              >
                <CalendarDays className="w-4 h-4 text-slate-500" />
                <span>My Calendar</span>
              </button>

              {/* 6. Settings */}
              <button
                onClick={() => navigateTo('settings')}
                className={navItemClass(isActive('settings'))}
              >
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Settings & Roles</span>
              </button>
            </>
          )}

          {/* ==================== DEVELOPER NAVIGATION ==================== */}
          {isDeveloper && (
            <>
              <div className="px-3 py-1 text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50/80 rounded-md mb-2">
                Developer Workspace
              </div>

              {/* 1. Developer Dashboard */}
              <button
                onClick={() => navigateTo('dev-dashboard')}
                className={navItemClass(isActive('dev-dashboard'))}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Developer Dashboard</span>
              </button>

              {/* 2. All Developer Tasks */}
              <button
                onClick={() => navigateTo('dev-tasks')}
                className={navItemClass(isActive('dev-tasks'))}
              >
                <Kanban className="w-4 h-4" />
                <span>All Developer Tasks</span>
              </button>

              {/* 3. Requirements */}
              <button
                onClick={() => navigateTo('dev-requirements')}
                className={navItemClass(isActive('dev-requirements'))}
              >
                <FileCode className="w-4 h-4" />
                <span>Requirements & Specs</span>
              </button>

              {/* 4. Bugs & Revisions */}
              <button
                onClick={() => navigateTo('dev-bugs')}
                className={navItemClass(isActive('dev-bugs'))}
              >
                <Bug className="w-4 h-4" />
                <span>Bugs & Revisions</span>
              </button>

              {/* 5. My Assigned Tasks */}
              <button
                onClick={() => navigateTo('dev-my-tasks')}
                className={navItemClass(isActive('dev-my-tasks'))}
              >
                <User className="w-4 h-4" />
                <span>My Assigned Tasks</span>
              </button>

              {/* 6. Developer Calendar */}
              <button
                onClick={() => navigateTo('dev-calendar')}
                className={navItemClass(isActive('dev-calendar'))}
              >
                <Calendar className="w-4 h-4" />
                <span>Developer Calendar</span>
              </button>
            </>
          )}

          {/* ==================== MARKETING NAVIGATION ==================== */}
          {isMarketing && (
            <>
              <div className="px-3 py-1 text-[11px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50/80 rounded-md mb-2">
                Marketing Workspace
              </div>

              {/* 1. Marketing Dashboard */}
              <button
                onClick={() => navigateTo('mkt-dashboard')}
                className={navItemClass(isActive('mkt-dashboard'))}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Marketing Dashboard</span>
              </button>

              {/* 2. Content Board */}
              <button
                onClick={() => navigateTo('mkt-board')}
                className={navItemClass(isActive('mkt-board'))}
              >
                <Kanban className="w-4 h-4" />
                <span>Content Board</span>
              </button>

              {/* 3. Content Briefs */}
              <button
                onClick={() => navigateTo('mkt-briefs')}
                className={navItemClass(isActive('mkt-briefs'))}
              >
                <FileText className="w-4 h-4" />
                <span>Content Briefs</span>
              </button>

              {/* 4. Content Calendar */}
              <button
                onClick={() => navigateTo('mkt-calendar')}
                className={navItemClass(isActive('mkt-calendar'))}
              >
                <Calendar className="w-4 h-4" />
                <span>Content Calendar</span>
              </button>

              {/* 5. My Assigned Tasks */}
              <button
                onClick={() => navigateTo('mkt-my-tasks')}
                className={navItemClass(isActive('mkt-my-tasks'))}
              >
                <User className="w-4 h-4" />
                <span>My Assigned Tasks</span>
              </button>
            </>
          )}
        </div>

        {/* Security / RBAC Banner & Logout footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200/80 shadow-xs">
            <ShieldAlert className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-slate-800 truncate">
                {currentUser?.name || currentUser?.email || 'User'}
              </p>
              <p className="text-[10px] text-slate-500 truncate capitalize">
                Role: {currentUser?.role || 'User'}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200/60"
            title="Keluar dari akun"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
