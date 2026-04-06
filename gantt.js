const GanttView = ({ records, getStatusColor }) => {
  const range = () => {
    const dates = records.flatMap(r => [r.StartDate, r.EndDate]).filter(Boolean);
    if (dates.length === 0) return { start: new Date(), end: new Date() };
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    min.setMonth(min.getMonth() - 1);
    max.setMonth(max.getMonth() + 1);
    return { start: min, end: max };
  };

  const months = () => {
    const { start, end } = range();
    const m = [];
    const cur = new Date(start);
    while (cur <= end) {
      m.push(new Date(cur));
      cur.setMonth(cur.getMonth() + 1);
    }
    return m;
  };

  const barStyle = (task) => {
    const r = range();
    if (!task.StartDate || !task.EndDate) return { display: 'none' };
    const total = (r.end - r.start) / (1000 * 60 * 60 * 24);
    const offset = (task.StartDate - r.start) / (1000 * 60 * 60 * 24);
    const duration = (task.EndDate - task.StartDate) / (1000 * 60 * 60 * 24) + 1;
    return {
      left: (offset / total * 100) + '%',
      width: Math.max(duration / total * 100, 2) + '%',
      backgroundColor: getStatusColor(task.StatusText)
    };
  };

  const m = months();
  const r = range();

  return React.createElement('div', { className: 'gantt-container' }, [
    React.createElement('div', { key: 'header', className: 'gantt-header' }, [
      React.createElement('div', { key: 'tasks', className: 'task-column' }, 'Задача'),
      React.createElement('div', { key: 'timeline', className: 'timeline-header' },
        m.map((mo, i) => 
          React.createElement('div', {
            key: i,
            className: 'month-header'
          }, mo.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }))
        )
      )
    ]),
    React.createElement('div', { key: 'body', className: 'gantt-body' },
      records.map(task => 
        React.createElement('div', { key: task.id, className: 'gantt-row' }, [
          React.createElement('div', { key: 'name', className: 'gantt-task-name' }, task.TaskName),
          React.createElement('div', { key: 'timeline', className: 'gantt-timeline' },
            task.StartDate && React.createElement('div', {
              className: 'gantt-bar',
              style: barStyle(task),
              title: `${task.TaskName}: ${task.StartDateStr} — ${task.EndDateStr}`
            }, task.TaskName)
          )
        ])
      )
    )
  ]);
};