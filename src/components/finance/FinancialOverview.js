import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AccountService, TransactionService, CategoryService, BudgetService, BillService, ObligationService } from '../../services/supabaseService';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  PieChart,
  Calendar,
  Receipt,
  Plus,
  Landmark,
} from 'lucide-react';

export const FinancialOverview = () => {
  const { currentUser } = useAuth();
  const { openModal, setCurrentView, refreshTrigger } = useApp();

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);
  const [recurring, setRecurring] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [accs, txs, cats, buds, bls, recs] = await Promise.all([
          AccountService.getAll(currentUser.id),
          TransactionService.getAll(currentUser.id),
          CategoryService.getAll(currentUser.id),
          BudgetService.getAll(currentUser.id),
          BillService.getAll(currentUser.id),
          ObligationService.getAll(currentUser.id),
        ]);
        setAccounts(accs); setTransactions(txs); setCategories(cats);
        setBudgets(buds); setBills(bls); setRecurring(recs);
      } catch (err) {
        console.error('Finance load error:', err);
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  // Total balance across all accounts
  const totalBalance = accounts.reduce((acc, a) => acc + (a.currentBalance || 0), 0);

  // Filter transactions for period
  const periodTransactions = transactions.filter((tx) => {
    if (!selectedMonth) return true;
    return tx.date.startsWith(selectedMonth);
  });

  const totalIncome = periodTransactions
    .filter((tx) => tx.type === 'Income')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const totalExpense = periodTransactions
    .filter((tx) => tx.type === 'Expense')
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const netCashFlow = totalIncome - totalExpense;

  // Expense by category breakdown
  const categoryExpenses = categories
    .filter((c) => c.type === 'Expense')
    .map((cat) => {
      const spent = periodTransactions
        .filter((tx) => tx.type === 'Expense' && tx.categoryId === cat.id)
        .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
      const budget = budgets.find((b) => b.categoryId === cat.id && b.month === selectedMonth);
      return {
        ...cat,
        spent,
        budgetLimit: budget?.limit || 0,
        percentage: totalExpense > 0 ? Math.round((spent / totalExpense) * 100) : 0,
      };
    })
    .filter((c) => c.spent > 0 || c.budgetLimit > 0)
    .sort((a, b) => b.spent - a.spent);

  // Unpaid bills
  const unpaidBills = bills.filter((b) => b.status !== 'Paid');
  const totalOutstandingObligations = unpaidBills.reduce((sum, b) => sum + Number(b.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner with Period Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Personal Financial Command Center (Owner Only)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan saldo riil, arus kas bersih (net cash flow), realisasi anggaran, dan kewajiban jatuh tempo.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              <option value="2026-10">Oktober 2026 (Bulan Ini)</option>
              <option value="2026-09">September 2026</option>
              <option value="">Semua Periode</option>
            </select>
          </div>

          <button
            onClick={() => openModal('tx_form')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi</span>
          </button>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Total Saldo Seluruh Akun
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Rp {totalBalance.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
            {accounts.length} sumber dana aktif
          </span>
        </div>

        {/* Pemasukan Periode */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Pemasukan</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
            +Rp {totalIncome.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Periode berjalan</span>
        </div>

        {/* Pengeluaran Periode */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Pengeluaran</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-600">
            -Rp {totalExpense.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Exclude transfer internal</span>
        </div>

        {/* Net Cash Flow */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Arus Kas Bersih (Net Flow)</span>
            <ArrowLeftRight className="w-4 h-4 text-blue-500" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold ${
              netCashFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {netCashFlow >= 0 ? '+' : ''}Rp {netCashFlow.toLocaleString('id-ID')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Income − Expense</span>
        </div>
      </div>

      {/* Grid: Left (Category Expense Breakdown & Accounts) | Right (Upcoming Bills & Obligations) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Category Breakdown & Realization */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                Pengeluaran per Kategori & Realisasi Anggaran
              </h3>
              <button
                onClick={() => setCurrentView('finance-budgets')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Kelola Anggaran
              </button>
            </div>

            <div className="space-y-4">
              {categoryExpenses.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Belum ada transaksi pengeluaran pada periode ini.
                </p>
              ) : (
                categoryExpenses.map((cat) => {
                  const isOver = cat.budgetLimit > 0 && cat.spent > cat.budgetLimit;
                  const pctBudget =
                    cat.budgetLimit > 0 ? Math.round((cat.spent / cat.budgetLimit) * 100) : null;

                  return (
                    <div key={cat.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          {cat.name}
                          {isOver && (
                            <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.2 rounded font-extrabold">
                              Over Budget!
                            </span>
                          )}
                        </span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">
                            Rp {cat.spent.toLocaleString('id-ID')}
                          </span>
                          {cat.budgetLimit > 0 && (
                            <span className="text-slate-400 ml-1.5">
                              / Rp {cat.budgetLimit.toLocaleString('id-ID')} ({pctBudget}%)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver
                              ? 'bg-rose-500'
                              : cat.percentage > 30
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{
                            width: `${Math.min(
                              cat.budgetLimit > 0 ? (cat.spent / cat.budgetLimit) * 100 : cat.percentage,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Accounts Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-600" />
                Daftar Akun Keuangan & Saldo Terkini
              </h3>
              <button
                onClick={() => setCurrentView('finance-accounts')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Semua Akun →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">{acc.name}</span>
                    <span className="text-[10px] text-slate-400">{acc.type}</span>
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    Rp {acc.currentBalance?.toLocaleString('id-ID')}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                    No: {acc.accountNumber || '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right (1 Column): Upcoming Bills & Liabilities */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-600" />
                Tagihan Jatuh Tempo ({unpaidBills.length})
              </h3>
              <button
                onClick={() => setCurrentView('finance-obligations')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Lihat Semua
              </button>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 mb-3 text-xs">
              <span className="text-slate-600 block">Total Tagihan Belum Lunas:</span>
              <span className="font-extrabold text-rose-700 text-base">
                Rp {totalOutstandingObligations.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="space-y-3">
              {unpaidBills.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Semua tagihan lunas!</p>
              ) : (
                unpaidBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{bill.name}</span>
                      <span className="text-rose-600 font-bold">{bill.dueDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{bill.payee}</span>
                      <span className="font-extrabold text-slate-900">
                        Rp {bill.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <button
                      onClick={() => openModal('bill_pay_modal', bill)}
                      className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-xs"
                    >
                      Bayar Sekarang (Anti Double Count)
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recurring Obligations Quick List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">
              Kewajiban Rutin Bulanan
            </h3>
            <div className="space-y-2 text-xs">
              {recurring.map((rec) => (
                <div
                  key={rec.id}
                  className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{rec.name}</span>
                    <span className="text-[10px] text-slate-400">Jatuh tempo tgl {rec.dueDay}</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    Rp {rec.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
