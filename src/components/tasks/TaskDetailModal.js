import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TaskService } from '../../services/supabaseService';
import {
  X,
  Calendar,
  User,
  Clock,
  Tag,
  GitPullRequest,
  CheckCircle,
  AlertTriangle,
  FileCode,
  Edit2,
  Trash2,
  Send,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';

export const TaskDetailModal = () => {
  const { modalState, closeModal, openModal, refreshData, addToast } = useApp();
  const { currentUser, isOwner, requirePermission } = useAuth();

  const isOpen = modalState.type === 'task_detail';
  const task = modalState.data;

  if (!isOpen || !task) return null;

  const assignee = task?.assignee || null;
  const creator = task?.creator || null;

  const isOverdue =
    task.dueDate &&
    task.dueDate < new Date().toISOString().split('T')[0] &&
    task.status !== 'Done';

  const handleStatusChange = async (newStatus) => {
    try {
      if (newStatus === 'Done' && !isOwner) {
        requirePermission('final_approve', 'developer_tasks', task);
        return;
      }
      await TaskService.updateStatus(task.id, newStatus, currentUser);
      addToast(`Status diubah menjadi "${newStatus}"`, 'success');
      refreshData();
      closeModal();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Yakin ingin menghapus task ${task.id}?`)) {
      try {
        await TaskService.delete(task.id, currentUser);
        addToast(`Task ${task.id} berhasil dihapus.`, 'success');
        refreshData();
        closeModal();
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'Done':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'In Review':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase px-2 py-0.5 bg-white rounded border border-slate-200">
                {task.id}
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                  task.priority
                )}`}
              >
                {task.priority} Priority
              </span>
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadge(
                  task.status
                )}`}
              >
                {task.status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{task.title}</h2>
          </div>

          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overdue Warning */}
        {isOverdue && (
          <div className="px-6 py-2 bg-rose-50 border-b border-rose-200 flex items-center gap-2 text-rose-700 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Task ini sudah melewati tenggat waktu ({task.dueDate})! Segera tindak lanjuti.</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Deskripsi Pekerjaan
            </h4>
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              {task.description || 'Tidak ada deskripsi detail.'}
            </p>
          </div>

          {/* Grid Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> PIC Utama:
                </span>
                <span className="font-semibold text-slate-800">{assignee?.name || 'Belum ditugaskan'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Dibuat oleh:
                </span>
                <span className="font-medium text-slate-700">{creator?.name || 'System'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Divisi:</span>
                <span className="font-semibold text-slate-800 capitalize">{task.division}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Task Type:</span>
                <span className="font-medium text-slate-700">{task.taskType}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Start Date:
                </span>
                <span className="font-medium text-slate-700">{task.startDate || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" /> Deadline:
                </span>
                <span className={`font-semibold ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}`}>
                  {task.dueDate || 'Tidak ada'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Terakhir Update:</span>
                <span className="text-slate-600">
                  {task.updatedAt ? new Date(task.updatedAt).toLocaleDateString('id-ID') : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Developer Deliverables (PR & Test Proof) */}
          {task.division === 'developer' && (
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2.5">
              <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" /> Developer Deliverables & QA
              </h4>

              {task.requirementId && (
                <div className="text-xs text-blue-800 bg-white p-2 rounded-lg border border-blue-200 flex items-center justify-between">
                  <span>Terkait Requirement: <strong>{task.requirementId}</strong></span>
                  <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded text-blue-700">Linked Spec</span>
                </div>
              )}

              {task.prUrl ? (
                <div className="flex items-center gap-2 text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                  <GitPullRequest className="w-4 h-4 text-purple-600 shrink-0" />
                  <a
                    href={task.prUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline truncate flex-1 font-mono"
                  >
                    {task.prUrl}
                  </a>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada pull request yang dilampirkan.</p>
              )}

              {task.testProof && (
                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                  <span className="font-semibold text-slate-800 block mb-0.5">Bukti Pengujian:</span>
                  <p className="text-slate-600 font-mono text-[11px]">{task.testProof}</p>
                </div>
              )}
            </div>
          )}

          {/* Labels */}
          {task.labels && task.labels.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Labels
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {task.labels.map((lbl, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded-md border border-slate-200"
                  >
                    #{lbl}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer / Workflow Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeModal();
                openModal('task_form', task);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              Edit Task
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg shadow-2xs transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus
            </button>
          </div>

          {/* Workflow Status Actions */}
          <div className="flex items-center gap-2">
            {task.status === 'To Do' && (
              <button
                onClick={() => handleStatusChange('In Progress')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Mulai Kerjakan (In Progress)
              </button>
            )}

            {task.status === 'In Progress' && (
              <button
                onClick={() => handleStatusChange('In Review')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Kirim untuk Review (In Review)
              </button>
            )}

            {task.status === 'In Review' && (
              <>
                {isOwner ? (
                  <>
                    <button
                      onClick={() => handleStatusChange('In Progress')}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Minta Revisi
                    </button>
                    <button
                      onClick={() => handleStatusChange('Done')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve & Selesai (Done)
                    </button>
                  </>
                ) : (
                  <div className="text-xs text-indigo-700 font-medium bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                    Menunggu Approval Final oleh Owner
                  </div>
                )}
              </>
            )}

            {task.status === 'Done' && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Selesai & Disetujui
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
