const KanbanView = ({ records, statuses, projects, users, draggedId, setDraggedId, onUpdateStatus, onAddTask, onEditTask }) => {
  const [editingTask, setEditingTask] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [defaultStatus, setDefaultStatus] = React.useState(null);

  const getColor = (statusText) => {
    const s = statuses.find(x => x.Status === statusText);
    return s?.Color || '#757575';
  };

  // Группировка по проектам (свимлейны), внутри по статусам
  const groupByProjectAndStatus = () => {
    const allProjects = [{ id: null, Name: 'Без проекта' }, ...projects];
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

  const handleAddClick = (statusName) => {
    const statusObj = statuses.find(s => s.Status === statusName);
    setDefaultStatus(statusObj);
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    if (editingTask) {
      await onEditTask(editingTask.id, formData);
    } else {
      // Если создаётся новая задача и не выбран статус, используем defaultStatus
      if (!formData.StatusId && defaultStatus) {
        formData.StatusId = defaultStatus.id;
      }
      await onAddTask(formData);
    }
    setModalOpen(false);
    setEditingTask(null);
    setDefaultStatus(null);
  };

  return React.createElement(React.Fragment, null, [
    React.createElement('div', { key: 'kanban', className: 'kanban-board' },
      Object.entries(grouped).map(([projectName, statusGroups]) =>
        React.createElement('div', { key: projectName, className: 'kanban-swimlane' }, [
          React.createElement('div', { key: 'header', className: 'swimlane-header' }, projectName),
          React.createElement('div', { key: 'columns', className: 'swimlane-columns', style: { display: 'flex', gap: '20px', overflowX: 'auto', padding: '16px' } },
            Object.entries(statusGroups).map(([status, tasks]) =>
              React.createElement('div', {
                key: status,
                className: 'kanban-column',
                style: { minWidth: '280px', background: '#f8f9fa', borderRadius: '12px', display: 'flex', flexDirection: 'column', maxHeight: '100%' },
                onDragOver: (e) => e.preventDefault(),
                onDrop: (e) => {
                  e.preventDefault();
                  if (draggedId) onUpdateStatus(draggedId, status);
                }
              }, [
                React.createElement('div', {
                  key: 'header',
                  className: 'column-header',
                  style: { padding: '16px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `2px solid ${getColor(status)}` }
                }, [
                  React.createElement('span', { key: 'title' }, [
                    React.createElement('span', { key: 'dot', className: 'status-badge', style: { backgroundColor: getColor(status), display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', marginRight: '6px' } }),
                    status
                  ]),
                  React.createElement('div', { key: 'actions', style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
                    React.createElement('span', { key: 'count', className: 'column-count', style: { background: 'rgba(0,0,0,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' } }, tasks.length),
                    React.createElement('button', {
                      key: 'add',
                      onClick: () => handleAddClick(status),
                      style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#666', padding: '0 4px' },
                      title: 'Добавить задачу'
                    }, '+')
                  ])
                ]),
                React.createElement('div', { key: 'tasks', className: 'kanban-tasks', style: { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' } },
                  tasks.length === 0
                    ? React.createElement('div', { className: 'empty-state', style: { textAlign: 'center', padding: '40px 20px', color: '#999', fontStyle: 'italic' } }, 'Перетащите задачи сюда')
                    : tasks.map(task =>
                        React.createElement('div', {
                          key: task.id,
                          className: 'kanban-card',
                          draggable: true,
                          style: { background: 'white', padding: '14px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'grab', borderLeft: `4px solid ${getColor(task.StatusText)}` },
                          onDragStart: () => setDraggedId(task.id),
                          onDragEnd: () => setDraggedId(null),
                          onClick: (e) => {
                            e.stopPropagation();
                            handleEditClick(task);
                          }
                        }, [
                          React.createElement('div', { key: 'title', className: 'card-title', style: { fontWeight: '600', marginBottom: '8px', color: '#333' } }, task.TaskName),
                          React.createElement('div', { key: 'meta', className: 'card-meta', style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#666' } }, [
                            React.createElement('span', { key: 'assignee' }, task.AssigneeName || 'Не назначен'),
                            task.Priority && React.createElement('span', {
                              key: 'priority',
                              className: `priority-${task.Priority.toLowerCase()}`,
                              style: { padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }
                            }, task.Priority === 'High' ? 'Высокий' : (task.Priority === 'Medium' ? 'Средний' : 'Низкий'))
                          ]),
                          task.StartDate && React.createElement('div', { key: 'dates', className: 'card-dates', style: { marginTop: '8px', fontSize: '11px', color: '#888' } }, `${task.StartDateStr} — ${task.EndDateStr}`)
                        ])
                      )
                )
              ])
            )
          )
        ])
      )
    ),
    React.createElement(TaskModal, {
      key: 'modal',
      isOpen: modalOpen,
      task: editingTask,
      onSave: handleSave,
      onClose: () => setModalOpen(false),
      statuses: statuses,
      projects: projects,
      users: users
    })
  ]);
};