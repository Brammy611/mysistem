import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AccountService } from '../../services/supabaseService';
import {
  Landmark,
  Plus,
  Edit2,
  Trash2,
  CreditCard,
  Wallet,
  Coins,
} from 'lucide-react';

export const AccountsView = () => {
  const { currentUser } = useAuth();
  const { openModal, refreshData, addToast, refreshTrigger } = useApp();

  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await AccountService.getAll(currentUser.id);
        setAccounts(data);
      } catch (err) {
        addToast('Gagal memuat akun: ' + err.message, 'error');
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  const handleDelete = async (accId) => {
    if (window.confirm('Yakin ingin menghapus akun ini?')) {
      try {
        await AccountService.delete(accId);
        addToast('Akun berhasil dihapus.', 'success');
        refreshData();
      } catch (err) {
        addToast(err.message, 'error');
      }
    }
  };

  const getAccountIcon = (type) => {
    switch (type) {
      case 'Bank Account':
        return <Landmark className="w-5 h-5 text-blue-600" />;
      case 'E-Wallet':
        return <CreditCard className="w-5 h-5 text-purple-600" />;
      case 'Cash':
        return <Coins className="w-5 h-5 text-amber-600" />;
      default:
        return <Wallet className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            Manajemen Akun & Sumber Dana
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola rekening bank, e-wallet, dan kas tunai. Saldo terhitung otomatis dari saldo awal + mutasi transaksi.
          </p>
        </div>

        <button
          onClick={() => openModal('account_form')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between hover:shadow-md transition-all"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{acc.name}</h3>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {acc.type} • {acc.currency || 'IDR'}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Aktif
                </span>
              </div>

              {/* Saldo box */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-100 mb-3 space-y-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Saldo Berjalan (Current Balance):
                  </span>
                  <div className="text-xl font-extrabold text-slate-900">
                    Rp {acc.currentBalance?.toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Saldo Awal:</span>
                  <span className="font-semibold text-slate-700">
                    Rp {acc.openingBalance?.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {acc.accountNumber && acc.accountNumber !== '-' && (
                <div className="text-xs text-slate-500 font-mono mb-2">
                  No. Rekening: <strong>{acc.accountNumber}</strong>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                onClick={() => openModal('account_form', acc)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-400" /> Edit
              </button>
              <button
                onClick={() => handleDelete(acc.id)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-slate-50 hover:bg-rose-50 border border-rose-200 rounded-lg"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
