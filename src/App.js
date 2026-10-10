import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';

// Layout
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { AccessDeniedModal } from './components/layout/AccessDeniedModal';
import { ToastContainer } from './components/layout/ToastContainer';
import { Login } from './components/layout/Login';

// Dashboards
import { OwnerDashboard } from './components/dashboard/OwnerDashboard';
import { DeveloperDashboard } from './components/developer/DeveloperDashboard';
import { MarketingDashboard } from './components/marketing/MarketingDashboard';

// Task Management & Kanban
import { TaskBoard } from './components/tasks/TaskBoard';
import { TaskFormModal } from './components/tasks/TaskFormModal';
import { TaskDetailModal } from './components/tasks/TaskDetailModal';

// Developer Views
import { RequirementsView } from './components/developer/RequirementsView';
import { RequirementFormModal } from './components/developer/RequirementFormModal';
import { BugsRevisionsView } from './components/developer/BugsRevisionsView';

// Marketing Views
import { ContentBoardView } from './components/marketing/ContentBoardView';
import { ContentBriefsView } from './components/marketing/ContentBriefsView';
import { ContentFormModal } from './components/marketing/ContentFormModal';
import { ContentDetailModal } from './components/marketing/ContentDetailModal';

// Team Overview
import { TeamOverview } from './components/team/TeamOverview';

// Personal Finance Views & Modals
import { FinancialOverview } from './components/finance/FinancialOverview';
import { AccountsView } from './components/finance/AccountsView';
import { TransactionsView } from './components/finance/TransactionsView';
import { BudgetsView } from './components/finance/BudgetsView';
import { ObligationsBillsView } from './components/finance/ObligationsBillsView';
import { TransactionFormModal } from './components/finance/TransactionFormModal';
import { AccountFormModal } from './components/finance/AccountFormModal';
import { BudgetFormModal } from './components/finance/BudgetFormModal';
import { BillPayModal } from './components/finance/BillPayModal';
import { BillFormModal } from './components/finance/BillFormModal';
import { CategoryFormModal } from './components/finance/CategoryFormModal';

// Personal Tasks
import { PersonalTasksView } from './components/personal/PersonalTasksView';
import { PersonalTaskFormModal } from './components/personal/PersonalTaskFormModal';

// Unified Calendar
import { UnifiedCalendarView } from './components/calendar/UnifiedCalendarView';
import { CalendarEventFormModal } from './components/calendar/CalendarEventFormModal';

// Settings
import { SettingsView } from './components/settings/SettingsView';

import { Lock } from 'lucide-react';

const MainContent = () => {
  const { currentUser, isOwner, isDeveloper, isMarketing } = useAuth();
  const { currentView, setCurrentView } = useApp();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser) {
    return <Login />;
  }

  // Router dispatcher with RBAC security validation
  const renderView = () => {
    // ---------------- OWNER VIEWS ---------------- //
    if (isOwner) {
      switch (currentView) {
        case 'overview':
          return <OwnerDashboard />;
        case 'bookqu-dev':
          return <TaskBoard division="developer" />;
        case 'bookqu-marketing':
          return <ContentBoardView />;
        case 'bookqu-calendar':
          return <UnifiedCalendarView />;
        case 'bookqu-team':
          return <TeamOverview />;
        case 'finance-overview':
          return <FinancialOverview />;
        case 'finance-transactions':
          return <TransactionsView />;
        case 'finance-accounts':
          return <AccountsView />;
        case 'finance-budgets':
          return <BudgetsView />;
        case 'finance-obligations':
          return <ObligationsBillsView />;
        case 'personal-tasks':
          return <PersonalTasksView />;
        case 'personal-calendar':
          return <UnifiedCalendarView />;
        case 'settings':
          return <SettingsView />;
        default:
          return <OwnerDashboard />;
      }
    }

    // ---------------- DEVELOPER VIEWS ---------------- //
    if (isDeveloper) {
      // Security guard: If somehow attempting to access restricted personal finance
      if (
        currentView.startsWith('finance-') ||
        currentView === 'personal-tasks' ||
        currentView === 'settings'
      ) {
        return (
          <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center space-y-3">
            <Lock className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              Akses Ditolak: Modul Personal Khusus Owner
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Berdasarkan PRD Section 2.2, anggota tim Developer tidak diperkenankan mengakses Personal Workspace & Data Finansial.
            </p>
            <button
              onClick={() => setCurrentView('dev-dashboard')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
            >
              Kembali ke Developer Dashboard
            </button>
          </div>
        );
      }

      switch (currentView) {
        case 'dev-dashboard':
          return <DeveloperDashboard />;
        case 'dev-tasks':
        case 'dev-my-tasks':
          return <TaskBoard division="developer" />;
        case 'dev-requirements':
          return <RequirementsView />;
        case 'dev-bugs':
          return <BugsRevisionsView />;
        case 'dev-calendar':
          return <UnifiedCalendarView />;
        default:
          return <DeveloperDashboard />;
      }
    }

    // ---------------- MARKETING VIEWS ---------------- //
    if (isMarketing) {
      if (
        currentView.startsWith('finance-') ||
        currentView === 'personal-tasks' ||
        currentView === 'settings' ||
        currentView.startsWith('dev-')
      ) {
        return (
          <div className="p-8 bg-white rounded-2xl border border-rose-200 text-center space-y-3">
            <Lock className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              Akses Ditolak: Batasan Akses Divisi Marketing
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Berdasarkan PRD Section 2.3, anggota tim Marketing hanya memiliki akses ke Marketing Workspace.
            </p>
            <button
              onClick={() => setCurrentView('mkt-dashboard')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold"
            >
              Kembali ke Marketing Dashboard
            </button>
          </div>
        );
      }

      switch (currentView) {
        case 'mkt-dashboard':
          return <MarketingDashboard />;
        case 'mkt-board':
        case 'mkt-my-tasks':
          return <ContentBoardView />;
        case 'mkt-briefs':
          return <ContentBriefsView />;
        case 'mkt-calendar':
          return <UnifiedCalendarView />;
        default:
          return <MarketingDashboard />;
      }
    }

    return <div>Silakan pilih workspace.</div>;
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
      {/* Role-Adaptive Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {renderView()}
        </main>
      </div>

      {/* Global Modals & Dialogs */}
      <TaskFormModal />
      <TaskDetailModal />
      <ContentFormModal />
      <ContentDetailModal />
      <RequirementFormModal />
      <TransactionFormModal />
      <AccountFormModal />
      <BudgetFormModal />
      <BillPayModal />
      <BillFormModal />
      <CategoryFormModal />
      <PersonalTaskFormModal />
      <CalendarEventFormModal />
      <AccessDeniedModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </AuthProvider>
  );
}
