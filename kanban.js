const KanbanView = ({ records, statuses, projects, onUpdateStatus, onAddTask, onEditTask }) => {
  const [editingTask, setEditingTask] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [defaultStatus, setDefaultStatus] = React.useState(null);

  const getColor = (name) => {
    const s = statuses.find(x => x.Status === name);
    return s?.Color || '#757575';
  };
  
  // Группировка сначала по проектам, затем по статусам
  const groupByProjectAndStatus = () => {
    const projectsSet = new Set(records.map(r => r.Project || 'Без проекта'));
    const result = {};
    projectsSet.forEach(proj => {
      result[proj] = {};
      statuses.forEach(s => {
        result[proj][s.Status] = [];
      });
    });
    records.forEach(r => {
      const proj = r.Project || 'Без проекта';
      const status = r.StatusText || 'Без статуса';
      if (result[proj] && result[proj][status]) {
        result[proj][status].push(r);
      } else {
        if (!result[proj]) result[proj] = {};
        if (!result[proj][status]) result[proj][status] = [];
        result[proj][status].push(r);
      }
    });
    return result;
  };

  const grouped = groupByProjectAndStatus();

  const handleAddClick = (statusName) => {
    setDefaultStatus(statusName);
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleEditClick = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    if (editingTask) {
      // Редактирование существующей задачи
      await onEditTask(editingTask.id, formData);
    } else {
      // Создание новой задачи
      const newTask = {
        TaskName: formData.TaskName,
        Status: formData.StatusId,  // Grist ожидает ID статуса
        StartDate: formData.StartDate || null,
        EndDate: formData.EndDate || null,
        Assignee: formData.Assignee || null,
        Priority: formData.Priority || null,
        Project: formData.Project || null
      };
      await onAddTask(newTask);
    }
    setModalOpen(false);
    setEditingTask(null);
    setDefaultStatus(null);
  };

  return React.createElement(React.Fragment, null, [
    React.createElement('div', { key: 'kanban', className: 'kanban-board' },
      Object.entries(grouped).map(([project, statusGroups]) =>
        React.createElement('div', { key: project, className: 'kanban-swimlane' }, [
          React.createElement('div', { key: 'header', className: 'swimlane-header' }, project),
          React.createElement('div', { key: 'columns', className: 'swimlane-columns', style: { display: 'flex', gap: '20px' } },
            Object.entries(statusGroups).map(([status, tasks]) =>
              React.createElement('div', {
                key: status,
                className: 'kanban-column',
                style: { minHeight: '200px' },
                onDragOver: (e) => e.preventDefault(),
                onDrop: (e) => {
                  e.preventDefault();
                  if (draggedId) onUpdateStatus(draggedId, status);
                }
              }, [
                React.createElement('div', {
                  key: 'header',
                  className: 'column-header',
                  style: { borderBottomColor: getColor(status) }
                }, [
                  React.createElement('span', { key: 'title' }, [
                    React.createElement('span', {
                      key: 'dot',
                      className: 'status-badge',
                      style: { backgroundColor: getColor(status) }
                    }),
                    status
                  ]),
                  React.createElement('div', { key: 'actions', style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
                    React.createElement('span', { key: 'count', className: 'column-count' }, tasks.length),
                    React.createElement('button', {
                      key: 'add',
                      onClick: () => handleAddClick(status),
                      style: {
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#666',
                        padding: '0 4px'
                      },
                      title: 'Добавить задачу'
                    }, '+')
                  ])
                ]),
                React.createElement('div', { key: 'tasks', className: 'kanban-tasks' },
                  tasks.length === 0 
                    ? React.createElement('div', { className: 'empty-state' }, 'Перетащите задачи сюда')
                    : tasks.map(task => 
                        React.createElement('div', {
                          key: task.id,
                          className: 'kanban-card',
                          draggable: true,
                          style: { borderLeftColor: getColor(task.StatusText) },
                          onDragStart: () => setDraggedId(task.id),
                          onDragEnd: () => setDraggedId(null),
                          onClick: (e) => {
                            e.stopPropagation();
                            handleEditClick(task);
                          }
                        }, [
                          React.createElement('div', { key: 'title', className: 'card-title' }, task.TaskName),
                          React.createElement('div', { key: 'meta', className: 'card-meta' }, [
                            React.createElement('span', { key: 'assignee' }, task.Assignee || 'Не назначен'),
                            task.Priority && React.createElement('span', {
                              key: 'priority',
                              className: PRIORITY_CLASSES[task.Priority]
                            }, task.Priority)
                          ]),
                          task.StartDate && React.createElement('div', {
                            key: 'dates',
                            className: 'card-dates'
                          }, `${task.StartDateStr} — ${task.EndDateStr}`)
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
      projects: projects
    })
  ]);
};