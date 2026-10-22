/**
 * supabaseService.js
 * Menggantikan StorageService (localStorage) dengan Supabase database.
 * Semua method async, mirror struktur storage.js agar komponen mudah dimigrasi.
 */

import { supabase } from '../supabaseClient';

// ─── HELPER ─────────────────────────────────────────────────────────────────

function throwIfError(error) {
  if (error) throw new Error(error.message);
}

// Konversi snake_case dari DB → camelCase di frontend
function toCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  return Object.entries(obj).reduce((acc, [k, v]) => {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    acc[camel] = toCamel(v);
    return acc;
  }, {});
}

// Konversi camelCase dari frontend → snake_case untuk DB
function toSnake(obj) {
  if (obj === '') return null;
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnake);
  return Object.entries(obj).reduce((acc, [k, v]) => {
    const snake = k.replace(/([A-Z])/g, (c) => `_${c.toLowerCase()}`);
    acc[snake] = toSnake(v);
    return acc;
  }, {});
}

// ─── PROFILES ────────────────────────────────────────────────────────────────

export const ProfileService = {
  async getAll() {
    const { data, error } = await supabase.from('profiles').select('*');
    throwIfError(error);
    const users = toCamel(data) || [];
    return users.map((u) => ({
      ...u,
      name: u.name || (u.email ? u.email.split('@')[0] : 'User'),
      avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email || 'User')}&background=random`,
    }));
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    throwIfError(error);
    const u = toCamel(data);
    if (!u) return null;
    return {
      ...u,
      name: u.name || (u.email ? u.email.split('@')[0] : 'User'),
      avatar: u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || u.email || 'User')}&background=random`,
    };
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(toSnake(updates))
      .eq('id', id)
      .select()
      .single();
    throwIfError(error);
    return toCamel(data);
  },
};

// ─── TASKS ────────────────────────────────────────────────────────────────────

