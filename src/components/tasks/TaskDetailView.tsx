import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../lib/api';
import { FilePreviewModal, PreviewableFile } from '../common/FilePreviewModal';

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

interface TaskAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt: string;
}

export default function TaskDetailView({ taskId }: { taskId: string }) {
  const [task, setTask] = useState<any | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs below description: COMMENTS or HISTORY
  const [activeBottomTab, setActiveBottomTab] = useState<'COMMENTS' | 'HISTORY'>('COMMENTS');

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  // Comments & @mentions
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Task Attachment
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // File Preview Modal state
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const loadTaskData = async () => {
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

      // Load team members for assignee dropdown and @mentions
      if (data.projectId) {
        const project = await fetchApi<any>(`/projects/${data.projectId}`);
        if (project.teamId) {
          const mList = await fetchApi<Member[]>(`/teams/${project.teamId}/members`);
          setMembers(mList);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaskData();
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
      loadTaskData();
    } catch (err: any) {
      alert(err.message || 'Error actualizando tarea');
    } finally {
      setSaving(false);
    }
  };

  // Mention Handler
  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewComment(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    if (lastAtPos !== -1 && lastAtPos >= textBeforeCursor.length - 20) {
      const query = textBeforeCursor.substring(lastAtPos + 1);
      if (!query.includes(' ')) {
        setMentionFilter(query.toLowerCase());
        setShowMentionDropdown(true);
        return;
      }
    }
    setShowMentionDropdown(false);
  };

  const insertMention = (memberName: string) => {
    if (!commentTextareaRef.current) return;
    const val = newComment;
    const cursorPos = commentTextareaRef.current.selectionStart;
    const textBeforeCursor = val.substring(0, cursorPos);
    const lastAtPos = textBeforeCursor.lastIndexOf('@');

    const textAfterCursor = val.substring(cursorPos);
    const mentionTag = `@${memberName.replace(/\s+/g, '')} `;
    const updated = val.substring(0, lastAtPos) + mentionTag + textAfterCursor;

    setNewComment(updated);
    setShowMentionDropdown(false);
    commentTextareaRef.current.focus();
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
      setShowMentionDropdown(false);
      loadTaskData();
    } catch (err: any) {
      alert(err.message || 'Error guardando comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUploadTaskAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    try {
      setUploadingAttachment(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', task.projectId);
      formData.append('name', file.name);

      const docRes = await fetchApi<any>('/documents/upload', {
        method: 'POST',
        body: formData,
      });

      // Associate with task
      await fetchApi(`/tasks/${taskId}/attachments`, {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          fileUrl: docRes.fileUrl,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      loadTaskData();
    } catch (err: any) {
      alert(err.message || 'Error al adjuntar archivo a la tarea');
    } finally {
      setUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    }
  };

  const filteredMembersForMention = members.filter((m) => {
    const name = (m.user.name || '').toLowerCase();
    const email = m.user.email.toLowerCase();
    return name.includes(mentionFilter) || email.includes(mentionFilter);
  });

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#D40000] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium">Cargando detalles de la tarea...</span>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center">
        <p className="text-red-600 font-bold">Tarea no encontrada o sin permisos.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <a
            href={`/projects/${task.projectId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:text-[#D40000] text-xs font-bold rounded-xl transition-all shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            <span>Volver al Proyecto</span>
          </a>
          <span className="text-gray-300">/</span>
          <span className="px-2.5 py-1 bg-red-100/70 text-[#900] text-xs font-black rounded-lg tracking-wide uppercase">
            {task.code || 'TAR'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-800 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              <span>Editar Tarea</span>
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
            >
              Cancelar Edición
            </button>
          )}
        </div>
      </div>

      {/* Main Task Header Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                task.status === 'DONE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                task.status === 'REVIEW' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                'bg-gray-100 text-gray-600'
              }`}>
                {task.status}
              </span>

              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                task.priority === 'URGENT' ? 'bg-red-50 text-[#D40000] border border-red-200' :
                task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                task.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                Prioridad: {task.priority}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              {task.title}
            </h1>
          </div>
        </div>

        {/* Edit Form OR Task Information Grid */}
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4 pt-2">
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
                Descripción Detallada
              </label>
              <textarea
                rows={4}
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
                  onChange={(e) => setStatus(e.target.value)}
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
                  onChange={(e) => setPriority(e.target.value)}
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
                  Asignar a
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

            <div className="flex justify-end gap-3 pt-3">
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
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Metadata Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Creado Por
                </span>
                <span className="text-xs font-bold text-gray-900 block truncate">
                  {task.reporter?.name || 'Creador'}
                </span>
                <span className="text-[10px] text-gray-500 block truncate">{task.reporter?.email}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Responsable
                </span>
                <span className="text-xs font-bold text-gray-900 block truncate">
                  {task.assignee?.name || <span className="text-gray-400 font-normal">Sin asignar</span>}
                </span>
                <span className="text-[10px] text-gray-500 block truncate">{task.assignee?.email}</span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Fecha Creación
                </span>
                <span className="text-xs font-semibold text-gray-700 block">
                  {task.createdAt ? new Date(task.createdAt).toLocaleDateString('es-ES') : '-'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Vencimiento
                </span>
                <span className="text-xs font-bold text-[#D40000] block">
                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-ES') : 'Sin fecha'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Descripción
              </h3>
              <div className="p-5 bg-gray-50/50 border border-gray-200 rounded-2xl text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                {task.description || <span className="text-gray-400 italic">Sin descripción asignada.</span>}
              </div>
            </div>

            {/* Task Attachments Section */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                  </svg>
                  <span>Archivos Adjuntos a la Tarea ({task.attachments?.length || 0})</span>
                </h3>

                <div>
                  <input
                    type="file"
                    ref={attachmentInputRef}
                    onChange={handleUploadTaskAttachment}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    disabled={uploadingAttachment}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1"
                  >
                    {uploadingAttachment ? (
                      <span>Subiendo...</span>
                    ) : (
                      <>
                        <span>+ Adjuntar Archivo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {task.attachments && task.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.attachments.map((att: TaskAttachment) => (
                    <div
                      key={att.id}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        <span className="text-xs font-bold text-gray-800 truncate" title={att.fileName}>
                          {att.fileName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewFile({
                              name: att.fileName,
                              fileUrl: att.fileUrl,
                              mimeType: att.mimeType,
                              fileSize: att.fileSize,
                            });
                            setShowPreview(true);
                          }}
                          className="px-2.5 py-1 bg-[#D40000]/10 hover:bg-[#D40000]/20 text-[#D40000] font-bold text-[11px] rounded-lg transition-colors border border-[#D40000]/20 flex items-center gap-1 cursor-pointer"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Ver</span>
                        </button>
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="text-[11px] font-bold text-gray-600 hover:text-gray-900 hover:underline shrink-0"
                        >
                          Descargar
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No hay archivos adjuntos a esta tarea.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tabs Below Description: Comentarios / Historial */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center border-b border-gray-200 pb-2 gap-4">
          <button
            onClick={() => setActiveBottomTab('COMMENTS')}
            className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeBottomTab === 'COMMENTS'
                ? 'border-[#D40000] text-[#D40000]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <span>Comentarios ({task.comments?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveBottomTab('HISTORY')}
            className={`py-2 px-4 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all flex items-center gap-2 ${
              activeBottomTab === 'HISTORY'
                ? 'border-[#D40000] text-[#D40000]'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>Historial de Cambios ({task.history?.length || 0})</span>
          </button>
        </div>

        {activeBottomTab === 'COMMENTS' && (
          <div className="space-y-6">
            {/* Comments List */}
            <div className="space-y-4">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment: TaskComment) => (
                  <div
                    key={comment.id}
                    className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-start gap-3.5"
                  >
                    <div className="w-9 h-9 rounded-full bg-red-100 text-[#D40000] font-bold text-xs flex items-center justify-center shrink-0 border border-red-200">
                      {(comment.user?.name || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-gray-900">{comment.user?.name || comment.user?.email || 'Usuario'}</span>
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
                  Sin comentarios aún. Escribe el primer mensaje y etiqueta a miembros con @.
                </div>
              )}
            </div>

            {/* Post Comment Form with @mentions */}
            <form onSubmit={handleAddComment} className="pt-4 border-t border-gray-100 space-y-3 relative">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Escribir comentario
                </label>
                <span className="text-[11px] text-gray-400">
                  Usa <code className="bg-gray-100 px-1 py-0.5 rounded text-red-600 font-bold">@nombre</code> para etiquetar a un miembro
                </span>
              </div>

              <div className="relative">
                <textarea
                  ref={commentTextareaRef}
                  rows={3}
                  required
                  placeholder="Escribe tu comentario... tip: presiona @ para listar los miembros del equipo"
                  value={newComment}
                  onChange={handleCommentChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
                />

                {/* Mention Dropdown */}
                {showMentionDropdown && filteredMembersForMention.length > 0 && (
                  <div className="absolute bottom-full mb-2 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50 p-1">
                    <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Etiquetar Miembro:
                    </p>
                    {filteredMembersForMention.map((m) => (
                      <button
                        key={m.user.id}
                        type="button"
                        onClick={() => insertMention(m.user.name || m.user.email)}
                        className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 hover:text-[#D40000] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="font-bold">{m.user.name || m.user.email}</span>
                        <span className="text-[10px] text-gray-400">@{m.user.name?.split(' ')[0] || 'user'}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="px-5 py-2.5 bg-[#D40000] hover:bg-[#B00000] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-[#D40000]/20 disabled:opacity-50 cursor-pointer transition-all"
                >
                  {submittingComment ? 'Enviando...' : 'Publicar Comentario'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeBottomTab === 'HISTORY' && (
          <div className="space-y-3">
            {task.history && task.history.length > 0 ? (
              task.history.map((hist: TaskHistory) => (
                <div
                  key={hist.id}
                  className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-start gap-3.5 text-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center shrink-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-gray-900">{hist.user?.name || 'Usuario'}</span>
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
                      <div className="mt-2 text-[11px] text-gray-600 font-mono bg-white p-2.5 rounded-lg border border-gray-200">
                        {Object.entries(hist.changes).map(([key, change]) => (
                          <div key={key}>
                            <span className="font-bold text-gray-800">{key}:</span>{' '}
                            <span className="line-through text-red-500">{String(change.from || 'Vacío')}</span> ➔{' '}
                            <span className="text-emerald-600 font-bold">{String(change.to)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 text-xs">
                Sin historial de cambios registrado aún.
              </div>
            )}
          </div>
        )}
      </div>

      {/* File Preview Modal Dialog */}
      <FilePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        file={previewFile}
      />
    </div>
  );
}
