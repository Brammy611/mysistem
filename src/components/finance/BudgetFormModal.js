import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { BudgetService, CategoryService } from '../../services/supabaseService';
import { X, Check, PieChart, AlertCircle } from 'lucide-react';

export const BudgetFormModal = () => {
  const { modalState, closeModal, refreshData, addToast } = useApp();
  const { currentUser, requirePermission } = useAuth();

  const isOpen = modalState.type === 'budget_form';

  const [formData, setFormData] = useState({
    id: '',
    categoryId: '',
    month: '2026-10',
    limit: '',
  });

  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        try {
          const data = modalState.data || {};
          const allCats = await CategoryService.getAll(currentUser.id);
          const cats = allCats.filter((c) => c.type === 'Expense');
          setCategories(cats);
          setFormData({
            id: data.id || '',
            categoryId: data.categoryId || (cats[0]?.id || ''),
            month: data.month || '2026-10',
            limit: data.limit || '',
          });
          setError('');
        } catch (e) {
          setError(e.message);
        }
      };
      load();
    }
  }, [isOpen, modalState.data, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const limitNum = Number(formData.limit);
    if (!limitNum || limitNum <= 0) {
      setError('Batas anggaran harus lebih dari 0.');
      return;
    }

    try {
      await BudgetService.save(
        {
          ...formData,
          limit: limitNum,
        },
        currentUser.id
      );

      addToast(
        formData.id ? 'Anggaran berhasil diperbarui!' : 'Anggaran kategori berhasil dibuat!',
        'success'
      );
      refreshData();
      closeModal();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan anggaran.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-600 text-white rounded-xl">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {formData.id ? 'Edit Anggaran Kategori' : 'Atur Anggaran Bulanan'}
              </h3>
              <p className="text-xs text-slate-500">Tentukan plafon pengeluaran per kategori.</p>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kategori Pengeluaran *
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Bulan Periode *</label>
            <input
              type="month"
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Batas Anggaran Maksimal (IDR) *
            </label>
            <input
              type="number"
              value={formData.limit}
              onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
              placeholder="Contoh: 3000000"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
              required
            />
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
            >
              <Check className="w-4 h-4" />
              {formData.id ? 'Simpan Anggaran' : 'Tetapkan Anggaran'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
