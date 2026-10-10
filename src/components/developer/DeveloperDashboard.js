import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TaskService, RequirementService, ActivityService } from '../../services/supabaseService';
import {
  Code2,
  AlertTriangle,
  FileCode,
  Send,
  Calendar,
  Activity,
  ArrowRight,
  GitPullRequest,
  Plus,
} from 'lucide-react';

export const DeveloperDashboard = () => {
  const { currentUser } = useAuth();
  const { setCurrentView, openModal, refreshTrigger } = useApp();

  const [allDevTasks, setAllDevTasks] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [tasks, reqs, logs] = await Promise.all([
          TaskService.getAll(currentUser),
          RequirementService.getAll(),
          ActivityService.getAll(currentUser),
        ]);
        setAllDevTasks(tasks.filter((t) => t.division === 'developer'));
        setRequirements(reqs);
        setActivities(logs.slice(0, 6));
      } catch (err) {
        console.error('Dev dashboard load error:', err);
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  const myTasks = allDevTasks.filter((t) => t.assigneeId === currentUser.id);
  const inReviewTasks = allDevTasks.filter((t) => t.status === 'In Review');

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueTasks = allDevTasks.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'Done'
  );

  const upcomingDeadlines = allDevTasks
    .filter((t) => t.dueDate && t.status !== 'Done')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 5);

  const activeReqs = requirements.filter((r) => r.status !== 'Completed');

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-blue-100 text-xs font-semibold mb-2 backdrop-blur-xs">
              <Code2 className="w-3.5 h-3.5" /> BookQu Developer Workspace
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Halo, {currentUser.name}! 🚀
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 max-w-xl">
              Fokus sprint saat ini: Pembatalan booking & integrasi payment QRIS BookQu.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openModal('task_form', { division: 'developer' })}
              className="px-4 py-2 bg-white text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-50 shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Task Dev</span>
            </button>
            <button
              onClick={() => setCurrentView('dev-tasks')}
              className="px-4 py-2 bg-white/20 text-white font-semibold text-xs rounded-xl hover:bg-white/30 transition-all flex items-center gap-1.5 backdrop-blur-xs"
            >
              <span>Buka Kanban</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Tugas Saya (Assigned)</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{myTasks.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {myTasks.filter((t) => t.status === 'Done').length} selesai disetujui
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Menunggu Review</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-600">{inReviewTasks.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Siap untuk di-approve Owner</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Task Overdue</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold ${overdueTasks.length > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {overdueTasks.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Melebihi tenggat deadline</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Active Requirements</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <FileCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{activeReqs.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Spesifikasi fitur aktif</div>
        </div>
      </div>

      {/* Main Grid: Left (Upcoming Deadlines & In Review) | Right (Active Requirements & Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Tenggat Waktu Terdekat (Upcoming Deadlines)
              </h3>
              <button
                onClick={() => setCurrentView('dev-calendar')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Lihat Kalender
              </button>
            </div>

            <div className="space-y-2.5">
              {upcomingDeadlines.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Tidak ada deadline mendatang.</p>
              ) : (
                upcomingDeadlines.map((task) => {
                  const isPast = task.dueDate < todayStr;
                  return (
                    <div
                      key={task.id}
                      onClick={() => openModal('task_detail', task)}
                      className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] font-bold text-slate-500">
                          {task.id}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 hover:text-blue-700">
                            {task.title}
                          </p>
                          <span className="text-[10px] text-slate-500">{task.taskType}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-bold block ${
                            isPast ? 'text-rose-600' : 'text-slate-700'
                          }`}
                        >
                          {task.dueDate}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">{task.status}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Tasks in Review */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                Task Dalam Proses Review ({inReviewTasks.length})
              </h3>
              <button
                onClick={() => setCurrentView('dev-tasks')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Semua Task
              </button>
            </div>

            <div className="space-y-2.5">
              {inReviewTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Tidak ada task yang sedang menunggu review.
                </div>
              ) : (
                inReviewTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => openModal('task_detail', task)}
                    className="p-3 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-[10px] font-bold text-indigo-700">
                          {task.id}
                        </span>
                        <span className="text-xs font-bold text-slate-800">{task.title}</span>
                      </div>
                      {task.prUrl && (
                        <span className="text-[10px] text-indigo-600 flex items-center gap-1 font-mono">
                          <GitPullRequest className="w-3 h-3" /> PR terlampir
                        </span>
                      )}
                    </div>

                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-full">
                      Menunggu Owner
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right (1 column) */}
        <div className="space-y-6">
          {/* Active Requirements Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-600" />
                Active Requirements
              </h3>
              <button
                onClick={() => setCurrentView('dev-requirements')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Detail
              </button>
            </div>

            <div className="space-y-3">
              {activeReqs.map((req) => (
                <div
                  key={req.id}
                  onClick={() => setCurrentView('dev-requirements')}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/80 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      {req.id}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      Target: {req.targetDate || '-'}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{req.title}</h4>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-600" />
              Aktivitas Terkini
            </h3>

            <div className="space-y-3 text-xs">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-slate-800 font-medium">
                      <strong>{act.userName}</strong>: {act.details}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {new Date(act.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
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
