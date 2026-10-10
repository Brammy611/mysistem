import {
  INITIAL_USERS,
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTION_CATEGORIES,
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGETS,
  INITIAL_RECURRING_OBLIGATIONS,
  INITIAL_BILLS,
  INITIAL_REQUIREMENTS,
  INITIAL_TASKS,
  INITIAL_PERSONAL_TASKS,
  INITIAL_CALENDAR_EVENTS,
  INITIAL_ACTIVITY_LOGS,
} from './seedData';

const STORAGE_KEYS = {
  USERS: 'cc_bookqu_users',
  ACCOUNTS: 'cc_bookqu_accounts',
  CATEGORIES: 'cc_bookqu_categories',
  TRANSACTIONS: 'cc_bookqu_transactions',
  BUDGETS: 'cc_bookqu_budgets',
  RECURRING_OBLIGATIONS: 'cc_bookqu_recurring',
  BILLS: 'cc_bookqu_bills',
  REQUIREMENTS: 'cc_bookqu_requirements',
  TASKS: 'cc_bookqu_tasks',
  PERSONAL_TASKS: 'cc_bookqu_personal_tasks',
  CALENDAR_EVENTS: 'cc_bookqu_calendar_events',
  ACTIVITY_LOGS: 'cc_bookqu_activity_logs',
  CURRENT_USER_ID: 'cc_bookqu_current_user_id',
};

