import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AccountService, BillService } from '../../services/supabaseService';
import { X, Check, Receipt, AlertCircle } from 'lucide-react';

export const BillPayModal = () => {
  const { modalState, closeModal, refreshData, addToast } = useApp();
  const { currentUser } = useAuth();

  const isOpen = modalState.type === 'bill_pay_modal';
  const bill = modalState.data;

  const [accountId, setAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const load = async () => {
        try {
          const accs = await AccountService.getAll(currentUser.id);
          setAccounts(accs);
          setAccountId(accs[0]?.id || '');
          setPaymentDate(new Date().toISOString().split('T')[0]);
          setError('');
        } catch (e) {
          setError(e.message);
        }
      };
      load();
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !bill) return null;

  const handlePay = async (e) => {
    e.preventDefault();

    if (!accountId) {
      setError('Pilih akun pembayaran.');
      return;
    }

    try {
      await BillService.pay(bill.id, accountId, paymentDate, currentUser.id);
      addToast(
        `Tagihan "${bill.name}" berhasil dibayar & tercatat di transaksi!`,
        'success'
      );
      refreshData();
      closeModal();
    } catch (err) {
      setError(err.message || 'Gagal memproses pembayaran tagihan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="px-6 py-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 text-white rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Pelunasan Tagihan</h3>
              <p className="text-xs text-slate-500">Konfirmasi akun pembayaran dan tanggal transaksi.</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handlePay} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bill Summary Card */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Nama Tagihan:</span>
              <span className="font-bold text-slate-800">{bill.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Penerima (Payee):</span>
              <span className="font-semibold text-slate-700">{bill.payee}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jatuh Tempo:</span>
              <span className="font-semibold text-rose-600">{bill.dueDate}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm">
              <span className="font-bold text-slate-700">Nominal:</span>
              <span className="font-extrabold text-slate-900 text-base">
                Rp {bill.amount?.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Bayar Menggunakan Akun *
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} — Saldo: Rp {acc.currentBalance?.toLocaleString('id-ID')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Pembayaran *</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-[11px] text-emerald-900 leading-relaxed">
            Sistem secara otomatis akan mencatat mutasi pengeluaran dan menandai tagihan ini sebagai <strong>Lunas</strong>. Tidak terjadi perhitungan saldo ganda.
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
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
            >
              <Check className="w-4 h-4" />
              Konfirmasi & Lunasi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
