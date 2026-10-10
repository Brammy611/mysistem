import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TaskService } from '../../services/supabaseService';
import {
  FileText,
  Plus,
  ExternalLink,
  Copy,
} from 'lucide-react';

export const ContentBriefsView = () => {
  const { currentUser, allUsers } = useAuth();
  const { openModal, searchQuery, addToast, refreshTrigger } = useApp();

  const [mktTasks, setMktTasks] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const tasks = await TaskService.getAll(currentUser);
        setMktTasks(tasks.filter((t) => t.division === 'marketing'));
      } catch (err) {
        addToast('Gagal memuat tugas marketing: ' + err.message, 'error');
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  const filtered = mktTasks.filter((task) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      (task.brief || '').toLowerCase().includes(q) ||
      (task.campaign || '').toLowerCase().includes(q) ||
      (task.caption || '').toLowerCase().includes(q)
    );
  });

  const handleCopyCaption = (caption) => {
    if (caption) {
      navigator.clipboard.writeText(caption);
      addToast('Caption berhasil disalin ke clipboard!', 'info');
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Content Briefs & Creative Assets
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kumpulan instruksi brief, draft caption, aset visual Canva/Figma, dan hashtag kampanye.
          </p>
        </div>

        <button
          onClick={() => openModal('content_form')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Brief Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">Belum ada content brief yang sesuai.</p>
          </div>
        ) : (
          filtered.map((task) => {
            const assignee = allUsers.find((u) => u.id === task.assigneeId);

            return (
              <div
                key={task.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:border-purple-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {task.platform}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {task.contentType}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.approvalStatus === 'Approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {task.approvalStatus || 'Draft'}
                    </span>
                  </div>

                  <h3
                    onClick={() => openModal('content_detail', task)}
                    className="text-sm font-bold text-slate-900 mb-2 hover:text-purple-600 cursor-pointer"
                  >
                    {task.title}
                  </h3>

                  {task.brief && (
                    <div className="mb-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Brief:
                      </span>
                      {task.brief}
                    </div>
                  )}

                  {task.caption && (
                    <div className="mb-3 p-3 bg-purple-50/40 rounded-xl text-xs font-mono text-slate-800 border border-purple-100 relative group">
                      <button
                        onClick={() => handleCopyCaption(task.caption)}
                        className="absolute top-2 right-2 p-1 bg-white hover:bg-slate-100 text-slate-500 rounded border border-slate-200 opacity-60 group-hover:opacity-100 transition-opacity"
                        title="Salin Caption"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block mb-0.5 font-sans">
                        Caption:
                      </span>
                      <p className="line-clamp-3 whitespace-pre-wrap">{task.caption}</p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">
                    PIC: {assignee?.name || '-'}
                  </span>

                  <div className="flex items-center gap-3">
                    {task.designUrl && (
                      <a
                        href={task.designUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-purple-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        Desain <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <button
                      onClick={() => openModal('content_detail', task)}
                      className="text-xs font-bold text-slate-700 hover:text-purple-600"
                    >
                      Detail →
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
