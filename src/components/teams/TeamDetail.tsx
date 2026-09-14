import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';

interface Team {
  id: string;
  name: string;
  description: string;
  type: 'PUBLIC' | 'PRIVATE';
  createdAt: string;
}

interface Member {
  id: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'COMPLETED';
  createdAt: string;
}

export const TeamDetail: React.FC<{ teamId: string }> = ({ teamId }) => {
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario en línea para invitar miembros
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'MEMBER' | 'VIEWER'>('MEMBER');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tData, mData, pData] = await Promise.all([
        fetchApi<Team>(`/teams/${teamId}`),
        fetchApi<Member[]>(`/teams/${teamId}/members`),
        fetchApi<Project[]>(`/projects/team/${teamId}`),
      ]);
      setTeam(tData);
      setMembers(mData);
      setProjects(pData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [teamId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    setInviteSuccess(null);
    setInviteError(null);
    try {
      await fetchApi(`/teams/${teamId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteSuccess(`Invitación enviada exitosamente a ${inviteEmail}`);
      setInviteEmail('');
      loadData();
    } catch (err: any) {
      setInviteError(err.message || 'Error invitando miembro');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#D40000] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium">Cargando equipo...</span>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
        <p className="text-red-600 font-bold text-lg">Equipo no encontrado o sin permisos suficientes.</p>
        <a href="/teams" className="inline-block mt-4 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-gray-900">
          ← Volver a la lista de equipos
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner idéntico a Eventos */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">{team.name}</h1>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                team.type === 'PUBLIC'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-[#D40000] border border-red-200'
              }`}
            >
              {team.type === 'PUBLIC' ? '🌐 Público' : '🔒 Privado'}
            </span>
          </div>
          <p className="text-gray-500 text-sm">{team.description || 'Sin descripción provista.'}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-wider transition-all border border-gray-200 cursor-pointer"
          >
            <span>{showInviteForm ? 'Ocultar Invitación' : '+ Invitar Miembro'}</span>
          </button>

          <a
            href={`/calendar`}
            className="bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-wider transition-all border border-gray-200 flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#D40000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span>Calendario</span>
          </a>

          <a
            href={`/teams/new-project?teamId=${teamId}`}
            className="bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-widest shadow-md shadow-[#D40000]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>+ Nuevo Proyecto</span>
          </a>
        </div>
      </div>

      {/* Formulario en Vista para Invitar Miembros (Sin Diálogos Modales) */}
      {showInviteForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900">Invitar Nuevo Miembro al Equipo</h3>
          {inviteSuccess && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">{inviteSuccess}</div>}
          {inviteError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">{inviteError}</div>}
          <form onSubmit={handleInvite} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="socio@globals1.com"
                className="w-full brand-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Rol en el Equipo</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as any)}
                className="w-full brand-input text-sm"
              >
                <option value="MEMBER">Miembro (Colaborador)</option>
                <option value="ADMIN">Administrador de Equipo</option>
                <option value="VIEWER">Observador</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={inviting}
                className="w-full bg-[#D40000] text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-sm hover:bg-[#B80000] transition-colors cursor-pointer disabled:opacity-50"
              >
                {inviting ? 'Enviando...' : 'Enviar Invitación'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Proyectos y Miembros Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Proyectos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span>Proyectos del Equipo</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full font-bold">
                {projects.length}
              </span>
            </h2>
            <a href={`/teams/new-project?teamId=${teamId}`} className="text-xs text-[#D40000] font-bold uppercase tracking-wider hover:underline">
              + Crear Proyecto
            </a>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm">Aún no hay proyectos en este equipo.</p>
              <a
                href={`/teams/new-project?teamId=${teamId}`}
                className="inline-block mt-3 text-[#D40000] text-xs font-bold uppercase tracking-wider hover:underline"
              >
                + Crear el primer proyecto
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((p) => (
                <a
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-[#D40000]/30 hover:shadow-md transition-all flex flex-col justify-between block group"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="bg-gray-100 text-gray-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                        {p.status}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#D40000] transition-colors leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-gray-500 text-xs mt-2 line-clamp-2 leading-relaxed">
                      {p.description || 'Sin descripción provista.'}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-700 font-bold group-hover:text-[#D40000] transition-colors uppercase tracking-wider">
                    <span>Abrir Tareas</span>
                    <span>→</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Miembros */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center justify-between border-b border-gray-100 pb-3">
            <span>Miembros Activos</span>
            <span className="text-xs bg-red-50 text-[#D40000] px-2.5 py-0.5 rounded-full font-bold">
              {members.length}
            </span>
          </h3>

          <div className="space-y-2.5">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div>
                  <p className="text-sm font-bold text-gray-900">{m.user.name || m.user.email}</p>
                  <p className="text-xs text-gray-400">{m.user.email}</p>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-700">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
