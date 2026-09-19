import React, { useState, useEffect } from 'react';
import { resolveFileUrl } from '../../lib/api';

export interface PreviewableFile {
  name: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
}

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: PreviewableFile | null;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ isOpen, onClose, file }) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);
  const [textError, setTextError] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && file) {
      setImgError(false);
      const ext = getExtension(file.name, resolveFileUrl(file.fileUrl));
      if (isTextExtension(ext)) {
        loadTextContent(resolveFileUrl(file.fileUrl));
      } else {
        setTextContent(null);
      }
    }
  }, [isOpen, file]);

  if (!isOpen || !file) return null;

  const getExtension = (name: string, url: string): string => {
    const fromName = name.split('.').pop()?.toLowerCase() || '';
    if (fromName && fromName.length <= 5 && !fromName.includes('/')) return fromName;
    const cleanUrl = url.split('?')[0];
    return cleanUrl.split('.').pop()?.toLowerCase() || '';
  };

  const ext = getExtension(file.name, resolveFileUrl(file.fileUrl));
  const mime = (file.mimeType || '').toLowerCase();

  const isImage =
    ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext) || mime.startsWith('image/');
  const isPdf = ext === 'pdf' || mime === 'application/pdf';
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  const isVideo = ['mp4', 'webm', 'ogg', 'mov'].includes(ext) || mime.startsWith('video/');
  const isAudio = ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext) || mime.startsWith('audio/');
  const isText = isTextExtension(ext) || mime.startsWith('text/');

  function isTextExtension(extension: string) {
    return ['txt', 'csv', 'json', 'md', 'xml', 'log', 'js', 'ts', 'css', 'html', 'sql', 'yaml', 'yml'].includes(
      extension,
    );
  }

  const loadTextContent = async (url: string) => {
    setLoadingText(true);
    setTextError(false);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se pudo cargar el archivo');
      const text = await res.text();
      setTextContent(text);
    } catch {
      setTextError(true);
    } finally {
      setLoadingText(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCopyText = () => {
    if (textContent) {
      navigator.clipboard.writeText(textContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Viewers
  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(resolveFileUrl(file.fileUrl))}&embedded=true`;
  const officeOnlineViewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resolveFileUrl(file.fileUrl))}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="w-full max-w-6xl bg-[#121117] text-white p-3.5 sm:p-5 rounded-2xl border border-gray-800 shadow-2xl flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-[#D40000]/20 border border-[#D40000]/40 text-[#D40000] flex items-center justify-center font-bold text-sm shrink-0">
            {isImage
              ? '🖼️'
              : isPdf
              ? '📕'
              : isOffice
              ? '📘'
              : isVideo
              ? '🎬'
              : isAudio
              ? '🎵'
              : isText
              ? '📝'
              : '📄'}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-sm sm:text-base text-white truncate" title={file.name}>
              {file.name}
            </h3>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
              <span className="uppercase font-mono font-bold text-[#D40000] bg-[#D40000]/10 px-1.5 py-0.2 rounded">
                .{ext || 'archivo'}
              </span>
              {formatFileSize(file.fileSize) && (
                <>
                  <span>&bull;</span>
                  <span>{formatFileSize(file.fileSize)}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isText && textContent && (
            <button
              onClick={handleCopyText}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-bold rounded-xl transition-all border border-gray-700 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>{isCopied ? '¡Copiado!' : 'Copiar Texto'}</span>
            </button>
          )}

          <a
            href={resolveFileUrl(file.fileUrl)}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-xl transition-all border border-gray-700 flex items-center gap-1.5"
            title="Abrir en pestaña nueva"
          >
            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            <span className="hidden sm:inline">Pestaña Nueva</span>
          </a>

          <a
            href={resolveFileUrl(file.fileUrl)}
            download
            className="px-3.5 py-1.5 bg-[#D40000] hover:bg-[#B00000] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#D40000]/30 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Descargar</span>
          </a>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl cursor-pointer transition-colors ml-1"
            title="Cerrar vista previa (Esc)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content Preview Stage */}
      <div className="w-full max-w-6xl flex-1 my-3 bg-[#1A1A24]/90 rounded-2xl border border-gray-800 p-2 sm:p-4 overflow-hidden flex items-center justify-center relative">
        {/* IMAGE PREVIEW */}
        {isImage && (
          <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
            {!imgError ? (
              <img
                src={resolveFileUrl(file.fileUrl)}
                alt={file.name}
                onError={() => setImgError(true)}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl border border-gray-800 bg-[#0F0F12]"
              />
            ) : (
              <div className="p-8 bg-[#121117] rounded-2xl border border-gray-800 shadow-2xl text-center space-y-4 max-w-md w-full">
                <div className="w-16 h-16 rounded-full bg-red-900/30 text-red-500 border border-red-800/50 flex items-center justify-center text-2xl mx-auto">
                  ⚠️
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">No se pudo cargar la imagen directa</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    La URL remota no respondió o fue inaccesible. Puedes abrirla en una nueva pestaña o descargarla.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <a
                    href={resolveFileUrl(file.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl transition-all border border-gray-700"
                  >
                    Abrir Enlace
                  </a>
                  <a
                    href={resolveFileUrl(file.fileUrl)}
                    download
                    className="px-4 py-2 bg-[#D40000] hover:bg-[#B00000] text-white font-bold text-xs rounded-xl transition-all"
                  >
                    Descargar
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PDF PREVIEW */}
        {isPdf && (
          <iframe
            src={resolveFileUrl(file.fileUrl)}
            title={file.name}
            className="w-full h-full min-h-[70vh] rounded-xl bg-white border-0 shadow-xl"
          />
        )}

        {/* OFFICE PREVIEW (Word, Excel, PowerPoint) */}
        {isOffice && (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <iframe
              src={googleDocsViewerUrl}
              title={file.name}
              className="w-full h-full min-h-[70vh] rounded-xl bg-white border-0 shadow-xl"
              onError={() => {}}
            />
          </div>
        )}

        {/* VIDEO PREVIEW */}
        {isVideo && (
          <div className="w-full h-full flex items-center justify-center">
            <video
              src={resolveFileUrl(file.fileUrl)}
              controls
              autoPlay
              className="max-h-[75vh] max-w-full rounded-xl bg-black shadow-2xl"
            />
          </div>
        )}

        {/* AUDIO PREVIEW */}
        {isAudio && (
          <div className="p-8 bg-[#121117] rounded-2xl border border-gray-800 shadow-2xl text-center space-y-6 max-w-md w-full">
            <div className="w-20 h-20 rounded-full bg-[#D40000]/20 border border-[#D40000]/40 text-[#D40000] flex items-center justify-center text-3xl mx-auto animate-pulse">
              🎵
            </div>
            <div>
              <h4 className="font-bold text-white text-base">{file.name}</h4>
              <p className="text-xs text-gray-400 mt-1">Reproductor de Audio Integrado</p>
            </div>
            <audio src={resolveFileUrl(file.fileUrl)} controls className="w-full" autoPlay />
          </div>
        )}

        {/* TEXT / CODE PREVIEW */}
        {isText && (
          <div className="w-full h-full bg-[#121117] rounded-xl border border-gray-800 p-4 overflow-auto text-left font-mono text-xs text-gray-200">
            {loadingText && (
              <div className="py-16 text-center text-gray-400 space-y-2">
                <div className="w-6 h-6 border-2 border-[#D40000] border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Cargando contenido de texto...</p>
              </div>
            )}

            {textError && (
              <div className="py-12 text-center text-red-400 space-y-2">
                <p>⚠️ No se pudo renderizar el texto directamente en el navegador.</p>
                <a
                  href={resolveFileUrl(file.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2 bg-gray-800 text-white font-bold text-xs rounded-xl"
                >
                  Abrir archivo en pestaña nueva
                </a>
              </div>
            )}

            {!loadingText && !textError && textContent !== null && (
              <pre className="whitespace-pre-wrap break-words leading-relaxed font-mono">
                {textContent}
              </pre>
            )}
          </div>
        )}

        {/* FALLBACK FOR UNPREVIEWABLE FILES */}
        {!isImage && !isPdf && !isOffice && !isVideo && !isAudio && !isText && (
          <div className="p-8 sm:p-12 bg-[#121117] rounded-2xl border border-gray-800 shadow-2xl text-center space-y-5 max-w-md w-full">
            <div className="w-20 h-20 rounded-full bg-gray-800 text-gray-300 flex items-center justify-center text-3xl mx-auto">
              📦
            </div>
            <div>
              <h4 className="font-bold text-white text-base">{file.name}</h4>
              <p className="text-xs text-gray-400 mt-1">
                Este tipo de archivo (.{ext}) se visualiza de forma óptima al abrirlo o descargarlo directamente.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <a
                href={resolveFileUrl(file.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl transition-all border border-gray-700"
              >
                Abrir en Navegador
              </a>
              <a
                href={resolveFileUrl(file.fileUrl)}
                download
                className="px-4 py-2 bg-[#D40000] hover:bg-[#B00000] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-[#D40000]/30"
              >
                Descargar Archivo
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-gray-400 shrink-0">
        <span>Presiona <kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-200">Esc</kbd> o haz clic en la &quot;X&quot; para cerrar la vista previa.</span>
      </div>
    </div>
  );
};
