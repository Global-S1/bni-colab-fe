import React, { useEffect, useState } from 'react';
import { fetchApi } from '../../lib/api';

interface ProjectItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  teamId: string;
  teamName: string;
  teamCode: string;
  taskCount: number;
  completedTaskCount: number;
  createdAt: string;
}

interface TeamItem {
  id: string;
  code: string;
  name: string;
}

export const ProjectsListView: React.FC = () => {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'progress'>('newest');

  // Modal for new project quick creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectTeamId, setNewProjectTeamId] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projsRes, teamsRes] = await Promise.all([
        fetchApi<ProjectItem[]>('/projects'),
        fetchApi<TeamItem[]>('/teams'),
      ]);
      setProjects(projsRes || []);
      setTeams(teamsRes || []);
      if (teamsRes && teamsRes.length > 0) {
        setNewProjectTeamId(teamsRes[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los proyectos.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectTeamId || !newProjectName.trim()) return;
    setCreating(true);
    setCreateError(null);

    try {
      const newProj = await fetchApi<ProjectItem>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          teamId: newProjectTeamId,
          name: newProjectName.trim(),
          description: newProjectDesc.trim(),
        }),
      });
      setShowCreateModal(false);
      window.location.href = `/projects/${newProj.id}`;
    } catch (err: any) {
      setCreateError(err.message || 'Error al crear el proyecto.');
    } finally {
      setCreating(false);
    }
  };

  // Filter and Sort projects
  const filteredProjects = projects.filter((p) => {
    // Search query filter
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      p.name.toLowerCase().includes(query) ||
      (p.code && p.code.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.teamName && p.teamName.toLowerCase().includes(query));

    // Status filter
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;

    // Team filter
    const matchesTeam = selectedTeamId === 'ALL' || p.teamId === selectedTeamId;

    return matchesSearch && matchesStatus && matchesTeam;
  });

  // Sort
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    if (sortBy === 'progress') {
      const progA = a.taskCount > 0 ? a.completedTaskCount / a.taskCount : 0;
      const progB = b.taskCount > 0 ? b.completedTaskCount / b.taskCount : 0;
      return progB - progA;
    }
    return 0;
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedStatus('ALL');
    setSelectedTeamId('ALL');
    setSortBy('newest');
  };

  const isFilterActive = search !== '' || selectedStatus !== 'ALL' || selectedTeamId !== 'ALL' || sortBy !== 'newest';

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-[#D40000] uppercase tracking-[0.3em]">
              Visibilidad Autorizada
            </span>
            <span className="bg-[#D40000]/10 text-[#D40000] text-[10px] font-black px-2 py-0.5 rounded-full">
              {filteredProjects.length} Proyectos
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
            Proyectos de <span className="text-[#D40000]">Trabajo</span>
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">
            Lista consolidada de proyectos a los que tienes acceso directo según tus equipos y permisos.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-[#D40000]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Filter Menu Box */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#D40000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="text-xs font-black uppercase tracking-wider text-gray-800">
              Filtros y Búsqueda
            </span>
          </div>

          {isFilterActive && (
            <button
              onClick={clearFilters}
              className="text-[11px] font-bold text-[#D40000] hover:underline cursor-pointer flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Limpiar Filtros</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código o nombre..."
              className="w-full brand-input pl-9 text-xs"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full brand-input text-xs"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVE">🟢 Activo</option>
              <option value="COMPLETED">🔵 Completado</option>
              <option value="ARCHIVED">⚪ Archivado</option>
            </select>
          </div>

          {/* Filter Team */}
          <div>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full brand-input text-xs"
            >
              <option value="ALL">Todos los Equipos</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.code ? `[${t.code}] ` : ''}{t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full brand-input text-xs"
            >
              <option value="newest">Más Recientes primero</option>
              <option value="oldest">Más Antiguos primero</option>
              <option value="name">Nombre (A - Z)</option>
              <option value="progress">Mayor Avance %</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-[#D40000] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cargando proyectos autorizados...</p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
          <button onClick={loadData} className="font-bold underline cursor-pointer">
            Reintentar
          </button>
        </div>
      )}

      {/* Empty / No Results */}
      {!loading && !error && sortedProjects.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">No se encontraron proyectos</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
              {isFilterActive
                ? 'Ningún proyecto coincide con los filtros aplicados. Intenta borrar los criterios de búsqueda.'
                : 'Aún no perteneces a ningún equipo con proyectos o no se han creado proyectos.'}
            </p>
          </div>
          {isFilterActive && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && sortedProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedProjects.map((p) => {
            const progress = p.taskCount > 0 ? Math.round((p.completedTaskCount / p.taskCount) * 100) : 0;

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent top border line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D40000] to-[#8B0000] opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-4">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.code && (
                        <span className="font-mono text-[10px] font-black px-2 py-0.5 bg-[#D40000]/10 text-[#D40000] border border-[#D40000]/20 rounded-md">
                          {p.code}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                        {p.teamCode ? `${p.teamCode} • ` : ''}{p.teamName}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'COMPLETED'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : p.status === 'ARCHIVED'
                          ? 'bg-gray-100 text-gray-600 border border-gray-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {p.status === 'COMPLETED' ? 'Completado' : p.status === 'ARCHIVED' ? 'Archivado' : 'Activo'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#D40000] transition-colors leading-snug">
                      {p.name}
                    </h3>
                    {p.description && (
                      <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Progress Indicator */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-gray-500">Progreso</span>
                      <span className={progress === 100 ? 'text-emerald-600' : 'text-gray-900'}>
                        {progress}% ({p.completedTaskCount}/{p.taskCount} Tareas)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          progress === 100
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-[#D40000] to-[#8B0000]'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>

                  <a
                    href={`/projects/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#D40000] hover:text-[#8B0000] hover:translate-x-1 transition-all"
                  >
                    <span>Abrir Proyecto</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 p-6 md:p-8 space-y-6 relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-[#D40000] uppercase tracking-widest">Creación Rápida</p>
                <h3 className="text-xl font-bold text-gray-900">Nuevo Proyecto</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Equipo Responsable <span className="text-[#D40000]">*</span>
                </label>
                <select
                  required
                  value={newProjectTeamId}
                  onChange={(e) => setNewProjectTeamId(e.target.value)}
                  className="w-full brand-input text-xs"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.code ? `[${t.code}] ` : ''}{t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nombre del Proyecto <span className="text-[#D40000]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ej: Rediseño Landing Eventos"
                  className="w-full brand-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Descripción Corta
                </label>
                <textarea
                  rows={2}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Resumen u objetivos primarios..."
                  className="w-full brand-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Creando...' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
