import React, { useState, useEffect } from 'react';
import { fetchApi, Meeting } from '../../lib/api';

interface TeamOption {
  id: string;
  name: string;
}

interface ProjectOption {
  id: string;
  name: string;
  teamId: string;
}

export default function CalendarView() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');

  // Modal / Form state for new meeting
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form inputs
  const [title, setTitle] = useState('');
  const [teamId, setTeamId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [startTimeStr, setStartTimeStr] = useState('09:00');
  const [endTimeStr, setEndTimeStr] = useState('10:00');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [meetingsData, teamsData] = await Promise.all([
        fetchApi<Meeting[]>('/meetings'),
        fetchApi<TeamOption[]>('/teams'),
      ]);
      setMeetings(meetingsData);
      setTeams(teamsData);
      if (teamsData.length > 0 && !teamId) {
        setTeamId(teamsData[0].id);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch projects when team changes in modal
  useEffect(() => {
    if (teamId) {
      fetchApi<ProjectOption[]>(`/projects?teamId=${teamId}`)
        .then((data) => setProjects(data))
        .catch(() => setProjects([]));
    } else {
      setProjects([]);
    }
  }, [teamId]);

  // Open modal with preselected date
  const handleOpenModal = (date?: Date) => {
    const targetDate = date || selectedDate || new Date();
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    setStartDateStr(`${yyyy}-${mm}-${dd}`);
    setErrorMessage('');
    setSuccessMessage('');
    setShowModal(true);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !teamId || !startDateStr || !startTimeStr || !endTimeStr) {
      setErrorMessage('Por favor completa los campos obligatorios (*)');
      return;
    }

    try {
      setSaving(true);
      setErrorMessage('');

      const startDateTime = new Date(`${startDateStr}T${startTimeStr}:00`);
      const endDateTime = new Date(`${startDateStr}T${endTimeStr}:00`);

      if (endDateTime <= startDateTime) {
        setErrorMessage('La hora de fin debe ser posterior a la hora de inicio.');
        setSaving(false);
        return;
      }

      await fetchApi<Meeting>('/meetings', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          meetingUrl: meetingUrl.trim() || undefined,
          location: location.trim() || undefined,
          teamId,
          projectId: projectId || undefined,
        }),
      });

      setSuccessMessage('¡Reunión programada y notificaciones con .ics enviadas a los miembros del equipo!');
      setTimeout(() => {
        setShowModal(false);
        setSuccessMessage('');
        setTitle('');
        setMeetingUrl('');
        setLocation('');
        setDescription('');
        setProjectId('');
        loadData();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al programar la reunión.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!confirm('¿Estás seguro de cancelar y eliminar esta reunión?')) return;
    try {
      await fetchApi(`/meetings/${meetingId}`, { method: 'DELETE' });
      setMeetings(meetings.filter((m) => m.id !== meetingId));
    } catch (err: any) {
      alert(err.message || 'Error eliminando la reunión');
    }
  };

  // Calendar Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Filter meetings by team
  const filteredMeetings = meetings.filter((m) => {
    if (selectedTeamFilter === 'ALL') return true;
    return m.teamId === selectedTeamFilter;
  });

  // Month Matrix Days
  const calendarCells = [];
  // Prev month filler
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }
  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }
  // Next month filler
  const remaining = 42 - calendarCells.length;
  for (let i = 1; i <= remaining; i++) {
    calendarCells.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const getMeetingsForDay = (date: Date) => {
    return filteredMeetings.filter((m) => isSameDay(new Date(m.startTime), date));
  };

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // Meetings for selected date
  const selectedDateMeetings = selectedDate ? getMeetingsForDay(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D40000]"></span>
            <span className="text-xs font-black uppercase tracking-wider text-gray-500">Gestión de Calendario</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reuniones de Equipos y Proyectos</h1>
          <p className="text-sm text-gray-500 mt-1">
            Coordina sesiones virtuales y sincroniza automáticamente las agendas de los miembros con Google Calendar, Outlook y archivos ICS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Team Filter */}
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none cursor-pointer"
          >
            <option value="ALL">Todos los Equipos</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* New Meeting Button */}
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 bg-[#D40000] hover:bg-[#B00000] text-white text-sm font-bold rounded-xl shadow-md shadow-[#D40000]/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>+ Programar Reunión</span>
          </button>
        </div>
      </div>

      {/* Main Calendar Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm">
          {/* Calendar Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 capitalize tracking-tight">{monthName}</h2>
              <button
                onClick={goToToday}
                className="ml-2 px-2.5 py-1 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
              >
                Hoy
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Grid / Agenda toggle */}
              <div className="bg-gray-100 p-1 rounded-xl flex items-center">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Mes
                </button>
                <button
                  onClick={() => setViewMode('agenda')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    viewMode === 'agenda' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Lista
                </button>
              </div>

              {/* Prev / Next */}
              <div className="flex items-center gap-1">
                <button
                  onClick={prevMonth}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
                  title="Mes anterior"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                  </svg>
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
                  title="Mes siguiente"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                  <div key={day} className="text-xs font-black uppercase tracking-wider text-gray-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((cell, idx) => {
                  const dayMeetings = getMeetingsForDay(cell.date);
                  const isToday = isSameDay(cell.date, new Date());
                  const isSelected = selectedDate && isSameDay(cell.date, selectedDate);

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(cell.date)}
                      onDoubleClick={() => handleOpenModal(cell.date)}
                      className={`min-h-[75px] sm:min-h-[85px] p-1.5 border rounded-xl flex flex-col justify-between transition-all cursor-pointer select-none ${
                        !cell.isCurrentMonth
                          ? 'bg-gray-50/50 border-gray-100 text-gray-300'
                          : isSelected
                          ? 'bg-red-50/40 border-[#D40000] ring-1 ring-[#D40000]'
                          : 'bg-white border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full ${
                            isToday
                              ? 'bg-[#D40000] text-white shadow-sm'
                              : isSelected
                              ? 'text-[#D40000]'
                              : cell.isCurrentMonth
                              ? 'text-gray-700'
                              : 'text-gray-400'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>
                        {dayMeetings.length > 0 && (
                          <span className="w-2 h-2 rounded-full bg-[#D40000]"></span>
                        )}
                      </div>

                      {/* Small Meeting pills */}
                      <div className="mt-1 space-y-1 overflow-hidden">
                        {dayMeetings.slice(0, 2).map((m) => (
                          <div
                            key={m.id}
                            className="text-[10px] font-semibold bg-red-100/70 text-[#900] px-1.5 py-0.5 rounded truncate"
                            title={m.title}
                          >
                            {new Date(m.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}{' '}
                            {m.title}
                          </div>
                        ))}
                        {dayMeetings.length > 2 && (
                          <div className="text-[9px] font-bold text-gray-400 pl-1">
                            +{dayMeetings.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Agenda / List Mode */
            <div className="space-y-3">
              {filteredMeetings.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <p className="font-semibold text-gray-600">No hay reuniones programadas</p>
                  <p className="text-xs text-gray-400 mt-1">Crea una nueva reunión con el botón superior.</p>
                </div>
              ) : (
                filteredMeetings.map((m) => {
                  const start = new Date(m.startTime);
                  const end = new Date(m.endTime);
                  const team = teams.find((t) => t.id === m.teamId);

                  // Direct link for Google Calendar
                  const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                    m.title,
                  )}&dates=${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${
                    end.toISOString().replace(/[-:]/g, '').split('.')[0]
                  }Z&details=${encodeURIComponent(m.description || '')}&location=${encodeURIComponent(m.meetingUrl || m.location || '')}`;

                  return (
                    <div
                      key={m.id}
                      className="p-4 bg-gray-50/80 hover:bg-gray-100/80 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-red-100 text-[#D40000] text-[10px] font-black uppercase rounded-full">
                            {team?.name || 'Equipo'}
                          </span>
                          <span className="text-xs font-semibold text-gray-500">
                            {start.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} &bull;{' '}
                            {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-gray-900">{m.title}</h4>
                        {m.description && <p className="text-xs text-gray-600 mt-0.5">{m.description}</p>}
                        {m.meetingUrl && (
                          <a
                            href={m.meetingUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#D40000] hover:underline mt-1.5"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            Unirse a la llamada
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={gCalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm"
                          title="Añadir a Google Calendar"
                        >
                          + GCal
                        </a>
                        <button
                          onClick={() => handleDeleteMeeting(m.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg cursor-pointer"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Selected Day Panel / Agenda Sidebar (1 col) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Reuniones del Día</span>
              <h3 className="text-base font-bold text-gray-900 capitalize">
                {selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </h3>
            </div>
            <button
              onClick={() => handleOpenModal(selectedDate || new Date())}
              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-[#D40000] text-xs font-bold rounded-lg cursor-pointer transition-colors"
            >
              + Agregar
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 space-y-3">
            {selectedDateMeetings.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <svg className="w-10 h-10 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-sm font-semibold text-gray-600">Sin reuniones para este día</p>
                <p className="text-xs text-gray-400 mt-1">Haz doble clic en cualquier fecha para agendar.</p>
              </div>
            ) : (
              selectedDateMeetings.map((m) => {
                const start = new Date(m.startTime);
                const end = new Date(m.endTime);
                const team = teams.find((t) => t.id === m.teamId);

                const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                  m.title,
                )}&dates=${start.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${
                  end.toISOString().replace(/[-:]/g, '').split('.')[0]
                }Z&details=${encodeURIComponent(m.description || '')}&location=${encodeURIComponent(m.meetingUrl || m.location || '')}`;

                return (
                  <div
                    key={m.id}
                    className="p-4 bg-gray-50 border-l-4 border-l-[#D40000] border-gray-200 rounded-r-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        {team?.name}
                      </span>
                      <span className="text-xs font-bold text-gray-700">
                        {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-gray-900">{m.title}</h4>

                    {m.description && <p className="text-xs text-gray-600 leading-relaxed">{m.description}</p>}

                    {m.meetingUrl && (
                      <div className="pt-1">
                        <a
                          href={m.meetingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D40000] hover:bg-[#B00000] text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          <span>Entrar a Reunión</span>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                          </svg>
                        </a>
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                      <a
                        href={gCalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-bold text-gray-500 hover:text-gray-900"
                      >
                        📅 Añadir a Google Cal
                      </a>
                      <button
                        onClick={() => handleDeleteMeeting(m.id)}
                        className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Programar Reunión */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D40000]"></span>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Programar Nueva Reunión</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleCreateMeeting} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Título de la Reunión *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Sprint Planning, Revisión de Arquitectura"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Equipo Convocado *
                  </label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none cursor-pointer"
                  >
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Proyecto (Opcional)
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none cursor-pointer"
                  >
                    <option value="">General del Equipo</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Inicio *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTimeStr}
                    onChange={(e) => setStartTimeStr(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    Fin *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTimeStr}
                    onChange={(e) => setEndTimeStr(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Enlace de Reunión (Google Meet / Zoom / Teams)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/xyz-abc-123"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Descripción o Agenda
                </label>
                <textarea
                  rows={2}
                  placeholder="Temas a tratar en la sesión..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
                ></textarea>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-[11px] text-gray-500 leading-relaxed">
                📧 <strong>Notificación Automática:</strong> Se enviará un correo con formato oficial BNI a todos los miembros con el archivo <code>.ics</code> adjunto y botones directos para agregar a su Google Calendar u Outlook.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#D40000] hover:bg-[#B00000] text-white text-sm font-bold rounded-xl shadow-md shadow-[#D40000]/20 disabled:opacity-50 cursor-pointer transition-all"
                >
                  {saving ? 'Programando y enviando...' : 'Confirmar y Notificar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
