import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { CalendarService, TaskService, PersonalTaskService, BillService } from '../../services/supabaseService';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';

export const UnifiedCalendarView = () => {
  const { currentUser, isOwner } = useAuth();
  const { openModal, searchQuery, refreshTrigger } = useApp();

  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'week' | 'day' | 'agenda'
  const [filterSource, setFilterSource] = useState('');

  // Fixed anchor around October 2026 for rich seeded data exploration
  const [currentDate, setCurrentDate] = useState(new Date('2026-10-12T00:00:00'));

  const [allEvents, setAllEvents] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [bills, setBills] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [evts, ts, pts, bs] = await Promise.all([
          CalendarService.getAll(currentUser.id),
          TaskService.getAll(currentUser),
          PersonalTaskService.getAll(currentUser.id),
          BillService.getAll(currentUser.id)
        ]);
        setAllEvents(evts);
        setAllTasks(ts);
        setPersonalTasks(pts);
        setBills(bs);
      } catch (err) {
        console.error(err);
      }
    };
    if (currentUser) fetchAll();
  }, [currentUser, refreshTrigger]);

  // Filter events
  const filteredEvents = allEvents.filter((evt) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        evt.title.toLowerCase().includes(q) || (evt.description || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (filterSource && evt.source !== filterSource) return false;
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
      const task = personalTasks.find(
        (t) => t.id === evt.relatedId
      );
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
  const month = currentDate.getMonth(); // 9 = October
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
            Mengintegrasikan seluruh deadline task tim, jadwal posting sosmed, jatuh tempo finansial, dan agenda pribadi.
          </p>
        </div>

        <button
          onClick={() => openModal('calendar_event_form')}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Event Manual</span>
        </button>
      </div>

      {/* Navigation & Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Date Month Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="font-extrabold text-slate-800 text-sm capitalize">{monthName}</span>
        </div>

        {/* View Switcher */}
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
              Agenda / List View
            </button>
          </div>

          {/* Filter Source */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
          >
            <option value="">Semua Sumber</option>
            <option value="task">Deadline Task Tim</option>
            <option value="content_publish">Jadwal Publish Konten</option>
            {isOwner && <option value="bill">Tagihan Finansial</option>}
            {isOwner && <option value="personal_task">Personal Task</option>}
            <option value="manual">Event Manual</option>
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
              const dayEvents = filteredEvents.filter((e) => e.startDate.startsWith(dateStr));
              const isToday = day === 12; // October 12 current simulated date

              return (
                <div
                  key={`day-${day}`}
                  className={`min-h-[110px] p-2 transition-colors hover:bg-slate-50/50 flex flex-col justify-between ${
                    isToday ? 'bg-indigo-50/20' : ''
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
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate cursor-pointer hover:opacity-80 transition-opacity border ${getEventBadge(
                          evt
                        )}`}
                        title={`${evt.title} (${evt.category})`}
                      >
                        {evt.title}
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
              Tidak ada event pada filter kalender.
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
                        <span className="text-xs font-bold text-slate-900">{evt.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{evt.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-700 block">
                      {evt.startDate.replace('T', ' ')}
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
    </div>
  );
};
