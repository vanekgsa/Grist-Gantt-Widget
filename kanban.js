const KanbanView = ({ records, statuses, projects, users, draggedId, setDraggedId, onUpdateStatus, onAddTask, onEditTask }) => {
  const [editingTask, setEditingTask] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [initialStatusForModal, setInitialStatusForModal] = React.useState(null);
  const [initialProjectForModal, setInitialProjectForModal] = React.useState(null);
  const [collapsedProjects, setCollapsedProjects] = React.useState({});

  const getColor = (statusText) => {
    const s = statuses.find(x => x.Status === statusText);
    return s?.Color || '#757575';
  };

  // Группировка: сначала по проектам, потом по статусам
  const groupByProjectAndStatus = () => {
    const allProjects = [...projects, { id: null, Name: 'Без проекта' }];
    const result = {};
    allProjects.forEach(proj => {
      result[proj.Name] = {};
      statuses.forEach(s => {
        result[proj.Name][s.Status] = [];
      });
    });
    records.forEach(r => {
      const projName = r.ProjectName || 'Без проекта';
      const status = r.StatusText || 'Без статуса';
      if (result[projName] && result[projName][status]) {
        result[projName][status].push(r);
      } else {
        if (!result[projName]) result[projName] = {};
        if (!result[projName][status]) result[projName][status] = [];
        result[projName][status].push(r);
      }
    });
    return result;
  };

  const grouped = groupByProjectAndStatus();
  const projectNames = Object.keys(grouped);

  const toggleProject = (projectName) => {
    setCollapsedProjects(prev => ({ ...prev, [projectName]: !prev[projectName] }));
  };

  const handleAddClick = (statusName, projectName) => {
    const statusObj = statuses.find(s => s.Status === statusName);
    const projectObj = projects.find(p => p.Name === projectName) || null;
    setInitialStatusForModal(statusObj);
    setInitialProjectForModal(projectObj);
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingTask(null);
    setInitialStatusForModal(null);
    setInitialProjectForModal(null);
  };

  const handleSave = async (formData) => {
    if (editingTask) {
      await onEditTask(editingTask.id, formData);
    } else {
      await onAddTask(formData);
    }
    handleCloseModal();
  };

  return React.createElement(React.Fragment, null, [
    React.createElement('div', { key: 'kanban', className: 'kanban-board' },
      // Заголовок колонок (статусы)
      React.createElement('div', { key: 'headers', className: 'kanban-headers', style: { display: 'flex', marginLeft: '200px', borderBottom: '1px solid #e0e0e0' } },
        statuses.map(status => 
          React.createElement('div', { key: status.Status, className: 'kanban-header-cell', style: { flex: 1, minWidth: '250px', padding: '12px', fontWeight: 'bold', textAlign: 'center', borderBottom: `3px solid ${status.Color}` } }, status.Status)
        )
      ),
      // Строки проектов
      projectNames.map(projectName => 
        !collapsedProjects[projectName] && React.createElement('div', { key: projectName, className: 'kanban-swimlane-row', style: { display: 'flex' } }, [
          React.createElement('div', { key: 'label', className: 'swimlane-label', style: { width: '200px', flexShrink: 0, background: '#fafafa', borderBottom: '1px solid #e0e0e0', padding: '12px', fontWeight: 'bold', position: 'sticky', left: 0, cursor: 'pointer' }, onClick: () => toggleProject(projectName) }, [
            React.createElement('span', null, collapsedProjects[projectName] ? '▶ ' : '▼ '),
            projectName,
            React.createElement('span', { style: { marginLeft: '8px', fontSize: '12px', color: '#666' } }, `(${Object.values(grouped[projectName]).reduce((sum, arr) => sum + arr.length, 0)})`)
          ]),
          React.createElement('div', { key: 'cells', className: 'swimlane-cells', style: { display: 'flex', flex: 1 } },
            statuses.map(status => {
              const tasks = grouped[projectName][status.Status] || [];
              return React.createElement('div', { key: status.Status, className: 'kanban-cell', style: { flex: 1, minWidth: '250px', background: '#fefefe', borderLeft: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', padding: '8px' } }, [
                React.createElement('div', { key: 'add', style: { textAlign: 'right', marginBottom: '8px' } },
                  React.createElement('button', { onClick: () => handleAddClick(status.Status, projectName), style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: '#666' } }, '+')
                ),
                React.createElement('div', { key: 'tasks', className: 'kanban-tasks', style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
                  tasks.map(task =>
                    React.createElement('div', {
                      key: task.id,
                      className: 'kanban-card',
                      draggable: true,
                      style: { background: 'white', padding: '10px', borderRadius: '6px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', cursor: 'grab', borderLeft: `4px solid ${getColor(task.StatusText)}` },
                      onDragStart: () => setDraggedId(task.id),
                      onDragEnd: () => setDraggedId(null),
                      onClick: () => handleEditClick(task)
                    }, [
                      React.createElement('div', { key: 'title', style: { fontWeight: '500', marginBottom: '6px' } }, task.TaskName),
                      React.createElement('div', { key: 'meta', style: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' } }, [
                        React.createElement('span', null, task.AssigneeName || '—'),
                        task.Priority && React.createElement('span', { className: `priority-${task.Priority.toLowerCase()}` }, task.Priority === 'High' ? '!' : (task.Priority === 'Medium' ? '‼' : '↓'))
                      ])
                    ])
                  )
                )
              ]);
            })
          )
        ])
      )
    ),
    React.createElement(TaskModal, {
      key: 'modal',
      isOpen: modalOpen,
      task: editingTask,
      onSave: handleSave,
      onClose: handleCloseModal,
      statuses: statuses,
      projects: projects,
      users: users,
      initialStatus: initialStatusForModal,
      initialProject: initialProjectForModal
    })
  ]);
};