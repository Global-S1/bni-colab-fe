import React, { useState, useEffect } from 'react';
import { TaskItem } from './TaskList';
import { fetchApi } from '../../lib/api';

interface Member {
  id: string;
  user: { id: string; name: string; email: string };
}

interface TaskModalProps {
  projectId: string;
  task: TaskItem | null;
  members: Member[];
  onClose: () => void;
  onSaved: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ projectId, task, members, onClose, onSaved }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskItem['status']>(task?.status || 'TODO');
  const [priority, setPriority] = useState<TaskItem['priority']>(task?.priority || 'MEDIUM');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split('T')[0] : '');
  const [tags, setTags] = useState(task?.tags ? task.tags.join(', ') : '');

  // Rich Content fields (text, images, links)
  const [richText, setRichText] = useState(task?.richContent?.text || '');
  const [imageUrl, setImageUrl] = useState('');
  const [images, setImages] = useState<string[]>(task?.richContent?.images || []);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [links, setLinks] = useState<{ title: string; url: string }[]>(task?.richContent?.links || []);

  const [saving, setSaving] = useState(false);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      projectId,
      title,
      description,
      status,
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
      if (task?.id) {
        await fetchApi(`/tasks/${task.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await fetchApi('/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      onSaved();
    } catch (err: any) {
      alert(err.message || 'Error guardando tarea');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-navy/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="glass-panel max-w-2xl w-full p-6 rounded-2xl border border-white/15 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h2 className="text-2xl font-display font-bold text-white">
            {task ? 'Editar Tarea' : 'Nueva Tarea'}
          </h2>
          <button onClick={onClose} className="text-brand-silver hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Main Info */}
          <div>
            <label className="block text-xs font-semibold uppercase text-brand-silver mb-1">Título de la Tarea *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Preparar presentación estratégica"
              className="w-full bg-brand-navy/80 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-brand-silver mb-1">Asignar a Persona</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-brand-navy/80 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red"
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
              <label className="block text-xs font-semibold uppercase text-brand-silver mb-1">Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-brand-navy/80 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red"
              >
                <option value="LOW">Baja</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">🚨 Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-brand-silver mb-1">Estado</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-brand-navy/80 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red"
              >
                <option value="TODO">Por Hacer</option>
                <option value="IN_PROGRESS">En Progreso</option>
                <option value="REVIEW">En Revisión</option>
                <option value="DONE">Completada</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-brand-silver mb-1">Fecha de Vencimiento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-brand-navy/80 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-brand-silver mb-1">Descripción Breve</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Resumen rápido de la tarea..."
              className="w-full bg-brand-navy/80 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red"
            />
          </div>

          {/* Rich Content Section */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-sm font-display font-bold text-brand-gold uppercase tracking-wider">
              ✨ Detalle Enriquecido (Texto, Imágenes y Enlaces)
            </h3>

            <div>
              <label className="block text-xs font-semibold uppercase text-brand-silver mb-1">Contenido Enriquecido / Notas</label>
              <textarea
                rows={4}
                value={richText}
                onChange={(e) => setRichText(e.target.value)}
                placeholder="Escribe instrucciones detalladas, minutas o notas de seguimiento..."
                className="w-full bg-brand-navy/80 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand-red"
              />
            </div>

            {/* Images */}
            <div>
              <label className="block text-xs font-semibold uppercase text-brand-silver mb-1">Agregar Imágenes por URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.png"
                  className="flex-1 bg-brand-navy/80 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
                />
                <button type="button" onClick={handleAddImage} className="bg-white/10 text-white px-3 py-2 rounded-xl text-xs font-bold">
                  + Añadir
                </button>
              </div>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt="Adjunto" className="w-16 h-16 object-cover rounded-lg border border-white/20" />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, i) => i !== idx))}
                        className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Links */}
            <div>
              <label className="block text-xs font-semibold uppercase text-brand-silver mb-1">Agregar Enlaces Externos</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Título del enlace (Ej: Figma, Documento)"
                  className="bg-brand-navy/80 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-brand-navy/80 border border-white/15 rounded-xl px-3 py-2 text-white text-sm"
                  />
                  <button type="button" onClick={handleAddLink} className="bg-white/10 text-white px-3 py-2 rounded-xl text-xs font-bold">
                    + Añadir
                  </button>
                </div>
              </div>
              {links.length > 0 && (
                <div className="space-y-1.5 mt-3">
                  {links.map((link, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs text-brand-gold">
                      <a href={link.url} target="_blank" rel="noreferrer" className="hover:underline">
                        🔗 {link.title} ({link.url})
                      </a>
                      <button type="button" onClick={() => setLinks(links.filter((_, i) => i !== idx))} className="text-rose-400">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-brand-silver mb-1">Etiquetas (separadas por coma)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="urgente, diseno, cliente"
                className="w-full bg-brand-navy/80 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-brand-silver hover:bg-white/10">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-brand-glow text-white font-bold px-6 py-2.5 rounded-xl text-sm">
              {saving ? 'Guardando...' : 'Guardar Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
