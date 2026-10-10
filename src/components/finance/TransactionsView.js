import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AccountService, CategoryService, TransactionService } from '../../services/supabaseService';
import {
  ArrowLeftRight,
  Plus,
  Filter,
  Trash2,
  Edit2,
} from 'lucide-react';

export const TransactionsView = () => {
  const { currentUser } = useAuth();
  const { openModal, refreshData, addToast, searchQuery, refreshTrigger } = useApp();

  const [filterType, setFilterType] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [accs, cats, txs] = await Promise.all([
          AccountService.getAll(currentUser.id),
          CategoryService.getAll(currentUser.id),
          TransactionService.getAll(currentUser.id),
        ]);
        setAccounts(accs); setCategories(cats); setTransactions(txs);
      } catch (err) {
        addToast('Gagal memuat data: ' + err.message, 'error');
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  const filteredTransactions = transactions.filter((tx) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = (tx.description || '').toLowerCase().includes(q);
      const matchNotes = (tx.notes || '').toLowerCase().includes(q);
      if (!matchDesc && !matchNotes) return false;
    }
    if (filterType && tx.type !== filterType) return false;
    if (filterAccount) {
      if (tx.type === 'Transfer') {
        if (tx.fromAccountId !== filterAccount && tx.toAccountId !== filterAccount) return false;
      } else {
        if (tx.accountId !== filterAccount) return false;
      }
    }
    if (filterCategory && tx.categoryId !== filterCategory) return false;
    return true;
  });

  const totalInc = filteredTransactions
    .filter((t) => t.type === 'Income')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExp = filteredTransactions
    .filter((t) => t.type === 'Expense')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const handleDelete = async (txId) => {
    if (window.confirm('Hapus transaksi ini?')) {
      try {
        await TransactionService.delete(txId);
        addToast('Transaksi berhasil dihapus & saldo dihitung ulang.', 'success');
        refreshData();
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
            Riwayat & Pencatatan Transaksi Finansial
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Daftar pemasukan, pengeluaran riil, dan transfer saldo antar rekening tanpa perhitungan ganda.
          </p>
        </div>

        <button
          onClick={() => openModal('tx_form')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Transaksi</span>
        </button>
      </div>

      {/* Filter and Summary bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Filter:</span>
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">Semua Tipe</option>
              <option value="Expense">Pengeluaran</option>
              <option value="Income">Pemasukan</option>
              <option value="Transfer">Transfer</option>
            </select>

            <select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">Semua Akun</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {(filterType || filterAccount || filterCategory) && (
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterAccount('');
                  setFilterCategory('');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline px-1"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-emerald-600">
              Masuk: +Rp {totalInc.toLocaleString('id-ID')}
            </span>
            <span className="text-rose-600">
              Keluar: -Rp {totalExp.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Deskripsi</th>
                <th className="py-3 px-4">Akun</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isInc = tx.type === 'Income';
                  const isExp = tx.type === 'Expense';
                  const isTrf = tx.type === 'Transfer';

                  const acc = accounts.find((a) => a.id === tx.accountId);
                  const fromAcc = accounts.find((a) => a.id === tx.fromAccountId);
                  const toAcc = accounts.find((a) => a.id === tx.toAccountId);
                  const cat = categories.find((c) => c.id === tx.categoryId);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">{tx.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            isInc
                              ? 'bg-emerald-100 text-emerald-800'
                              : isExp
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{tx.description}</div>
                        {tx.notes && <div className="text-[11px] text-slate-400">{tx.notes}</div>}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {isTrf ? (
                          <span className="font-semibold text-blue-700">
                            {fromAcc?.name} → {toAcc?.name}
                          </span>
                        ) : (
                          <span>{acc?.name || '-'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {cat ? cat.name : isTrf ? 'Mutasi Antar Akun' : '-'}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-extrabold text-sm ${
                          isInc
                            ? 'text-emerald-600'
                            : isExp
                            ? 'text-rose-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {isInc ? '+' : isExp ? '-' : ''}Rp {tx.amount?.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openModal('tx_form', tx)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
