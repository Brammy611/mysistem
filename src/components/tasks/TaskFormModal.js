import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { TaskService, RequirementService } from '../../services/supabaseService';
import { X, Check, AlertCircle } from 'lucide-react';

export const TaskFormModal = () => {
  const { modalState, closeModal, refreshData, addToast } = useApp();
  const { currentUser, isOwner, requirePermission, allUsers } = useAuth();

  const isOpen = modalState.type === 'task_form';

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    division: 'developer',
    taskType: 'Feature Implementation',
    assigneeId: '',
    collaboratorIds: [],
    priority: 'Medium',
    status: 'To Do',
    startDate: '',
    dueDate: '',
    labels: '',
    prUrl: '',
    testProof: '',
    requirementId: '',
  });

  const [requirements, setRequirements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const data = modalState.data || {};
      const isMkt = data.division === 'marketing';
      setFormData({
        id: data.id || '',
        title: data.title || '',
        description: data.description || '',
        division: data.division || (isMkt ? 'marketing' : 'developer'),
        taskType: data.taskType || (isMkt ? 'Content' : 'Feature Implementation'),
        assigneeId: data.assigneeId || currentUser.id,
        collaboratorIds: data.collaboratorIds || [],
        priority: data.priority || 'Medium',
        status: data.status || 'To Do',
        startDate: data.startDate || new Date().toISOString().split('T')[0],
        dueDate: data.dueDate || '',
        labels: Array.isArray(data.labels) ? data.labels.join(', ') : '',
        prUrl: data.prUrl || '',
        testProof: data.testProof || '',
        requirementId: data.requirementId || '',
      });

      const fetchReqs = async () => {
        try {
          if (isOwner || currentUser.role === 'developer') {
            const reqs = await RequirementService.getAll();
            setRequirements(reqs);
          }
        } catch (e) {
          // Not permitted or empty
        }
      };
      fetchReqs();
      setError('');
    }
  }, [isOpen, modalState.data, currentUser, isOwner]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Nama pekerjaan / Title wajib diisi.');
      return;
    }

    try {
      const labelsArray = formData.labels
        .split(',')
        .map((l) => l.trim().toLowerCase())
        .filter(Boolean);

      await TaskService.save(
        {
          ...formData,
          labels: labelsArray,
        },
        currentUser
      );

      addToast(
        formData.id ? 'Task berhasil diperbarui!' : 'Task baru berhasil dibuat!',
        'success'
      );
      refreshData();
      closeModal();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan task.');
    }
  };

  // Filter assignees according to division
  const filteredUsers = allUsers.filter((u) => {
    if (u.role === 'owner') return true;
    return u.division === formData.division;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {formData.id ? `Edit Task (${formData.id})` : 'Buat Task Baru BookQu'}
            </h3>
            <p className="text-xs text-slate-500">
              Isi parameter pekerjaan sesuai standar operasional BookQu.
            </p>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Judul Pekerjaan (Title) *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Implementasi validasi booking cancel..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Divisi *</label>
              <select
                value={formData.division}
                onChange={(e) => {
                  const div = e.target.value;
                  setFormData({
                    ...formData,
                    division: div,
                    taskType: div === 'marketing' ? 'Content' : 'Feature Implementation',
                  });
                }}
                disabled={!isOwner && currentUser.division !== formData.division}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="developer">Developer Workspace</option>
                <option value="marketing">Marketing Workspace</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Task Type *</label>
              {formData.division === 'developer' ? (
                <select
                  value={formData.taskType}
                  onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Feature Implementation">Feature Implementation</option>
                  <option value="Bug Fix">Bug Fix</option>
                  <option value="Revision">Revision</option>
                  <option value="Refactoring">Refactoring</option>
                  <option value="Technical Debt">Technical Debt</option>
                  <option value="Testing">Testing</option>
                </select>
              ) : (
                <select
                  value={formData.taskType}
                  onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Content">Content Creation</option>
                  <option value="Campaign">Marketing Campaign</option>
                  <option value="Social Media">Social Media Post</option>
                  <option value="Graphic Design">Graphic Design Asset</option>
                </select>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Pekerjaan</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan kebutuhan, ruang lingkup, dan konteks pengerjaan..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PIC Utama (Assignee) *
              </label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prioritas *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="In Review">In Review</option>
                {isOwner && <option value="Done">Done (Owner Approval)</option>}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Due Date (Deadline)</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Developer Specific fields */}
          {formData.division === 'developer' && (
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
              <span className="text-xs font-bold text-blue-900 block">
                Developer Specification & Deliverables
              </span>

              {requirements.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Hubungkan dengan Requirement (Fitur Induk)
                  </label>
                  <select
                    value={formData.requirementId}
                    onChange={(e) => setFormData({ ...formData, requirementId: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Tidak Terhubung ke Requirement --</option>
                    {requirements.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.id}: {r.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pull Request Link (GitHub)
                  </label>
                  <input
                    type="url"
                    value={formData.prUrl}
                    onChange={(e) => setFormData({ ...formData, prUrl: e.target.value })}
                    placeholder="https://github.com/..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Bukti Pengujian / Test Result
                  </label>
                  <input
                    type="text"
                    value={formData.testProof}
                    onChange={(e) => setFormData({ ...formData, testProof: e.target.value })}
                    placeholder="Contoh: Unit test passed 12/12..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Labels / Tags (Pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={formData.labels}
              onChange={(e) => setFormData({ ...formData, labels: e.target.value })}
              placeholder="backend, api, bug, hotfix..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              {formData.id ? 'Simpan Perubahan' : 'Buat Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
