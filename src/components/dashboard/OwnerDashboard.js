import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { PersonalTaskService, TaskService, AccountService, TransactionService, BillService } from '../../services/supabaseService';
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  AlertTriangle,
  Code2,
  Megaphone,
  Wallet,
  Receipt,
  Clock,
  TrendingUp,
  CheckCircle2,
  Plus,
  LogOut,
} from 'lucide-react';

export const OwnerDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { setCurrentView, openModal, refreshTrigger } = useApp();

  const [personalTasks, setPersonalTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pts, ts, accs, txs, bs] = await Promise.all([
          PersonalTaskService.getAll(currentUser.id),
          TaskService.getAll(currentUser),
          AccountService.getAll(currentUser.id),
          TransactionService.getAll(currentUser.id),
          BillService.getAll(currentUser.id),
        ]);
        setPersonalTasks(pts);
        setAllTasks(ts);
        setAccounts(accs);
        setTransactions(txs);
        setBills(bs);
      } catch (err) {
        console.error(err);
      }
    };
    if (currentUser) fetchAll();
  }, [currentUser, refreshTrigger]);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Personal Tasks & Agenda today
  const personalTasksToday = personalTasks.filter(
    (t) => t.dueDate === todayStr || (!t.dueDate && t.status !== 'Done')
  );

  // 2. BookQu Team tasks
  const devTasks = allTasks.filter((t) => t.division === 'developer');
  const mktTasks = allTasks.filter((t) => t.division === 'marketing');

  const overdueTasks = allTasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'Done'
  );

  const pendingApprovals = allTasks.filter(
    (t) => t.status === 'In Review' || t.approvalStatus === 'Pending Approval'
  );

  // 3. Marketing Publishing Schedule
  const upcomingPublish = mktTasks
    .filter((t) => t.publishDate && t.productionStatus !== 'Published')
    .sort((a, b) => new Date(a.publishDate) - new Date(b.publishDate))
    .slice(0, 4);

  // 4. Financial Summary
  const totalBalance = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);

  const currentMonth = '2026-10';
  const monthTxs = transactions.filter((t) => t.date.startsWith(currentMonth));
  const monthIncome = monthTxs
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const monthExpense = monthTxs
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netCashFlow = monthIncome - monthExpense;

  // 5. Upcoming Bills
  const unpaidBills = bills
    .filter((b) => b.status !== 'Paid')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  // Progress metrics
  const devDone = devTasks.filter((t) => t.status === 'Done').length;
  const devProgressPct =
    devTasks.length > 0 ? Math.round((devDone / devTasks.length) * 100) : 0;

  const mktPublished = mktTasks.filter(
    (t) => t.productionStatus === 'Published' || t.status === 'Done'
  ).length;
  const mktProgressPct =
    mktTasks.length > 0 ? Math.round((mktPublished / mktTasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-2 backdrop-blur-xs">
              <LayoutDashboard className="w-3.5 h-3.5" /> Owner Command Center
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Selamat datang kembali, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Owner'}! 👑
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Satu dashboard terpadu untuk mengendalikan seluruh operasional BookQu dan keuangan pribadi Anda.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openModal('tx_form')}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi</span>
            </button>
            <button
              onClick={() => openModal('task_form', { division: 'developer' })}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Task Tim</span>
            </button>
            <button
              onClick={logout}
              className="px-3 py-2 bg-white/10 hover:bg-rose-600 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 backdrop-blur-xs border border-white/15"
              title="Keluar dari sistem"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Critical Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo */}
        <div
          onClick={() => setCurrentView('finance-overview')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Saldo Keuangan</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Rp {totalBalance.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Net Flow: +Rp {netCashFlow.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Task Overdue */}
        <div
          onClick={() => setCurrentView('bookqu-team')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Task BookQu Overdue</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-extrabold ${
              overdueTasks.length > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {overdueTasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Melewati tenggat waktu</div>
        </div>

        {/* Waiting Approval */}
        <div
          onClick={() => setCurrentView('bookqu-team')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Menunggu Approval Owner</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-600">
            {pendingApprovals.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Dev & Marketing in review</div>
        </div>

        {/* Tagihan Jatuh Tempo */}
        <div
          onClick={() => setCurrentView('finance-obligations')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Tagihan Belum Lunas</span>
            <Receipt className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {unpaidBills.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Segera bayar sebelum denda</div>
        </div>
      </div>

      {/* Progress Bars for Both Divisions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Developer Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-blue-600" /> Progress Divisi Developer
            </span>
            <button
              onClick={() => setCurrentView('bookqu-dev')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Buka Board →
            </button>
          </div>
          <div className="flex items-baseline justify-between text-xs text-slate-500 mb-1.5">
            <span>
              {devDone} dari {devTasks.length} tasks selesai
            </span>
            <span className="font-extrabold text-blue-700">{devProgressPct}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${devProgressPct}%` }}
            />
          </div>
        </div>

        {/* Marketing Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Megaphone className="w-4 h-4 text-purple-600" /> Progress Divisi Marketing
            </span>
            <button
              onClick={() => setCurrentView('bookqu-marketing')}
              className="text-xs font-bold text-purple-600 hover:underline"
            >
              Buka Pipeline →
            </button>
          </div>
          <div className="flex items-baseline justify-between text-xs text-slate-500 mb-1.5">
            <span>
              {mktPublished} dari {mktTasks.length} konten dipublikasikan
            </span>
            <span className="font-extrabold text-purple-700">{mktProgressPct}%</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-purple-600 h-full rounded-full transition-all"
              style={{ width: `${mktProgressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Personal Tasks & Approval Queue) | Right (Publish Schedule & Bills) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Approval Queue */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Antrean Approval Pekerjaan Tim ({pendingApprovals.length})
              </h3>
              <span className="text-[11px] text-slate-400">Memerlukan persetujuan Owner</span>
            </div>

            <div className="space-y-2.5">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Semua pekerjaan telah selesai disetujui.
                </div>
              ) : (
                pendingApprovals.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      if (task.division === 'marketing') openModal('content_detail', task);
                      else openModal('task_detail', task);
                    }}
                    className="p-3 bg-amber-50/40 hover:bg-amber-50 rounded-xl border border-amber-200/80 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] font-bold text-slate-500">
                          {task.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-indigo-50 text-indigo-700 capitalize">
                          {task.division}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{task.title}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {task.taskType || task.contentType} • Status: {task.status}
                      </span>
                    </div>

                    <button className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-2xs shrink-0">
                      Review & Approve
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Personal Tasks & To-Do List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                Personal Tasks & To-Do List (Owner)
              </h3>
              <button
                onClick={() => setCurrentView('personal-tasks')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Lihat Semua ({personalTasks.length})
              </button>
            </div>

            <div className="space-y-2">
              {personalTasksToday.slice(0, 5).map((task) => (
                <div
                  key={task.id}
                  onClick={() => openModal('personal_task_form', task)}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{task.title}</h4>
                      <span className="text-[10px] text-slate-400">{task.category}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      task.status === 'Done'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right (1 Column): Upcoming Publish & Upcoming Bills */}
        <div className="space-y-6">
          {/* Upcoming Publishing Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Jadwal Publikasi Sosmed
              </h3>
              <button
                onClick={() => setCurrentView('bookqu-marketing')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800"
              >
                Pipeline
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {upcomingPublish.length === 0 ? (
                <p className="text-slate-400 py-3 text-center">Belum ada jadwal posting terdekat.</p>
              ) : (
                upcomingPublish.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => openModal('content_detail', p)}
                    className="p-3 bg-purple-50/40 hover:bg-purple-50 rounded-xl border border-purple-100 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-purple-800">{p.platform}</span>
                      <span className="font-mono text-[10px] text-purple-600 font-bold">
                        {p.publishDate}
                      </span>
                    </div>
                    <p className="font-bold text-slate-900 line-clamp-1">{p.title}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Bills */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-rose-600" />
                Tagihan Mendatang
              </h3>
              <button
                onClick={() => setCurrentView('finance-obligations')}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800"
              >
                Lihat Tagihan
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {unpaidBills.map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-800">{b.name}</h4>
                    <span className="text-[10px] text-slate-400">Tempo: {b.dueDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 block">
                      Rp {b.amount.toLocaleString('id-ID')}
                    </span>
                    <button
                      onClick={() => openModal('bill_pay_modal', b)}
                      className="text-[10px] text-emerald-600 font-bold hover:underline"
                    >
                      Bayar Sekarang
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
