const KanbanView = ({ records, statuses, draggedId, setDraggedId, onUpdateStatus }) => {
  const getColor = (name) => {
    const s = statuses.find(x => x.Status === name);
    return s?.Color || '#757575';
  };
  
  const byStatus = () => {
    const grouped = {};
    statuses.forEach(s => {
      if (s.IsActive !== false) grouped[s.Status] = [];
    });
    records.forEach(r => {
      const s = r.StatusText || 'Без статуса';
      if (!grouped[s]) grouped[s] = [];
      grouped[s].push(r);
    });
    return grouped;
  };

  return React.createElement('div', { className: 'kanban-board' },
    Object.entries(byStatus()).map(([status, tasks]) => 
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
          React.createElement('span', { key: 'count', className: 'column-count' }, tasks.length)
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
                  onDragEnd: () => setDraggedId(null)
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
  );
};