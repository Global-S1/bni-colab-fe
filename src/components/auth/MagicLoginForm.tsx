import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';

export const MagicLoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devMagicUrl, setDevMagicUrl] = useState<string | null>(null);

  // Verificación de existencia de usuario root
  const [checkingRoot, setCheckingRoot] = useState(true);
  const [hasRoot, setHasRoot] = useState(true);
  const [rootName, setRootName] = useState('');
  const [rootEmail, setRootEmail] = useState('');
  const [rootLoading, setRootLoading] = useState(false);

  useEffect(() => {
    fetchApi<{ hasRoot: boolean }>('/auth/root-status')
      .then((res) => {
        setHasRoot(res.hasRoot);
      })
      .catch((err) => {
        console.warn('No se pudo verificar estado de root:', err);
      })
      .finally(() => {
        setCheckingRoot(false);
      });
  }, []);

  const handleSetupFirstRoot = async (e: React.FormEvent) => {
    e.preventDefault();
    setRootLoading(true);
    setError(null);

    try {
      const res = await fetchApi<{ message: string; accessToken: string; user: any }>('/auth/setup-first-root', {
        method: 'POST',
        body: JSON.stringify({ email: rootEmail, name: rootName }),
      });
      localStorage.setItem('bni_colab_token', res.accessToken);
      window.location.href = '/teams';
    } catch (err: any) {
      setError(err.message || 'Error al configurar el Administrador Root.');
    } finally {
      setRootLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);
    setDevMagicUrl(null);

    try {
      const res = await fetchApi<{ message: string; magicUrl?: string }>('/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setMessage(res.message);
      if (res.magicUrl) {
        setDevMagicUrl(res.magicUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al solicitar el enlace mágico.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdmin = () => {
    setEmail('bnitech@globals.one');
  };

  if (checkingRoot) {
    return (
      <div className="bg-[#1A1A24]/60 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 ring-1 ring-white/5 text-center text-gray-400">
        <div className="w-8 h-8 border-2 border-[#D40000] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-medium">Iniciando sistema BNI Colab...</p>
      </div>
    );
  }

  // SI LA PLATAFORMA NO CUENTA CON USUARIO ROOT, SE MUESTRA EL FORMULARIO PARA CREARLO
  if (!hasRoot) {
    return (
      <div className="bg-[#1A1A24]/60 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 ring-1 ring-white/5 space-y-6">
        <div className="text-center mb-6">
          <div className="bg-white w-20 h-20 rounded-2xl inline-flex items-center justify-center shadow-xl mb-4">
            <span className="text-xl font-black tracking-tight text-[#D40000] text-center leading-none">TECH</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Root <span className="text-[#D40000]">Admin</span>
          </h2>
          <p className="text-gray-400 text-xs font-medium mt-1">Configuración inicial de la plataforma</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-2xl text-xs flex items-center">
            <svg className="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSetupFirstRoot} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Email Corporativo Principal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                </svg>
              </span>
              <input
                type="email"
                required
                value={rootEmail}
                onChange={(e) => setRootEmail(e.target.value)}
                placeholder="admin@globals1.com"
                className="w-full bg-[#252532]/50 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D40000] focus:border-transparent transition-all shadow-inner text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">
              Nombre Completo
            </label>
            <input
              type="text"
              value={rootName}
              onChange={(e) => setRootName(e.target.value)}
              placeholder="Administrador Principal"
              className="w-full bg-[#252532]/50 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D40000] focus:border-transparent transition-all shadow-inner text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={rootLoading}
            className="w-full bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white py-4 px-6 rounded-2xl font-bold text-xs tracking-widest uppercase shadow-xl shadow-[#D40000]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {rootLoading ? 'Configurando...' : 'Crear Super Administrador e Ingresar'}
          </button>
        </form>
      </div>
    );
  }

  // FORMULARIO ESTÁNDAR DE LOGIN EXACTO A BNI EVENTOS
  return (
    <div className="bg-[#1A1A24]/60 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-white/10 ring-1 ring-white/5">
      {/* Header con icono TECH y Colores Idénticos */}
      <div className="text-center mb-8">
        <div className="bg-white w-24 h-24 rounded-2xl inline-flex items-center justify-center shadow-xl mb-6">
          <span className="text-2xl font-black tracking-tight text-[#D40000] text-center leading-none">TECH</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          <span className="text-[#D40000]">Colab</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2 font-medium">Panel de Gestión y Proyectos</p>
      </div>

      {message && (
        <div className="mb-6 bg-green-500/10 border border-green-500/50 text-green-200 px-4 py-3 rounded-2xl text-sm flex items-start gap-3 animate-fade-in">
          <svg className="w-5 h-5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div className="text-xs font-medium">
            <p className="font-bold text-white text-sm mb-0.5">Enlace de acceso enviado</p>
            {message}
          </div>
        </div>
      )}

      {devMagicUrl && (
        <a
          href={devMagicUrl}
          className="mb-6 block bg-[#D40000] text-white text-center px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#AA0000] transition-all shadow-lg shadow-[#D40000]/25"
        >
          Ingresar ahora →
        </a>
      )}

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-2xl text-sm flex items-center">
          <svg className="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span className="text-xs">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2 ml-1">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
              Email Corporativo
            </label>
            <button
              type="button"
              onClick={handleQuickAdmin}
              className="text-[11px] font-bold text-[#D40000] hover:text-[#FF3333] transition-colors cursor-pointer"
            >
              Usar correo admin
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
              </svg>
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#252532]/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#D40000] focus:border-transparent transition-all shadow-inner text-sm"
              placeholder="tu@bni.com"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white py-4 px-6 rounded-2xl font-bold text-sm tracking-widest uppercase shadow-xl shadow-[#D40000]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Procesando...
            </span>
          ) : (
            'Enviar Enlace de Acceso'
          )}
        </button>
      </form>

      <p className="mt-8 text-center text-xs text-gray-500 font-medium">
        &copy; {new Date().getFullYear()} Global S1. Todos los derechos reservados.
      </p>
    </div>
  );
};
