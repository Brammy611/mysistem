import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { BudgetService, CategoryService, TransactionService } from '../../services/supabaseService';
import {
  PieChart,
  Plus,
  AlertTriangle,
  Calendar,
  Edit2,
} from 'lucide-react';

export const BudgetsView = () => {
  const { currentUser } = useAuth();
  const { openModal, refreshTrigger } = useApp();

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [buds, cats, txs] = await Promise.all([
          BudgetService.getAll(currentUser.id),
          CategoryService.getAll(currentUser.id),
          TransactionService.getAll(currentUser.id),
        ]);
        setBudgets(buds);
        setCategories(cats.filter((c) => c.type === 'Expense'));
        setTransactions(txs);
      } catch (err) {
        console.error('Budgets load error:', err);
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  // Filter transactions for that month
  const monthTransactions = transactions.filter(
    (t) => t.type === 'Expense' && t.date.startsWith(selectedMonth)
  );

  const budgetItems = categories.map((cat) => {
    const budget = budgets.find((b) => b.categoryId === cat.id && b.month === selectedMonth);
    const spent = monthTransactions
      .filter((t) => t.categoryId === cat.id)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const limit = budget?.limit || 0;
    const remaining = limit - spent;
    const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    return {
      category: cat,
      budget,
      limit,
      spent,
      remaining,
      pct,
      isOver: limit > 0 && spent > limit,
    };
  });

  const totalBudget = budgetItems.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgetItems.reduce((sum, b) => sum + b.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-600" />
            Budget Management & Spending Limits
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Bandingkan plafon anggaran bulanan dengan realisasi pengeluaran riil per kategori.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={() => openModal('budget_form', { month: selectedMonth })}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Atur Anggaran Kategori</span>
          </button>
        </div>
      </div>

      {/* Summary KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Total Plafon Anggaran
          </span>
          <div className="text-2xl font-extrabold text-slate-900">
            Rp {totalBudget.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Total Realisasi Terpakai
          </span>
          <div className="text-2xl font-extrabold text-rose-600">
            Rp {totalSpent.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Sisa Anggaran Tersedia
          </span>
          <div
            className={`text-2xl font-extrabold ${
              totalRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            Rp {totalRemaining.toLocaleString('id-ID')}
          </div>
        </div>
      </div>

      {/* Budget Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgetItems.map((item) => (
          <div
            key={item.category.id}
            className={`bg-white rounded-2xl border p-5 shadow-2xs transition-all ${
              item.isOver
                ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10'
                : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{item.category.name}</h3>
                <span className="text-[11px] text-slate-400">
                  {item.limit > 0 ? `Target ${selectedMonth}` : 'Belum ada batas budget'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {item.isOver && (
                  <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Over Budget
                  </span>
                )}
                <button
                  onClick={() =>
                    openModal('budget_form', {
                      id: item.budget?.id,
                      categoryId: item.category.id,
                      month: selectedMonth,
                      limit: item.limit,
                    })
                  }
                  className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                  title="Atur Budget"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Spent vs Limit numbers */}
            <div className="flex items-baseline justify-between text-xs mb-2">
              <span className="font-semibold text-slate-600">
                Terpakai: <strong className="text-slate-900">Rp {item.spent.toLocaleString('id-ID')}</strong>
              </span>
              <span className="text-slate-500">
                Limit: <strong>Rp {item.limit.toLocaleString('id-ID')}</strong> ({item.pct}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all ${
                  item.isOver
                    ? 'bg-rose-500'
                    : item.pct > 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(item.pct, 100)}%` }}
              />
            </div>

            {/* Remaining */}
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 text-slate-500">
              <span>Sisa Anggaran:</span>
              <span
                className={`font-bold ${
                  item.remaining < 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                Rp {item.remaining.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
