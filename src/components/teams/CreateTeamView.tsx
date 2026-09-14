import React, { useState } from 'react';
import { fetchApi } from '../../lib/api';

export const CreateTeamView: React.FC = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const team = await fetchApi<any>('/teams', {
        method: 'POST',
        body: JSON.stringify({ name, description, type }),
      });
      window.location.href = `/teams/${team.id}`;
    } catch (err: any) {
      setError(err.message || 'Error al crear el equipo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Breadcrumb / Top Link */}
      <a
        href="/teams"
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#D40000] uppercase tracking-wider transition-colors"
      >
        <span>← Volver a Equipos</span>
      </a>

      {/* Main Container Card */}
      <div className="bg-white p-8 md:p-10 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden space-y-8">
        <div>
          <p className="text-[10px] font-bold text-[#D40000] uppercase tracking-[0.4em] mb-2">Creación</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Crear Nuevo <span className="text-[#D40000]">Equipo</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configura el espacio de trabajo para tu equipo de proyectos y tareas.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Nombre del Equipo <span className="text-[#D40000]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Equipo de Expansión Comercial"
              className="w-full brand-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Descripción del Equipo
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla los objetivos, funciones o propósitos de este equipo..."
              className="w-full brand-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Tipo de Visibilidad <span className="text-[#D40000]">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label
                className={`p-5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  type === 'PUBLIC'
                    ? 'border-[#D40000] bg-red-50/40 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900 text-sm">🌐 Público</span>
                  <input
                    type="radio"
                    name="teamType"
                    checked={type === 'PUBLIC'}
                    onChange={() => setType('PUBLIC')}
                    className="accent-[#D40000]"
                  />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Cualquier miembro de la plataforma puede unirse y colaborar en los proyectos.
                </p>
              </label>

              <label
                className={`p-5 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  type === 'PRIVATE'
                    ? 'border-[#D40000] bg-red-50/40 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-900 text-sm">🔒 Privado</span>
                  <input
                    type="radio"
                    name="teamType"
                    checked={type === 'PRIVATE'}
                    onChange={() => setType('PRIVATE')}
                    className="accent-[#D40000]"
                  />
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Solo los miembros invitados expresamente tienen visibilidad del equipo.
                </p>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <a
              href="/teams"
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-[#D40000]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creando Equipo...' : 'Crear Equipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