// Safe JSON get/set
function getStoredItem(key, defaultValue) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error loading ${key} from storage:`, e);
    return defaultValue;
  }
}

function setStoredItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

export const StorageService = {
  // Reset all to default seed data
  resetAll() {
    localStorage.clear();
    setStoredItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    setStoredItem(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    setStoredItem(STORAGE_KEYS.CATEGORIES, INITIAL_TRANSACTION_CATEGORIES);
    setStoredItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    setStoredItem(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS);
    setStoredItem(STORAGE_KEYS.RECURRING_OBLIGATIONS, INITIAL_RECURRING_OBLIGATIONS);
    setStoredItem(STORAGE_KEYS.BILLS, INITIAL_BILLS);
    setStoredItem(STORAGE_KEYS.REQUIREMENTS, INITIAL_REQUIREMENTS);
    setStoredItem(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    setStoredItem(STORAGE_KEYS.PERSONAL_TASKS, INITIAL_PERSONAL_TASKS);
    setStoredItem(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
    setStoredItem(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    setStoredItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr-1');
  },

  initIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.resetAll();
    }
  },

  // ---------------- USER & AUTH ---------------- //
  getUsers() {
    this.initIfEmpty();
    return getStoredItem(STORAGE_KEYS.USERS, INITIAL_USERS);
  },

  getCurrentUser() {
    this.initIfEmpty();
    const currentId = getStoredItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr-1');
    const users = this.getUsers();
    return users.find((u) => u.id === currentId) || users[0];
  },

  setCurrentUser(userId) {
    setStoredItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
  },

  // ---------------- PERMISSION CHECK ---------------- //
  /**
   * Enforces backend & security rules:
   * Returns { allowed: boolean, reason?: string }
   */
  checkPermission(user, action, resource, item = null) {
    if (!user) return { allowed: false, reason: 'Pengguna belum terautentikasi.' };

    const role = user.role;

    // Owner has unrestricted access
    if (role === 'owner') {
      return { allowed: true };
    }

    // Personal modules (Finance & Personal Tasks)
    if (resource === 'finance' || resource === 'personal_tasks' || resource === 'settings_users') {
      return {
        allowed: false,
        reason: 'Akses ditolak: Modul ini adalah Personal Workspace khusus Owner.',
      };
    }

    // Developer Workspace permissions
    if (resource === 'developer_tasks' || resource === 'requirements') {
      if (role !== 'developer') {
        return {
          allowed: false,
          reason: 'Akses ditolak: Hanya anggota divisi Developer dan Owner yang memiliki akses ke modul ini.',
        };
      }
      if (action === 'final_approve') {
        return {
          allowed: false,
          reason: 'Akses ditolak: Final approval hanya dapat dilakukan oleh Owner.',
        };
      }
      if (action === 'delete' && item && item.createdBy !== user.id) {
        return {
          allowed: false,
          reason: 'Akses ditolak: Hanya Owner atau pembuat task yang dapat menghapus task ini.',
        };
      }
      return { allowed: true };
    }

    // Marketing Workspace permissions
    if (resource === 'marketing_tasks' || resource === 'marketing_content') {
      if (role !== 'marketing') {
        return {
          allowed: false,
          reason: 'Akses ditolak: Hanya anggota divisi Marketing dan Owner yang memiliki akses ke modul ini.',
        };
      }
      if (action === 'final_approve') {
        return {
          allowed: false,
          reason: 'Akses ditolak: Final approval konten hanya dapat diberikan oleh Owner.',
        };
      }
      if (action === 'delete' && item && item.createdBy !== user.id) {
        return {
          allowed: false,
          reason: 'Akses ditolak: Hanya Owner atau pembuat konten yang dapat menghapus data ini.',
        };
      }
      return { allowed: true };
    }

    // Shared calendar
    if (resource === 'calendar') {
      return { allowed: true };
    }

    return { allowed: true };
  },

  // ---------------- TASKS (BookQu Team) ---------------- //
  getTasks(user) {
    this.initIfEmpty();
    const tasks = getStoredItem(STORAGE_KEYS.TASKS, INITIAL_TASKS);
    if (!user || user.role === 'owner') return tasks;

    // Developer only sees developer tasks
    if (user.role === 'developer') {
      return tasks.filter((t) => t.division === 'developer');
    }

    // Marketing only sees marketing tasks
    if (user.role === 'marketing') {
      return tasks.filter((t) => t.division === 'marketing');
    }

    return [];
  },

  getAllTasksRaw() {
    this.initIfEmpty();
    return getStoredItem(STORAGE_KEYS.TASKS, INITIAL_TASKS);
  },

  saveTask(taskData, user) {
    const tasks = this.getAllTasksRaw();
    const isEditing = Boolean(taskData.id);

    // Permission check
    const resource = taskData.division === 'marketing' ? 'marketing_tasks' : 'developer_tasks';
    const perm = this.checkPermission(user, isEditing ? 'edit' : 'create', resource, taskData);
    if (!perm.allowed) {
      throw new Error(perm.reason);
    }

    let savedTask;
    const now = new Date().toISOString();

    if (isEditing) {
      const existingIndex = tasks.findIndex((t) => t.id === taskData.id);
      if (existingIndex === -1) throw new Error('Task tidak ditemukan');

      const oldTask = tasks[existingIndex];

      // If status changing to Done and user is not owner
      if (taskData.status === 'Done' && oldTask.status !== 'Done' && user.role !== 'owner') {
        throw new Error('Akses ditolak: Hanya Owner yang berhak memberikan approval status "Done".');
      }

      savedTask = {
        ...oldTask,
        ...taskData,
        updatedAt: now,
      };
      tasks[existingIndex] = savedTask;

      // Log status change or update
      if (oldTask.status !== savedTask.status) {
        this.addActivityLog({
          userId: user.id,
          userName: user.name,
          action: 'STATUS_CHANGED',
          targetType: 'task',
          targetId: savedTask.id,
          targetTitle: savedTask.title,
          details: `Mengubah status dari "${oldTask.status}" menjadi "${savedTask.status}".`,
        });
      } else {
        this.addActivityLog({
          userId: user.id,
          userName: user.name,
          action: 'TASK_UPDATED',
          targetType: 'task',
          targetId: savedTask.id,
          targetTitle: savedTask.title,
          details: `Memperbarui detail task ${savedTask.id}.`,
        });
      }
    } else {
      const prefix = taskData.division === 'marketing' ? 'CNT-' : 'TSK-';
      const randomNum = Math.floor(100 + Math.random() * 900);
      const newId = `${prefix}${randomNum}`;

      savedTask = {
        ...taskData,
        id: newId,
        createdBy: user.id,
        createdAt: now,
        updatedAt: now,
        status: taskData.status || 'To Do',
      };
      tasks.unshift(savedTask);

      this.addActivityLog({
        userId: user.id,
        userName: user.name,
        action: 'TASK_CREATED',
        targetType: 'task',
        targetId: savedTask.id,
        targetTitle: savedTask.title,
        details: `Membuat task baru di divisi ${savedTask.division === 'marketing' ? 'Marketing' : 'Developer'}.`,
      });
    }

    setStoredItem(STORAGE_KEYS.TASKS, tasks);
    return savedTask;
  },

  deleteTask(taskId, user) {
    const tasks = this.getAllTasksRaw();
    const taskToDelete = tasks.find((t) => t.id === taskId);
    if (!taskToDelete) return;

    const resource = taskToDelete.division === 'marketing' ? 'marketing_tasks' : 'developer_tasks';
    const perm = this.checkPermission(user, 'delete', resource, taskToDelete);
    if (!perm.allowed) {
      throw new Error(perm.reason);
    }

    const updated = tasks.filter((t) => t.id !== taskId);
    setStoredItem(STORAGE_KEYS.TASKS, updated);

    this.addActivityLog({
      userId: user.id,
      userName: user.name,
      action: 'TASK_DELETED',
      targetType: 'task',
      targetId: taskId,
      targetTitle: taskToDelete.title,
      details: `Menghapus task ${taskId}.`,
    });
  },

  updateTaskStatus(taskId, newStatus, user) {
    const tasks = this.getAllTasksRaw();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task tidak ditemukan');

    const resource = task.division === 'marketing' ? 'marketing_tasks' : 'developer_tasks';
    const perm = this.checkPermission(user, 'edit', resource, task);
    if (!perm.allowed) {
      throw new Error(perm.reason);
    }

    if (newStatus === 'Done' && user.role !== 'owner') {
      throw new Error('Akses ditolak: Hanya Owner yang berhak memberikan approval final "Done".');
    }

    const oldStatus = task.status;
    task.status = newStatus;
    task.updatedAt = new Date().toISOString();

    // If marketing, sync approvalStatus
    if (task.division === 'marketing') {
      if (newStatus === 'In Review') task.approvalStatus = 'Pending Approval';
      if (newStatus === 'Done') task.approvalStatus = 'Approved';
    }

    setStoredItem(STORAGE_KEYS.TASKS, tasks);

    this.addActivityLog({
      userId: user.id,
      userName: user.name,
      action: 'STATUS_CHANGED',
      targetType: 'task',
      targetId: task.id,
      targetTitle: task.title,
      details: `Memindahkan status dari "${oldStatus}" ke "${newStatus}".`,
    });

    return task;
  },

  // ---------------- REQUIREMENTS (Developer) ---------------- //
  getRequirements(user) {
    this.initIfEmpty();
    const perm = this.checkPermission(user, 'view', 'requirements');
    if (!perm.allowed) {
      throw new Error(perm.reason);
    }
    return getStoredItem(STORAGE_KEYS.REQUIREMENTS, INITIAL_REQUIREMENTS);
  },

  saveRequirement(reqData, user) {
    const perm = this.checkPermission(user, reqData.id ? 'edit' : 'create', 'requirements', reqData);
    if (!perm.allowed) {
      throw new Error(perm.reason);
    }

    const reqs = getStoredItem(STORAGE_KEYS.REQUIREMENTS, INITIAL_REQUIREMENTS);
    let saved;

    if (reqData.id) {
      const idx = reqs.findIndex((r) => r.id === reqData.id);
      if (idx === -1) throw new Error('Requirement tidak ditemukan');
      saved = { ...reqs[idx], ...reqData };
      reqs[idx] = saved;
    } else {
      const newId = `REQ-${Math.floor(100 + Math.random() * 900)}`;
      saved = { ...reqData, id: newId };
      reqs.unshift(saved);
    }

    setStoredItem(STORAGE_KEYS.REQUIREMENTS, reqs);
    return saved;
  },

  deleteRequirement(reqId, user) {
    const perm = this.checkPermission(user, 'delete', 'requirements');
    if (!perm.allowed) {
      throw new Error(perm.reason);
    }

    const reqs = getStoredItem(STORAGE_KEYS.REQUIREMENTS, INITIAL_REQUIREMENTS);
    const updated = reqs.filter((r) => r.id !== reqId);
    setStoredItem(STORAGE_KEYS.REQUIREMENTS, updated);
  },

  // ---------------- PERSONAL TASKS (Owner Only) ---------------- //
  getPersonalTasks(user) {
    this.initIfEmpty();
    const perm = this.checkPermission(user, 'view', 'personal_tasks');
    if (!perm.allowed) {
      throw new Error(perm.reason);
    }
    return getStoredItem(STORAGE_KEYS.PERSONAL_TASKS, INITIAL_PERSONAL_TASKS);
  },

  savePersonalTask(taskData, user) {
    const perm = this.checkPermission(user, 'edit', 'personal_tasks');
    if (!perm.allowed) {
      throw new Error(perm.reason);
    }

    const tasks = getStoredItem(STORAGE_KEYS.PERSONAL_TASKS, INITIAL_PERSONAL_TASKS);
    const now = new Date().toISOString();
    let saved;

    if (taskData.id) {
      const idx = tasks.findIndex((t) => t.id === taskData.id);
      if (idx === -1) throw new Error('Personal task tidak ditemukan');
      saved = { ...tasks[idx], ...taskData, updatedAt: now };
      tasks[idx] = saved;
    } else {
      const newId = `PTSK-${Math.floor(10 + Math.random() * 90)}`;
      saved = {
        ...taskData,
        id: newId,
        createdAt: now,
        updatedAt: now,
        status: taskData.status || 'To Do',
      };
      tasks.unshift(saved);
    }

    setStoredItem(STORAGE_KEYS.PERSONAL_TASKS, tasks);
    return saved;
  },

  deletePersonalTask(taskId, user) {
    const perm = this.checkPermission(user, 'delete', 'personal_tasks');
    if (!perm.allowed) {
      throw new Error(perm.reason);
    }

    const tasks = getStoredItem(STORAGE_KEYS.PERSONAL_TASKS, INITIAL_PERSONAL_TASKS);
    const updated = tasks.filter((t) => t.id !== taskId);
    setStoredItem(STORAGE_KEYS.PERSONAL_TASKS, updated);
  },

  // ---------------- PERSONAL FINANCE (Owner Only) ---------------- //
  getAccounts(user) {
    this.initIfEmpty();
    const perm = this.checkPermission(user, 'view', 'finance');
    if (!perm.allowed) {
      throw new Error(perm.reason);
    }
    const accounts = getStoredItem(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    const transactions = getStoredItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);

    // Compute live balance for each account:
    // Opening + Incomes - Expenses + Transfers In - Transfers Out
    return accounts.map((acc) => {
      let balance = Number(acc.openingBalance) || 0;

      transactions.forEach((tx) => {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'Income' && tx.accountId === acc.id) {
          balance += amt;
        } else if (tx.type === 'Expense' && tx.accountId === acc.id) {
          balance -= amt;
        } else if (tx.type === 'Transfer') {
          if (tx.toAccountId === acc.id) balance += amt;
          if (tx.fromAccountId === acc.id) balance -= amt;
        }
      });

      return {
        ...acc,
        currentBalance: balance,
      };
    });
  },

  saveAccount(accData, user) {
    const perm = this.checkPermission(user, 'edit', 'finance');
    if (!perm.allowed) {
      throw new Error(perm.reason);
    }

    const accounts = getStoredItem(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    let saved;

    if (accData.id) {
      const idx = accounts.findIndex((a) => a.id === accData.id);
      if (idx === -1) throw new Error('Akun tidak ditemukan');
      saved = { ...accounts[idx], ...accData };
      accounts[idx] = saved;
    } else {
      const newId = `acc-${Date.now()}`;
      saved = {
        ...accData,
        id: newId,
        openingBalance: Number(accData.openingBalance) || 0,
        isActive: accData.isActive !== false,
      };
      accounts.push(saved);
    }

    setStoredItem(STORAGE_KEYS.ACCOUNTS, accounts);
    return saved;
  },

  deleteAccount(accId, user) {
    const perm = this.checkPermission(user, 'delete', 'finance');
    if (!perm.allowed) throw new Error(perm.reason);

    const accounts = getStoredItem(STORAGE_KEYS.ACCOUNTS, INITIAL_ACCOUNTS);
    const updated = accounts.filter((a) => a.id !== accId);
    setStoredItem(STORAGE_KEYS.ACCOUNTS, updated);
  },

  getCategories(user) {
    this.initIfEmpty();
    const perm = this.checkPermission(user, 'view', 'finance');
    if (!perm.allowed) throw new Error(perm.reason);
    return getStoredItem(STORAGE_KEYS.CATEGORIES, INITIAL_TRANSACTION_CATEGORIES);
  },

  getTransactions(user) {
    this.initIfEmpty();
    const perm = this.checkPermission(user, 'view', 'finance');
    if (!perm.allowed) throw new Error(perm.reason);
    return getStoredItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
  },

  saveTransaction(txData, user) {
    const perm = this.checkPermission(user, 'edit', 'finance');
    if (!perm.allowed) throw new Error(perm.reason);

    const txs = getStoredItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    let saved;

    if (txData.id) {
      const idx = txs.findIndex((t) => t.id === txData.id);
      if (idx !== -1) {
        saved = { ...txs[idx], ...txData, amount: Number(txData.amount) };
        txs[idx] = saved;
      } else {
        saved = {
          ...txData,
          id: txData.id,
          amount: Number(txData.amount),
        };
        txs.unshift(saved);
      }
    } else {
      const newId = `trx-${Date.now()}`;
      saved = {
        ...txData,
        id: newId,
        amount: Number(txData.amount),
      };
      txs.unshift(saved);
    }

    setStoredItem(STORAGE_KEYS.TRANSACTIONS, txs);
    return saved;
  },

  deleteTransaction(txId, user) {
    const perm = this.checkPermission(user, 'delete', 'finance');
    if (!perm.allowed) throw new Error(perm.reason);

    const txs = getStoredItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    const updated = txs.filter((t) => t.id !== txId);
    setStoredItem(STORAGE_KEYS.TRANSACTIONS, updated);
  },

  getBudgets(user) {
    this.initIfEmpty();
    const perm = this.checkPermission(user, 'view', 'finance');
    if (!perm.allowed) throw new Error(perm.reason);
    return getStoredItem(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS);
  },

  saveBudget(budgetData, user) {
    const perm = this.checkPermission(user, 'edit', 'finance');
    if (!perm.allowed) throw new Error(perm.reason);

    const budgets = getStoredItem(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS);
    let saved;

    if (budgetData.id) {
      const idx = budgets.findIndex((b) => b.id === budgetData.id);
      if (idx === -1) throw new Error('Budget tidak ditemukan');
      saved = { ...budgets[idx], ...budgetData, limit: Number(budgetData.limit) };
      budgets[idx] = saved;
    } else {
      const newId = `bud-${Date.now()}`;
      saved = { ...budgetData, id: newId, limit: Number(budgetData.limit) };
      budgets.push(saved);
    }

    setStoredItem(STORAGE_KEYS.BUDGETS, budgets);
    return saved;
  },

  getRecurringObligations(user) {
    this.initIfEmpty();
    const perm = this.checkPermission(user, 'view', 'finance');
    if (!perm.allowed) throw new Error(perm.reason);
    return getStoredItem(STORAGE_KEYS.RECURRING_OBLIGATIONS, INITIAL_RECURRING_OBLIGATIONS);
  },

  saveRecurringObligation(obligationData, user) {
    const perm = this.checkPermission(user, 'edit', 'finance');
    if (!perm.allowed) throw new Error(perm.reason);

    const obligations = getStoredItem(STORAGE_KEYS.RECURRING_OBLIGATIONS, INITIAL_RECURRING_OBLIGATIONS);
    let saved;

    if (obligationData.id) {
      const idx = obligations.findIndex((o) => o.id === obligationData.id);
      if (idx === -1) throw new Error('Kewajiban tidak ditemukan');
      saved = { ...obligations[idx], ...obligationData, amount: Number(obligationData.amount) };
      obligations[idx] = saved;
    } else {
      const newId = `rec-${Date.now()}`;
      saved = { ...obligationData, id: newId, amount: Number(obligationData.amount), isActive: true };
      obligations.push(saved);
    }

    setStoredItem(STORAGE_KEYS.RECURRING_OBLIGATIONS, obligations);
    return saved;
  },

  getBills(user) {
    this.initIfEmpty();
    const perm = this.checkPermission(user, 'view', 'finance');
    if (!perm.allowed) throw new Error(perm.reason);
    return getStoredItem(STORAGE_KEYS.BILLS, INITIAL_BILLS);
  },

  saveBill(billData, user) {
    const perm = this.checkPermission(user, 'edit', 'finance');
    if (!perm.allowed) throw new Error(perm.reason);

    const bills = getStoredItem(STORAGE_KEYS.BILLS, INITIAL_BILLS);
    let saved;

    if (billData.id) {
      const idx = bills.findIndex((b) => b.id === billData.id);
      if (idx === -1) throw new Error('Tagihan tidak ditemukan');
      saved = { ...bills[idx], ...billData, amount: Number(billData.amount) };
      bills[idx] = saved;
    } else {
      const newId = `bill-${Date.now()}`;
      saved = {
        ...billData,
        id: newId,
        amount: Number(billData.amount),
        status: billData.status || 'Upcoming',
      };
      bills.push(saved);
    }

    setStoredItem(STORAGE_KEYS.BILLS, bills);
    return saved;
  },

  /**
   * Pay a bill: updates bill status to 'Paid', and creates an associated
   * expense transaction so account balance is deducted without double-counting!
   */
  payBill(billId, accountId, paymentDate, user) {
    const perm = this.checkPermission(user, 'edit', 'finance');
    if (!perm.allowed) throw new Error(perm.reason);

    const bills = getStoredItem(STORAGE_KEYS.BILLS, INITIAL_BILLS);
    const bill = bills.find((b) => b.id === billId);
    if (!bill) throw new Error('Tagihan tidak ditemukan');

    if (bill.status === 'Paid') {
      throw new Error('Tagihan ini sudah berstatus Lunas.');
    }

    // 1. Create linked expense transaction
    const newTxId = `trx-bill-${bill.id}`;
    const tx = this.saveTransaction(
      {
        id: newTxId,
        date: paymentDate || new Date().toISOString().split('T')[0],
        type: 'Expense',
        amount: bill.amount,
        accountId: accountId,
        categoryId: 'cat-exp-3', // Operational / SaaS / Default
        description: `Pembayaran Tagihan: ${bill.name} (${bill.payee})`,
        notes: `Pelunasan otomatis dari modul Tagihan & Kewajiban`,
        billId: bill.id,
      },
      user
    );

    // 2. Mark bill as paid
    bill.status = 'Paid';
    bill.paidDate = paymentDate || new Date().toISOString().split('T')[0];
    bill.transactionId = tx.id;
    setStoredItem(STORAGE_KEYS.BILLS, bills);

    return { bill, transaction: tx };
  },

  // ---------------- CALENDAR (Unified) ---------------- //
  getCalendarEvents(user) {
    this.initIfEmpty();
    const manualEvents = getStoredItem(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);

    // Permission-filtered manual events
    let visibleManualEvents = manualEvents;
    if (user.role === 'developer') {
      visibleManualEvents = manualEvents.filter((e) => e.division === 'developer' || e.isShared);
    } else if (user.role === 'marketing') {
      visibleManualEvents = manualEvents.filter((e) => e.division === 'marketing' || e.isShared);
    }

    // Generate dynamic events from source items (Tasks, Content, Bills, Personal Tasks)
    const dynamicEvents = [];

    // 1. Team Tasks Deadlines
    const allTasks = this.getTasks(user);
    allTasks.forEach((t) => {
      if (t.dueDate) {
        dynamicEvents.push({
          id: `evt-task-${t.id}`,
          title: `[DL] ${t.title}`,
          description: `Deadline Task: ${t.description || ''}`,
          startDate: `${t.dueDate}T17:00`,
          endDate: `${t.dueDate}T18:00`,
          allDay: true,
          category: t.division === 'marketing' ? 'Marketing' : 'BookQu Dev',
          source: 'task',
          relatedId: t.id,
          priority: t.priority,
          status: t.status,
          division: t.division,
          isShared: true,
        });
      }

      // If marketing content has publish date
      if (t.division === 'marketing' && t.publishDate) {
        dynamicEvents.push({
          id: `evt-publish-${t.id}`,
          title: `[PUBLISH] ${t.title}`,
          description: `Jadwal Publikasi di ${t.platform || 'Sosmed'}`,
          startDate: t.publishDate,
          endDate: t.publishDate,
          allDay: false,
          category: 'Content Publish',
          source: 'content_publish',
          relatedId: t.id,
          priority: t.priority,
          status: t.status,
          division: 'marketing',
          isShared: true,
        });
      }
    });

    // 2. Personal Tasks Deadlines (Owner Only)
    if (user.role === 'owner') {
      const personalTasks = getStoredItem(STORAGE_KEYS.PERSONAL_TASKS, INITIAL_PERSONAL_TASKS);
      personalTasks.forEach((pt) => {
        if (pt.dueDate) {
          dynamicEvents.push({
            id: `evt-ptsk-${pt.id}`,
            title: `[Personal] ${pt.title}`,
            description: pt.description || '',
            startDate: `${pt.dueDate}T09:00`,
            endDate: `${pt.dueDate}T10:00`,
            allDay: true,
            category: 'Personal Task',
            source: 'personal_task',
            relatedId: pt.id,
            priority: pt.priority,
            status: pt.status,
            division: null,
            isShared: false,
          });
        }
      });

      // 3. Financial Bills & Due Dates (Owner Only)
      const bills = getStoredItem(STORAGE_KEYS.BILLS, INITIAL_BILLS);
      bills.forEach((b) => {
        if (b.dueDate && b.status !== 'Paid') {
          dynamicEvents.push({
            id: `evt-bill-${b.id}`,
            title: `[Tagihan] ${b.name} (Rp ${b.amount.toLocaleString('id-ID')})`,
            description: `Jatuh tempo tagihan ke ${b.payee}`,
            startDate: `${b.dueDate}T08:00`,
            endDate: `${b.dueDate}T09:00`,
            allDay: true,
            category: 'Finance Due',
            source: 'bill',
            relatedId: b.id,
            priority: 'High',
            status: b.status,
            division: null,
            isShared: false,
          });
        }
      });
    }

    return [...visibleManualEvents, ...dynamicEvents];
  },

  saveCalendarEvent(eventData, user) {
    const perm = this.checkPermission(user, 'edit', 'calendar');
    if (!perm.allowed) throw new Error(perm.reason);

    const events = getStoredItem(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
    let saved;

    if (eventData.id && !eventData.id.startsWith('evt-task-') && !eventData.id.startsWith('evt-ptsk-') && !eventData.id.startsWith('evt-bill-')) {
      const idx = events.findIndex((e) => e.id === eventData.id);
      if (idx !== -1) {
        saved = { ...events[idx], ...eventData };
        events[idx] = saved;
      } else {
        saved = { ...eventData, id: eventData.id };
        events.push(saved);
      }
    } else {
      const newId = `evt-${Date.now()}`;
      saved = {
        ...eventData,
        id: newId,
        source: 'manual',
        createdBy: user.id,
      };
      events.push(saved);
    }

    setStoredItem(STORAGE_KEYS.CALENDAR_EVENTS, events);
    return saved;
  },

  deleteCalendarEvent(eventId, user) {
    const perm = this.checkPermission(user, 'delete', 'calendar');
    if (!perm.allowed) throw new Error(perm.reason);

    const events = getStoredItem(STORAGE_KEYS.CALENDAR_EVENTS, INITIAL_CALENDAR_EVENTS);
    const updated = events.filter((e) => e.id !== eventId);
    setStoredItem(STORAGE_KEYS.CALENDAR_EVENTS, updated);
  },

  // ---------------- ACTIVITY LOGS ---------------- //
  getActivityLogs(user) {
    this.initIfEmpty();
    const logs = getStoredItem(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    if (user.role === 'owner') return logs;

    // Filter by user division
    return logs.filter((log) => {
      if (user.role === 'developer') {
        return log.details.includes('Developer') || log.userId === user.id || log.targetId.startsWith('TSK') || log.targetId.startsWith('REQ');
      }
      if (user.role === 'marketing') {
        return log.details.includes('Marketing') || log.userId === user.id || log.targetId.startsWith('CNT');
      }
      return false;
    });
  },

  addActivityLog(logData) {
    const logs = getStoredItem(STORAGE_KEYS.ACTIVITY_LOGS, INITIAL_ACTIVITY_LOGS);
    const newLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep max 100 logs
    if (logs.length > 100) logs.pop();
    setStoredItem(STORAGE_KEYS.ACTIVITY_LOGS, logs);
    return newLog;
  },
};
