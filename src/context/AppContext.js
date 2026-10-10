import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  TaskService,
  BillService,
  ActivityService,
} from '../services/supabaseService';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { currentUser, isOwner, isDeveloper, isMarketing } = useAuth();

  // Navigation state
  const [currentView, setCurrentView] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals state
  const [modalState, setModalState] = useState({
    type: null,
    data: null,
  });

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Adjust default view based on role when user changes
  useEffect(() => {
    if (!currentUser) return;
    if (isOwner) {
      setCurrentView((v) => (v.startsWith('dev-') || v.startsWith('mkt-') ? 'overview' : v));
    } else if (isDeveloper) {
      setCurrentView('dev-dashboard');
    } else if (isMarketing) {
      setCurrentView('mkt-dashboard');
    }
  }, [currentUser?.id, isOwner, isDeveloper, isMarketing]);

  const refreshData = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Notifications from Supabase
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchNotifications = async () => {
      const list = [];
      const todayStr = new Date().toISOString().split('T')[0];

      try {
        const tasks = await TaskService.getAll(currentUser);

        tasks.forEach((t) => {
          if (t.dueDate && t.dueDate < todayStr && t.status !== 'Done') {
            list.push({
              id: `notif-overdue-${t.id}`,
              title: `Task Overdue: ${t.title}`,
              message: `Batas waktu ${t.dueDate} sudah terlewat.`,
              type: 'warning',
              linkView: t.division === 'marketing' ? 'mkt-board' : 'bookqu-dev',
              item: t,
            });
          }

          if (isOwner && t.status === 'In Review') {
            list.push({
              id: `notif-review-${t.id}`,
              title: `Menunggu Approval: ${t.title}`,
              message: `Task dari divisi ${t.division === 'marketing' ? 'Marketing' : 'Developer'} siap di-review.`,
              type: 'info',
              linkView: t.division === 'marketing' ? 'bookqu-marketing' : 'bookqu-dev',
              item: t,
            });
          }
        });

        if (isOwner) {
          const bills = await BillService.getAll(currentUser.id);
          const now = new Date();
          bills.forEach((b) => {
            if (b.status !== 'Paid' && b.dueDate) {
              const diffDays = Math.ceil((new Date(b.dueDate) - now) / (1000 * 60 * 60 * 24));
              if (diffDays <= 3 && diffDays >= 0) {
                list.push({
                  id: `notif-bill-${b.id}`,
                  title: `Tagihan Mendekati Tempo: ${b.name}`,
                  message: `Jatuh tempo pada ${b.dueDate} (Rp ${Number(b.amount).toLocaleString('id-ID')}).`,
                  type: 'danger',
                  linkView: 'finance-obligations',
                  item: b,
                });
              } else if (diffDays < 0) {
                list.push({
                  id: `notif-bill-overdue-${b.id}`,
                  title: `Tagihan Overdue: ${b.name}`,
                  message: `Tagihan lewat jatuh tempo sejak ${b.dueDate}!`,
                  type: 'danger',
                  linkView: 'finance-obligations',
                  item: b,
                });
              }
            }
          });
        }
      } catch (e) {
        console.error('Error fetching notifications:', e);
      }

      setNotifications(list);
    };

    fetchNotifications();
  }, [currentUser, isOwner, refreshTrigger]);

  const openModal = (type, data = null) => {
    setModalState({ type, data });
  };

  const closeModal = () => {
    setModalState({ type: null, data: null });
  };

  const value = {
    currentView,
    setCurrentView,
    searchQuery,
    setSearchQuery,
    refreshTrigger,
    refreshData,
    notifications,
    toasts,
    addToast,
    removeToast,
    modalState,
    openModal,
    closeModal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
