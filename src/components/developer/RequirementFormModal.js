import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { RequirementService } from '../../services/supabaseService';
import { X, Check, Plus, Trash2, AlertCircle } from 'lucide-react';

export const RequirementFormModal = () => {
  const { modalState, closeModal, refreshData, addToast } = useApp();
  const { currentUser, allUsers, requirePermission } = useAuth();

  const isOpen = modalState.type === 'req_form';

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    userStory: '',
    acceptanceCriteria: [''],
    priority: 'High',
    status: 'In Progress',
    picId: '',
    targetDate: '',
    docsUrl: '',
    designUrl: '',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const data = modalState.data || {};
      setFormData({
        id: data.id || '',
        title: data.title || '',
        description: data.description || '',
        userStory: data.userStory || '',
        acceptanceCriteria:
          data.acceptanceCriteria && data.acceptanceCriteria.length > 0
            ? [...data.acceptanceCriteria]
            : [''],
        priority: data.priority || 'High',
        status: data.status || 'In Progress',
        picId: data.picId || currentUser.id,
        targetDate: data.targetDate || '',
        docsUrl: data.docsUrl || '',
        designUrl: data.designUrl || '',
      });
      setError('');
    }
  }, [isOpen, modalState.data, currentUser]);

  if (!isOpen) return null;

  const handleAddCriteria = () => {
    setFormData((prev) => ({
      ...prev,
      acceptanceCriteria: [...prev.acceptanceCriteria, ''],
    }));
  };

  const handleRemoveCriteria = (index) => {
    setFormData((prev) => ({
      ...prev,
      acceptanceCriteria: prev.acceptanceCriteria.filter((_, i) => i !== index),
    }));
  };

  const handleCriteriaChange = (index, value) => {
    const updated = [...formData.acceptanceCriteria];
    updated[index] = value;
    setFormData((prev) => ({ ...prev, acceptanceCriteria: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Nama fitur / Requirement title wajib diisi.');
      return;
    }

    if (!requirePermission(formData.id ? 'edit' : 'create', 'requirements', formData)) {
      return;
    }

    try {
      const cleanedCriteria = formData.acceptanceCriteria
        .map((c) => c.trim())
        .filter(Boolean);

      await RequirementService.save(
        {
          ...formData,
          acceptanceCriteria: cleanedCriteria,
        },
        currentUser
      );

      addToast(
        formData.id ? 'Requirement berhasil diperbarui!' : 'Requirement baru berhasil dibuat!',
        'success'
      );
      refreshData();
      closeModal();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan requirement.');
    }
  };

  const devUsers = allUsers.filter((u) => u.role === 'owner' || u.division === 'developer');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {formData.id ? `Edit Requirement (${formData.id})` : 'Buat Functional Requirement Baru'}
            </h3>
            <p className="text-xs text-slate-500">
              Dokumentasikan spesifikasi fitur, user story, dan kriteria penerimaan.
            </p>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Fitur / Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Fitur Pembatalan Booking Otomatis & Refund..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              User Story / Konteks Kebutuhan
            </label>
            <textarea
              rows={2}
              value={formData.userStory}
              onChange={(e) => setFormData({ ...formData, userStory: e.target.value })}
              placeholder="Sebagai [pengguna], saya ingin [tindakan] sehingga [manfaat]..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deskripsi Teknis & Ruang Lingkup
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail implementasi teknis..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Dynamic Acceptance Criteria */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">
                Acceptance Criteria (Kriteria Penerimaan)
              </label>
              <button
                type="button"
                onClick={handleAddCriteria}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Kriteria
              </button>
            </div>
            <div className="space-y-2">
              {formData.acceptanceCriteria.map((crit, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={crit}
                    onChange={(e) => handleCriteriaChange(idx, e.target.value)}
                    placeholder={`Kriteria #${idx + 1}`}
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.acceptanceCriteria.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCriteria(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PIC Lead</label>
              <select
                value={formData.picId}
                onChange={(e) => setFormData({ ...formData, picId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {devUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Prioritas</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Draft">Draft</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Selesai</label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Docs URL</label>
              <input
                type="url"
                value={formData.docsUrl}
                onChange={(e) => setFormData({ ...formData, docsUrl: e.target.value })}
                placeholder="https://docs..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Design / Figma URL</label>
              <input
                type="url"
                value={formData.designUrl}
                onChange={(e) => setFormData({ ...formData, designUrl: e.target.value })}
                placeholder="https://figma..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              {formData.id ? 'Simpan Perubahan' : 'Buat Requirement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
