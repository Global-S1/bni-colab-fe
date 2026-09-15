import React, { useState, useEffect } from 'react';

export interface InteractiveTourProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface TourStep {
  selector: string;
  badge: string;
  title: string;
  description: string;
  actionHint: string;
  actionUrl?: string;
  highlights: string[];
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="logo-brand"]',
    badge: 'Paso 1 de 7',
    title: '¡Te damos la bienvenida a BNI Colab!',
    description:
      'Esta es tu plataforma colaborativa integral. Te guiaremos paso a paso mostrando exactamente dónde hacer clic en cada sección.',
    actionHint: '👈 Esta es la identidad principal de BNI Tech Colab.',
    highlights: [
      'Navegación directa por secciones dedicadas.',
      'Identificadores únicos correlativos (BT-001, PRJ-001, TAR-001).',
    ],
  },
  {
    selector: '[data-tour="nav-teams"]',
    badge: 'Paso 2 de 7',
    title: 'Módulo de Equipos (BT-001)',
    description:
      'Haz clic aquí para organizar tus equipos de trabajo, administrar miembros, invitar colaboradores y asignar roles.',
    actionHint: '👈 ¡Haz clic aquí o pulsa Siguiente para ir a Equipos!',
    actionUrl: '/teams',
    highlights: [
      'Código correlativo único por equipo (ej. BT-001).',
      'Gestión de roles: Propietario, Admin y Miembro.',
    ],
  },
  {
    selector: '[data-tour="nav-projects"]',
    badge: 'Paso 3 de 7',
    title: 'Proyectos y Tablero Kanban (PRJ-001)',
    description:
      'Haz clic en "Proyectos" para acceder a la lista consolidada, aplicar filtros por estado y gestionar tareas en el Kanban.',
    actionHint: '👈 ¡Haz clic aquí para ver tus Proyectos!',
    actionUrl: '/projects',
    highlights: [
      'Filtros dinámicos por estado, prioridad y equipo.',
      'Tablero Kanban visual con movimiento Drag & Drop.',
    ],
  },
  {
    selector: '[data-tour="nav-calendar"]',
    badge: 'Paso 4 de 7',
    title: 'Calendario y Entregables',
    description:
      'Haz clic en "Calendario" para ver la programación temporal de entregas, fechas límite de tareas y reuniones agendadas.',
    actionHint: '👈 ¡Haz clic aquí para consultar el Calendario!',
    actionUrl: '/calendar',
    highlights: [
      'Vista de fechas de entrega de proyectos y tareas.',
      'Sincronización de eventos del equipo.',
    ],
  },
  {
    selector: '[data-tour="nav-admin"]',
    badge: 'Paso 5 de 7',
    title: 'Panel Root Admin',
    description:
      'Haz clic en "Root Admin" para ingresar al panel de administración del sistema (gestión global de usuarios y auditoría).',
    actionHint: '👈 ¡Haz clic aquí para ir al Panel de Administración!',
    actionUrl: '/admin',
    highlights: [
      'Control centralizado de permisos y usuarios.',
      'Métricas y registros de auditoría del sistema.',
    ],
  },
  {
    selector: '[data-tour="nav-profile"]',
    badge: 'Paso 6 de 7',
    title: 'Mi Perfil de Usuario',
    description:
      'Haz clic en tu foto o nombre en el pie del menú lateral para personalizar tu información de usuario y ver tus tareas.',
    actionHint: '👈 ¡Haz clic aquí para editar tu Perfil!',
    actionUrl: '/profile',
    highlights: [
      'Actualización de nombre, avatar e información visual.',
      'Consulta de proyectos y tareas asignadas.',
    ],
  },
  {
    selector: '[data-tour="open-tour-btn"]',
    badge: 'Paso 7 de 7',
    title: 'Guía Interactiva en Cualquier Momento',
    description:
      'En la barra superior siempre tendrás el botón "Guía Interactiva". Haz clic allí cuando desees volver a repetir este tour.',
    actionHint: '☝️ ¡Haz clic en Guía Interactiva para reiniciar cuando quieras!',
    highlights: [
      'Disponible en todas las páginas de la plataforma.',
      'No interrumpe tu trabajo ni elimina tus datos.',
    ],
  },
];

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({ isOpen: externalIsOpen, onClose: externalOnClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const currentStep = TOUR_STEPS[stepIndex];

  useEffect(() => {
    if (externalIsOpen === undefined) {
      const completed = localStorage.getItem('bni_colab_tour_completed');
      if (!completed) {
        setInternalIsOpen(true);
      }
    }
  }, [externalIsOpen]);

  // Target element bounding rectangle calculation
  const updateTargetRect = () => {
    if (!isOpen || !currentStep) return;
    const el = document.querySelector(currentStep.selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    updateTargetRect();
    const handleResizeOrScroll = () => updateTargetRect();
    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);
    const interval = setInterval(updateTargetRect, 500);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
      clearInterval(interval);
    };
  }, [isOpen, stepIndex]);

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

  const handleTargetClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStep.actionUrl) {
      window.location.href = currentStep.actionUrl;
    } else {
      handleNext();
    }
  };

  if (!isOpen) return null;

  const isLastStep = stepIndex === TOUR_STEPS.length - 1;

  // Calculate tooltip position relative to targetRect
  let tooltipStyle: React.CSSProperties = {};
  let placement = 'center';

  if (targetRect) {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    // Check if target is in sidebar (left portion of screen)
    if (targetRect.left < 320 && windowWidth > 768) {
      placement = 'right';
      tooltipStyle = {
        top: Math.max(16, Math.min(targetRect.top, windowHeight - 400)),
        left: Math.min(targetRect.left + targetRect.width + 20, windowWidth - 460),
      };
    } else if (targetRect.top < 100) {
      // Target is in top header
      placement = 'below';
      tooltipStyle = {
        top: targetRect.top + targetRect.height + 16,
        right: Math.max(16, windowWidth - (targetRect.left + targetRect.width)),
      };
    } else {
      placement = 'center';
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* SVG Backdrop Overlay with Cutout Hole Mask over targetRect */}
      <svg className="fixed inset-0 w-full h-full z-40 pointer-events-auto cursor-pointer" onClick={handleClose}>
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White fills the screen (opaque dark overlay) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black rectangle creates a 100% transparent cutout hole over the target element */}
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Dark backdrop rect rendered through the mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Spotlight Ring around target element */}
      {targetRect && (
        <div
          onClick={handleTargetClick}
          className="fixed z-50 border-4 border-[#D40000] rounded-2xl shadow-[0_0_35px_#D40000,0_0_15px_rgba(212,0,0,0.8)] animate-pulse cursor-pointer transition-all duration-300 pointer-events-auto group hover:bg-[#D40000]/10"
          style={{
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
          title="¡Haz clic aquí para interactuar!"
        >
          {/* Floating animated click indicator badge attached to target */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#D40000] text-white text-[11px] font-black px-3 py-1 rounded-full shadow-lg whitespace-nowrap uppercase tracking-wider flex items-center gap-1.5 animate-bounce">
            <span>👇 ¡HAZ CLIC AQUÍ!</span>
          </div>
        </div>
      )}

      {/* Guided Tour Callout Card */}
      <div
        className={`fixed z-50 w-full max-w-md p-4 sm:p-0 transition-all duration-300 ${
          placement === 'center' || !targetRect
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            : ''
        }`}
        style={placement !== 'center' && targetRect ? tooltipStyle : {}}
      >
        <div className="bg-[#1A1A24] border-2 border-[#D40000]/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-white transform transition-all duration-300 scale-100">
          {/* Progress Bar Top */}
          <div className="w-full bg-gray-800 h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D40000] to-[#FF3333] transition-all duration-300"
              style={{ width: `${((stepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
            />
          </div>

          {/* Card Content */}
          <div className="p-5 sm:p-6 space-y-4">
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#D40000]/20 border border-[#D40000]/40 text-[#D40000] flex items-center justify-center text-sm font-black shrink-0">
                  {stepIndex + 1}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#D40000] bg-[#D40000]/10 border border-[#D40000]/30 px-2 py-0.5 rounded-full">
                  {currentStep.badge}
                </span>
              </div>

              <button
                onClick={handleClose}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl cursor-pointer transition-colors"
                title="Cerrar tutorial (Esc)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-lg font-black text-white tracking-tight leading-snug">
                {currentStep.title}
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Action Hint Box */}
            <div className="bg-[#121117] p-3 rounded-xl border border-[#D40000]/40 flex items-center gap-2.5">
              <span className="text-lg animate-pulse">🎯</span>
              <p className="text-xs font-bold text-[#FF6666] leading-tight">
                {currentStep.actionHint}
              </p>
            </div>

            {/* Key highlights */}
            <div className="space-y-1 pt-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Puntos Clave:</p>
              <ul className="space-y-1 text-xs text-gray-300">
                {currentStep.highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#D40000] font-bold">✓</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Step dots */}
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
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-800">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-700 text-[#D40000] focus:ring-[#D40000] bg-gray-800 cursor-pointer"
                />
                <span className="text-[11px] text-gray-400">No mostrar al inicio</span>
              </label>

              <div className="flex items-center gap-2">
                {stepIndex > 0 && (
                  <button
                    onClick={handlePrev}
                    className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-gray-700 cursor-pointer"
                  >
                    ← Ant
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#D40000]/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>{isLastStep ? 'Finalizar' : 'Siguiente →'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
