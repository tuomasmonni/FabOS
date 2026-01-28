import React, { useState } from 'react';
import { useTheme, THEMES } from './contexts/ThemeContext';
import ModuleShell from './components/ModuleShell';

// Mock data for the project management prototype
const MOCK_PROJECTS = [
  {
    id: 1,
    name: 'Teräsrakenteet Oy - Laserleikkeet',
    tasks: [
      { id: 1, name: 'DXF-tiedostojen tarkistus', status: 'done', assignee: 'Matti V.', deadline: '2025-01-25', priority: 'high' },
      { id: 2, name: 'Materiaalivaraus', status: 'in_progress', assignee: 'Liisa K.', deadline: '2025-01-28', priority: 'medium' },
      { id: 3, name: 'Leikkausohjelmointi', status: 'in_progress', assignee: 'Pekka S.', deadline: '2025-01-29', priority: 'high' },
      { id: 4, name: 'Laaduntarkastus', status: 'todo', assignee: 'Anna M.', deadline: '2025-01-31', priority: 'medium' },
      { id: 5, name: 'Pakkaus ja lähetys', status: 'todo', assignee: null, deadline: '2025-02-01', priority: 'low' },
    ]
  },
  {
    id: 2,
    name: 'Rakennusliike ABC - Portaat',
    tasks: [
      { id: 6, name: 'Mittapiirustusten tarkistus', status: 'done', assignee: 'Matti V.', deadline: '2025-01-20', priority: 'high' },
      { id: 7, name: 'IFC-mallin generointi', status: 'done', assignee: 'Pekka S.', deadline: '2025-01-22', priority: 'high' },
      { id: 8, name: 'Asiakkaan hyväksyntä', status: 'in_progress', assignee: 'Liisa K.', deadline: '2025-01-26', priority: 'high' },
      { id: 9, name: 'Tuotannon aikataulutus', status: 'todo', assignee: null, deadline: '2025-01-30', priority: 'medium' },
    ]
  },
  {
    id: 3,
    name: 'Sisäinen kehitys - FabOS V2',
    tasks: [
      { id: 10, name: 'Käyttöliittymäsuunnittelu', status: 'in_progress', assignee: 'Anna M.', deadline: '2025-02-15', priority: 'high' },
      { id: 11, name: 'API-integraatiot', status: 'todo', assignee: 'Pekka S.', deadline: '2025-02-28', priority: 'medium' },
      { id: 12, name: 'Testaus', status: 'todo', assignee: null, deadline: '2025-03-10', priority: 'medium' },
    ]
  }
];

const STATUS_CONFIG = {
  todo: { label: 'Odottaa', color: '#6B7280', bgColor: '#6B728020' },
  in_progress: { label: 'Käynnissä', color: '#F59E0B', bgColor: '#F59E0B20' },
  done: { label: 'Valmis', color: '#10B981', bgColor: '#10B98120' },
};

const PRIORITY_CONFIG = {
  low: { label: 'Matala', color: '#6B7280' },
  medium: { label: 'Normaali', color: '#3B82F6' },
  high: { label: 'Korkea', color: '#EF4444' },
};

