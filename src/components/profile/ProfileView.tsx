import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';

export default function ProfileView() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Form fields
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await fetchApi<any>('/auth/me');
      setUser(data);
      setName(data.name || '');
      setTitle(data.metadata?.title || '');
      setPhone(data.metadata?.phone || '');
      setBio(data.metadata?.bio || '');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error cargando perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    try {
      setSaving(true);
      const updated = await fetchApi<any>('/auth/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          metadata: {
            title: title.trim(),
            phone: phone.trim(),
            bio: bio.trim(),
          },
        }),
      });

      // Update localStorage user so layout reflects new name instantly
      const stored = localStorage.getItem('bni_colab_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.name = updated.name;
        localStorage.setItem('bni_colab_user', JSON.stringify(parsed));
      }

      setUser(updated);
      setSuccessMessage('¡Tus datos de perfil han sido actualizados con éxito!');

      // Update sidebar DOM if exists
      const nameEl = document.getElementById('user-name');
      const avatarEl = document.getElementById('user-avatar');
      if (nameEl) nameEl.textContent = updated.name;
      if (avatarEl && updated.name) avatarEl.textContent = updated.name.substring(0, 2).toUpperCase();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error actualizando perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-gray-400 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#D40000] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-medium">Cargando perfil...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D40000] to-[#8B0000] text-white flex items-center justify-center text-2xl font-black shadow-md shadow-[#D40000]/20">
            {(name || user?.email || 'U').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">{name || 'Mi Perfil'}</h1>
              <span className="px-2.5 py-0.5 bg-red-50 text-[#D40000] border border-red-200 rounded-full text-[10px] font-black uppercase tracking-wider">
                {user?.systemRole}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Miembro desde</span>
          <span className="text-xs font-semibold text-gray-700">
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) : '-'}
          </span>
        </div>
      </div>

      {/* Main Profile Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        <div className="pb-4 border-b border-gray-100 mb-6">
          <h2 className="text-base font-bold text-gray-900">Editar Datos Personales</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Configura cómo te ven los demás miembros en las tareas, proyectos y asignaciones de equipo.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-xl">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Nombre Completo *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre y apellidos"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Correo Electrónico (No editable)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Cargo / Rol en la Organización
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej: Product Lead, Ingeniero de Software, Director"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+51 987 654 321"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
              Biografía / Resumen Breve
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntale brevemente a tus equipos sobre tu experiencia y áreas de especialidad..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D40000] focus:border-transparent outline-none"
            />
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-[#D40000] hover:bg-[#B00000] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-[#D40000]/20 disabled:opacity-50 cursor-pointer transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <span>Guardar Cambios de Perfil</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
