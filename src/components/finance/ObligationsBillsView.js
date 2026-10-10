import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { BillService, ObligationService, AccountService } from '../../services/supabaseService';
import {
  Receipt,
  Repeat,
  Plus,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export const ObligationsBillsView = () => {
  const { currentUser } = useAuth();
  const { openModal, refreshData, addToast, refreshTrigger } = useApp();

  const [activeTab, setActiveTab] = useState('bills');
  const [bills, setBills] = useState([]);
  const [recurring, setRecurring] = useState([]);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [bls, recs, accs] = await Promise.all([
          BillService.getAll(currentUser.id),
          ObligationService.getAll(currentUser.id),
          AccountService.getAll(currentUser.id),
        ]);
        setBills(bls); setRecurring(recs); setAccounts(accs);
      } catch (err) {
        console.error('Bills load error:', err);
      }
    };
    if (currentUser) fetch();
  }, [currentUser, refreshTrigger]);

  const todayStr = new Date().toISOString().split('T')[0];

  const unpaidBills = bills.filter((b) => b.status !== 'Paid');
  const paidBills = bills.filter((b) => b.status === 'Paid');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-600" />
            Kewajiban Rutin & Tagihan Finansial (Bills & Liabilities)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Pelacakan langganan berulang (SaaS, internet, server) dan tagihan satu kali tanpa risiko pencatatan ganda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openModal('bill_form')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tagihan</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-6">
        <button
          onClick={() => setActiveTab('bills')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'bills'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Daftar Tagihan & Kewajiban ({unpaidBills.length} Belum Lunas)</span>
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'recurring'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Kewajiban Rutin Berulang ({recurring.length} Langganan)</span>
        </button>
      </div>

      {/* TAB 1: Bills & Liabilities */}
      {activeTab === 'bills' && (
        <div className="space-y-6">
          {/* Unpaid section */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Tagihan Aktif & Jatuh Tempo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unpaidBills.length === 0 ? (
                <div className="col-span-full bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  Semua tagihan sudah berstatus lunas.
                </div>
              ) : (
                unpaidBills.map((bill) => {
                  const isOverdue = bill.dueDate && bill.dueDate < todayStr;

                  return (
                    <div
                      key={bill.id}
                      className={`bg-white rounded-2xl border p-5 shadow-2xs flex flex-col justify-between ${
                        isOverdue
                          ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/15'
                          : 'border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              isOverdue
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isOverdue ? 'Overdue!' : bill.status || 'Upcoming'}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-500">
                            Tempo: {bill.dueDate}
                          </span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-sm mb-1">{bill.name}</h4>
                        <p className="text-xs text-slate-500 mb-3">{bill.payee}</p>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Nominal Tagihan:
                          </span>
                          <span className="text-lg font-extrabold text-slate-900">
                            Rp {bill.amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => openModal('bill_pay_modal', bill)}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Bayar & Potong Saldo</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Paid section */}
          {paidBills.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Histori Tagihan Lunas
              </h3>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-2.5 px-4">Nama Tagihan</th>
                      <th className="py-2.5 px-4">Penyedia</th>
                      <th className="py-2.5 px-4">Nominal</th>
                      <th className="py-2.5 px-4">Tanggal Bayar</th>
                      <th className="py-2.5 px-4">Ref Transaksi</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paidBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-slate-50/60">
                        <td className="py-2.5 px-4 font-bold text-slate-800">{bill.name}</td>
                        <td className="py-2.5 px-4 text-slate-600">{bill.payee}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">
                          Rp {bill.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-500">
                          {bill.paidDate || '-'}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-indigo-600">
                          {bill.transactionId || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Lunas
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Recurring Obligations */}
      {activeTab === 'recurring' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recurring.map((rec) => {
            const acc = accounts.find((a) => a.id === rec.accountId);

            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      {rec.frequency}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      Tgl {rec.dueDay} Tiap Bulan
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mb-1">{rec.name}</h4>
                  <p className="text-xs text-slate-500 mb-3">{rec.category}</p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Nominal:</span>
                      <span className="font-extrabold text-slate-900">
                        Rp {rec.amount.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Akun Debet:</span>
                      <span className="font-semibold text-slate-700">{acc?.name || '-'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400">
                  Status: <strong className="text-emerald-600">Aktif Berlangganan</strong>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
