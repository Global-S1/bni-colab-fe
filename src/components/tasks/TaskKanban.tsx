import React, { useState } from 'react';
import { TaskItem } from './TaskList';

interface TaskKanbanProps {
  tasks: TaskItem[];
  onTaskClick?: (task: TaskItem) => void;
  onStatusChange: (taskId: string, newStatus: TaskItem['status']) => void;
}

const COLUMNS: { id: TaskItem['status']; title: string; badge: string }[] = [
  { id: 'TODO', title: 'Por Hacer', badge: 'bg-gray-100 text-gray-700' },
  { id: 'IN_PROGRESS', title: 'En Progreso', badge: 'bg-blue-50 text-blue-700' },
  { id: 'REVIEW', title: 'En Revisión', badge: 'bg-purple-50 text-purple-700' },
  { id: 'DONE', title: 'Completadas', badge: 'bg-emerald-50 text-emerald-700' },
];

export const TaskKanban: React.FC<TaskKanbanProps> = ({ tasks, onStatusChange }) => {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskItem['status']) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      onStatusChange(taskId, targetStatus);
    }
    setDraggedTaskId(null);
  };

  const handleCardClick = (taskId: string) => {
    window.location.href = `/tasks/${taskId}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((t) => t.status === col.id);
        const isTarget = dragOverColumn === col.id;

        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`bg-white p-4 rounded-2xl border transition-all flex flex-col h-full min-h-[520px] ${
              isTarget ? 'border-[#D40000] ring-2 ring-[#D40000]/20 bg-red-50/10' : 'border-gray-200 shadow-sm'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span>{col.title}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${col.badge}`}>
                  {columnTasks.length}
                </span>
              </h3>
            </div>

            {/* Draggable Task Cards */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 no-scrollbar">
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => handleCardClick(task.id)}
                  className={`bg-white p-4 rounded-xl border border-gray-200 hover:border-[#D40000]/60 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing space-y-3 group transition-all select-none ${
                    draggedTaskId === task.id ? 'opacity-40 border-dashed border-[#D40000]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 bg-red-100/70 text-[#900] text-[10px] font-black rounded uppercase">
                      {task.code || 'TAR'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      task.priority === 'URGENT' ? 'bg-red-50 text-[#D40000] border border-red-200' :
                      task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#D40000] transition-colors line-clamp-2">
                    {task.title}
                  </h4>

                  {task.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}

                  {/* Member & Due Date snippet */}
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                      <div className="w-5 h-5 rounded-full bg-red-50 text-[#D40000] font-bold flex items-center justify-center text-[9px] uppercase border border-red-100 shrink-0">
                        {(task.assignee?.name || task.reporter?.name || 'U').substring(0, 1)}
                      </div>
                      <span className="truncate font-medium">{task.assignee?.name || 'Sin asignar'}</span>
                    </div>

                    {task.dueDate ? (
                      <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}

              {columnTasks.length === 0 && (
                <div className="h-28 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 font-medium">
                  Arrastra tarjetas aquí
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
