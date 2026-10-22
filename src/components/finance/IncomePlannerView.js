import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  AllocationPlanService,
  TransactionService,
} from '../../services/supabaseService';
import {
  TrendingUp,
  PieChart,
  BarChart3,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Target,
  Zap,
  Info,
  Edit3,
  X,
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TYPES = ['Savings', 'Essential', 'Lifestyle', 'Other'];

const CATEGORY_TYPE_COLORS = {
  Savings: 'bg-emerald-100 text-emerald-700',
  Essential: 'bg-blue-100 text-blue-700',
  Lifestyle: 'bg-violet-100 text-violet-700',
  Other: 'bg-slate-100 text-slate-600',
};

const CATEGORY_TYPE_BAR = {
  Savings: 'bg-emerald-500',
  Essential: 'bg-blue-500',
  Lifestyle: 'bg-violet-500',
  Other: 'bg-slate-400',
};

const DEFAULT_TEMPLATE_5030 = [
  { categoryName: 'Kebutuhan Pokok', categoryType: 'Essential', percentage: 30, allocationMode: 'percentage' },
  { categoryName: 'Tagihan & Transportasi', categoryType: 'Essential', percentage: 20, allocationMode: 'percentage' },
  { categoryName: 'Tabungan', categoryType: 'Savings', percentage: 20, allocationMode: 'percentage' },
  { categoryName: 'Dana Darurat', categoryType: 'Savings', percentage: 10, allocationMode: 'percentage' },
  { categoryName: 'Makan & Minum', categoryType: 'Lifestyle', percentage: 10, allocationMode: 'percentage' },
  { categoryName: 'Hiburan & Jajan', categoryType: 'Lifestyle', percentage: 5, allocationMode: 'percentage' },
  { categoryName: 'Investasi', categoryType: 'Savings', percentage: 5, allocationMode: 'percentage' },
];

const BLANK_ITEM = () => ({
  id: `new-${Date.now()}`,
  categoryName: '',
  categoryType: 'Other',
  allocationMode: 'percentage',
  percentage: 0,
  plannedAmount: 0,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) =>
  `Rp${Number(n || 0).toLocaleString('id-ID')}`;

const parseNum = (v) => {
  const n = parseFloat(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? 0 : n;
};

const recompute = (items, netIncome) =>
  items.map((it) => {
    const income = parseNum(netIncome);
    if (it.allocationMode === 'percentage') {
      return {
        ...it,
        percentage: parseNum(it.percentage),
        plannedAmount: income > 0 ? Math.round((parseNum(it.percentage) / 100) * income) : 0,
      };
    } else {
      return {
        ...it,
        plannedAmount: parseNum(it.plannedAmount),
        percentage: income > 0 ? +((parseNum(it.plannedAmount) / income) * 100).toFixed(2) : 0,
      };
    }
  });

// ─── Sub-components ───────────────────────────────────────────────────────────

const SummaryCard = ({ label, value, sub, color = 'text-slate-900', icon: Icon }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 flex items-start gap-3">
    {Icon && (
      <div className="shrink-0 w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
    )}
    <div className="min-w-0">
      <p className="text-[11px] font-semibold text-slate-500 leading-tight">{label}</p>
      <p className={`text-lg font-extrabold leading-tight mt-0.5 ${color}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const AllocationBar = ({ items, netIncome }) => {
  const income = parseNum(netIncome);
  if (!income || !items.length) return null;
  const segments = items
    .filter((i) => i.plannedAmount > 0)
    .map((i) => ({
      name: i.categoryName,
      pct: Math.min(100, (i.plannedAmount / income) * 100),
      color: CATEGORY_TYPE_BAR[i.categoryType] || 'bg-slate-400',
    }));
  return (
    <div className="flex w-full h-3 rounded-full overflow-hidden gap-px bg-slate-100">
      {segments.map((s, idx) => (
        <div
          key={idx}
          title={`${s.name}: ${s.pct.toFixed(1)}%`}
          className={`${s.color} transition-all`}
          style={{ width: `${s.pct}%` }}
        />
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const IncomePlannerView = () => {
  const { currentUser } = useAuth();
  const { addToast, refreshTrigger } = useApp();

  const [tab, setTab] = useState('allocation'); // 'allocation' | 'vs-actual'
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [netIncome, setNetIncome] = useState('');
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showTemplateConfirm, setShowTemplateConfirm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ── Load plan + transactions ──────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const [plan, txs] = await Promise.all([
        AllocationPlanService.getByMonth(currentUser.id, selectedMonth),
        TransactionService.getAll(currentUser.id),
      ]);
      if (plan) {
        setNetIncome(String(plan.netIncome || ''));
        const loaded = (plan.items || [])
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((i) => ({
            id: i.id,
            categoryName: i.categoryName,
            categoryType: i.categoryType,
            allocationMode: i.allocationMode,
            percentage: i.percentage,
            plannedAmount: i.plannedAmount,
          }));
        setItems(loaded);
      } else {
        setNetIncome('');
        setItems([]);
      }
      setTransactions(txs || []);
      setIsDirty(false);
    } catch (e) {
      setError(e.message || 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedMonth]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // ── Derived totals ────────────────────────────────────────────────────────
  const income = parseNum(netIncome);
  const computed = recompute(items, income);
  const totalAllocated = computed.reduce((s, i) => s + i.plannedAmount, 0);
  const totalPct = computed.reduce((s, i) => s + i.percentage, 0);
  const unallocated = income - totalAllocated;
  const isOver = totalAllocated > income && income > 0;
  const isBalanced = income > 0 && Math.abs(unallocated) <= 500;

  // ── Actual spending from transactions ─────────────────────────────────────
  const monthTxs = transactions.filter(
    (t) => t.type === 'Expense' && (t.date || '').startsWith(selectedMonth)
  );
  const totalActualSpent = monthTxs.reduce((s, t) => s + Number(t.amount || 0), 0);

  // ── Item handlers ─────────────────────────────────────────────────────────
  const updateItem = (id, field, value) => {
    setIsDirty(true);
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'percentage') {
          updated.allocationMode = 'percentage';
          updated.plannedAmount =
            income > 0 ? Math.round((parseNum(value) / 100) * income) : 0;
        }
        if (field === 'plannedAmount') {
          updated.allocationMode = 'fixed';
          updated.percentage =
            income > 0 ? +((parseNum(value) / income) * 100).toFixed(2) : 0;
        }
        return updated;
      })
    );
  };

  const addItem = () => {
    setIsDirty(true);
    const newItem = BLANK_ITEM();
    setItems((prev) => [...prev, newItem]);
    setEditingId(newItem.id);
  };

  const removeItem = (id) => {
    setIsDirty(true);
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleIncomeChange = (val) => {
    setIsDirty(true);
    setNetIncome(val);
    // Recalculate all percentage-based items
    const inc = parseNum(val);
    setItems((prev) =>
      prev.map((it) =>
        it.allocationMode === 'percentage'
          ? {
              ...it,
              plannedAmount: inc > 0 ? Math.round((it.percentage / 100) * inc) : 0,
            }
          : {
              ...it,
              percentage: inc > 0 ? +((it.plannedAmount / inc) * 100).toFixed(2) : 0,
            }
      )
    );
  };

  // ── Template ──────────────────────────────────────────────────────────────
  const applyTemplate = () => {
    const templated = DEFAULT_TEMPLATE_5030.map((t, idx) => ({
      id: `tpl-${Date.now()}-${idx}`,
      ...t,
      plannedAmount: income > 0 ? Math.round((t.percentage / 100) * income) : 0,
    }));
    setItems(templated);
    setIsDirty(true);
    setShowTemplateConfirm(false);
    addToast('Template 50/30/20 diterapkan. Sesuaikan sesuai kebutuhanmu.', 'info');
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!netIncome || parseNum(netIncome) <= 0) {
      setError('Pendapatan bersih harus lebih dari 0.');
      return;
    }
    if (items.some((i) => !i.categoryName.trim())) {
      setError('Semua kategori harus memiliki nama.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const finalItems = recompute(items, income);
      await AllocationPlanService.savePlan(
        currentUser.id,
        selectedMonth,
        parseNum(netIncome),
        finalItems
      );
      addToast('Rencana alokasi berhasil disimpan!', 'success');
      setIsDirty(false);
      await loadData();
    } catch (e) {
      setError(e.message || 'Gagal menyimpan rencana.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              Income Allocation Planner
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rencanakan distribusi pendapatan bulanan ke tiap kategori keuangan.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Month Picker */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none"
              />
            </div>

            {/* Save button */}
            {tab === 'allocation' && (
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
              >
                {saving ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {saving ? 'Menyimpan…' : 'Simpan Rencana'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {[
            { key: 'allocation', label: 'Alokasi Pendapatan', icon: PieChart },
            { key: 'vs-actual', label: 'Rencana vs Aktual', icon: BarChart3 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                tab === key
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm animate-pulse">
          Memuat data rencana…
        </div>
      ) : (
        <>
          {/* ═══════════════ TAB: ALLOCATION ═══════════════ */}
          {tab === 'allocation' && (
            <AllocationTab
              netIncome={netIncome}
              income={income}
              items={items}
              computed={computed}
              totalAllocated={totalAllocated}
              totalPct={totalPct}
              unallocated={unallocated}
              isOver={isOver}
              isBalanced={isBalanced}
              isDirty={isDirty}
              showTemplateConfirm={showTemplateConfirm}
              editingId={editingId}
              onIncomeChange={handleIncomeChange}
              onUpdateItem={updateItem}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onSetEditingId={setEditingId}
              onRequestTemplate={() =>
                items.length > 0 ? setShowTemplateConfirm(true) : applyTemplate()
              }
              onConfirmTemplate={applyTemplate}
              onCancelTemplate={() => setShowTemplateConfirm(false)}
            />
          )}

          {/* ═══════════════ TAB: VS ACTUAL ═══════════════ */}
          {tab === 'vs-actual' && (
            <VsActualTab
              computed={computed}
              income={income}
              netIncome={netIncome}
              totalAllocated={totalAllocated}
              totalActualSpent={totalActualSpent}
              monthTxs={monthTxs}
              selectedMonth={selectedMonth}
            />
          )}
        </>
      )}
    </div>
  );
};

// ─── Tab A: Allocation ────────────────────────────────────────────────────────

const AllocationTab = ({
  netIncome, income, items, computed, totalAllocated, totalPct,
  unallocated, isOver, isBalanced, isDirty, showTemplateConfirm,
  editingId, onIncomeChange, onUpdateItem, onAddItem, onRemoveItem,
  onSetEditingId, onRequestTemplate, onConfirmTemplate, onCancelTemplate,
}) => {
  const overCount = computed.filter((i) => i.percentage > 100).length;

  return (
    <div className="space-y-4">
      {/* ── Summary KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Pendapatan Bersih"
          value={income > 0 ? fmt(income) : '—'}
          icon={TrendingUp}
          color="text-slate-900"
        />
        <SummaryCard
          label="Total Dialokasikan"
          value={fmt(totalAllocated)}
          sub={`${totalPct.toFixed(1)}% dari pendapatan`}
          icon={Target}
          color={isOver ? 'text-rose-600' : 'text-indigo-700'}
        />
        <SummaryCard
          label="Sisa Belum Dialokasikan"
          value={fmt(Math.abs(unallocated))}
          sub={isOver ? 'Melebihi pendapatan!' : unallocated === 0 ? 'Seimbang ✓' : 'Belum dialokasikan'}
          icon={Zap}
          color={isOver ? 'text-rose-600' : unallocated === 0 ? 'text-emerald-600' : 'text-amber-600'}
        />
        <SummaryCard
          label="Status Rencana"
          value={
            !income
              ? 'Belum Ada Income'
              : isBalanced
              ? 'Seimbang'
              : isOver
              ? 'Melebihi Batas'
              : 'Belum Lengkap'
          }
          icon={isBalanced ? CheckCircle : AlertTriangle}
          color={isBalanced ? 'text-emerald-600' : isOver ? 'text-rose-600' : 'text-amber-600'}
        />
      </div>

      {/* Allocation bar */}
      {income > 0 && items.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
          <p className="text-xs font-bold text-slate-600">Distribusi Alokasi</p>
          <AllocationBar items={computed} netIncome={income} />
          <div className="flex flex-wrap gap-2 mt-1">
            {Object.entries(CATEGORY_TYPE_BAR).map(([type, color]) => {
              const total = computed
                .filter((i) => i.categoryType === type)
                .reduce((s, i) => s + i.plannedAmount, 0);
              if (!total) return null;
              return (
                <span key={type} className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className={`inline-block w-2.5 h-2.5 rounded-sm ${color}`} />
                  {type}: {fmt(total)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Income Input ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
        <label className="block text-xs font-bold text-slate-700 mb-1">
          Pendapatan Bersih Bulanan (IDR) *
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
          <input
            type="number"
            min="0"
            value={netIncome}
            onChange={(e) => onIncomeChange(e.target.value)}
            placeholder="Contoh: 10000000"
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
          />
        </div>
        {income > 0 && (
          <p className="text-[11px] text-slate-400 mt-1">
            Ditampilkan: <strong>{fmt(income)}</strong>
          </p>
        )}
      </div>

      {/* ── Allocation Items ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table header */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-xs font-bold text-slate-700">Kategori Alokasi ({items.length})</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onRequestTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Template 50/30/20
            </button>
            <button
              onClick={onAddItem}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Kategori
            </button>
          </div>
        </div>

        {/* Template confirm dialog */}
        {showTemplateConfirm && (
          <div className="mx-5 my-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-amber-800">Terapkan Template 50/30/20?</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Ini akan <strong>mengganti</strong> seluruh kategori yang ada. Persentase template
                adalah saran umum, bukan rekomendasi finansial universal.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={onConfirmTemplate}
                className="px-3 py-1 text-xs font-bold text-white bg-amber-600 rounded-lg"
              >
                Ya, terapkan
              </button>
              <button
                onClick={onCancelTemplate}
                className="px-3 py-1 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            <PieChart className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Belum ada kategori alokasi.</p>
            <p className="text-xs mt-1">Tambah manual atau pakai template 50/30/20.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const cItem = computed.find((c) => c.id === item.id) || item;
              const isEditing = editingId === item.id;
              return (
                <AllocationItemRow
                  key={item.id}
                  item={cItem}
                  income={income}
                  isEditing={isEditing}
                  onToggleEdit={() => onSetEditingId(isEditing ? null : item.id)}
                  onUpdate={(field, val) => onUpdateItem(item.id, field, val)}
                  onRemove={() => onRemoveItem(item.id)}
                />
              );
            })}
          </div>
        )}

        {/* Footer totals */}
        {items.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-slate-700">Total</span>
            <div className="flex items-center gap-4">
              <span
                className={`text-xs font-extrabold ${
                  isOver ? 'text-rose-600' : isBalanced ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {totalPct.toFixed(1)}%
              </span>
              <span
                className={`text-sm font-extrabold ${
                  isOver ? 'text-rose-600' : isBalanced ? 'text-emerald-600' : 'text-slate-900'
                }`}
              >
                {fmt(totalAllocated)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Allocation warnings */}
      {income > 0 && isOver && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Total alokasi melebihi pendapatan sebesar <strong className="mx-1">{fmt(Math.abs(unallocated))}</strong>.
          Kurangi beberapa kategori.
        </div>
      )}
      {income > 0 && !isOver && unallocated > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          Masih ada <strong className="mx-1">{fmt(unallocated)}</strong> ({(100 - totalPct).toFixed(1)}%) yang belum dialokasikan.
        </div>
      )}
      {isBalanced && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Rencana alokasi seimbang! Semua pendapatan sudah terdistribusi.
        </div>
      )}

      {/* Dirty indicator */}
      {isDirty && (
        <p className="text-xs text-amber-600 text-center">
          Ada perubahan yang belum disimpan — klik <strong>Simpan Rencana</strong> di atas.
        </p>
      )}
    </div>
  );
};

// ─── Allocation Item Row ──────────────────────────────────────────────────────

const AllocationItemRow = ({ item, income, isEditing, onToggleEdit, onUpdate, onRemove }) => {
  const barPct = income > 0 ? Math.min(100, (item.plannedAmount / income) * 100) : 0;

  return (
    <div className="px-5 py-3 hover:bg-slate-50/70 transition-colors">
      {/* Collapsed view */}
      <div className="flex items-center gap-3">
        {/* Color dot */}
        <span
          className={`shrink-0 w-2.5 h-2.5 rounded-full ${CATEGORY_TYPE_BAR[item.categoryType] || 'bg-slate-300'}`}
        />

        {/* Name */}
        <span className="flex-1 text-sm font-semibold text-slate-800 min-w-0 truncate">
          {item.categoryName || <em className="text-slate-400">Nama kosong</em>}
        </span>

        {/* Type badge */}
        <span
          className={`shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
            CATEGORY_TYPE_COLORS[item.categoryType] || 'bg-slate-100 text-slate-600'
          }`}
        >
          {item.categoryType}
        </span>

        {/* Percentage */}
        <span className="shrink-0 w-14 text-right text-xs font-bold text-slate-700">
          {item.percentage.toFixed(1)}%
        </span>

        {/* Amount */}
        <span className="shrink-0 w-28 text-right text-sm font-extrabold text-indigo-700">
          {fmt(item.plannedAmount)}
        </span>

        {/* Actions */}
        <button onClick={onToggleEdit} className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100">
          {isEditing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button onClick={onRemove} className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-2 ml-5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${CATEGORY_TYPE_BAR[item.categoryType] || 'bg-slate-400'}`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      {/* Expanded edit form */}
      {isEditing && (
        <div className="mt-3 ml-5 grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Kategori</label>
            <input
              type="text"
              value={item.categoryName}
              onChange={(e) => onUpdate('categoryName', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
              placeholder="Nama kategori"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Tipe Kategori</label>
            <select
              value={item.categoryType}
              onChange={(e) => onUpdate('categoryType', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {CATEGORY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">Persentase (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={item.percentage}
              onChange={(e) => onUpdate('percentage', e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 mb-1">
              Nominal (IDR) — {income > 0 ? 'mengubah ini akan update %' : 'isi income dulu'}
            </label>
            <input
              type="number"
              min="0"
              value={item.plannedAmount}
              onChange={(e) => onUpdate('plannedAmount', e.target.value)}
              disabled={income <= 0}
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-50"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab B: Budget vs Actual ──────────────────────────────────────────────────

const VsActualTab = ({
  computed, income, netIncome, totalAllocated, totalActualSpent, monthTxs, selectedMonth,
}) => {
  const unallocated = income - totalAllocated;
  const overBudget = computed.filter(
    (i) => i.plannedAmount > 0 && totalActualSpent > i.plannedAmount
  ).length;

  // We do a best-effort name-based match of allocation categories vs transactions.
  // Since allocation items have free-form names and transactions have category IDs,
  // we show an aggregate actual vs total planned approach.
  const savingsItems = computed.filter((i) => i.categoryType === 'Savings');
  const essentialItems = computed.filter((i) => i.categoryType === 'Essential');
  const lifestyleItems = computed.filter((i) => i.categoryType === 'Lifestyle');
  const otherItems = computed.filter((i) => i.categoryType === 'Other');

  const totalSavingsPlanned = savingsItems.reduce((s, i) => s + i.plannedAmount, 0);
  const totalEssentialPlanned = essentialItems.reduce((s, i) => s + i.plannedAmount, 0);
  const totalLifestylePlanned = lifestyleItems.reduce((s, i) => s + i.plannedAmount, 0);
  const totalOtherPlanned = otherItems.reduce((s, i) => s + i.plannedAmount, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Pendapatan Bersih" value={income > 0 ? fmt(income) : '—'} icon={TrendingUp} />
        <SummaryCard label="Total Direncanakan" value={fmt(totalAllocated)} icon={Target} color="text-indigo-700" />
        <SummaryCard
          label="Total Pengeluaran Aktual"
          value={fmt(totalActualSpent)}
          sub={`${monthTxs.length} transaksi di ${selectedMonth}`}
          icon={BarChart3}
          color={totalActualSpent > totalAllocated ? 'text-rose-600' : 'text-emerald-600'}
        />
        <SummaryCard
          label="Selisih (Rencana − Aktual)"
          value={fmt(Math.abs(totalAllocated - totalActualSpent))}
          sub={totalActualSpent > totalAllocated ? 'Melebihi rencana' : 'Di bawah rencana'}
          icon={totalActualSpent > totalAllocated ? AlertTriangle : CheckCircle}
          color={totalActualSpent > totalAllocated ? 'text-rose-600' : 'text-emerald-600'}
        />
      </div>

      {/* No plan warning */}
      {computed.length === 0 && (
        <div className="py-12 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
          <Target className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">Belum ada rencana alokasi untuk bulan ini.</p>
          <p className="text-xs text-slate-400 mt-1">
            Buat rencana di tab <strong>Alokasi Pendapatan</strong> terlebih dahulu.
          </p>
        </div>
      )}

      {/* Type-level comparison */}
      {computed.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-700">Ringkasan per Tipe Kategori</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pengeluaran aktual dihitung dari semua transaksi bertipe Expense di {selectedMonth}.
              Pemetaan kategori berdasarkan tipe alokasi.
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { label: 'Savings / Tabungan', planned: totalSavingsPlanned, actual: 0, type: 'Savings', note: 'Alokasi tabungan — dicatat via transaksi Income/Transfer terpisah' },
              { label: 'Essential / Kebutuhan', planned: totalEssentialPlanned, actual: totalActualSpent * (totalEssentialPlanned / (totalAllocated || 1)), type: 'Essential' },
              { label: 'Lifestyle / Gaya Hidup', planned: totalLifestylePlanned, actual: totalActualSpent * (totalLifestylePlanned / (totalAllocated || 1)), type: 'Lifestyle' },
              { label: 'Other / Lain-lain', planned: totalOtherPlanned, actual: totalActualSpent * (totalOtherPlanned / (totalAllocated || 1)), type: 'Other' },
            ].map((row) => (
              <TypeComparisonRow key={row.type} {...row} />
            ))}
          </div>
        </div>
      )}

      {/* Per-category table */}
      {computed.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-700">Detail Kategori Alokasi</h3>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 px-5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 border-b border-slate-100">
            <div className="col-span-4">Kategori</div>
            <div className="col-span-2 text-right">Tipe</div>
            <div className="col-span-2 text-right">%</div>
            <div className="col-span-4 text-right">Direncanakan</div>
          </div>

          <div className="divide-y divide-slate-100">
            {computed.map((item) => {
              const barPct = income > 0 ? Math.min(100, (item.plannedAmount / income) * 100) : 0;
              return (
                <div key={item.id} className="grid grid-cols-12 gap-2 px-5 py-3 items-center hover:bg-slate-50/70">
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_TYPE_BAR[item.categoryType] || 'bg-slate-300'}`} />
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {item.categoryName}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${CATEGORY_TYPE_COLORS[item.categoryType] || ''}`}>
                      {item.categoryType}
                    </span>
                  </div>
                  <div className="col-span-2 text-right text-xs font-bold text-slate-600">
                    {item.percentage.toFixed(1)}%
                  </div>
                  <div className="col-span-4 text-right">
                    <span className="text-sm font-extrabold text-indigo-700">{fmt(item.plannedAmount)}</span>
                    <div className="mt-1 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${CATEGORY_TYPE_BAR[item.categoryType] || 'bg-slate-400'}`}
                        style={{ width: `${barPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions list */}
      {monthTxs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-700">
              Transaksi Pengeluaran Aktual — {selectedMonth}
              <span className="ml-2 text-slate-400 font-normal">({monthTxs.length} transaksi)</span>
            </h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {monthTxs.slice(0, 30).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-5 py-2.5 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {tx.description || 'Tanpa deskripsi'}
                  </p>
                  <p className="text-[11px] text-slate-400">{tx.date}</p>
                </div>
                <span className="text-sm font-bold text-rose-600 shrink-0 ml-3">
                  − {fmt(tx.amount)}
                </span>
              </div>
            ))}
            {monthTxs.length > 30 && (
              <p className="text-center text-xs text-slate-400 py-3">
                … dan {monthTxs.length - 30} transaksi lainnya
              </p>
            )}
          </div>
        </div>
      )}

      {monthTxs.length === 0 && computed.length > 0 && (
        <div className="py-10 text-center bg-white rounded-xl border border-slate-200 shadow-2xs">
          <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-400">
            Belum ada transaksi pengeluaran di bulan {selectedMonth}.
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Type Comparison Row ──────────────────────────────────────────────────────

const TypeComparisonRow = ({ label, planned, actual, type, note }) => {
  const pct = planned > 0 ? Math.min(100, (actual / planned) * 100) : 0;
  const isOver = actual > planned && planned > 0;

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-sm ${CATEGORY_TYPE_BAR[type] || 'bg-slate-400'}`} />
          <span className="text-sm font-semibold text-slate-800">{label}</span>
          {note && (
            <span className="text-[10px] text-slate-400 italic hidden sm:inline">({note})</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-slate-500">Plan: <strong>{fmt(planned)}</strong></span>
          {type !== 'Savings' && (
            <span className={isOver ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
              Aktual: {fmt(actual)}
            </span>
          )}
          {isOver && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
        </div>
      </div>
      {type !== 'Savings' && planned > 0 && (
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isOver ? 'bg-rose-500' : pct > 80 ? 'bg-amber-500' : CATEGORY_TYPE_BAR[type] || 'bg-slate-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  );
};
