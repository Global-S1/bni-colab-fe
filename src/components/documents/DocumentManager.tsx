import React, { useState, useEffect, useRef } from 'react';
import { fetchApi } from '../../lib/api';
import { FilePreviewModal, PreviewableFile } from '../common/FilePreviewModal';

interface DocumentItem {
  id: string;
  name: string;
  description: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  richContent?: any;
  uploadedAt: string;
  uploader?: {
    id: string;
    name: string;
    email: string;
  };
  deletedAt?: string;
  deleter?: {
    id: string;
    name: string;
    email: string;
  };
}

export const DocumentManager: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [deletedDocuments, setDeletedDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  // Preview modal state
  const [previewFile, setPreviewFile] = useState<PreviewableFile | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [description, setDescription] = useState('');
  const [uploadMode, setUploadMode] = useState<'FILE' | 'URL'>('FILE');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const [docsData, deletedData] = await Promise.all([
        fetchApi<DocumentItem[]>(`/documents/project/${projectId}`),
        fetchApi<DocumentItem[]>(`/documents/project/${projectId}/history`),
      ]);
      setDocuments(docsData);
      setDeletedDocuments(deletedData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [projectId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!docName.trim()) {
        setDocName(file.name);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploading(true);

    try {
      if (uploadMode === 'FILE') {
        if (!selectedFile) {
          setErrorMessage('Por favor selecciona un archivo de tu equipo.');
          setUploading(false);
          return;
        }

        setUploadProgress('Subiendo archivo al almacenamiento de la nube...');
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('projectId', projectId);
        if (docName.trim()) {
          formData.append('name', docName.trim());
        }
        if (description.trim()) {
          formData.append('description', description.trim());
        }

        await fetchApi('/documents/upload', {
          method: 'POST',
          body: formData,
        });

        setSuccessMessage('¡Archivo subido exitosamente a la nube!');
      } else {
        if (!fileUrl.trim()) {
          setErrorMessage('Por favor ingresa la URL del documento.');
          setUploading(false);
          return;
        }

        await fetchApi('/documents', {
          method: 'POST',
          body: JSON.stringify({
            projectId,
            name: docName.trim() || 'Documento Enlazado',
            description: description.trim(),
            fileUrl: fileUrl.trim(),
            mimeType: 'application/octet-stream',
            fileSize: 1024 * 100,
          }),
        });

        setSuccessMessage('¡Documento registrado correctamente!');
      }

      // Reset Form
      setSelectedFile(null);
      setDocName('');
      setDescription('');
      setFileUrl('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadDocuments();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar el documento');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este documento del proyecto?')) return;
    try {
      await fetchApi(`/documents/${id}`, { method: 'DELETE' });
      loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Error eliminando documento');
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm('¿Estás seguro de restaurar este documento?')) return;
    try {
      await fetchApi(`/documents/${id}/restore`, { method: 'POST' });
      loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Error restaurando documento');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (name: string, mime?: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return '📕';
    if (['doc', 'docx'].includes(ext || '')) return '📘';
    if (['xls', 'xlsx', 'csv'].includes(ext || '')) return '📗';
    if (['ppt', 'pptx'].includes(ext || '')) return '📙';
    if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext || '')) return '🖼️';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) return '📦';
    return '📄';
  };

  return (
    <div className="space-y-8">
      {/* Upload Box */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D40000]"></span>
              <span>Gestión Documentaria del Proyecto</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Carga archivos directamente desde tu computadora (PDF, Office, Imágenes) o vincula URLs externas.
            </p>
          </div>

          {/* Mode switch */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setUploadMode('FILE')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                uploadMode === 'FILE'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              📁 Subir Archivo
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('URL')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                uploadMode === 'URL'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              🔗 Por Enlace
            </button>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleUpload} className="mt-5 space-y-4">
          {uploadMode === 'FILE' ? (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Seleccionar Archivo de tu Equipo *
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-[#D40000] bg-gray-50/50 hover:bg-red-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-red-100/70 text-[#D40000] flex items-center justify-center text-xl mb-2">
                    {selectedFile ? getFileIcon(selectedFile.name) : '☁️'}
                  </div>
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-bold text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(selectedFile.size)}</p>
                      <span className="text-[11px] font-semibold text-[#D40000] underline mt-1 inline-block">
                        Cambiar archivo
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-gray-800">
                        Haz clic aquí para seleccionar un archivo o arrástralo
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Soporta PDF, Word, Excel, PowerPoint, ZIP, Imágenes (hasta 50 MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                URL / Enlace del Archivo *
              </label>
              <input
                type="url"
                required
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://drive.google.com/... o https://guest-files.bnitech.online/..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Nombre Personalizado o Etiqueta
              </label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="ej: Contrato Firmado v2, Minuta de Sesión"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                Descripción / Notas Adicionales
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ej: Aprobado por el comité directivo..."
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {uploadProgress ? (
              <span className="text-xs font-bold text-gray-600 animate-pulse">{uploadProgress}</span>
            ) : <span></span>}

            <button
              type="submit"
              disabled={uploading || (uploadMode === 'FILE' && !selectedFile)}
              className="px-6 py-2.5 bg-[#D40000] hover:bg-[#B00000] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-[#D40000]/20 disabled:opacity-50 cursor-pointer transition-all flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Cargando...</span>
                </>
              ) : (
                <>
                  <span>+ {uploadMode === 'FILE' ? 'Cargar Archivo' : 'Guardar Documento'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'ACTIVE'
                  ? 'border-[#D40000] text-[#D40000]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Archivos Activos ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'HISTORY'
                  ? 'border-[#D40000] text-[#D40000]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Historial Eliminados ({deletedDocuments.length})
            </button>
          </div>
        </div>

        {loading && (
          <div className="py-12 text-center text-gray-400 flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-[#D40000] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs">Cargando documentos...</span>
          </div>
        )}

        {!loading && activeTab === 'ACTIVE' && documents.length === 0 && (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm text-gray-400 text-sm">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
            </svg>
            <p className="font-semibold text-gray-600">No hay documentos cargados en este proyecto.</p>
            <p className="text-xs text-gray-400 mt-1">Usa el formulario superior para cargar el primer archivo.</p>
          </div>
        )}

        {!loading && activeTab === 'ACTIVE' && documents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between gap-4 hover:border-[#D40000]/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-red-50 text-[#D40000] border border-red-100 flex items-center justify-center text-xl shrink-0">
                    {getFileIcon(doc.name, doc.mimeType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-900 text-sm truncate" title={doc.name}>
                      {doc.name}
                    </h4>
                    {doc.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1" title={doc.description}>
                        {doc.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1.5 flex-wrap">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>&bull;</span>
                      <span>{new Date(doc.uploadedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>&bull;</span>
                      <span className="text-gray-600 font-semibold flex items-center gap-1">
                        <span>👤</span>
                        <span>{doc.uploader?.name || doc.uploader?.email || 'Miembro'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewFile({
                        name: doc.name,
                        fileUrl: doc.fileUrl,
                        mimeType: doc.mimeType,
                        fileSize: doc.fileSize,
                      });
                      setShowPreview(true);
                    }}
                    className="px-3 py-1.5 bg-[#D40000]/10 hover:bg-[#D40000]/20 text-[#D40000] font-bold text-xs uppercase tracking-wider rounded-lg transition-all border border-[#D40000]/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Vista Previa</span>
                  </button>

                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-xs uppercase tracking-wider rounded-lg transition-all border border-gray-200 flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                    <span>Descargar</span>
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    title="Eliminar documento"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab === 'HISTORY' && deletedDocuments.length === 0 && (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm text-gray-400 text-sm">
            <p className="font-semibold text-gray-600">No hay documentos eliminados en el historial.</p>
          </div>
        )}

        {!loading && activeTab === 'HISTORY' && deletedDocuments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deletedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="bg-gray-50 p-5 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between gap-4 opacity-75"
              >
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-xl bg-gray-200 text-gray-500 border border-gray-300 flex items-center justify-center text-xl shrink-0">
                    {getFileIcon(doc.name, doc.mimeType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-900 text-sm truncate line-through" title={doc.name}>
                      {doc.name}
                    </h4>
                    <div className="flex flex-col gap-1 text-[11px] text-gray-500 mt-1.5">
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-[#D40000]">Eliminado el:</span>
                        <span>{doc.deletedAt ? new Date(doc.deletedAt).toLocaleDateString('es-ES') : '-'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-semibold text-[#D40000]">Por:</span>
                        <span>{doc.deleter?.name || doc.deleter?.email || 'Miembro'}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewFile({
                        name: doc.name,
                        fileUrl: doc.fileUrl,
                        mimeType: doc.mimeType,
                        fileSize: doc.fileSize,
                      });
                      setShowPreview(true);
                    }}
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-lg transition-all border border-gray-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs uppercase tracking-wider rounded-lg transition-all border border-gray-300 flex items-center gap-1 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                  </a>
                  <button
                    onClick={() => handleRestore(doc.id)}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors border border-emerald-200 cursor-pointer"
                    title="Restaurar documento"
                  >
                    Restaurar
                  </button>
                </div>
              </div>
            ))}
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
};