export default function ProjectManagement({ onBack }) {
  const { theme } = useTheme();
  const isFabOS = theme === THEMES.FABOS;

  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [selectedProject, setSelectedProject] = useState(MOCK_PROJECTS[0]);
  const [editingCell, setEditingCell] = useState(null);

  const updateTaskStatus = (taskId, newStatus) => {
    setProjects(prev => prev.map(project => ({
      ...project,
      tasks: project.tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    })));
    setSelectedProject(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    }));
  };

  const updateTaskField = (taskId, field, value) => {
    setProjects(prev => prev.map(project => ({
      ...project,
      tasks: project.tasks.map(task =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    })));
    setSelectedProject(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    }));
    setEditingCell(null);
  };

  const addNewTask = () => {
    const newTask = {
      id: Date.now(),
      name: 'Uusi tehtävä',
      status: 'todo',
      assignee: null,
      deadline: null,
      priority: 'medium'
    };
    setProjects(prev => prev.map(project =>
      project.id === selectedProject.id
        ? { ...project, tasks: [...project.tasks, newTask] }
        : project
    ));
    setSelectedProject(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const projectStats = {
    total: selectedProject.tasks.length,
    done: selectedProject.tasks.filter(t => t.status === 'done').length,
    inProgress: selectedProject.tasks.filter(t => t.status === 'in_progress').length,
    todo: selectedProject.tasks.filter(t => t.status === 'todo').length,
  };

  return (
    <ModuleShell
      onBack={onBack}
      moduleName="Projektinhallinta"
      badgeVersion="V0.8"
      badgeColor="#8B5CF6"
      sticky={true}
    >
      <div className={`flex h-[calc(100vh-60px)] ${isFabOS ? '' : ''}`}>
        {/* Sidebar - Project List */}
        <aside className={`w-72 border-r flex flex-col ${
          isFabOS ? 'bg-white border-gray-200' : 'bg-slate-800 border-slate-700'
        }`}>
          <div className={`p-4 border-b ${isFabOS ? 'border-gray-200' : 'border-slate-700'}`}>
            <h2 className={`font-semibold ${isFabOS ? 'text-gray-800' : 'text-white'}`}>
              Projektit
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {projects.map(project => {
              const done = project.tasks.filter(t => t.status === 'done').length;
              const total = project.tasks.length;
              const progress = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`w-full text-left p-4 border-b transition-colors ${
                    selectedProject.id === project.id
                      ? isFabOS
                        ? 'bg-[#FF6B35]/10 border-[#FF6B35]/20'
                        : 'bg-purple-500/20 border-purple-500/30'
                      : isFabOS
                        ? 'hover:bg-gray-50 border-gray-100'
                        : 'hover:bg-slate-700/50 border-slate-700/50'
                  }`}
                >
                  <div className={`font-medium text-sm ${isFabOS ? 'text-gray-800' : 'text-white'}`}>
                    {project.name}
                  </div>
                  <div className={`text-xs mt-1 ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                    {done}/{total} tehtävää valmis
                  </div>
                  <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${
                    isFabOS ? 'bg-gray-200' : 'bg-slate-700'
                  }`}>
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFabOS ? 'bg-[#FF6B35]' : 'bg-purple-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          <div className={`p-4 border-t ${isFabOS ? 'border-gray-200' : 'border-slate-700'}`}>
            <button className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
              isFabOS
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}>
              + Uusi projekti
            </button>
          </div>
        </aside>

        {/* Main Content - Task Table */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Project Header */}
          <div className={`px-6 py-4 border-b ${isFabOS ? 'bg-white border-gray-200' : 'bg-slate-800/50 border-slate-700'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h1 className={`text-xl font-bold ${isFabOS ? 'text-gray-900' : 'text-white'}`}>
                  {selectedProject.name}
                </h1>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`text-sm ${isFabOS ? 'text-gray-500' : 'text-slate-400'}`}>
                    {projectStats.total} tehtävää
                  </span>
                  <span className="text-sm text-green-500">{projectStats.done} valmis</span>
                  <span className="text-sm text-amber-500">{projectStats.inProgress} käynnissä</span>
                  <span className={`text-sm ${isFabOS ? 'text-gray-400' : 'text-slate-500'}`}>
                    {projectStats.todo} odottaa
                  </span>
                </div>
              </div>
              <button
                onClick={addNewTask}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isFabOS
                    ? 'bg-[#FF6B35] text-white hover:bg-[#e5612f]'
                    : 'bg-purple-500 text-white hover:bg-purple-400'
                }`}
              >
                + Lisää tehtävä
              </button>
            </div>
          </div>

          {/* Task Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full">
              <thead className={`sticky top-0 ${isFabOS ? 'bg-gray-50' : 'bg-slate-800'}`}>
                <tr className={`text-left text-xs font-semibold uppercase tracking-wider ${
                  isFabOS ? 'text-gray-500' : 'text-slate-400'
                }`}>
                  <th className="px-6 py-3 w-[40%]">Tehtävä</th>
                  <th className="px-4 py-3 w-[15%]">Status</th>
                  <th className="px-4 py-3 w-[15%]">Vastuuhenkilö</th>
                  <th className="px-4 py-3 w-[15%]">Deadline</th>
                  <th className="px-4 py-3 w-[15%]">Prioriteetti</th>
                </tr>
              </thead>
              <tbody className={isFabOS ? 'bg-white' : 'bg-slate-900/50'}>
                {selectedProject.tasks.map((task, index) => (
                  <tr
                    key={task.id}
                    className={`border-b transition-colors ${
                      isFabOS
                        ? 'border-gray-100 hover:bg-gray-50'
                        : 'border-slate-800 hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Task Name */}
                    <td className="px-6 py-3">
                      {editingCell === `${task.id}-name` ? (
                        <input
                          type="text"
                          defaultValue={task.name}
                          autoFocus
                          className={`w-full px-2 py-1 rounded border ${
                            isFabOS
                              ? 'border-gray-300 bg-white text-gray-900'
                              : 'border-slate-600 bg-slate-800 text-white'
                          }`}
                          onBlur={(e) => updateTaskField(task.id, 'name', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateTaskField(task.id, 'name', e.target.value);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                        />
                      ) : (
                        <span
                          onClick={() => setEditingCell(`${task.id}-name`)}
                          className={`cursor-pointer ${
                            task.status === 'done'
                              ? isFabOS ? 'text-gray-400 line-through' : 'text-slate-500 line-through'
                              : isFabOS ? 'text-gray-900' : 'text-white'
                          }`}
                        >
                          {task.name}
                        </span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer border-0"
                        style={{
                          backgroundColor: STATUS_CONFIG[task.status].bgColor,
                          color: STATUS_CONFIG[task.status].color
                        }}
                      >
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Assignee */}
                    <td className="px-4 py-3">
                      {editingCell === `${task.id}-assignee` ? (
                        <input
                          type="text"
                          defaultValue={task.assignee || ''}
                          autoFocus
                          placeholder="Lisää henkilö..."
                          className={`w-full px-2 py-1 rounded border text-sm ${
                            isFabOS
                              ? 'border-gray-300 bg-white text-gray-900'
                              : 'border-slate-600 bg-slate-800 text-white'
                          }`}
                          onBlur={(e) => updateTaskField(task.id, 'assignee', e.target.value || null)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateTaskField(task.id, 'assignee', e.target.value || null);
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                        />
                      ) : (
                        <span
                          onClick={() => setEditingCell(`${task.id}-assignee`)}
                          className={`cursor-pointer text-sm ${
                            task.assignee
                              ? isFabOS ? 'text-gray-700' : 'text-slate-300'
                              : isFabOS ? 'text-gray-400 italic' : 'text-slate-500 italic'
                          }`}
                        >
                          {task.assignee || 'Ei määritetty'}
                        </span>
                      )}
                    </td>

                    {/* Deadline */}
                    <td className="px-4 py-3">
                      <input
                        type="date"
                        value={task.deadline || ''}
                        onChange={(e) => updateTaskField(task.id, 'deadline', e.target.value || null)}
                        className={`px-2 py-1 rounded border text-sm ${
                          isFabOS
                            ? 'border-gray-200 bg-transparent text-gray-700 hover:border-gray-300'
                            : 'border-slate-700 bg-transparent text-slate-300 hover:border-slate-600'
                        }`}
                      />
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3">
                      <select
                        value={task.priority}
                        onChange={(e) => updateTaskField(task.id, 'priority', e.target.value)}
                        className={`px-2 py-1 rounded text-sm cursor-pointer ${
                          isFabOS
                            ? 'bg-transparent border border-gray-200 text-gray-700'
                            : 'bg-transparent border border-slate-700 text-slate-300'
                        }`}
                        style={{ color: PRIORITY_CONFIG[task.priority].color }}
                      >
                        {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                          <option key={key} value={key} style={{ color: config.color }}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </ModuleShell>
  );
}
