import React, { useState } from 'react';
import {
  MeetingMinute,
  ScheduleItem,
  ActionItem,
  ViewMode,
  UserProfile,
  Attendee
} from '../types';
import { DashboardCalendar } from './DashboardCalendar';

interface DashboardViewProps {
  schedule: ScheduleItem[];
  actionItems: ActionItem[];
  recentMinutes: MeetingMinute[];
  allAttendees: Attendee[];
  onToggleActionItem: (id: string) => void;
  onAddActionItem: (
    text: string,
    dueDate?: string,
    priority?: 'Low' | 'Medium' | 'High',
    assignedTo?: Attendee
  ) => void;
  onSelectMinute: (minute: MeetingMinute) => void;
  onOpenExport: (minute: MeetingMinute) => void;
  onNewMinute: () => void;
  onNavigate: (view: ViewMode) => void;
  userProfile: UserProfile;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  schedule,
  actionItems,
  recentMinutes,
  allAttendees,
  onToggleActionItem,
  onAddActionItem,
  onSelectMinute,
  onOpenExport,
  onNewMinute,
  onNavigate,
  userProfile
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar'>('overview');
  const [newActionText, setNewActionText] = useState('');
  const [newActionDueDate, setNewActionDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newActionPriority, setNewActionPriority] = useState<'Low' | 'Medium' | 'High'>('High');
  const [newActionAssigneeId, setNewActionAssigneeId] = useState<string>(allAttendees[0]?.id || '');
  const [isAddingAction, setIsAddingAction] = useState(false);

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newActionText.trim()) {
      const assigned = allAttendees.find((a) => a.id === newActionAssigneeId);
      onAddActionItem(newActionText.trim(), newActionDueDate, newActionPriority, assigned);
      setNewActionText('');
      setIsAddingAction(false);
    }
  };

  const firstName = userProfile.name.split(' ')[0] || userProfile.name;

  // Pending action items count
  const pendingCount = actionItems.filter((a) => !a.completed).length;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 custom-scrollbar">
      <div className="max-w-7xl mx-auto pb-24 space-y-6">
        {/* Welcome Briefing Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Bienvenida/o de nuevo, {firstName}</span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {userProfile.role} • {userProfile.department || 'Dirección General'} — Este es tu resumen ejecutivo y calendario de compromisos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('library')}
              className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] text-slate-500">inventory_2</span>
              <span>Todas las Actas ({recentMinutes.length})</span>
            </button>
            <button
              onClick={onNewMinute}
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Crear Acta</span>
            </button>
          </div>
        </div>

        {/* Top View Selector Tabs (Resumen vs Calendario) */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
          <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">dashboard</span>
              <span>Resumen Ejecutivo</span>
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>Calendario de Tareas</span>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {actionItems.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {pendingCount} tareas pendientes
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {actionItems.length - pendingCount} completadas
            </span>
          </div>
        </div>

        {/* Tab 1: Resumen Ejecutivo (Bento Grid) */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 auto-rows-min">
              {/* Upcoming Schedule (Span 8) */}
              <div className="bento-card md:col-span-8 flex flex-col h-full min-h-[320px] p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600 text-[22px]">event</span>
                      Agenda y Sesiones Programadas
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Próximas reuniones de directorio y sincronizaciones de equipo
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold cursor-pointer flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                    <span>Ver en Calendario</span>
                  </button>
                </div>

                <div className="space-y-3 flex-1">
                  {schedule.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => onNewMinute()}
                      className="flex items-center gap-4 p-3.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/70 transition-all group cursor-pointer"
                    >
                      <div
                        className={`${
                          idx === 0
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : 'bg-slate-100 text-slate-700 border border-slate-200/60'
                        } p-2 rounded-xl text-center min-w-[64px] shrink-0`}
                      >
                        <div className="text-base font-bold leading-none">{item.time}</div>
                        <div className="text-[10px] font-bold uppercase mt-0.5 tracking-wider">
                          {item.ampm}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="material-symbols-outlined text-[14px] text-slate-400">group</span>
                          <span className="truncate">{item.participants}</span>
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200/50">
                          {item.platform}
                        </span>
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-indigo-600 text-[18px] opacity-0 group-hover:opacity-100 transition-opacity">
                          edit_note
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Items (Span 4) */}
              <div className="bento-card md:col-span-4 flex flex-col h-full min-h-[320px] p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-emerald-600 text-[22px] material-symbols-fill">
                        task_alt
                      </span>
                      Tareas y Acuerdos
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {pendingCount} pendientes de resolución
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAddingAction(!isAddingAction)}
                    title="Agregar tarea o acuerdo"
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold hover:bg-indigo-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>

                {/* Inline Add Action Item */}
                {isAddingAction && (
                  <form onSubmit={handleActionSubmit} className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <input
                      type="text"
                      value={newActionText}
                      onChange={(e) => setNewActionText(e.target.value)}
                      placeholder="Nueva tarea o compromiso..."
                      className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                      autoFocus
                    />
                    <div className="grid grid-cols-2 gap-1.5">
                      <input
                        type="date"
                        value={newActionDueDate}
                        onChange={(e) => setNewActionDueDate(e.target.value)}
                        className="text-xs p-1 rounded border border-slate-200 bg-white"
                      />
                      <select
                        value={newActionPriority}
                        onChange={(e) => setNewActionPriority(e.target.value as any)}
                        className="text-xs p-1 rounded border border-slate-200 bg-white"
                      >
                        <option value="High">Alta</option>
                        <option value="Medium">Media</option>
                        <option value="Low">Baja</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingAction(false)}
                        className="text-xs text-slate-500 px-2 py-1"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1 rounded-lg font-medium shadow-xs"
                      >
                        Guardar
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[320px]">
                  {actionItems.slice(0, 5).map((action) => (
                    <div
                      key={action.id}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 transition-colors cursor-pointer group ${
                        action.completed ? 'opacity-60 bg-slate-50/50' : 'bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={action.completed}
                        onChange={() => onToggleActionItem(action.id)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-medium ${
                            action.completed ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {action.text}
                        </p>
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            📅 {action.dueDate || 'Sin fecha'}
                          </span>
                          {action.assignedTo && (
                            <img
                              src={action.assignedTo.avatarUrl}
                              alt={action.assignedTo.name}
                              title={action.assignedTo.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {actionItems.length > 5 && (
                    <button
                      onClick={() => setActiveTab('calendar')}
                      className="w-full text-center py-1.5 text-xs text-indigo-600 font-bold hover:underline"
                    >
                      Ver todas ({actionItems.length}) en el Calendario →
                    </button>
                  )}
                </div>
              </div>

              {/* Recent Minutes (Span 12) */}
              <div className="bento-card md:col-span-12 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-indigo-600 text-[22px]">history</span>
                      Actas Recientes de Directorio
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Documentos ejecutivos redactados y acuerdos consolidados
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate('library')}
                    className="text-indigo-600 hover:text-indigo-700 text-xs font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <span>Ver Biblioteca</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  {recentMinutes.slice(0, 3).map((minute) => (
                    <div
                      key={minute.id}
                      onClick={() => onSelectMinute(minute)}
                      className="border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer bg-white group relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Status Indicator Bar */}
                      <div
                        className={`absolute top-0 left-0 w-1.5 h-full ${
                          minute.status === 'Approved' || minute.status === 'Aprobada'
                            ? 'bg-emerald-500'
                            : 'bg-indigo-600'
                        }`}
                      />

                      <div>
                        <div className="flex justify-between items-start mb-2 pl-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                              minute.status === 'Approved' || minute.status === 'Aprobada'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200/50'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              {minute.status === 'Approved' || minute.status === 'Aprobada'
                                ? 'check_circle'
                                : 'pending'}
                            </span>
                            {minute.status}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {minute.formattedDate}
                          </span>
                        </div>

                        <h4 className="text-base font-semibold text-slate-900 mb-1 pl-2 group-hover:text-indigo-600 transition-colors">
                          {minute.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 pl-2 mb-4 leading-relaxed">
                          {minute.pointsTreated.split('\n')[0]?.replace(/^[•\-\*]\s*/, '') ||
                            minute.objectives ||
                            'Puntos de acuerdo capturados durante la reunión ejecutiva.'}
                        </p>
                      </div>

                      <div className="pl-2 pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                        <div className="flex -space-x-2 overflow-hidden">
                          {minute.attendees.map((att) => (
                            <img
                              key={att.id}
                              src={att.avatarUrl}
                              alt={att.name}
                              title={att.name}
                              className="w-7 h-7 rounded-full border-2 border-white object-cover"
                            />
                          ))}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenExport(minute);
                          }}
                          title="Exportar y Compartir"
                          className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-1.5 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">ios_share</span>
                          <span className="hidden sm:inline font-semibold">Exportar</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Full-Featured Calendar Visualization */}
        {activeTab === 'calendar' && (
          <div className="animate-in fade-in">
            <DashboardCalendar
              actionItems={actionItems}
              schedule={schedule}
              minutes={recentMinutes}
              allAttendees={allAttendees}
              onToggleActionItem={onToggleActionItem}
              onAddActionItem={onAddActionItem}
              onSelectMinute={onSelectMinute}
              onNewMinute={onNewMinute}
            />
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={onNewMinute}
        id="btn-fab-new-minute"
        title="Iniciar Nueva Acta con Voz o Texto"
        className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-xl shadow-indigo-200 hover:scale-105 transition-all duration-200 flex items-center justify-center z-40 group cursor-pointer ring-4 ring-white"
      >
        <span className="material-symbols-outlined text-[28px] material-symbols-fill">mic</span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2.5 transition-all duration-300 font-semibold text-sm">
          Nueva Acta
        </span>
      </button>
    </div>
  );
};
