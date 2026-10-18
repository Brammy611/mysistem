import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import {
  CalendarService,
  TaskService,
  PersonalTaskService,
  BillService,
} from '../../services/supabaseService';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export const UnifiedCalendarView = () => {
  const { currentUser, isOwner, isDeveloper, isMarketing } = useAuth();
  const { openModal, searchQuery, refreshTrigger, refreshData, currentView } = useApp();

  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'agenda'
  const [filterSource, setFilterSource] = useState('');
  const [loading, setLoading] = useState(false);

  // Default currentDate initialized to today
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const [allEvents, setAllEvents] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [bills, setBills] = useState([]);

  // Adjust default filter based on active view
  useEffect(() => {
    if (currentView === 'dev-calendar') {
      setFilterSource('task_dev');
    } else if (currentView === 'mkt-calendar') {
      setFilterSource('task_mkt');
    } else if (currentView === 'personal-calendar') {
      setFilterSource('personal_task');
    }
  }, [currentView]);

  const fetchAll = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [evts, ts, pts, bs] = await Promise.all([
        CalendarService.getAll(currentUser),
        TaskService.getAll(currentUser),
        isOwner ? PersonalTaskService.getAll(currentUser.id) : Promise.resolve([]),
        isOwner ? BillService.getAll(currentUser.id) : Promise.resolve([]),
      ]);

      const tasksList = ts || [];
      const personalList = pts || [];
      const billsList = bs || [];

      setAllTasks(tasksList);
      setPersonalTasks(personalList);
      setBills(billsList);

      const dynamicEvents = [];

      // 1. Team Tasks Deadlines (Developer & Marketing Divisions)
      tasksList.forEach((t) => {
        const dlDate = t.dueDate || t.productionDeadline;
        const isDev = t.division === 'developer';
        const assigneeName = t.assignee?.name
          ? t.assignee.name.split(' ')[0]
          : t.assignee?.email
          ? t.assignee.email.split('@')[0]
          : '';
        const picLabel = assigneeName ? ` • ${assigneeName}` : '';

        if (dlDate) {
          dynamicEvents.push({
            id: `evt-task-${t.id}`,
            title: `[${isDev ? 'Dev' : 'Mkt'}] ${t.title}${picLabel}`,
            description: `Tenggat Waktu (${t.priority} Priority, Status: ${t.status}): ${
              t.description || t.title
            }`,
            startDate: dlDate.includes('T') ? dlDate : `${dlDate}T17:00:00`,
            endDate: dlDate.includes('T') ? dlDate : `${dlDate}T18:00:00`,
            allDay: true,
            category: isDev ? 'BookQu Dev' : 'Marketing',
            source: 'task',
            relatedId: t.id,
            priority: t.priority,
            status: t.status,
            division: t.division,
            isShared: true,
            assignee: t.assignee,
          });
        }

        // If marketing content has publishDate
        if (t.division === 'marketing' && t.publishDate) {
          dynamicEvents.push({
            id: `evt-publish-${t.id}`,
            title: `[Publish] ${t.title} (${t.platform || 'Sosmed'})`,
            description: `Jadwal Publikasi Konten: ${t.caption || t.description || ''}`,
            startDate: t.publishDate.includes('T') ? t.publishDate : `${t.publishDate}T10:00:00`,
            endDate: t.publishDate.includes('T') ? t.publishDate : `${t.publishDate}T11:00:00`,
            allDay: false,
            category: 'Content Publish',
            source: 'content_publish',
            relatedId: t.id,
            priority: t.priority,
            status: t.status,
            division: 'marketing',
            isShared: true,
            assignee: t.assignee,
          });
        }
      });

      // 2. Personal Tasks (Owner Only)
      if (isOwner && personalList.length > 0) {
        personalList.forEach((pt) => {
          if (pt.dueDate) {
            dynamicEvents.push({
              id: `evt-ptsk-${pt.id}`,
              title: `[Personal] ${pt.title}`,
              description: pt.description || '',
              startDate: pt.dueDate.includes('T') ? pt.dueDate : `${pt.dueDate}T09:00:00`,
              endDate: pt.dueDate.includes('T') ? pt.dueDate : `${pt.dueDate}T10:00:00`,
              allDay: true,
              category: 'Personal Task',
              source: 'personal_task',
              relatedId: pt.id,
              priority: pt.priority,
              status: pt.status,
              division: null,
              isShared: false,
            });
          }
        });
      }

      // 3. Financial Obligations & Bills (Owner Only)
      if (isOwner && billsList.length > 0) {
        billsList.forEach((b) => {
          if (b.dueDate && b.status !== 'Paid') {
            dynamicEvents.push({
              id: `evt-bill-${b.id}`,
              title: `[Tagihan] ${b.name} (Rp ${b.amount?.toLocaleString('id-ID')})`,
              description: `Tagihan ke ${b.payee || '-'}`,
              startDate: b.dueDate.includes('T') ? b.dueDate : `${b.dueDate}T10:00:00`,
              endDate: b.dueDate.includes('T') ? b.dueDate : `${b.dueDate}T11:00:00`,
              allDay: true,
              category: 'Financial Obligation',
              source: 'bill',
              relatedId: b.id,
              priority: 'High',
              status: b.status,
              division: null,
              isShared: false,
            });
          }
        });
      }

      // Combine manual events + dynamic events
      const manualList = evts || [];
      setAllEvents([...manualList, ...dynamicEvents]);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isOwner]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refreshTrigger]);

  // Filter events
  const filteredEvents = allEvents.filter((evt) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        (evt.title || '').toLowerCase().includes(q) ||
        (evt.description || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterSource) {
      if (filterSource === 'task_dev') {
        return evt.source === 'task' && evt.division === 'developer';
      }
      if (filterSource === 'task_mkt') {
        return evt.source === 'task' && evt.division === 'marketing';
      }
      if (evt.source !== filterSource) return false;
    }
    return true;
  });

  // Source colors and badges
  const getEventBadge = (evt) => {
    switch (evt.source) {
      case 'task':
        return evt.division === 'marketing'
          ? 'bg-purple-100 text-purple-800 border-purple-200'
          : 'bg-blue-100 text-blue-800 border-blue-200';
      case 'content_publish':
        return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200';
      case 'bill':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'personal_task':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  const handleEventClick = (evt) => {
    if (evt.source === 'task') {
      const task = allTasks.find((t) => t.id === evt.relatedId);
      if (task) {
        if (task.division === 'marketing') openModal('content_detail', task);
        else openModal('task_detail', task);
      }
    } else if (evt.source === 'content_publish') {
      const task = allTasks.find((t) => t.id === evt.relatedId);
      if (task) openModal('content_detail', task);
    } else if (evt.source === 'personal_task') {
      const task = personalTasks.find((t) => t.id === evt.relatedId);
      if (task) openModal('personal_task_form', task);
    } else if (evt.source === 'bill') {
      const bill = bills.find((b) => b.id === evt.relatedId);
      if (bill) openModal('bill_pay_modal', bill);
    } else {
      openModal('calendar_event_form', evt);
    }
  };

  // Month grid calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    prevMonthDays.push(null);
  }

  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  const allCalendarDays = [...prevMonthDays, ...currentMonthDays];

  const today = new Date();

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            Unified Central Calendar
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Terintegrasi otomatis dengan seluruh deadline tugas divisi (Developer & Marketing), jadwal publikasi konten, tagihan, dan agenda.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshData()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200/80"
            title="Segarkan kalender"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => openModal('calendar_event_form')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Event Manual</span>
          </button>
        </div>
      </div>

      {/* Navigation & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Date Month Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors ml-1"
            >
              Hari Ini
            </button>
          </div>
          <span className="font-extrabold text-slate-800 text-sm capitalize">{monthName}</span>
        </div>

        {/* View Switcher & Filter */}
        <div className="flex items-center gap-2.5">
          <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setCalendarView('month')}
              className={`px-3 py-1 rounded-md transition-all ${
                calendarView === 'month'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setCalendarView('agenda')}
              className={`px-3 py-1 rounded-md transition-all ${
                calendarView === 'agenda'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda / List
            </button>
          </div>

          {/* Filter Source */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Semua Sumber ({allEvents.length})</option>
            {!isMarketing && (
              <option value="task_dev">
                Tugas Developer ({allEvents.filter((e) => e.source === 'task' && e.division === 'developer').length})
              </option>
            )}
            {!isDeveloper && (
              <option value="task_mkt">
                Tugas Marketing ({allEvents.filter((e) => e.source === 'task' && e.division === 'marketing').length})
              </option>
            )}
            {!isDeveloper && (
              <option value="content_publish">
                Publish Konten ({allEvents.filter((e) => e.source === 'content_publish').length})
              </option>
            )}
            {isOwner && (
              <option value="bill">
                Tagihan Finansial ({allEvents.filter((e) => e.source === 'bill').length})
              </option>
            )}
            {isOwner && (
              <option value="personal_task">
                Personal Task ({allEvents.filter((e) => e.source === 'personal_task').length})
              </option>
            )}
            <option value="manual">
              Event Manual ({allEvents.filter((e) => e.source === 'manual').length})
            </option>
          </select>
        </div>
      </div>

      {/* VIEW 1: MONTH VIEW */}
      {calendarView === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-xs font-bold text-slate-600">
            <span>Minggu</span>
            <span>Senin</span>
            <span>Selasa</span>
            <span>Rabu</span>
            <span>Kamis</span>
            <span>Jumat</span>
            <span>Sabtu</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
            {allCalendarDays.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="min-h-[110px] bg-slate-50/40 p-2" />;
              }

              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                day
              ).padStart(2, '0')}`;
              const dayEvents = filteredEvents.filter((e) => e.startDate && e.startDate.startsWith(dateStr));
              const isToday =
                today.getFullYear() === year &&
                today.getMonth() === month &&
                today.getDate() === day;

              return (
                <div
                  key={`day-${day}`}
                  className={`min-h-[110px] p-2 transition-colors hover:bg-slate-50/50 flex flex-col justify-between ${
                    isToday ? 'bg-indigo-50/30 ring-1 ring-inset ring-indigo-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-700'
                      }`}
                    >
                      {day}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayEvents.length} event
                      </span>
                    )}
                  </div>

                  {/* Day Events Stack */}
                  <div className="space-y-1 overflow-y-auto max-h-24">
                    {dayEvents.map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => handleEventClick(evt)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate cursor-pointer hover:opacity-90 hover:shadow-2xs transition-all border flex items-center gap-1 ${getEventBadge(
                          evt
                        )} ${evt.status === 'Done' ? 'line-through opacity-60' : ''}`}
                        title={`${evt.title} (${evt.category}) - Klik untuk buka`}
                      >
                        {evt.status === 'Done' && (
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        )}
                        <span className="truncate">{evt.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: AGENDA / LIST VIEW */}
      {calendarView === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100">
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada event atau tugas pada filter kalender yang dipilih.
            </div>
          ) : (
            filteredEvents
              .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
              .map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => handleEventClick(evt)}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 text-slate-600 shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEventBadge(
                            evt
                          )}`}
                        >
                          {evt.category}
                        </span>
                        <span
                          className={`text-xs font-bold text-slate-900 ${
                            evt.status === 'Done' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {evt.title}
                        </span>
                        {evt.status === 'Done' && (
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Selesai
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{evt.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-700 block">
                      {evt.startDate?.replace('T', ' ')?.slice(0, 16)}
                    </span>
                    <span className="text-[10px] text-indigo-600 font-semibold hover:underline">
                      Buka Detail →
                    </span>
                  </div>
                </div>
              ))
          )}
        </div>
      )}

      {/* Calendar Color Legend */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
            Indikator:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
            <span className="font-medium">Task Developer</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
            <span className="font-medium">Task Marketing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-fuchsia-500" />
            <span className="font-medium">Publish Konten</span>
          </div>
          {isOwner && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
                <span className="font-medium">Tagihan Finansial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span className="font-medium">Personal Task</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="font-medium">Event Manual</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-400 font-medium">
          Total {filteredEvents.length} jadwal terintegrasi
        </div>
      </div>
    </div>
  );
};
