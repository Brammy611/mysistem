import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TaskService, ActivityService } from '../../services/supabaseService';
import {
  Megaphone,
  CheckCircle2,
  Clock,
  Calendar,
  Share2,
  ArrowRight,
  Plus,
  Activity,
  AlertTriangle,
} from 'lucide-react';

export const MarketingDashboard = () => {
  const { currentUser } = useAuth();
  const { setCurrentView, openModal, refreshTrigger } = useApp();

  const [allMktTasks, setAllMktTasks] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [tasks, logs] = await Promise.all([
          TaskService.getAll(currentUser),
          ActivityService.getAll(currentUser),
        ]);
        setAllMktTasks(tasks.filter((t) => t.division === 'marketing'));
        setActivities(logs.slice(0, 6));
      } catch (err) {
        console.error('Dashboard load error:', err);
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  const pendingApproval = allMktTasks.filter(
    (t) => t.approvalStatus === 'Pending Approval' || t.productionStatus === 'In Review'
  );

  const scheduledTasks = allMktTasks.filter(
    (t) => t.productionStatus === 'Scheduled' || (t.publishDate && t.productionStatus !== 'Published')
  );

  const publishedTasks = allMktTasks.filter(
    (t) => t.productionStatus === 'Published' || t.status === 'Done'
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const urgentTasks = allMktTasks.filter(
    (t) =>
      t.productionDeadline &&
      t.productionDeadline <= todayStr &&
      t.productionStatus !== 'Published'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-fuchsia-700 to-indigo-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-purple-100 text-xs font-semibold mb-2 backdrop-blur-xs">
              <Megaphone className="w-3.5 h-3.5" /> BookQu Growth & Marketing Hub
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Halo, {currentUser?.name || 'Marketer'}! ✨
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/90 mt-1 max-w-xl">
              Fokus kampanye bulan ini: BookQu October Healing & diskon membership akhir pekan.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => openModal('content_form')}
              className="px-4 py-2 bg-white text-purple-700 font-bold text-xs rounded-xl hover:bg-purple-50 shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Konten Baru</span>
            </button>
            <button
              onClick={() => setCurrentView('mkt-board')}
              className="px-4 py-2 bg-white/20 text-white font-semibold text-xs rounded-xl hover:bg-white/30 transition-all flex items-center gap-1.5 backdrop-blur-xs"
            >
              <span>Pipeline Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Perlu Segera Selesai</span>
            <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{urgentTasks.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Mendekati deadline produksi</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Menunggu Approval</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{pendingApproval.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Siap direview oleh Owner</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Jadwal Publish</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-600">{scheduledTasks.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Tersinkron di kalender</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Telah Dipublikasikan</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{publishedTasks.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Live di sosmed</div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Cols): Publishing Schedule & Waiting Approval */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Publish Schedule */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Jadwal Publikasi Mendatang (Publishing Schedule)
              </h3>
              <button
                onClick={() => setCurrentView('mkt-calendar')}
                className="text-xs font-semibold text-purple-600 hover:text-purple-800"
              >
                Lihat Kalender
              </button>
            </div>

            <div className="space-y-2.5">
              {scheduledTasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Belum ada jadwal posting konten dalam waktu dekat.
                </p>
              ) : (
                scheduledTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => openModal('content_detail', task)}
                    className="p-3 bg-purple-50/30 hover:bg-purple-50/70 rounded-xl border border-purple-100 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] font-bold text-purple-700 bg-white px-2 py-0.5 rounded border border-purple-200">
                        {task.platform}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-800 hover:text-purple-700">
                          {task.title}
                        </p>
                        <span className="text-[10px] text-slate-500">{task.campaign || task.contentType}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-purple-900 block font-mono">
                        {task.publishDate || 'Belum diatur'}
                      </span>
                      <span className="text-[10px] text-slate-500">{task.productionStatus}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Published Content showcase */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-600" />
              Konten yang Telah Dipublikasikan
            </h3>

            <div className="space-y-2.5">
              {publishedTasks.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">Belum ada konten published.</p>
              ) : (
                publishedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => openModal('content_detail', task)}
                    className="p-3 bg-emerald-50/30 hover:bg-emerald-50/70 rounded-xl border border-emerald-100 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{task.title}</p>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        {task.publishedUrl ? task.publishedUrl : 'Dipublikasikan'}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      Live
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right (1 Col): Pending Approval & Recent Marketing Activity */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Menunggu Approval ({pendingApproval.length})
            </h3>

            <div className="space-y-2.5">
              {pendingApproval.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Semua draft konten telah disetujui.
                </p>
              ) : (
                pendingApproval.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => openModal('content_detail', task)}
                    className="p-3 bg-amber-50/40 hover:bg-amber-50 rounded-xl border border-amber-200 cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded mb-1 inline-block">
                      {task.platform}
                    </span>
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{task.title}</h4>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Target: {task.productionDeadline || '-'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-600" />
              Aktivitas Marketing
            </h3>

            <div className="space-y-3 text-xs">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 pb-2.5 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
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
