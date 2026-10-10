import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { CategoryService } from '../../services/supabaseService';
import { X, Check, Tags, AlertCircle } from 'lucide-react';

export const CategoryFormModal = () => {
  const { modalState, closeModal, refreshData, addToast } = useApp();
  const { currentUser } = useAuth();

  const isOpen = modalState.type === 'category_form';

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'Expense',
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const data = modalState.data || {};
      setFormData({
        id: data.id || '',
        name: data.name || '',
        type: data.type || 'Expense',
      });
      setError('');
    }
  }, [isOpen, modalState.data]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Nama kategori wajib diisi.');
      return;
    }

    try {
      await CategoryService.save(
        {
          ...formData,
        },
        currentUser.id
      );

      addToast(
        formData.id ? 'Kategori berhasil diperbarui!' : 'Kategori baru berhasil ditambahkan!',
        'success'
      );
      refreshData();
      closeModal();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan kategori.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Tags className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {formData.id ? 'Edit Kategori' : 'Tambah Kategori'}
              </h3>
            </div>
          </div>
          <button
            onClick={closeModal}
            type="button"
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

          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'Expense' })}
              className={`py-2 rounded-lg transition-all ${
                formData.type === 'Expense'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'Income' })}
              className={`py-2 rounded-lg transition-all ${
                formData.type === 'Income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pemasukan
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kategori *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Belanja Bulanan"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
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
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
