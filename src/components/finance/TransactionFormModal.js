import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AccountService, CategoryService, TransactionService } from '../../services/supabaseService';
import { X, Check, AlertCircle, Plus } from 'lucide-react';

export const TransactionFormModal = () => {
  const { modalState, closeModal, refreshData, addToast } = useApp();
  const { currentUser } = useAuth();

  const isOpen = modalState.type === 'tx_form';

  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Expense',
    amount: '',
    accountId: '',
    fromAccountId: '',
    toAccountId: '',
    categoryId: '',
    description: '',
    notes: '',
  });

  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        try {
          const data = modalState.data || {};
          const [accs, cats] = await Promise.all([
            AccountService.getAll(currentUser.id),
            CategoryService.getAll(currentUser.id),
          ]);
          setAccounts(accs);
          setCategories(cats);

          setFormData({
            id: data.id || '',
            date: data.date || new Date().toISOString().split('T')[0],
            type: data.type || 'Expense',
            amount: data.amount || '',
            accountId: data.accountId || (accs[0]?.id || ''),
            fromAccountId: data.fromAccountId || (accs[0]?.id || ''),
            toAccountId: data.toAccountId || (accs[1]?.id || ''),
            categoryId: data.categoryId || (cats[0]?.id || ''),
            description: data.description || '',
            notes: data.notes || '',
          });
        } catch (e) {
          setError(e.message);
        }
      };
      loadData();
    }
  }, [isOpen, modalState.data, currentUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amt = Number(formData.amount);
    if (!amt || amt <= 0) {
      setError('Nominal harus lebih dari 0.');
      return;
    }

    if (!formData.description.trim()) {
      setError('Deskripsi transaksi wajib diisi.');
      return;
    }

    if (formData.type === 'Transfer' && formData.fromAccountId === formData.toAccountId) {
      setError('Akun asal dan akun tujuan transfer tidak boleh sama.');
      return;
    }

    try {
      let finalCategoryId = formData.categoryId;

      if (isAddingCategory && newCategoryName.trim()) {
        const newCat = await CategoryService.save(
          { name: newCategoryName.trim(), type: formData.type },
          currentUser.id
        );
        finalCategoryId = newCat.id;
      }

      await TransactionService.save(
        {
          ...formData,
          amount: amt,
          categoryId: finalCategoryId,
        },
        currentUser.id
      );

      addToast(
        formData.id ? 'Transaksi berhasil diperbarui!' : 'Transaksi berhasil dicatat!',
        'success'
      );
      refreshData();
      closeModal();
    } catch (err) {
      setError(err.message || 'Gagal menyimpan transaksi.');
    }
  };

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base">
              {formData.id ? 'Edit Transaksi' : 'Catat Transaksi Baru'}
            </h3>
            <p className="text-xs text-slate-500">
              Pencatatan mutasi kas, saldo bank, dan arus keuangan pribadi.
            </p>
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

          {/* Type selector: Income, Expense, Transfer */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold">
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
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'Transfer' })}
              className={`py-2 rounded-lg transition-all ${
                formData.type === 'Transfer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transfer Antar Akun
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nominal (IDR) *
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Contoh: 500000"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Transaksi *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Account selections */}
          {formData.type === 'Transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dari Akun Asal *</label>
                <select
                  value={formData.fromAccountId}
                  onChange={(e) => setFormData({ ...formData, fromAccountId: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Rp {a.currentBalance?.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ke Akun Tujuan *</label>
                <select
                  value={formData.toAccountId}
                  onChange={(e) => setFormData({ ...formData, toAccountId: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Rp {a.currentBalance?.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Akun Keuangan *</label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Rp {a.currentBalance?.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Kategori Transaksi</span>
                  {!isAddingCategory && (
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Baru
                    </button>
                  )}
                </label>
                {isAddingCategory ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nama Kategori..."
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 bg-slate-100 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Transaksi *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Contoh: Langganan AWS server / Dividen Q3..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Tambahan (Notes)</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Keterangan opsional..."
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
              {formData.id ? 'Simpan Perubahan' : 'Catat Transaksi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
