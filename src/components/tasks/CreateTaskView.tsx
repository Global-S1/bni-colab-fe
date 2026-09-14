import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';

interface Member {
  id: string;
  user: { id: string; name: string; email: string };
}

export const CreateTaskView: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [richText, setRichText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [links, setLinks] = useState<{ title: string; url: string }[]>([]);

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApi<any>(`/projects/${projectId}`)
      .then((proj) => fetchApi<Member[]>(`/teams/${proj.teamId}/members`))
      .then((mList) => setMembers(mList))
      .catch((err) => console.error(err));
  }, [projectId]);

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleAddLink = () => {
    if (linkUrl.trim()) {
      setLinks([...links, { title: linkTitle.trim() || linkUrl.trim(), url: linkUrl.trim() }]);
      setLinkTitle('');
      setLinkUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      projectId,
      title,
      description,
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      richContent: {
        text: richText,
        images,
        links,
      },
    };

    try {
      await fetchApi('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      window.location.href = `/projects/${projectId}`;
    } catch (err: any) {
      setError(err.message || 'Error al crear la tarea.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <a
        href={`/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#D40000] uppercase tracking-wider transition-colors"
      >
        <span>← Volver al Proyecto</span>
      </a>

      <div className="bg-white p-8 md:p-10 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden space-y-8">
        <div>
          <p className="text-[10px] font-bold text-[#D40000] uppercase tracking-[0.4em] mb-2">Creación</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Crear Nueva <span className="text-[#D40000]">Tarea</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Asigna responsables, prioridades, fechas de entrega y recursos.
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
              Título de la Tarea <span className="text-[#D40000]">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Diseñar material promocional y presentaciones"
              className="w-full brand-input text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Asignar a Persona
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full brand-input text-sm"
              >
                <option value="">Sin asignar</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name || m.user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full brand-input text-sm"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Fecha de Vencimiento
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full brand-input text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
              Descripción General
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre lo que se debe lograr en esta tarea..."
              className="w-full brand-input text-sm"
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recursos Adicionales</h3>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Enlaces Externos
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Título (Ej: Figma, Google Drive)"
                  className="brand-input text-xs"
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 brand-input text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                  >
                    + Añadir
                  </button>
                </div>
              </div>
              {links.length > 0 && (
                <div className="space-y-1.5 mt-3">
                  {links.map((link, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs text-gray-800">
                      <a href={link.url} target="_blank" rel="noreferrer" className="hover:underline font-medium text-[#D40000]">
                        🔗 {link.title} ({link.url})
                      </a>
                      <button type="button" onClick={() => setLinks(links.filter((_, i) => i !== idx))} className="text-[#D40000] font-bold cursor-pointer">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Etiquetas (separadas por coma)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="urgente, marketing, cliente"
                className="w-full brand-input text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <a
              href={`/projects/${projectId}`}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              Cancelar
            </a>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold py-3.5 px-6 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-[#D40000]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creando Tarea...' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
