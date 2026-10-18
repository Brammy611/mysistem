import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TaskService } from '../../services/supabaseService';
import {
  Users,
  AlertTriangle,
} from 'lucide-react';

export const TeamOverview = () => {
  const { allUsers, currentUser } = useAuth();
  const { openModal, refreshTrigger, addToast } = useApp();

  const [allTasks, setAllTasks] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const tasks = await TaskService.getAll(currentUser);
        setAllTasks(tasks);
      } catch (err) {
        addToast('Gagal memuat tugas: ' + err.message, 'error');
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  const todayStr = new Date().toISOString().split('T')[0];

  const devTasks = allTasks.filter((t) => t.division === 'developer');
  const mktTasks = allTasks.filter((t) => t.division === 'marketing');

  const pendingApprovals = allTasks.filter((t) => t.status === 'In Review');
  const overdueTasks = allTasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'Done'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            BookQu Team Performance & Workload Distribution
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Transparansi alur kerja tim, status pembagian tugas per anggota, dan hambatan operasional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
            Total Anggota Tim: <strong>{allUsers.length} Orang</strong>
          </span>
        </div>
      </div>

      {/* High-level status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Total Task Aktif
          </span>
          <div className="text-2xl font-extrabold text-slate-900">
            {allTasks.filter((t) => t.status !== 'Done').length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {allTasks.filter((t) => t.status === 'Done').length} task terselesaikan
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Menunggu Approval Owner
          </span>
          <div className="text-2xl font-extrabold text-indigo-600">
            {pendingApprovals.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Perlu review final</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Task Overdue (Lewat Deadline)
          </span>
          <div
            className={`text-2xl font-extrabold ${
              overdueTasks.length > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {overdueTasks.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Butuh tindak lanjut</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Distribusi Divisi
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Dev: {devTasks.length}
            </span>
            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Mkt: {mktTasks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Blockers & Decisions Needing Owner Attention */}
      {pendingApprovals.length > 0 && (
        <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-5">
          <h3 className="font-bold text-amber-900 text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Daftar Hambatan & Task yang Memerlukan Keputusan Owner
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingApprovals.map((task) => (
              <div
                key={task.id}
                onClick={() => openModal('task_detail', task)}
                className="bg-white p-3.5 rounded-xl border border-amber-200/90 shadow-2xs flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      {task.id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                      {task.division}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg shrink-0">
                  Perlu Approval →
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Member Workload Cards */}
      <div>
        <h3 className="font-bold text-slate-900 text-sm mb-4">
          Distribusi Pekerjaan per Anggota Tim
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allUsers.map((user) => {
            const userTasks = allTasks.filter((t) => t.assigneeId === user.id);
            const activeUserTasks = userTasks.filter((t) => t.status !== 'Done');
            const completedUserTasks = userTasks.filter((t) => t.status === 'Done');

            return (
              <div
                key={user.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || user.email || 'User')}&background=random`}
                      alt={user.name || 'User'}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-100"
                    />
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{user.name || user.email || 'User'}</h4>
                      <p className="text-xs text-slate-500">{user.title}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full capitalize bg-slate-100 text-slate-700">
                        {user.role} ({user.division})
                      </span>
                    </div>
                  </div>

                  {/* Task counts */}
                  <div className="grid grid-cols-2 gap-2 text-center p-3 bg-slate-50 rounded-xl text-xs mb-3">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Task Aktif</span>
                      <span className="font-extrabold text-slate-900 text-base">
                        {activeUserTasks.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Selesai</span>
                      <span className="font-extrabold text-emerald-600 text-base">
                        {completedUserTasks.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active tasks preview */}
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Task Berjalan:
                  </span>
                  {activeUserTasks.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">Tidak ada task aktif saat ini.</p>
                  ) : (
                    activeUserTasks.slice(0, 3).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => openModal('task_detail', t)}
                        className="text-xs text-slate-700 hover:text-indigo-600 truncate cursor-pointer flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
