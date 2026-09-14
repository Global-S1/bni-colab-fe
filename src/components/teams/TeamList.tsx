import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';

interface TeamItem {
  id: string;
  name: string;
  description: string;
  type: 'PUBLIC' | 'PRIVATE';
  createdBy: string;
  createdAt: string;
}

export const TeamList: React.FC = () => {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await fetchApi<TeamItem[]>('/teams');
      setTeams(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleJoinTeam = async (teamId: string) => {
    try {
      await fetchApi(`/teams/${teamId}/join`, { method: 'POST' });
      alert('¡Te has unido exitosamente al equipo público!');
      loadTeams();
    } catch (err: any) {
      alert(err.message || 'No se pudo unirse al equipo.');
    }
  };

  const filteredTeams = teams.filter((t) => {
    if (filter === 'PUBLIC') return t.type === 'PUBLIC';
    if (filter === 'PRIVATE') return t.type === 'PRIVATE';
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section idéntico a Eventos Dashboard */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-bold text-[#D40000] uppercase tracking-[0.4em] mb-2">Resumen Operativo</p>
          <h1 className="text-4xl font-black tracking-tight">
            <span className="text-[#111827]">Equipos de</span> <span className="text-[#D40000]">Trabajo</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Organízate con otros miembros y colabora en proyectos compartidos</p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/teams/new"
            className="bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold py-3.5 px-6 rounded-2xl text-xs tracking-widest uppercase shadow-lg shadow-[#D40000]/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span>+ Crear Nuevo Equipo</span>
          </a>
        </div>
      </div>

      {/* Filters con estilo Eventos */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            filter === 'ALL'
              ? 'bg-[#D40000] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          Todos ({teams.length})
        </button>
        <button
          onClick={() => setFilter('PUBLIC')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            filter === 'PUBLIC'
              ? 'bg-[#D40000] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          🌐 Públicos
        </button>
        <button
          onClick={() => setFilter('PRIVATE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            filter === 'PRIVATE'
              ? 'bg-[#D40000] text-white shadow-sm'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          🔒 Privados
        </button>
      </div>

      {/* Grid of Teams con tarjetas blancas y acentos Eventos */}
      {loading ? (
        <div className="py-24 text-center text-gray-400 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#D40000] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Cargando equipos...</span>
        </div>
      ) : filteredTeams.length === 0 ? (
        <div className="bg-white p-16 text-center rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#D40000] flex items-center justify-center mx-auto mb-3 text-2xl font-bold">
            👥
          </div>
          <p className="text-gray-900 font-bold text-lg">No hay equipos en esta categoría</p>
          <p className="text-gray-500 text-sm mt-1">Crea un equipo público o privado para comenzar a organizar proyectos.</p>
          <a
            href="/teams/new"
            className="inline-block mt-5 bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white text-xs font-bold py-3 px-5 rounded-xl uppercase tracking-wider shadow-md shadow-[#D40000]/20"
          >
            + Crear Primer Equipo
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:border-[#D40000]/30 hover:shadow-md transition-all group relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      t.type === 'PUBLIC'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-[#D40000] border border-red-200'
                    }`}
                  >
                    {t.type === 'PUBLIC' ? '🌐 Público' : '🔒 Privado'}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#D40000] transition-colors leading-snug">
                  {t.name}
                </h3>
                <p className="text-gray-500 text-sm mt-2 line-clamp-3 leading-relaxed">
                  {t.description || 'Sin descripción provista.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <a
                  href={`/teams/${t.id}`}
                  className="flex-1 text-center bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all"
                >
                  Ver Proyectos →
                </a>
                {t.type === 'PUBLIC' && (
                  <button
                    onClick={() => handleJoinTeam(t.id)}
                    className="bg-[#D40000]/10 hover:bg-[#D40000] hover:text-white text-[#D40000] font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shrink-0 cursor-pointer"
                  >
                    Unirse
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