export const TaskService = {
  async getAll(user) {
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    // Role-based filter
    if (user.role === 'developer') {
      query = query.eq('division', 'developer');
    } else if (user.role === 'marketing') {
      query = query.eq('division', 'marketing');
    }

    const { data, error } = await query;
    throwIfError(error);
    const tasks = toCamel(data) || [];

    // Manually enrich assignee & creator from profiles
    if (tasks.length > 0) {
      const ids = [
        ...new Set([
          ...tasks.map((t) => t.assigneeId).filter(Boolean),
          ...tasks.map((t) => t.createdBy).filter(Boolean),
        ]),
      ];
      if (ids.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, avatar, email, role')
          .in('id', ids);
        const profileMap = {};
        (profiles || []).forEach((p) => {
          profileMap[p.id] = {
            ...p,
            name: p.name || (p.email ? p.email.split('@')[0] : 'User'),
            avatar: p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || p.email || 'User')}&background=random`,
          };
        });
        return tasks.map((t) => ({
          ...t,
          assignee: t.assigneeId ? profileMap[t.assigneeId] || null : null,
          creator: t.createdBy ? profileMap[t.createdBy] || null : null,
        }));
      }
    }
    return tasks;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .single();
    throwIfError(error);
    const task = toCamel(data);
    if (task?.assigneeId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, avatar, email, role')
        .eq('id', task.assigneeId)
        .single();
      if (profile) {
        task.assignee = {
          ...profile,
          name: profile.name || (profile.email ? profile.email.split('@')[0] : 'User'),
          avatar: profile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || profile.email || 'User')}&background=random`,
        };
      }
    }
    return task;
  },

  async save(taskData, user) {
    const now = new Date().toISOString();
    const isEditing = Boolean(taskData.id);

    // Permission guard
    if (taskData.status === 'Done' && user.role !== 'owner') {
      throw new Error('Akses ditolak: Hanya Owner yang berhak memberikan approval status "Done".');
    }

    // Strip virtual/enriched fields that are NOT real DB columns
    // (assignee & creator are computed by the service, not stored directly)
    const { assignee, creator, ...cleanTaskData } = taskData;

    const payload = toSnake({
      ...cleanTaskData,
      updatedAt: now,
      ...(isEditing ? {} : { createdBy: user.id, createdAt: now, status: cleanTaskData.status || 'To Do' }),
    });

    let result;
    if (isEditing) {
      const { data, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', taskData.id)
        .select()
        .single();
      throwIfError(error);
      result = data;
    } else {
      // Generate ID
      const prefix = taskData.division === 'marketing' ? 'CNT-' : 'TSK-';
      const newId = `${prefix}${Math.floor(100 + Math.random() * 900)}`;
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...payload, id: newId })
        .select()
        .single();
      throwIfError(error);
      result = data;

      // Log activity
      await ActivityService.add({
        userId: user.id,
        userName: user.name,
        action: 'TASK_CREATED',
        targetType: 'task',
        targetId: result.id,
        targetTitle: result.title,
        details: `Membuat task baru di divisi ${result.division === 'marketing' ? 'Marketing' : 'Developer'}.`,
      });
    }

    return toCamel(result);
  },

  async updateStatus(taskId, newStatus, user) {
    if (newStatus === 'Done' && user.role !== 'owner') {
      throw new Error('Akses ditolak: Hanya Owner yang berhak memberikan approval final "Done".');
    }

    const updates = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      ...(newStatus === 'In Review' ? { approval_status: 'Pending Approval' } : {}),
      ...(newStatus === 'Done' ? { approval_status: 'Approved' } : {}),
    };

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();
    throwIfError(error);

    await ActivityService.add({
      userId: user.id,
      userName: user.name,
      action: 'STATUS_CHANGED',
      targetType: 'task',
      targetId: taskId,
      targetTitle: data.title,
      details: `Mengubah status menjadi "${newStatus}".`,
    });

    return toCamel(data);
  },

  async delete(taskId, user) {
    const { error } = await supabase.from('tasks').delete().eq('id', taskId);
    throwIfError(error);

    await ActivityService.add({
      userId: user.id,
      userName: user.name,
      action: 'TASK_DELETED',
      targetType: 'task',
      targetId: taskId,
      targetTitle: taskId,
      details: `Menghapus task ${taskId}.`,
    });
  },
};

// ─── REQUIREMENTS ─────────────────────────────────────────────────────────────

