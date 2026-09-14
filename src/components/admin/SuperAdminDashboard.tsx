import React, { useState, useEffect } from 'react';
import { fetchApi, getAuthToken } from '../../lib/api';

interface UserItem {
  id: string;
  email: string;
  name: string;
  systemRole: 'SUPER_ADMIN' | 'USER';
  status: 'INVITED' | 'ACTIVE' | 'INACTIVE';
  metadata: Record<string, any>;
  createdAt: string;
}

export const SuperAdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [systemRole, setSystemRole] = useState<'USER' | 'SUPER_ADMIN'>('USER');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadUsers = async () => {
    const token = getAuthToken();
    if (!token) {
      setNeedsAuth(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setNeedsAuth(false);
      setError(null);
      const data = await fetchApi<UserItem[]>('/auth/admin/users');
      setUsers(data);
    } catch (err: any) {
      if (err.message?.includes('No autorizado') || err.message?.includes('token') || err.message?.includes('Token')) {
        setNeedsAuth(true);
      } else {
        setError(err.message || 'Error cargando lista de usuarios');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handlePreRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setError(null);

    try {
      await fetchApi('/auth/admin/users', {
        method: 'POST',
        body: JSON.stringify({
          email,
          name,
          systemRole,
          metadata: { invitedBy: 'Root Super Admin', registeredAt: new Date().toISOString() },
        }),
      });
      setSuccessMsg(`¡Usuario ${email} registrado y autorizado exitosamente!`);
      setEmail('');
      setName('');
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'Error registrando usuario.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner idéntico a Eventos */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-[10px] font-bold text-[#D40000] uppercase tracking-[0.4em] mb-2">Administración Central</p>
          <h1 className="text-4xl font-black tracking-tight">
            <span className="text-[#111827]">Gestión de</span> <span className="text-[#D40000]">Usuarios</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">Autoriza miembros para acceso seguro por enlace mágico a la plataforma.</p>
        </div>

        {needsAuth && (
          <a
            href="/login"
            className="bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold py-3.5 px-6 rounded-2xl text-xs tracking-widest uppercase shadow-lg shadow-[#D40000]/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Iniciar Sesión como Admin
          </a>
        )}
      </div>

      {/* Alerta si requiere autenticación */}
      {needsAuth && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[#D40000] text-lg font-bold">⚠️</span>
            <span className="font-medium">
              Para gestionar usuarios y acceder a las funciones de Root Admin debes iniciar sesión.
            </span>
          </div>
          <a href="/login" className="bg-[#D40000] text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-[#B80000] transition-colors shrink-0 uppercase tracking-wider">
            Ir al Login
          </a>
        </div>
      )}

      {/* Grid de Formulario y Tabla */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pre-register Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit space-y-5">
          <div className="border-b border-gray-100 pb-3 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D40000] text-white flex items-center justify-center font-bold text-sm">
              +
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Pre-Registrar Miembro</h3>
              <p className="text-xs text-gray-400">Habilita su correo para que pueda ingresar</p>
            </div>
          </div>

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <span className="font-bold">✓</span>
              <span>{successMsg}</span>
            </div>
          )}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handlePreRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Correo Electrónico <span className="text-[#D40000]">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@globals1.com"
                className="w-full brand-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Nombre Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Juan Pérez"
                className="w-full brand-input text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Rol en el Sistema
              </label>
              <select
                value={systemRole}
                onChange={(e) => setSystemRole(e.target.value as any)}
                className="w-full brand-input text-sm"
              >
                <option value="USER">Usuario Estándar (Miembro)</option>
                <option value="SUPER_ADMIN">Super Administrador (Root)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving || needsAuth}
              className="w-full bg-gradient-to-r from-[#D40000] to-[#8B0000] text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-md shadow-[#D40000]/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {saving ? 'Registrando...' : 'Autorizar Usuario'}
            </button>
          </form>
        </div>

        {/* Table of Users */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>Usuarios Autorizados</span>
              <span className="bg-red-50 text-[#D40000] border border-red-100 px-2.5 py-0.5 rounded-full text-xs font-bold">
                {users.length}
              </span>
            </h3>

            <button
              onClick={loadUsers}
              className="text-xs text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer"
            >
              ↻ Refrescar
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400 flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-[#D40000] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Cargando usuarios...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-sm">No se encontraron usuarios registrados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-100">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-bold tracking-wider border-b border-gray-100">
                  <tr>
                    <th className="py-3 px-4">Usuario</th>
                    <th className="py-3 px-4">Correo</th>
                    <th className="py-3 px-4">Rol Sistema</th>
                    <th className="py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">{u.name || 'Sin nombre'}</td>
                      <td className="py-3 px-4 text-gray-500">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${u.systemRole === 'SUPER_ADMIN' ? 'bg-red-50 text-[#D40000] border border-red-200' : 'bg-gray-100 text-gray-700'}`}>
                          {u.systemRole}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'}`}>
                          {u.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
