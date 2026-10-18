import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TaskService } from '../../services/supabaseService';
import {
  Plus,
  Filter,
  AlertTriangle,
} from 'lucide-react';

export const ContentBoardView = () => {
  const { currentUser, allUsers, isOwner, requirePermission } = useAuth();
  const { refreshData, addToast, openModal, searchQuery, refreshTrigger } = useApp();

  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [mktTasks, setMktTasks] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const tasks = await TaskService.getAll(currentUser);
        setMktTasks(tasks.filter((t) => t.division === 'marketing'));
      } catch (err) {
        addToast('Gagal memuat konten: ' + err.message, 'error');
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  const todayStr = new Date().toISOString().split('T')[0];

  const stages = [
    { id: 'Planning', label: 'Planning', color: 'bg-slate-100 text-slate-700' },
    { id: 'To Do', label: 'To Do', color: 'bg-blue-50 text-blue-700' },
    { id: 'In Progress', label: 'In Progress', color: 'bg-indigo-50 text-indigo-700' },
    { id: 'In Review', label: 'In Review', color: 'bg-amber-50 text-amber-700' },
    { id: 'Approved', label: 'Approved', color: 'bg-emerald-50 text-emerald-700' },
    { id: 'Scheduled', label: 'Scheduled', color: 'bg-purple-50 text-purple-700' },
    { id: 'Published', label: 'Published', color: 'bg-teal-50 text-teal-800' },
  ];

  const filteredTasks = mktTasks.filter((task) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        task.title.toLowerCase().includes(q) ||
        (task.campaign || '').toLowerCase().includes(q) ||
        (task.caption || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterPlatform && task.platform !== filterPlatform) return false;
    if (filterAssignee && task.assigneeId !== filterAssignee) return false;
    return true;
  });

  const handleMoveStage = async (task, targetStage) => {
    try {
      if (targetStage === 'Approved' && !isOwner) {
        requirePermission('final_approve', 'marketing_content', task);
        return;
      }

      await TaskService.save(
        {
          ...task,
          productionStatus: targetStage,
          approvalStatus:
            targetStage === 'Approved'
              ? 'Approved'
              : targetStage === 'In Review'
              ? 'Pending Approval'
              : task.approvalStatus,
          status: targetStage === 'Published' ? 'Done' : task.status,
        },
        currentUser
      );

      addToast(`Konten dipindahkan ke stage ${targetStage}`, 'success');
      refreshData();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, stageId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    const task = mktTasks.find((t) => t.id === taskId);
    if (!task) return;
    handleMoveStage(task, stageId);
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Platform:</span>
          </div>

          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">Semua Platform</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
            <option value="LinkedIn">LinkedIn</option>
          </select>

          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">Semua PIC</option>
            {allUsers
              .filter((u) => u.role === 'owner' || u.division === 'marketing')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email || 'User'}
                </option>
              ))}
          </select>

          {(filterPlatform || filterAssignee) && (
            <button
              onClick={() => {
                setFilterPlatform('');
                setFilterAssignee('');
              }}
              className="text-xs text-purple-600 hover:text-purple-800 font-semibold underline px-1"
            >
              Reset
            </button>
          )}
        </div>

        <button
          onClick={() => openModal('content_form')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Buat Konten Baru</span>
        </button>
      </div>

      {/* Production Pipeline Board (Scrollable horizontal) */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-[1300px] items-start">
          {stages.map((stage) => {
            const stageTasks = filteredTasks.filter(
              (t) => (t.productionStatus || 'Planning') === stage.id
            );

            return (
              <div
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="w-72 bg-slate-50/80 rounded-2xl border border-slate-200/90 p-3 min-h-[480px] flex flex-col shrink-0"
              >
                <div className="flex items-center justify-between pb-2.5 px-1 border-b border-slate-200/60 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${stage.color}`}>
                      {stage.label}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {stageTasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      openModal('content_form', { productionStatus: stage.id })
                    }
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200/60"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto">
                  {stageTasks.length === 0 ? (
                    <div className="h-28 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400">
                      Tarik konten ke sini
                    </div>
                  ) : (
                    stageTasks.map((task) => {
                      const assignee = allUsers.find((u) => u.id === task.assigneeId);
                      const isOverdue =
                        task.productionDeadline &&
                        task.productionDeadline < todayStr &&
                        task.productionStatus !== 'Published';

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onClick={() => openModal('content_detail', task)}
                          className={`bg-white p-3 rounded-xl border shadow-2xs hover:shadow-md transition-all cursor-pointer ${
                            isOverdue
                              ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/20'
                              : 'border-slate-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                              {task.platform || 'Sosmed'}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-500">
                              {task.contentType || 'Post'}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 line-clamp-2 mb-1.5 hover:text-purple-700">
                            {task.title}
                          </h4>

                          {task.campaign && (
                            <span className="inline-block text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mb-2">
                              {task.campaign}
                            </span>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-slate-700 truncate max-w-[90px]">
                              {assignee?.name ? assignee.name.split(' ')[0] : assignee?.email ? assignee.email.split('@')[0] : '-'}
                            </span>

                            {task.productionDeadline && (
                              <div
                                className={`flex items-center gap-1 ${
                                  isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'
                                }`}
                              >
                                {isOverdue && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                                <span>{task.productionDeadline}</span>
                              </div>
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
    </div>
  );
};
