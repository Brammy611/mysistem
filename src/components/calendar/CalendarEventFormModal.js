import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { CalendarService } from '../../services/supabaseService';
import { X, Check, Calendar, AlertCircle } from 'lucide-react';

export const CalendarEventFormModal = () => {
  const { modalState, closeModal, refreshData, addToast } = useApp();
  const { currentUser, requirePermission } = useAuth();

  const isOpen = modalState.type === 'calendar_event_form';

  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: false,
    category: 'BookQu Team',
    division: 'developer',
    isShared: true,
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const data = modalState.data || {};
      setFormData({
        id: data.id || '',
        title: data.title || '',
        description: data.description || '',
        startDate: data.startDate || new Date().toISOString().slice(0, 16),
        endDate: data.endDate || new Date().toISOString().slice(0, 16),
        allDay: data.allDay || false,
        category: data.category || 'BookQu Team',
        division: data.division || (currentUser?.role === 'marketing' ? 'marketing' : 'developer'),
        isShared: data.isShared !== false,
      });
      setError('');
    }
  }, [isOpen, modalState.data, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Nama event wajib diisi.');
      return;
    }

    try {
      await CalendarService.save(formData, currentUser.id);
      addToast(
        formData.id ? 'Event kalender diperbarui!' : 'Event kalender berhasil dibuat!',
        'success'
      );
      refreshData();
      closeModal();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan event kalender.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {formData.id ? 'Edit Event Kalender' : 'Tambah Event Manual'}
              </h3>
              <p className="text-xs text-slate-500">Meeting, sync, atau milestone jadwal.</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Acara *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Sprint Review BookQu / Meeting Penerbit..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail agenda acara..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mulai *</label>
              <input
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Selesai</label>
              <input
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="BookQu Team">BookQu Team Sync</option>
                <option value="Marketing">Marketing Campaign</option>
                <option value="Personal">Personal Meeting</option>
                <option value="Milestone">Milestone / Release</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Visibilitas</label>
              <select
                value={formData.isShared ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, isShared: e.target.value === 'true' })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="true">Dibagikan ke Tim</option>
                <option value="false">Private (Hanya Saya)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              <Check className="w-4 h-4" />
              {formData.id ? 'Simpan Event' : 'Buat Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
