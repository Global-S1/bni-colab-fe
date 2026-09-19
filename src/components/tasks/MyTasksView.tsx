import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TaskList, TaskItem } from './TaskList';

export const MyTasksView: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem('bni_colab_token') : null;

  const { data: tasks, isLoading, error } = useQuery<TaskItem[]>({
    queryKey: ['my-tasks', statusFilter],
    queryFn: async () => {
      const url = new URL(
        '/api/v1/tasks/my-tasks',
        import.meta.env.PUBLIC_API_URL || 'https://api.colab.bnitech.online'
      );
      if (statusFilter) url.searchParams.append('status', statusFilter);

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Error al cargar tus tareas');
      return res.json();
    },
    enabled: !!token,
  });

  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mis Tareas</h1>
          <p className="text-sm text-gray-500 mt-1">Todas las tareas asignadas a ti en todos los proyectos.</p>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold bg-white text-gray-700 shadow-sm focus:border-[#D40000] focus:ring-1 focus:ring-[#D40000] outline-none"
          >
            <option value="">Todos los Estados</option>
            <option value="TODO">Por Hacer</option>
            <option value="IN_PROGRESS">En Progreso</option>
            <option value="REVIEW">En Revisión</option>
            <option value="DONE">Completadas</option>
          </select>
        </div>
      </header>

      {isLoading && (
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D40000]"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium">
          Error: {(error as Error).message}
        </div>
      )}

      {tasks && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <TaskList tasks={tasks} members={[]} />
        </div>
      )}
    </div>
  );
};
