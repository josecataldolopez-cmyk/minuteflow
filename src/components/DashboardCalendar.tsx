import React, { useState, useMemo } from 'react';
import { ActionItem, ScheduleItem, MeetingMinute, Attendee } from '../types';

interface DashboardCalendarProps {
  actionItems: ActionItem[];
  schedule: ScheduleItem[];
  minutes: MeetingMinute[];
  allAttendees: Attendee[];
  onToggleActionItem: (id: string) => void;
  onAddActionItem: (
    text: string,
    dueDate?: string,
    priority?: 'Low' | 'Medium' | 'High',
    assignedTo?: Attendee
  ) => void;
  onSelectMinute: (minute: MeetingMinute) => void;
  onNewMinute: () => void;
}

type CalendarViewMode = 'month' | 'week' | 'list';
type CalendarFilter = 'all' | 'pending' | 'completed' | 'meetings' | 'high_priority';

export const DashboardCalendar: React.FC<DashboardCalendarProps> = ({
  actionItems,
  schedule,
  minutes,
  allAttendees,
  onToggleActionItem,
  onAddActionItem,
  onSelectMinute,
  onNewMinute
}) => {
  // Calendar Navigation State - Default to August 2026 (matching dataset current time)
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 7, 31)); // Aug 31, 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-08-31');
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [filter, setFilter] = useState<CalendarFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Task Creation on Selected Day
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('High');
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState<string>(allAttendees[0]?.id || '');

  // Year & Month details
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Navigate months
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToToday = () => {
    const today = new Date(2026, 7, 31);
    setCurrentDate(today);
    setSelectedDateStr('2026-08-31');
  };

  // Helper to format date as YYYY-MM-DD
  const formatDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Build calendar matrix for the month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Monday-based index (0 = Monday, 6 = Sunday)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        dateStr: formatDateKey(d),
        isCurrentMonth: false,
        isToday: formatDateKey(d) === '2026-08-31'
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        dateStr: formatDateKey(d),
        isCurrentMonth: true,
        isToday: formatDateKey(d) === '2026-08-31'
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        dateStr: formatDateKey(d),
        isCurrentMonth: false,
        isToday: formatDateKey(d) === '2026-08-31'
      });
    }

    return days;
  }, [year, month]);

  // Aggregate items by date
  const itemsByDate = useMemo(() => {
    const map: Record<
      string,
      {
        actions: ActionItem[];
        schedules: ScheduleItem[];
        nextSessions: MeetingMinute[];
      }
    > = {};

    // Map Action Items
    actionItems.forEach((action) => {
      // If action has a dueDate, map it, else map to fallback
      const dateKey = action.dueDate || '2026-08-31';
      if (!map[dateKey]) {
        map[dateKey] = { actions: [], schedules: [], nextSessions: [] };
      }
      map[dateKey].actions.push(action);
    });

    // Map Schedule Items
    schedule.forEach((sch) => {
      const dateKey = sch.date || '2026-08-31';
      if (!map[dateKey]) {
        map[dateKey] = { actions: [], schedules: [], nextSessions: [] };
      }
      map[dateKey].schedules.push(sch);
    });

    // Map Next Session Dates from minutes
    minutes.forEach((min) => {
      if (min.nextSessionDate) {
        if (!map[min.nextSessionDate]) {
          map[min.nextSessionDate] = { actions: [], schedules: [], nextSessions: [] };
        }
        map[min.nextSessionDate].nextSessions.push(min);
      }
    });

    return map;
  }, [actionItems, schedule, minutes]);

  // Filtered action items for the current selected month / filter
  const monthlyStats = useMemo(() => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const thisMonthActions = actionItems.filter((a) => (a.dueDate || '2026-08-31').startsWith(monthPrefix));
    const completed = thisMonthActions.filter((a) => a.completed).length;
    const pending = thisMonthActions.filter((a) => !a.completed).length;
    const highPriority = thisMonthActions.filter((a) => a.priority === 'High' && !a.completed).length;
    const rate = thisMonthActions.length > 0 ? Math.round((completed / thisMonthActions.length) * 100) : 0;

    return {
      total: thisMonthActions.length,
      completed,
      pending,
      highPriority,
      rate
    };
  }, [actionItems, year, month]);

  // Handle adding task on selected date
  const handleCreateTaskForSelectedDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    const assignedAttendee = allAttendees.find((a) => a.id === newTaskAssigneeId);
    onAddActionItem(newTaskText.trim(), selectedDateStr, newTaskPriority, assignedAttendee);

    setNewTaskText('');
    setIsAddingTask(false);
  };

  // Selected date data
  const selectedDayData = itemsByDate[selectedDateStr] || {
    actions: [],
    schedules: [],
    nextSessions: []
  };

  // Filtered actions for the selected day
  const filteredSelectedDayActions = selectedDayData.actions.filter((action) => {
    if (searchQuery.trim() && !action.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (filter === 'pending') return !action.completed;
    if (filter === 'completed') return action.completed;
    if (filter === 'high_priority') return action.priority === 'High';
    return true;
  });

  // Helper for priority color tag
  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'High':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Alta'
        };
      case 'Medium':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Media'
        };
      case 'Low':
      default:
        return {
          bg: 'bg-slate-100 text-slate-600 border-slate-200',
          dot: 'bg-slate-400',
          label: 'Baja'
        };
    }
  };

  // Helper for human date string
  const formatHumanDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Calendar Header Bar */}
      <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-indigo-600 text-[24px]">
              calendar_month
            </span>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              Calendario de Tareas y Vencimientos
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sincronizado
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualiza y gestiona los compromisos de las actas de reunión según su fecha de entrega.
          </p>
        </div>

        {/* View Switcher & Navigation Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
          {/* Month Switcher Controls */}
          <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-xs p-1">
            <button
              onClick={handlePrevMonth}
              title="Mes anterior"
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 min-w-[130px] text-center capitalize">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              title="Mes siguiente"
              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          <button
            onClick={handleGoToToday}
            className="px-3 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
          >
            Hoy
          </button>

          {/* View Mode (Mes / Semana / Agenda) */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mes
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Agenda
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Metrics Sub-header */}
      <div className="px-4 md:px-6 py-3 bg-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase tracking-wider">
            Filtro:
          </span>
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({actionItems.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              filter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Pendientes ({actionItems.filter((a) => !a.completed).length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Completadas ({actionItems.filter((a) => a.completed).length})
          </button>
          <button
            onClick={() => setFilter('high_priority')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              filter === 'high_priority'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Prioridad Alta
          </button>
        </div>

        {/* Quick Month Metrics */}
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Cumplimiento del mes:</span>
            <span className="text-indigo-600 font-bold">{monthlyStats.rate}%</span>
            <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{ width: `${monthlyStats.rate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid & Selected Day Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
        {/* Left Side: Calendar Grid (8 cols on lg) */}
        <div className="lg:col-span-8 p-3 md:p-6 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col">
          {viewMode === 'month' && (
            <div className="flex-1 flex flex-col">
              {/* Day Name Header Row */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {dayNames.map((d, i) => (
                  <div
                    key={d}
                    className={`text-xs font-bold py-1.5 ${
                      i >= 5 ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day Cells Grid */}
              <div className="grid grid-cols-7 gap-1.5 flex-1 auto-rows-fr">
                {calendarDays.map((dayItem) => {
                  const isSelected = dayItem.dateStr === selectedDateStr;
                  const dayData = itemsByDate[dayItem.dateStr];
                  const dayActions = dayData?.actions || [];
                  const daySchedules = dayData?.schedules || [];
                  const dayNextSessions = dayData?.nextSessions || [];

                  // Apply active filter to visible dots/chips
                  const filteredDayActions = dayActions.filter((a) => {
                    if (filter === 'pending') return !a.completed;
                    if (filter === 'completed') return a.completed;
                    if (filter === 'high_priority') return a.priority === 'High';
                    return true;
                  });

                  const totalCount =
                    filteredDayActions.length + daySchedules.length + dayNextSessions.length;

                  return (
                    <div
                      key={dayItem.dateStr}
                      onClick={() => setSelectedDateStr(dayItem.dateStr)}
                      className={`min-h-[85px] sm:min-h-[105px] p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-200'
                          : dayItem.isToday
                          ? 'border-indigo-300 bg-indigo-50/20 hover:border-indigo-400'
                          : dayItem.isCurrentMonth
                          ? 'border-slate-100 bg-white hover:border-slate-300 hover:shadow-xs'
                          : 'border-slate-50 bg-slate-50/60 text-slate-300 hover:bg-slate-100/50'
                      }`}
                    >
                      {/* Cell Header with Date Number and Badges */}
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            dayItem.isToday
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : isSelected
                              ? 'text-indigo-700 font-extrabold bg-indigo-100'
                              : dayItem.isCurrentMonth
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {dayItem.date.getDate()}
                        </span>

                        {totalCount > 0 && (
                          <div className="flex items-center gap-0.5">
                            {filteredDayActions.some((a) => !a.completed && a.priority === 'High') && (
                              <span
                                className="w-2 h-2 rounded-full bg-rose-500"
                                title="Tarea de alta prioridad"
                              />
                            )}
                            {filteredDayActions.length > 0 && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                  filteredDayActions.every((a) => a.completed)
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-indigo-100 text-indigo-800'
                                }`}
                              >
                                {filteredDayActions.length}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Items Preview Chips (Max 2 displayed) */}
                      <div className="space-y-1 overflow-hidden flex-1">
                        {/* Meetings */}
                        {daySchedules.slice(0, 1).map((sch) => (
                          <div
                            key={sch.id}
                            className="text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 rounded px-1 py-0.5 truncate flex items-center gap-1"
                            title={`Reunión: ${sch.title} (${sch.time} ${sch.ampm})`}
                          >
                            <span className="material-symbols-outlined text-[10px]">videocam</span>
                            <span className="truncate">{sch.title}</span>
                          </div>
                        ))}

                        {/* Action items */}
                        {filteredDayActions.slice(0, 2).map((action) => {
                          const priorityInfo = getPriorityBadge(action.priority);
                          return (
                            <div
                              key={action.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleActionItem(action.id);
                              }}
                              className={`text-[10px] font-medium rounded px-1 py-0.5 truncate flex items-center gap-1 border transition-colors ${
                                action.completed
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 line-through opacity-70'
                                  : `${priorityInfo.bg}`
                              }`}
                              title={`${action.text} - ${action.completed ? 'Completada' : 'Pendiente'}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  action.completed ? 'bg-emerald-500' : priorityInfo.dot
                                }`}
                              />
                              <span className="truncate flex-1">{action.text}</span>
                            </div>
                          );
                        })}

                        {filteredDayActions.length > 2 && (
                          <div className="text-[9px] font-bold text-slate-400 text-right pr-0.5">
                            +{filteredDayActions.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="text-xs font-bold text-slate-500 mb-1">
                Semana seleccionada alrededor del {formatHumanDate(selectedDateStr)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2 flex-1">
                {calendarDays.slice(0, 7).map((d) => {
                  const dayData = itemsByDate[d.dateStr];
                  const dayActions = dayData?.actions || [];
                  const daySchedules = dayData?.schedules || [];

                  return (
                    <div
                      key={d.dateStr}
                      onClick={() => setSelectedDateStr(d.dateStr)}
                      className={`p-3 rounded-xl border flex flex-col gap-2 cursor-pointer transition-all ${
                        d.dateStr === selectedDateStr
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-200'
                          : 'border-slate-200 bg-white hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                        <span className="text-xs font-bold text-slate-800">
                          {d.date.toLocaleDateString('es-ES', { weekday: 'short' })}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{d.date.getDate()}</span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto">
                        {daySchedules.map((s) => (
                          <div
                            key={s.id}
                            className="text-[11px] p-1.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200/60 font-semibold"
                          >
                            🕒 {s.time} {s.ampm} - {s.title}
                          </div>
                        ))}

                        {dayActions.map((a) => (
                          <div
                            key={a.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleActionItem(a.id);
                            }}
                            className={`text-[11px] p-1.5 rounded-lg border flex items-start gap-1.5 ${
                              a.completed
                                ? 'bg-slate-50 text-slate-400 line-through border-slate-200'
                                : 'bg-white text-slate-800 border-slate-200 shadow-xs'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={a.completed}
                              readOnly
                              className="mt-0.5 rounded text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-xs leading-snug">{a.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
              <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Todos los Compromisos Ordenados por Fecha de Vencimiento
              </div>

              {actionItems
                .slice()
                .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
                .map((action) => {
                  const priorityInfo = getPriorityBadge(action.priority);
                  return (
                    <div
                      key={action.id}
                      onClick={() => action.dueDate && setSelectedDateStr(action.dueDate)}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer ${
                        action.completed
                          ? 'bg-slate-50 border-slate-200 opacity-75'
                          : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={action.completed}
                          onChange={() => onToggleActionItem(action.id)}
                          className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <div>
                          <p
                            className={`text-sm font-semibold ${
                              action.completed ? 'line-through text-slate-400' : 'text-slate-900'
                            }`}
                          >
                            {action.text}
                          </p>
                          {action.sourceMinuteTitle && (
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span className="material-symbols-outlined text-[13px] text-slate-400">
                                description
                              </span>
                              Acta: {action.sourceMinuteTitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${priorityInfo.bg}`}
                        >
                          {priorityInfo.label}
                        </span>

                        <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl border border-slate-200/60 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px] text-slate-500">
                            event
                          </span>
                          {action.dueDate || 'Sin fecha'}
                        </span>

                        {action.assignedTo && (
                          <img
                            src={action.assignedTo.avatarUrl}
                            alt={action.assignedTo.name}
                            title={`Asignado a ${action.assignedTo.name}`}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Right Side: Day Details & Quick Add Inspector (4 cols on lg) */}
        <div className="lg:col-span-4 p-4 md:p-6 bg-slate-50/70 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            {/* Header for the Selected Day */}
            <div className="border-b border-slate-200/80 pb-3 flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Detalle del Día
                </span>
                <h4 className="text-base font-bold text-slate-900 capitalize">
                  {formatHumanDate(selectedDateStr)}
                </h4>
              </div>

              <button
                onClick={() => setIsAddingTask(true)}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-2.5 py-1 rounded-xl transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                title="Agregar tarea para este día"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>Tarea</span>
              </button>
            </div>

            {/* Quick Add Form on Selected Day */}
            {isAddingTask && (
              <form
                onSubmit={handleCreateTaskForSelectedDate}
                className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-md space-y-2.5 animate-in fade-in"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">
                    Nueva Tarea para {selectedDateStr}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <input
                  type="text"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  placeholder="Descripción del compromiso..."
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  autoFocus
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      Prioridad
                    </label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) =>
                        setNewTaskPriority(e.target.value as 'Low' | 'Medium' | 'High')
                      }
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50"
                    >
                      <option value="High">Alta</option>
                      <option value="Medium">Media</option>
                      <option value="Low">Baja</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      Asignar a
                    </label>
                    <select
                      value={newTaskAssigneeId}
                      onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                      className="w-full text-xs p-1.5 rounded-lg border border-slate-200 bg-slate-50"
                    >
                      {allAttendees.map((att) => (
                        <option key={att.id} value={att.id}>
                          {att.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingTask(false)}
                    className="text-xs font-semibold text-slate-500 hover:bg-slate-100 px-2.5 py-1 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-lg shadow-xs"
                  >
                    Guardar Tarea
                  </button>
                </div>
              </form>
            )}

            {/* Scheduled Meetings on This Day */}
            {selectedDayData.schedules.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Reuniones Agendadas ({selectedDayData.schedules.length})
                </span>
                {selectedDayData.schedules.map((sch) => (
                  <div
                    key={sch.id}
                    className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs flex justify-between items-center group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {sch.time} {sch.ampm}
                        </span>
                        <h5 className="text-xs font-bold text-slate-900 truncate max-w-[170px]">
                          {sch.title}
                        </h5>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{sch.participants}</p>
                    </div>

                    <button
                      onClick={onNewMinute}
                      className="text-xs bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 font-semibold p-1.5 rounded-lg transition-colors"
                      title="Crear acta para esta reunión"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Items Due on This Day */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                <span>Tareas con Vencimiento ({filteredSelectedDayActions.length})</span>
                {filteredSelectedDayActions.length > 0 && (
                  <span className="text-indigo-600 font-semibold lowercase">
                    {filteredSelectedDayActions.filter((a) => a.completed).length} completadas
                  </span>
                )}
              </span>

              {filteredSelectedDayActions.length === 0 ? (
                <div className="text-center py-6 bg-white/60 rounded-xl border border-dashed border-slate-200 p-4">
                  <span className="material-symbols-outlined text-slate-300 text-[28px] mb-1">
                    task_alt
                  </span>
                  <p className="text-xs text-slate-500 font-medium">
                    No hay tareas con vencimiento para esta fecha.
                  </p>
                  <button
                    onClick={() => setIsAddingTask(true)}
                    className="text-xs text-indigo-600 font-bold hover:underline mt-2 inline-block cursor-pointer"
                  >
                    + Agregar una tarea aquí
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredSelectedDayActions.map((action) => {
                    const priorityInfo = getPriorityBadge(action.priority);
                    return (
                      <div
                        key={action.id}
                        className={`p-2.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                          action.completed
                            ? 'bg-slate-100/70 border-slate-200 opacity-70'
                            : 'bg-white border-slate-200 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={action.completed}
                            onChange={() => onToggleActionItem(action.id)}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer shrink-0"
                          />
                          <span
                            className={`text-xs font-semibold leading-snug flex-1 ${
                              action.completed
                                ? 'line-through text-slate-400'
                                : 'text-slate-800'
                            }`}
                          >
                            {action.text}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pl-6 text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold border ${priorityInfo.bg}`}
                          >
                            {priorityInfo.label}
                          </span>

                          {action.assignedTo && (
                            <div className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/60">
                              <img
                                src={action.assignedTo.avatarUrl}
                                alt={action.assignedTo.name}
                                className="w-3.5 h-3.5 rounded-full object-cover"
                              />
                              <span className="font-semibold">{action.assignedTo.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Next Sessions / Seguimiento */}
            {selectedDayData.nextSessions.length > 0 && (
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs">
                <span className="font-bold text-indigo-900 flex items-center gap-1 mb-1">
                  <span className="material-symbols-outlined text-[16px] text-indigo-600">
                    event_repeat
                  </span>
                  Próxima Sesión Programada
                </span>
                {selectedDayData.nextSessions.map((min) => (
                  <div
                    key={min.id}
                    onClick={() => onSelectMinute(min)}
                    className="text-indigo-800 hover:text-indigo-900 font-semibold cursor-pointer underline truncate"
                  >
                    {min.title}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Calendar Footer Info */}
          <div className="pt-3 border-t border-slate-200/70 text-[11px] text-slate-400 flex justify-between items-center">
            <span>Google Calendar Sync: Activo</span>
            <button
              onClick={onNewMinute}
              className="text-indigo-600 font-semibold hover:underline"
            >
              Nueva Acta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