export const RequirementService = {
  async getAll() {
    const { data, error } = await supabase
      .from('requirements')
      .select('*')
      .order('created_at', { ascending: false });
    throwIfError(error);
    const reqs = toCamel(data) || [];

    // Manually enrich pic from profiles
    const picIds = [...new Set(reqs.map((r) => r.picId).filter(Boolean))];
    if (picIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar, email')
        .in('id', picIds);
      const profileMap = {};
      (profiles || []).forEach((p) => {
        profileMap[p.id] = {
          ...p,
          name: p.name || (p.email ? p.email.split('@')[0] : 'User'),
          avatar: p.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || p.email || 'User')}&background=random`,
        };
      });
      return reqs.map((r) => ({ ...r, pic: r.picId ? profileMap[r.picId] || null : null }));
    }
    return reqs;
  },

  async save(reqData) {
    const isEditing = Boolean(reqData.id);
    const payload = toSnake(reqData);

    if (isEditing) {
      const { data, error } = await supabase
        .from('requirements')
        .update(payload)
        .eq('id', reqData.id)
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    } else {
      const newId = `REQ-${Math.floor(100 + Math.random() * 900)}`;
      const { data, error } = await supabase
        .from('requirements')
        .insert({ ...payload, id: newId })
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    }
  },

  async delete(reqId) {
    const { error } = await supabase.from('requirements').delete().eq('id', reqId);
    throwIfError(error);
  },
};

// ─── PERSONAL TASKS (Owner Only) ─────────────────────────────────────────────

export const PersonalTaskService = {
  async getAll(ownerId) {
    const { data, error } = await supabase
      .from('personal_tasks')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    throwIfError(error);
    return toCamel(data);
  },

  async save(taskData, ownerId) {
    const now = new Date().toISOString();
    const isEditing = Boolean(taskData.id);
    const payload = toSnake({ ...taskData, ownerId, updatedAt: now });

    if (isEditing) {
      const { data, error } = await supabase
        .from('personal_tasks')
        .update(payload)
        .eq('id', taskData.id)
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    } else {
      const newId = `PTSK-${Math.floor(10 + Math.random() * 90)}`;
      const { data, error } = await supabase
        .from('personal_tasks')
        .insert({ ...payload, id: newId, created_at: now, status: taskData.status || 'To Do' })
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    }
  },

  async delete(taskId) {
    const { error } = await supabase.from('personal_tasks').delete().eq('id', taskId);
    throwIfError(error);
  },
};

// ─── CALENDAR EVENTS ──────────────────────────────────────────────────────────

export const CalendarService = {
  async getAll(user) {
    let query = supabase.from('calendar_events').select('*').order('start_date');

    const role = typeof user === 'object' ? user?.role : null;
    if (role === 'developer') {
      query = query.or('division.eq.developer,is_shared.eq.true');
    } else if (role === 'marketing') {
      query = query.or('division.eq.marketing,is_shared.eq.true');
    }

    const { data, error } = await query;
    throwIfError(error);
    return toCamel(data) || [];
  },

  async save(eventData, user) {
    const isEditing = Boolean(eventData.id) && !eventData.id.startsWith('evt-task-') && !eventData.id.startsWith('evt-ptsk-') && !eventData.id.startsWith('evt-bill-');
    const createdBy = typeof user === 'object' ? user?.id : user;
    const payload = toSnake({ ...eventData, createdBy });

    if (isEditing) {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(payload)
        .eq('id', eventData.id)
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    } else {
      const newId = `evt-${Date.now()}`;
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({ ...payload, id: newId, source: 'manual' })
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    }
  },

  async delete(eventId) {
    const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);
    throwIfError(error);
  },
};

// ─── ACTIVITY LOGS ─────────────────────────────────────────────────────────────

export const ActivityService = {
  async getAll(user) {
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (user.role !== 'owner') {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;
    throwIfError(error);
    return toCamel(data);
  },

  async add(logData) {
    const newId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { error } = await supabase.from('activity_logs').insert(
      toSnake({ ...logData, id: newId, createdAt: new Date().toISOString() })
    );
    if (error) console.error('Log error:', error);
  },
};

// ─── FINANCE: ACCOUNTS ────────────────────────────────────────────────────────

export const AccountService = {
  async getAll(ownerId) {
    const { data: accounts, error: accErr } = await supabase
      .from('accounts')
      .select('*')
      .eq('owner_id', ownerId);
    throwIfError(accErr);

    const { data: txs, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('owner_id', ownerId);
    throwIfError(txErr);

    // Compute live balance
    return toCamel(accounts).map((acc) => {
      let balance = Number(acc.openingBalance) || 0;
      toCamel(txs).forEach((tx) => {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'Income' && tx.accountId === acc.id) balance += amt;
        else if (tx.type === 'Expense' && tx.accountId === acc.id) balance -= amt;
        else if (tx.type === 'Transfer') {
          if (tx.toAccountId === acc.id) balance += amt;
          if (tx.fromAccountId === acc.id) balance -= amt;
        }
      });
      return { ...acc, currentBalance: balance };
    });
  },

  async save(accData, ownerId) {
    const isEditing = Boolean(accData.id);
    const payload = toSnake({ ...accData, ownerId });

    if (isEditing) {
      const { data, error } = await supabase
        .from('accounts')
        .update(payload)
        .eq('id', accData.id)
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    } else {
      const newId = `acc-${Date.now()}`;
      const { data, error } = await supabase
        .from('accounts')
        .insert({ ...payload, id: newId })
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    }
  },

  async delete(accId) {
    const { error } = await supabase.from('accounts').delete().eq('id', accId);
    throwIfError(error);
  },
};

// ─── FINANCE: CATEGORIES ──────────────────────────────────────────────────────

export const CategoryService = {
  async getAll(ownerId) {
    const { data, error } = await supabase
      .from('transaction_categories')
      .select('*')
      .eq('owner_id', ownerId);
    throwIfError(error);
    return toCamel(data);
  },

  async save(catData, ownerId) {
    const isEditing = Boolean(catData.id);
    const payload = toSnake({ ...catData, ownerId });

    if (isEditing) {
      const { data, error } = await supabase
        .from('transaction_categories')
        .update(payload)
        .eq('id', catData.id)
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    } else {
      const newId = `cat-${Date.now()}`;
      const { data, error } = await supabase
        .from('transaction_categories')
        .insert({ ...payload, id: newId })
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    }
  },

  async delete(catId) {
    const { error } = await supabase
      .from('transaction_categories')
      .delete()
      .eq('id', catId);
    throwIfError(error);
  },
};

// ─── FINANCE: TRANSACTIONS ────────────────────────────────────────────────────

export const TransactionService = {
  async getAll(ownerId) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('owner_id', ownerId)
      .order('date', { ascending: false });
    throwIfError(error);
    return toCamel(data);
  },

  async save(txData, ownerId) {
    const isEditing = Boolean(txData.id);
    const payload = toSnake({ ...txData, ownerId, amount: Number(txData.amount) });

    if (isEditing) {
      const { data, error } = await supabase
        .from('transactions')
        .update(payload)
        .eq('id', txData.id)
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    } else {
      const newId = `trx-${Date.now()}`;
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...payload, id: newId })
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    }
  },

  async delete(txId) {
    const { error } = await supabase.from('transactions').delete().eq('id', txId);
    throwIfError(error);
  },
};

// ─── FINANCE: BUDGETS ─────────────────────────────────────────────────────────

export const BudgetService = {
  async getAll(ownerId) {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('owner_id', ownerId);
    throwIfError(error);
    return toCamel(data);
  },

  async save(budgetData, ownerId) {
    const isEditing = Boolean(budgetData.id);
    const payload = toSnake({ ...budgetData, ownerId, limit: Number(budgetData.limit) });

    if (isEditing) {
      const { data, error } = await supabase
        .from('budgets')
        .update(payload)
        .eq('id', budgetData.id)
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    } else {
      const newId = `bud-${Date.now()}`;
      const { data, error } = await supabase
        .from('budgets')
        .insert({ ...payload, id: newId })
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    }
  },
};

// ─── FINANCE: RECURRING OBLIGATIONS ──────────────────────────────────────────

export const ObligationService = {
  async getAll(ownerId) {
    const { data, error } = await supabase
      .from('recurring_obligations')
      .select('*')
      .eq('owner_id', ownerId);
    throwIfError(error);
    return toCamel(data);
  },

  async save(obligationData, ownerId) {
    const isEditing = Boolean(obligationData.id);
    const payload = toSnake({ ...obligationData, ownerId, amount: Number(obligationData.amount) });

    if (isEditing) {
      const { data, error } = await supabase
        .from('recurring_obligations')
        .update(payload)
        .eq('id', obligationData.id)
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    } else {
      const newId = `rec-${Date.now()}`;
      const { data, error } = await supabase
        .from('recurring_obligations')
        .insert({ ...payload, id: newId, is_active: true })
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    }
  },
};

// ─── FINANCE: BILLS ───────────────────────────────────────────────────────────

export const BillService = {
  async getAll(ownerId) {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('owner_id', ownerId)
      .order('due_date');
    throwIfError(error);
    return toCamel(data);
  },

  async save(billData, ownerId) {
    const isEditing = Boolean(billData.id);
    const payload = toSnake({ ...billData, ownerId, amount: Number(billData.amount) });

    if (isEditing) {
      const { data, error } = await supabase
        .from('bills')
        .update(payload)
        .eq('id', billData.id)
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    } else {
      const newId = `bill-${Date.now()}`;
      const { data, error } = await supabase
        .from('bills')
        .insert({ ...payload, id: newId, status: billData.status || 'Upcoming' })
        .select()
        .single();
      throwIfError(error);
      return toCamel(data);
    }
  },

  async pay(billId, accountId, paymentDate, ownerId) {
    // 1. Get bill data
    const { data: bill, error: billErr } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single();
    throwIfError(billErr);

    if (bill.status === 'Paid') throw new Error('Tagihan ini sudah berstatus Lunas.');

    // 2. Create linked transaction
    const newTxId = `trx-bill-${bill.id}`;
    const tx = await TransactionService.save({
      id: newTxId,
      date: paymentDate || new Date().toISOString().split('T')[0],
      type: 'Expense',
      amount: bill.amount,
      accountId: accountId,
      categoryId: null,
      description: `Pembayaran Tagihan: ${bill.name} (${bill.payee})`,
      notes: 'Pelunasan otomatis dari modul Tagihan & Kewajiban',
      billId: bill.id,
    }, ownerId);

    // 3. Mark bill as paid
    const { data: updatedBill, error: updateErr } = await supabase
      .from('bills')
      .update({ status: 'Paid', paid_date: paymentDate, transaction_id: tx.id })
      .eq('id', billId)
      .select()
      .single();
    throwIfError(updateErr);

    return { bill: toCamel(updatedBill), transaction: tx };
  },
};

// ─── FINANCE: INCOME ALLOCATION PLANS ────────────────────────────────────────

export const AllocationPlanService = {
  /** Fetch the plan (+ items) for a given month. Returns null if none exists. */
  async getByMonth(ownerId, month) {
    const { data, error } = await supabase
      .from('income_allocation_plans')
      .select('*, income_allocation_items(*)')
      .eq('owner_id', ownerId)
      .eq('month', month)
      .maybeSingle();
    throwIfError(error);
    if (!data) return null;
    const plan = toCamel(data);
    plan.items = toCamel(data.income_allocation_items || []);
    delete plan.incomeAllocationItems;
    return plan;
  },

  /** Upsert the plan header and replace all items atomically. */
  async savePlan(ownerId, month, netIncome, items) {
    // 1. Upsert plan header
    const { data: planRow, error: planErr } = await supabase
      .from('income_allocation_plans')
      .upsert(
        {
          owner_id: ownerId,
          month,
          net_income: Number(netIncome),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'owner_id,month', ignoreDuplicates: false }
      )
      .select()
      .single();
    throwIfError(planErr);
    const planId = planRow.id;

    // 2. Delete existing items
    const { error: delErr } = await supabase
      .from('income_allocation_items')
      .delete()
      .eq('plan_id', planId);
    throwIfError(delErr);

    // 3. Insert new items
    if (items && items.length > 0) {
      const rows = items.map((item, idx) =>
        toSnake({
          id: item.id || `ali-${Date.now()}-${idx}`,
          planId,
          categoryName: item.categoryName,
          categoryType: item.categoryType || 'Other',
          allocationMode: item.allocationMode || 'percentage',
          percentage: Number(item.percentage) || 0,
          plannedAmount: Number(item.plannedAmount) || 0,
          displayOrder: idx,
        })
      );
      const { error: insErr } = await supabase
        .from('income_allocation_items')
        .insert(rows);
      throwIfError(insErr);
    }

    return toCamel(planRow);
  },

  /** Delete a plan and all its items. */
  async deletePlan(ownerId, month) {
    const { data: planRow } = await supabase
      .from('income_allocation_plans')
      .select('id')
      .eq('owner_id', ownerId)
      .eq('month', month)
      .maybeSingle();
    if (!planRow) return;
    await supabase.from('income_allocation_items').delete().eq('plan_id', planRow.id);
    await supabase.from('income_allocation_plans').delete().eq('id', planRow.id);
  },
};
