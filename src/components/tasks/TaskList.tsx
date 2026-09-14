import React from 'react';

export interface TaskItem {
  id: string;
  code?: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  assigneeId: string;
  reporterId?: string;
  reporter?: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  dueDate: string | null;
  tags: string[];
  richContent?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface Member {
  id: string;
  user: { id: string; name: string; email: string };
}

interface TaskListProps {
  tasks: TaskItem[];
  members: Member[];
  onTaskClick?: (task: TaskItem) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ tasks, members }) => {
  const memberMap = new Map(members.map((m) => [m.user.id, m.user.name || m.user.email]));

  const handleRowClick = (taskId: string) => {
    window.location.href = `/tasks/${taskId}`;
  };

  if (tasks.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm text-gray-400">
        No se encontraron tareas con los filtros aplicados.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-700">
          <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-bold tracking-wider border-b border-gray-100">
            <tr>
              <th className="py-3.5 px-4">Código</th>
              <th className="py-3.5 px-4">Título</th>
              <th className="py-3.5 px-4">Estado</th>
              <th className="py-3.5 px-4">Prioridad</th>
              <th className="py-3.5 px-4">Creado por</th>
              <th className="py-3.5 px-4">Asignado a</th>
              <th className="py-3.5 px-4">Fechas (Creación / Vencimiento)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => handleRowClick(task.id)}
                className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
              >
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-1 bg-red-100/70 text-[#900] text-xs font-black rounded uppercase">
                    {task.code || 'TAR'}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-bold text-gray-900 group-hover:text-[#D40000] transition-colors">
                  {task.title}
                  {task.description && (
                    <p className="text-xs text-gray-400 font-normal truncate max-w-xs">{task.description}</p>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    task.status === 'DONE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    task.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    task.status === 'REVIEW' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    task.priority === 'URGENT' ? 'bg-red-50 text-[#D40000] border border-red-200' :
                    task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    task.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {task.priority}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-600">
                  {task.reporter?.name || (task.reporterId ? memberMap.get(task.reporterId) : 'Creador')}
                </td>
                <td className="py-3.5 px-4 text-xs font-semibold text-gray-800">
                  {task.assignee?.name || (task.assigneeId ? memberMap.get(task.assigneeId) || 'Miembro' : <span className="text-gray-400 font-normal">Sin asignar</span>)}
                </td>
                <td className="py-3.5 px-4 text-xs text-gray-500">
                  <div>
                    <span className="text-gray-400 text-[11px]">Creada:</span>{' '}
                    {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '-'}
                  </div>
                  {task.dueDate && (
                    <div className="text-[#D40000] font-semibold text-[11px]">
                      Vence: {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
