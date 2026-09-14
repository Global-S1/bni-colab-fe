import React, { useState } from 'react';
import { fetchApi } from '../../lib/api';

export const CreateProjectView: React.FC<{ teamId: string }> = ({ teamId }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [richText, setRichText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const proj = await fetchApi<any>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          teamId,
          name,
          description,
          richContent: { text: richText, images: [], links: [] },
        }),
      });
      window.location.href = `/projects/${proj.id}`;
    } catch (err: any) {
      setError(err.message || 'Error al crear el proyecto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <a
        href={`/teams/${teamId}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#D40000] uppercase tracking-wider transition-colors"
      >
        <span>← Volver al Equipo</span>
      </a>

      <div className="bg-white p-8 md:p-10 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden space-y-8">
        <div>
          <p className="text-[10px] font-bold text-[#D40000] uppercase tracking-[0.4em] mb-2">Creación</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Crear Nuevo <span className="text-[#D40000]">Proyecto</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Organiza tareas tipo lista, tableros kanban y repositorio de documentos.
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
              Nombre del Proyecto <span className="text-[#D40000]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Campaña de Lanzamiento Q4"
              className="w-full brand-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Descripción del Proyecto
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resumen del alcance y objetivos..."
              className="w-full brand-input text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Contenido / Notas Iniciales
            </label>
            <textarea
              rows={5}
              value={richText}
              onChange={(e) => setRichText(e.target.value)}
              placeholder="Instrucciones, enlaces importantes o detalles para el equipo..."
              className="w-full brand-input text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <a
              href={`/teams/${teamId}`}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-[#D40000]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creando Proyecto...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
