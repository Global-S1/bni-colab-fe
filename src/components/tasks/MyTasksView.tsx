import React, { useState, useEffect } from 'react';
import { fetchApi } from '../../lib/api';
import { TaskList, TaskItem } from './TaskList';

export const MyTasksView: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState('');
  const [tasks, setTasks] = useState<TaskItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let endpoint = '/tasks/my-tasks';
        if (statusFilter) {
          endpoint += `?status=${encodeURIComponent(statusFilter)}`;
        }
        const data = await fetchApi<TaskItem[]>(endpoint);
        setTasks(data);
      } catch (err: any) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, [statusFilter]);

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
