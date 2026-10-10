import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { PersonalTaskService } from '../../services/supabaseService';
import {
  CheckSquare,
  Plus,
  List,
  Kanban,
  Inbox,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  Share2,
} from 'lucide-react';

export const PersonalTasksView = () => {
  const { currentUser } = useAuth();
  const { openModal, refreshData, addToast, searchQuery, refreshTrigger } = useApp();

  const [viewMode, setViewMode] = useState('list');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await PersonalTaskService.getAll(currentUser.id);
        setTasks(data);
      } catch (err) {
        addToast('Gagal memuat task: ' + err.message, 'error');
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  const filteredTasks = tasks.filter((t) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (viewMode === 'inbox' && t.dueDate) return false; // inbox is for undated
    return true;
  });

  const handleToggleDone = async (task) => {
    const nextStatus = task.status === 'Done' ? 'To Do' : 'Done';
    try {
      await PersonalTaskService.save({ ...task, status: nextStatus }, currentUser.id);
      addToast(
        nextStatus === 'Done' ? 'Task selesai! 🎉' : 'Task dikembalikan ke To Do.',
        'info'
      );
      refreshData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Hapus task pribadi ini?')) {
      try {
        await PersonalTaskService.delete(taskId);
        addToast('Task berhasil dihapus.', 'success');
        refreshData();
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  const handlePromoteToTeam = (task) => {
    if (
      window.confirm(
        `Jadikan "${task.title}" sebagai BookQu Team Task untuk dikerjakan tim?`
      )
    ) {
      openModal('task_form', {
        title: task.title,
        description: task.description,
        division: 'developer',
        priority: task.priority,
        dueDate: task.dueDate,
      });
    }
  };

  const columns = ['To Do', 'In Progress', 'Done'];

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            Personal To-Do List & Agenda (Owner Only)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pengelolaan to-do list pribadi, akademik, karir, dan inisiatif BookQu tanpa tercampur dengan backlog tim.
          </p>
        </div>

        <button
          onClick={() => openModal('personal_task_form')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Personal Task</span>
        </button>
      </div>

      {/* View Switcher & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* View Modes */}
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('inbox')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                viewMode === 'inbox'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Inbox (Tanpa Deadline)</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2.5">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">Semua Kategori</option>
            <option value="Personal">Personal</option>
            <option value="Academic">Academic</option>
            <option value="BookQu">BookQu</option>
            <option value="Career">Career</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">Semua Prioritas</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {(filterCategory || filterPriority) && (
            <button
              onClick={() => {
                setFilterCategory('');
                setFilterPriority('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: LIST VIEW */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredTasks.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Tidak ada personal task yang cocok dengan filter.
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isDone = task.status === 'Done';
                return (
                  <div
                    key={task.id}
                    className={`p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors ${
                      isDone ? 'bg-slate-50/40 opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => handleToggleDone(task)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-indigo-600'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-bold ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-800'
                            }`}
                          >
                            {task.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 text-slate-600">
                            {task.category}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              task.priority === 'Critical'
                                ? 'bg-rose-100 text-rose-700'
                                : task.priority === 'High'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {task.dueDate ? (
                        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {task.dueDate}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          Inbox
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePromoteToTeam(task)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                          title="Tugaskan ke Tim BookQu"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openModal('personal_task_form', task)}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col);
            return (
              <div
                key={col}
                className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-3 min-h-[400px] flex flex-col"
              >
                <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 mb-3">
                  <span className="text-xs font-bold text-slate-800">{col}</span>
                  <span className="text-xs font-bold text-slate-400">{colTasks.length}</span>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {task.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">{task.priority}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{task.title}</h4>
                      {task.dueDate && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{task.dueDate}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: INBOX VIEW */}
      {viewMode === 'inbox' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Inbox className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Inbox Task (Tugas Belum Terjadwal)
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Tampungan ide dan rencana yang belum memiliki tenggat waktu tertentu. Berikan deadline untuk memunculkannya di kalender.
          </p>

          <div className="divide-y divide-slate-100 pt-3">
            {filteredTasks.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                Inbox kosong. Semua tugas sudah memiliki jadwal.
              </p>
            ) : (
              filteredTasks.map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{t.title}</h4>
                    <span className="text-[10px] text-slate-400">{t.category}</span>
                  </div>
                  <button
                    onClick={() => openModal('personal_task_form', t)}
                    className="text-xs font-semibold text-indigo-600 hover:underline"
                  >
                    Atur Deadline →
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
