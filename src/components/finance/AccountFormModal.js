import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AccountService } from '../../services/supabaseService';
import { X, Check, Landmark, AlertCircle } from 'lucide-react';

export const AccountFormModal = () => {
  const { modalState, closeModal, refreshData, addToast } = useApp();
  const { currentUser, requirePermission } = useAuth();

  const isOpen = modalState.type === 'account_form';

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: 'Bank Account',
    openingBalance: '',
    currency: 'IDR',
    accountNumber: '',
    isActive: true,
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const data = modalState.data || {};
      setFormData({
        id: data.id || '',
        name: data.name || '',
        type: data.type || 'Bank Account',
        openingBalance: data.openingBalance ?? '',
        currency: data.currency || 'IDR',
        accountNumber: data.accountNumber || '',
        isActive: data.isActive !== false,
      });
      setError('');
    }
  }, [isOpen, modalState.data]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Nama akun wajib diisi.');
      return;
    }

    try {
      await AccountService.save(
        {
          ...formData,
          openingBalance: Number(formData.openingBalance) || 0,
        },
        currentUser.id
      );

      addToast(
        formData.id ? 'Akun berhasil diperbarui!' : 'Akun baru berhasil ditambahkan!',
        'success'
      );
      refreshData();
      closeModal();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan akun.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">
                {formData.id ? 'Edit Akun Keuangan' : 'Tambah Sumber Dana / Akun'}
              </h3>
              <p className="text-xs text-slate-500">Rekening bank, dompet digital, atau uang tunai.</p>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Akun *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: BCA Prioritas / GoPay"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Akun *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Bank Account">Bank Account</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="Cash">Cash (Tunai)</option>
                <option value="Investment">Investasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mata Uang</label>
              <input
                type="text"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Saldo Awal (Opening Balance) *
            </label>
            <input
              type="number"
              value={formData.openingBalance}
              onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Saldo berjalan akan dihitung otomatis dari saldo awal + seluruh mutasi transaksi.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening / HP</label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="Contoh: 1234567890"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              {formData.id ? 'Simpan Akun' : 'Tambah Akun'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
