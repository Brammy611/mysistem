import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { RequirementService, TaskService } from '../../services/supabaseService';
import {
  FileCode,
  Plus,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  Layers,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export const RequirementsView = () => {
  const { currentUser, allUsers } = useAuth();
  const { refreshData, addToast, openModal, searchQuery, refreshTrigger } = useApp();

  const [expandedReqId, setExpandedReqId] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [reqs, allTasks] = await Promise.all([
          RequirementService.getAll(),
          TaskService.getAll(currentUser),
        ]);
        setRequirements(reqs);
        setTasks(allTasks);
      } catch (err) {
        addToast('Gagal memuat requirement: ' + err.message, 'error');
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  const filteredReqs = requirements.filter((req) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      req.title.toLowerCase().includes(q) ||
      (req.description || '').toLowerCase().includes(q) ||
      req.id.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (reqId) => {
    if (window.confirm(`Yakin ingin menghapus requirement ${reqId}?`)) {
      try {
        await RequirementService.delete(reqId);
        addToast(`Requirement ${reqId} berhasil dihapus.`, 'success');
        refreshData();
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Approved':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <FileCode className="w-5 h-5 text-blue-600" />
            Developer Requirements & Technical Specs
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pusat spesifikasi fungsional, acceptance criteria, dan pelacakan task implementasi fitur BookQu.
          </p>
        </div>

        <button
          onClick={() => openModal('req_form')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Requirement Baru</span>
        </button>
      </div>

      {/* Requirements List */}
      <div className="space-y-4">
        {filteredReqs.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400">
            <FileCode className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">Belum ada requirement yang sesuai.</p>
          </div>
        ) : (
          filteredReqs.map((req) => {
            const isExpanded = expandedReqId === req.id;
            const pic = allUsers.find((u) => u.id === req.picId);
            const linkedTasks = tasks.filter((t) => t.requirementId === req.id);
            const doneTasks = linkedTasks.filter((t) => t.status === 'Done');
            const progressPct =
              linkedTasks.length > 0
                ? Math.round((doneTasks.length / linkedTasks.length) * 100)
                : 0;

            return (
              <div
                key={req.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all"
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedReqId(isExpanded ? null : req.id)}
                  className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <button className="text-slate-400 p-0.5 mt-0.5 sm:mt-0">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {req.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(
                            req.status
                          )}`}
                        >
                          {req.status}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          {req.priority} Priority
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                        {req.title}
                      </h3>
                    </div>
                  </div>

                  {/* Progress & PIC */}
                  <div className="hidden md:flex items-center gap-6 text-xs text-right">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {doneTasks.length}/{linkedTasks.length} Tasks Selesai
                      </div>
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">Lead PIC:</span>
                      <span className="font-semibold text-slate-700">
                        {pic?.name.split(' ')[0] || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 space-y-4 bg-slate-50/40">
                    {/* User Story Box */}
                    {req.userStory && (
                      <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 mb-1">
                          User Story
                        </h4>
                        <p className="text-xs text-indigo-950 italic font-medium leading-relaxed">
                          "{req.userStory}"
                        </p>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Deskripsi & Scope
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                        {req.description}
                      </p>
                    </div>

                    {/* Acceptance Criteria Checklist */}
                    {req.acceptanceCriteria && req.acceptanceCriteria.length > 0 && (
                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Acceptance Criteria (Kriteria Penerimaan)
                        </h4>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                          {req.acceptanceCriteria.map((crit, idx) => (
                            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{crit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linked Implementation Tasks */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5" /> Task Implementasi Terkait ({linkedTasks.length})
                        </h4>
                        <button
                          onClick={() =>
                            openModal('task_form', {
                              division: 'developer',
                              requirementId: req.id,
                              title: `Implementasi: ${req.title}`,
                            })
                          }
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah Task Implementasi
                        </button>
                      </div>

                      <div className="space-y-2">
                        {linkedTasks.length === 0 ? (
                          <div className="p-4 bg-white rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                            Belum ada task implementasi yang dihubungkan dengan requirement ini.
                          </div>
                        ) : (
                          linkedTasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => openModal('task_detail', task)}
                              className="bg-white p-3 rounded-xl border border-slate-200 hover:border-indigo-300 shadow-2xs flex items-center justify-between gap-3 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-[10px] font-bold text-slate-500">
                                  {task.id}
                                </span>
                                <span className="text-xs font-semibold text-slate-800 hover:text-indigo-600">
                                  {task.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                  {task.taskType}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    task.status === 'Done'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : task.status === 'In Review'
                                      ? 'bg-indigo-100 text-indigo-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {task.status}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-4 text-slate-500">
                        {req.targetDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" /> Target: {req.targetDate}
                          </span>
                        )}
                        {req.docsUrl && (
                          <a
                            href={req.docsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Dokumentasi
                          </a>
                        )}
                        {req.designUrl && (
                          <a
                            href={req.designUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-purple-600 hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Desain Figma
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal('req_form', req)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Spec
                        </button>
                        <button
                          onClick={() => handleDelete(req.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
