import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { TaskItem } from './TaskList';

interface Member {
  id: string;
  user: { id: string; name: string; email: string };
}

interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface TaskHistory {
  id: string;
  action: string;
  changes?: Record<string, { from: any; to: any }>;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface TaskDetailModalProps {
  taskId: string;
  members: Member[];
  onClose: () => void;
  onTaskUpdated: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  members,
  onClose,
  onTaskUpdated,
}) => {
  const [task, setTask] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'DETAILS' | 'HISTORY' | 'COMMENTS'>('DETAILS');

  // Edit fields
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskItem['status']>('TODO');
  const [priority, setPriority] = useState<TaskItem['priority']>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Comments
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadTask = async () => {
    try {
      setLoading(true);
      const data = await fetchApi<any>(`/tasks/${taskId}`);
      setTask(data);
      setTitle(data.title || '');
      setDescription(data.description || '');
      setStatus(data.status || 'TODO');
      setPriority(data.priority || 'MEDIUM');
      setAssigneeId(data.assigneeId || '');
      setDueDate(data.dueDate ? data.dueDate.split('T')[0] : '');
    } catch (err: any) {
      alert(err.message || 'Error cargando detalle de tarea');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await fetchApi(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          status,
          priority,
          assigneeId: assigneeId || undefined,
          dueDate: dueDate || undefined,
        }),
      });
      setIsEditing(false);
      onTaskUpdated();
      loadTask();
    } catch (err: any) {
      alert(err.message || 'Error actualizando tarea');
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setSubmittingComment(true);
      await fetchApi(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: newComment.trim() }),
      });
      setNewComment('');
      loadTask();
    } catch (err: any) {
      alert(err.message || 'Error enviando comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <div className="bg-white p-8 rounded-2xl flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#D40000] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-gray-500">Cargando detalles de la tarea...</span>
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4 bg-gray-50/60 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                task.status === 'DONE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                task.status === 'REVIEW' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                'bg-gray-100 text-gray-600'
              }`}>
                {task.status}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                task.priority === 'URGENT' ? 'bg-red-50 text-[#D40000] border border-red-200' :
                task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                task.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {task.priority}
              </span>
              <span className="text-xs text-gray-400">ID: {task.id.substring(0, 8)}...</span>
            </div>

            <h2 className="text-xl font-black text-gray-900 tracking-tight">{task.title}</h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                ✏️ Editar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancelar Edición
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Sub-tabs Navigation */}
        <div className="flex items-center border-b border-gray-200 px-6 bg-white shrink-0">
          <button
            onClick={() => setActiveSubTab('DETAILS')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeSubTab === 'DETAILS'
                ? 'border-[#D40000] text-[#D40000]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            📋 Detalles y Datos
          </button>
          <button
            onClick={() => setActiveSubTab('COMMENTS')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeSubTab === 'COMMENTS'
                ? 'border-[#D40000] text-[#D40000]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            💬 Comentarios ({task.comments?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('HISTORY')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeSubTab === 'HISTORY'
                ? 'border-[#D40000] text-[#D40000]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            📜 Historial de Cambios ({task.history?.length || 0})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeSubTab === 'DETAILS' && (
            <div>
              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Título de la Tarea *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none cursor-pointer"
                      >
                        <option value="TODO">Por Hacer</option>
                        <option value="IN_PROGRESS">En Progreso</option>
                        <option value="REVIEW">En Revisión</option>
                        <option value="DONE">Completada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Prioridad
                      </label>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none cursor-pointer"
                      >
                        <option value="LOW">Baja</option>
                        <option value="MEDIUM">Media</option>
                        <option value="HIGH">Alta</option>
                        <option value="URGENT">Urgente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Asignado a
                      </label>
                      <select
                        value={assigneeId}
                        onChange={(e) => setAssigneeId(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none cursor-pointer"
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                        Fecha de Vencimiento
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 bg-[#D40000] hover:bg-[#B00000] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-[#D40000]/20 disabled:opacity-50 cursor-pointer"
                    >
                      {saving ? 'Guardando Cambios...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        👤 Creado Por
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        {task.reporter?.name || 'Creador del Proyecto'}
                      </span>
                      {task.reporter?.email && (
                        <span className="text-xs text-gray-400 block">{task.reporter.email}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        🎯 Responsable Asignado
                      </span>
                      <span className="text-sm font-bold text-gray-800">
                        {task.assignee?.name || <span className="text-gray-400 font-normal">Sin asignar</span>}
                      </span>
                      {task.assignee?.email && (
                        <span className="text-xs text-gray-400 block">{task.assignee.email}</span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        📅 Fecha de Creación
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        {task.createdAt ? new Date(task.createdAt).toLocaleString('es-ES') : '-'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                        🔄 Última Actualización
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        {task.updatedAt ? new Date(task.updatedAt).toLocaleString('es-ES') : '-'}
                      </span>
                    </div>

                    {task.dueDate && (
                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                          ⏰ Vencimiento
                        </span>
                        <span className="text-sm font-bold text-[#D40000]">
                          {new Date(task.dueDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description Box */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                      Descripción de la Tarea
                    </h4>
                    <div className="p-4 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {task.description || <span className="text-gray-400 italic">Sin descripción detallada.</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'COMMENTS' && (
            <div className="space-y-4">
              {/* List Comments */}
              <div className="space-y-3">
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((comment: TaskComment) => (
                    <div
                      key={comment.id}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-full bg-red-100 text-[#D40000] font-bold text-xs flex items-center justify-center shrink-0">
                        {(comment.user?.name || 'U').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-900">{comment.user?.name || 'Usuario'}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(comment.createdAt).toLocaleString('es-ES')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    No hay comentarios en esta tarea aún. Sé el primero en comentar.
                  </div>
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="pt-4 border-t border-gray-100 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Agregar un comentario
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Escribe un comentario o actualización de avance..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="px-4 py-2 bg-[#D40000] hover:bg-[#B00000] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {submittingComment ? 'Publicando...' : 'Comentar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSubTab === 'HISTORY' && (
            <div className="space-y-3">
              {task.history && task.history.length > 0 ? (
                task.history.map((hist: TaskHistory) => (
                  <div
                    key={hist.id}
                    className="p-3 bg-gray-50 border border-gray-100 rounded-xl flex items-start gap-3 text-xs"
                  >
                    <span className="text-base shrink-0">
                      {hist.action === 'CREATED' ? '✨' : hist.action === 'STATUS_CHANGE' ? '🔄' : hist.action === 'COMMENT_ADDED' ? '💬' : '✏️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-gray-800">{hist.user?.name || 'Usuario'}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(hist.createdAt).toLocaleString('es-ES')}
                        </span>
                      </div>
                      <p className="text-gray-600 font-medium">
                        {hist.action === 'CREATED' && 'Creó esta tarea'}
                        {hist.action === 'STATUS_CHANGE' && 'Cambió el estado de la tarea'}
                        {hist.action === 'COMMENT_ADDED' && 'Agregó un comentario'}
                        {hist.action === 'UPDATED' && 'Actualizó la información de la tarea'}
                      </p>
                      {hist.changes && (
                        <div className="mt-1 text-[11px] text-gray-500 font-mono bg-white p-2 rounded-lg border border-gray-200/60">
                          {Object.entries(hist.changes).map(([key, change]) => (
                            <div key={key}>
                              <span className="font-bold text-gray-700">{key}:</span>{' '}
                              <span className="line-through text-red-500">{String(change.from || 'Vacío')}</span> ➔{' '}
                              <span className="text-emerald-600 font-semibold">{String(change.to)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400 text-xs">
                  Sin historial registrado aún.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
