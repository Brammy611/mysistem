import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TaskService } from '../../services/supabaseService';
import {
  Plus,
  Filter,
  Calendar,
  AlertTriangle,
  GitPullRequest,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

export const TaskBoard = ({ division = 'developer' }) => {
  const { currentUser, isOwner, requirePermission } = useAuth();
  const { refreshData, addToast, openModal, searchQuery, refreshTrigger } = useApp();

  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterLabel, setFilterLabel] = useState('');
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);
  const [allTasks, setAllTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [tasks, { ProfileService }] = await Promise.all([
          TaskService.getAll(currentUser),
          import('../../services/supabaseService'),
        ]);
        const users = await ProfileService.getAll();
        setAllTasks(tasks.filter((t) => t.division === division));
        setAllUsers(users);
      } catch (err) {
        addToast('Gagal memuat task: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) fetch();
  }, [currentUser, division, refreshTrigger]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering
  const filteredTasks = allTasks.filter((task) => {
    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      const matchId = task.id.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchId) return false;
    }

    if (filterAssignee && task.assigneeId !== filterAssignee) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    if (filterLabel && (!task.labels || !task.labels.includes(filterLabel))) return false;
    if (filterOverdueOnly) {
      const isOverdue = task.dueDate && task.dueDate < todayStr && task.status !== 'Done';
      if (!isOverdue) return false;
    }

    return true;
  });

  const columns = [
    { id: 'To Do', title: 'To Do', color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { id: 'In Progress', title: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { id: 'In Review', title: 'In Review', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    { id: 'Done', title: 'Done', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  // Move task to adjacent column
  const handleMoveColumn = async (task, targetStatus) => {
    try {
      if (targetStatus === 'Done' && !isOwner) {
        requirePermission('final_approve', `${division}_tasks`, task);
        return;
      }
      await TaskService.updateStatus(task.id, targetStatus, currentUser);
      addToast(`Task ${task.id} dipindahkan ke ${targetStatus}`, 'success');
      refreshData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = allTasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    handleMoveColumn(task, targetStatus);
  };

  // Get distinct labels for filter
  const allLabels = Array.from(
    new Set(allTasks.flatMap((t) => t.labels || []))
  );

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>

          {/* Assignee Filter */}
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Semua PIC</option>
            {allUsers
              .filter((u) => u.role === 'owner' || u.division === division)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email || 'User'}
                </option>
              ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Semua Prioritas</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Label Filter */}
          {allLabels.length > 0 && (
            <select
              value={filterLabel}
              onChange={(e) => setFilterLabel(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Semua Label</option>
              {allLabels.map((lbl) => (
                <option key={lbl} value={lbl}>
                  #{lbl}
                </option>
              ))}
            </select>
          )}

          {/* Overdue Only toggle */}
          <button
            onClick={() => setFilterOverdueOnly(!filterOverdueOnly)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all flex items-center gap-1 border ${
              filterOverdueOnly
                ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-rose-500" />
            <span>Hanya Overdue</span>
          </button>

          {(filterAssignee || filterPriority || filterLabel || filterOverdueOnly) && (
            <button
              onClick={() => {
                setFilterAssignee('');
                setFilterPriority('');
                setFilterLabel('');
                setFilterOverdueOnly(false);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline px-1"
            >
              Reset
            </button>
          )}
        </div>

        {/* Add Task Button */}
        <button
          onClick={() => openModal('task_form', { division })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Task</span>
        </button>
      </div>

      {/* Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {columns.map((col, colIdx) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-slate-50/80 rounded-2xl border border-slate-200/90 p-3 min-h-[500px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200/60 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${col.color}`}>
                    {col.title}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => openModal('task_form', { division, status: col.id })}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60"
                  title={`Tambah Task di ${col.title}`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Task Cards */}
              <div className="flex-1 space-y-2.5 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    Drag task ke sini
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const assignee = allUsers.find((u) => u.id === task.assigneeId);
                    const isOverdue =
                      task.dueDate && task.dueDate < todayStr && task.status !== 'Done';

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => openModal('task_detail', task)}
                        className={`group bg-white p-3.5 rounded-xl border shadow-2xs hover:shadow-md transition-all cursor-pointer relative ${
                          isOverdue
                            ? 'border-rose-300 ring-1 ring-rose-300 bg-rose-50/20'
                            : 'border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        {/* Card Top: ID & Priority */}
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                            {task.id}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              task.priority === 'Critical'
                                ? 'bg-rose-100 text-rose-700'
                                : task.priority === 'High'
                                ? 'bg-amber-100 text-amber-700'
                                : task.priority === 'Medium'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Card Title */}
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-indigo-600 transition-colors mb-2 leading-relaxed">
                          {task.title}
                        </h4>

                        {/* Task Type badge */}
                        <div className="mb-2.5">
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {task.taskType}
                          </span>
                        </div>

                        {/* PR / Test Proof indicators */}
                        {task.prUrl && (
                          <div className="flex items-center gap-1 text-[11px] text-purple-700 mb-2 font-mono">
                            <GitPullRequest className="w-3 h-3" />
                            <span>PR Linked</span>
                          </div>
                        )}

                        {/* Labels */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {task.labels.slice(0, 3).map((lbl, i) => (
                              <span
                                key={i}
                                className="text-[9px] font-medium text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100"
                              >
                                #{lbl}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Card Bottom: Assignee & Due Date */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          {/* Assignee Avatar & Name */}
                          <div className="flex items-center gap-1.5">
                            {assignee ? (
                              <>
                                <img
                                  src={assignee.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(assignee.name || assignee.email || 'User')}&background=random`}
                                  alt={assignee.name || 'User'}
                                  className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                                />
                                <span className="font-semibold text-slate-700 truncate max-w-[80px]">
                                  {assignee.name ? assignee.name.split(' ')[0] : assignee.email ? assignee.email.split('@')[0] : 'User'}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-400 italic">Unassigned</span>
                            )}
                          </div>

                          {/* Due Date with Overdue Indicator */}
                          {task.dueDate && (
                            <div
                              className={`flex items-center gap-1 font-medium ${
                                isOverdue
                                  ? 'text-rose-600 font-bold'
                                  : 'text-slate-500'
                              }`}
                            >
                              {isOverdue ? (
                                <AlertTriangle className="w-3 h-3 text-rose-500" />
                              ) : (
                                <Calendar className="w-3 h-3" />
                              )}
                              <span>{task.dueDate}</span>
                            </div>
                          )}
                        </div>

                        {/* Accessible Move Buttons (Arrow Navigation for keyboard/touch) */}
                        <div className="mt-2.5 pt-2 border-t border-dashed border-slate-100 flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity">
                          {colIdx > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveColumn(task, columns[colIdx - 1].id);
                              }}
                              className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-0.5"
                              title={`Pindah ke ${columns[colIdx - 1].title}`}
                            >
                              <ArrowLeft className="w-3 h-3" />
                              <span>{columns[colIdx - 1].title}</span>
                            </button>
                          ) : (
                            <div />
                          )}

                          {colIdx < columns.length - 1 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveColumn(task, columns[colIdx + 1].id);
                              }}
                              className="text-[10px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-0.5 ml-auto"
                              title={`Pindah ke ${columns[colIdx + 1].title}`}
                            >
                              <span>{columns[colIdx + 1].title}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          ) : (
                            <div />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
