import React, { useState, useEffect } from 'react';

export interface InteractiveTourProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface TourStep {
  icon: string;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: '🚀',
    badge: 'Paso 1 de 7',
    title: '¡Te damos la bienvenida a BNI Colab!',
    description:
      'Plataforma colaborativa integral diseñada para optimizar el trabajo en equipo, la gestión de proyectos y la asignación de tareas con alta velocidad.',
    highlights: [
      'Navegación fluida por páginas dedicadas (sin modales encimados).',
      'Identificadores únicos correlativos por iniciales en todos los registros.',
    ],
  },
  {
    icon: '👥',
    badge: 'Paso 2 de 7',
    title: 'Organización por Equipos (BT-001)',
    description:
      'Crea o únete a equipos públicos o privados. Invita miembros por correo corporativo y asigna roles de Propietario, Administrador o Miembro.',
    highlights: [
      'Código único de equipo (ej. BT-001).',
      'Acceso restringido estricto según permisos del usuario.',
    ],
  },
  {
    icon: '📁',
    badge: 'Paso 3 de 7',
    title: 'Vista de Proyectos con Filtros Avanzados (PRJ-001)',
    description:
      'Accede a la lista consolidada de proyectos desde el menú lateral. Filtra por estado (Activo, Completado, Archivado), equipo asignado o por código.',
    highlights: [
      'Barra de avance en porcentaje recalculada en tiempo real.',
      'Buscador instantáneo por nombre o código único (ej. PRJ-001).',
    ],
  },
  {
    icon: '📋',
    badge: 'Paso 4 de 7',
    title: 'Tablero Kanban con Drag & Drop Native',
    description:
      'Gestión visual mediante columnas (Por Hacer, En Progreso, En Revisión, Completada). Arrastra y suelta tarjetas para actualizar el estado inmediatamente.',
    highlights: [
      'Soporte nativo de HTML5 Drag & Drop.',
      'Tarjetas con badges de contraste accesibles y legibilidad alta.',
    ],
  },
  {
    icon: '🎯',
    badge: 'Paso 5 de 7',
    title: 'Vista Dedicada de Tarea (TAR-001) y @Menciones',
    description:
      'Página completa por tarea con historial de auditoría, adjuntos y sección de comentarios. Etiqueta compañeros usando "@" para enviarles notificación por correo.',
    highlights: [
      'Notificaciones automáticas por correo electrónico al etiquetar personas.',
      'Pestañas organizadas de Comentarios e Historial de Cambios.',
    ],
  },
  {
    icon: '👁️',
    badge: 'Paso 6 de 7',
    title: 'Vista Previa Web de Archivos (0% Descargas)',
    description:
      'Abre y previsualiza archivos en el navegador sin descargarlos al disco local. Compatible con Imágenes, PDF, Office (Word/Excel/PowerPoint), Audio y Video.',
    highlights: [
      'Diálogo modal seguro con controles de zoom, copia de texto y descarga.',
      'Garantía de almacenamiento con ruta pública local de alta velocidad.',
    ],
  },
  {
    icon: '📅',
    badge: 'Paso 7 de 7',
    title: 'Calendario y Programación de Reuniones',
    description:
      'Sincroniza a tu equipo programando reuniones directamente en la plataforma con envío automático de alertas por correo.',
    highlights: [
      'Notificaciones instantáneas para calendarios externos.',
      'Sincronización fluida con proyectos y equipos.',
    ],
  },
];

export const InteractiveTour: React.FC<InteractiveTourProps> = ({ isOpen: externalIsOpen, onClose: externalOnClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  useEffect(() => {
    if (externalIsOpen === undefined) {
      const completed = localStorage.getItem('bni_colab_tour_completed');
      if (!completed) {
        setInternalIsOpen(true);
      }
    }
  }, [externalIsOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, stepIndex, dontShowAgain]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('bni_colab_tour_completed', 'true');
    }
    if (externalOnClose) {
      externalOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleNext = () => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      localStorage.setItem('bni_colab_tour_completed', 'true');
      handleClose();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    }
  };

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[stepIndex];
  const isLastStep = stepIndex === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1A1A24] border border-gray-700/80 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col relative text-white">
        {/* Progress Bar Top */}
        <div className="w-full bg-gray-800 h-1.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#D40000] to-[#FF3333] transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-2xl bg-[#D40000]/20 border border-[#D40000]/40 text-[#D40000] flex items-center justify-center text-xl shrink-0">
                {currentStep.icon}
              </span>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D40000] bg-[#D40000]/10 border border-[#D40000]/30 px-2 py-0.5 rounded-full">
                  {currentStep.badge}
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl cursor-pointer transition-colors"
              title="Cerrar tutorial (Esc)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Title & Description */}
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {currentStep.title}
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Highlights Box */}
          <div className="bg-[#121117] p-4 rounded-2xl border border-gray-800 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Puntos Clave:</p>
            <ul className="space-y-1.5 text-xs text-gray-200">
              {currentStep.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#D40000] font-bold mt-0.5">✓</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Step dots indicator */}
          <div className="flex items-center justify-center gap-1.5 py-1">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStepIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === stepIndex ? 'w-6 bg-[#D40000]' : 'w-2 bg-gray-700 hover:bg-gray-500'
                }`}
                title={`Ir al paso ${idx + 1}`}
              />
            ))}
          </div>

          {/* Footer Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-gray-800">
            <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 text-[#D40000] focus:ring-[#D40000] bg-gray-800 cursor-pointer"
              />
              <span className="text-xs text-gray-400">No mostrar automáticamente</span>
            </label>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {stepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-gray-700 cursor-pointer"
                >
                  ← Anterior
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-5 py-2.5 bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#D40000]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1"
              >
                <span>{isLastStep ? 'Finalizar Tutorial' : 'Siguiente →'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
