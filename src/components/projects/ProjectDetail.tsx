import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { TaskList, TaskItem } from '../tasks/TaskList';
import { TaskKanban } from '../tasks/TaskKanban';
import { TaskDetailModal } from '../tasks/TaskDetailModal';
import { DocumentManager } from '../documents/DocumentManager';

interface Project {
  id: string;
  teamId: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  richContent: {
    text?: string;
    images?: string[];
    links?: { title: string; url: string }[];
  };
  metadata: Record<string, any>;
  createdAt: string;
}

interface Member {
  id: string;
  role: string;
  user: { id: string; name: string; email: string };
}

export const ProjectDetail: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<'LIST' | 'KANBAN' | 'DOCUMENTS' | 'RICH_CONTENT'>('LIST');

  // Filters State
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  // Rich Content Editing
  const [richText, setRichText] = useState('');
  const [savingRich, setSavingRich] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const proj = await fetchApi<Project>(`/projects/${projectId}`);
      setProject(proj);
      setRichText(proj.richContent?.text || '');

      const [mList, tList] = await Promise.all([
        fetchApi<Member[]>(`/teams/${proj.teamId}/members`),
        fetchApi<TaskItem[]>(`/tasks/project/${projectId}`),
      ]);
      setMembers(mList);
      setTasks(tList);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleStatusChange = async (taskId: string, newStatus: TaskItem['status']) => {
    try {
      await fetchApi(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error cambiando estado');
    }
  };

  const handleSaveRichContent = async () => {
    if (!project) return;
    setSavingRich(true);
    try {
      await fetchApi(`/projects/${project.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          richContent: {
            ...project.richContent,
            text: richText,
          },
        }),
      });
      alert('Contenido del proyecto actualizado');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Error guardando');
    } finally {
      setSavingRich(false);
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('bni_colab_token');
      const response = await fetch(`/api/v1/projects/${projectId}/export-excel`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al exportar a Excel');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Proyecto_${project?.name?.replace(/\s+/g, '_') || 'Export'}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      alert(err.message || 'Error al descargar el archivo Excel');
    } finally {
      setExporting(false);
    }
  };

  // Filter Tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterAssignee && t.assigneeId !== filterAssignee) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="py-20 text-center text-[#A3A3A3]">Cargando proyecto...</div>;
  if (!project) return <div className="py-20 text-center text-rose-300">Proyecto no encontrado.</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Header estilo Eventos */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="px-2.5 py-1 bg-red-100/70 text-[#900] text-xs font-black rounded uppercase">
              {project.code || 'PRJ'}
            </span>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{project.name}</h1>
            <span className="bg-red-50 text-[#D40000] border border-red-200 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              {project.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm">{project.description || 'Sin descripción provista.'}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {exporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Generando Excel...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>Exportar a Excel</span>
              </>
            )}
          </button>

          <a
            href="/calendar"
            className="bg-gray-50 hover:bg-gray-100 text-gray-800 border border-gray-200 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#D40000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span>Calendario</span>
          </a>

          <a
            href={`/projects/new-task?projectId=${projectId}`}
            className="bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-widest shadow-md shadow-[#D40000]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>+ Nueva Tarea</span>
          </a>
        </div>
      </div>

      {/* Tabs & Search Navigation */}
      <div className="space-y-3 border-b border-gray-200 pb-4">
        {/* Row 1: Tab buttons */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center gap-1.5 p-1 bg-gray-100 rounded-2xl">
            <button
              onClick={() => setActiveTab('LIST')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'LIST'
                  ? 'bg-[#D40000] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
              </svg>
              <span>Vista Lista</span>
            </button>
            <button
              onClick={() => setActiveTab('KANBAN')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'KANBAN'
                  ? 'bg-[#D40000] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2m0 10V7m6 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path>
              </svg>
              <span>Vista Kanban</span>
            </button>
            <button
              onClick={() => setActiveTab('DOCUMENTS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'DOCUMENTS'
                  ? 'bg-[#D40000] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
              <span>Documentos</span>
            </button>
            <button
              onClick={() => setActiveTab('RICH_CONTENT')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'RICH_CONTENT'
                  ? 'bg-[#D40000] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              <span>Contenido Rico</span>
            </button>
          </div>

          {['LIST', 'KANBAN'].includes(activeTab) && (
            <div className="text-xs font-semibold text-gray-400">
              Mostrando <span className="font-bold text-gray-700">{filteredTasks.length}</span> de {tasks.length} tareas
            </div>
          )}
        </div>

        {/* Row 2: Filters Bar (Dedicated row when on List or Kanban) */}
        {['LIST', 'KANBAN'].includes(activeTab) && (
          <div className="bg-white border border-gray-200 rounded-2xl p-2.5 sm:p-3 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar tarea por código, título o descripción..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value="">Todos los asignados</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name || m.user.email}
                  </option>
                ))}
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none transition-all cursor-pointer"
              >
                <option value="">Todas las prioridades</option>
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>

              {(search || filterAssignee || filterPriority) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterAssignee('');
                    setFilterPriority('');
                  }}
                  className="px-2.5 py-2 text-xs font-bold text-[#D40000] hover:bg-red-50 rounded-xl transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1"
                  title="Limpiar filtros"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab Views */}
      {activeTab === 'LIST' && (
        <TaskList
          tasks={filteredTasks}
          members={members}
          onTaskClick={(t) => {
            setSelectedTaskId(t.id);
          }}
        />
      )}

      {activeTab === 'KANBAN' && (
        <TaskKanban
          tasks={filteredTasks}
          onTaskClick={(t) => {
            setSelectedTaskId(t.id);
          }}
          onStatusChange={handleStatusChange}
        />
      )}

      {activeTab === 'DOCUMENTS' && <DocumentManager projectId={projectId} />}

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          members={members}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={() => {
            loadData();
          }}
        />
      )}

      {activeTab === 'RICH_CONTENT' && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-gray-900">
            ✨ Documentación & Notas del Proyecto
          </h3>
          <textarea
            rows={8}
            value={richText}
            onChange={(e) => setRichText(e.target.value)}
            placeholder="Redacta notas estratégicas, briefs, minutas e información clave para el equipo..."
            className="w-full brand-input text-sm"
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveRichContent}
              disabled={savingRich}
              className="bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-[#D40000]/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50"
            >
              {savingRich ? 'Guardando...' : 'Guardar Notas'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
