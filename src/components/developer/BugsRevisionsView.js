import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TaskService } from '../../services/supabaseService';
import { Bug, Plus } from 'lucide-react';

export const BugsRevisionsView = () => {
  const { currentUser } = useAuth();
  const { openModal, searchQuery, refreshTrigger, addToast } = useApp();

  const [devTasks, setDevTasks] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const tasks = await TaskService.getAll(currentUser);
        setDevTasks(tasks.filter((t) => t.division === 'developer' && ['Bug Fix', 'Revision', 'Refactoring', 'Technical Debt'].includes(t.taskType)));
      } catch (err) {
        addToast('Gagal memuat tugas: ' + err.message, 'error');
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  const filtered = devTasks.filter((t) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description || '').toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-600" />
            Bugs, Revisions & Technical Debt
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pelacakan khusus isu stabilitas sistem, bug fixes, dan perbaikan teknis BookQu.
          </p>
        </div>

        <button
          onClick={() =>
            openModal('task_form', {
              division: 'developer',
              taskType: 'Bug Fix',
              priority: 'Critical',
            })
          }
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Laporkan Bug / Revisi Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <Bug className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">Tidak ada bug atau revisi aktif.</p>
          </div>
        ) : (
          filtered.map((task) => {
            return (
              <div
                key={task.id}
                onClick={() => openModal('task_detail', task)}
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      {task.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : task.priority === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1.5 line-clamp-2">
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                    {task.description || 'Tidak ada deskripsi rinci.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {task.taskType}
                  </span>
                  <span
                    className={`font-semibold text-[11px] ${
                      task.status === 'Done'
                        ? 'text-emerald-600'
                        : task.status === 'In Review'
                        ? 'text-indigo-600'
                        : 'text-slate-600'
                    }`}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
