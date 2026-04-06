const GanttView = ({ records, getStatusColor }) => {
  
  // Calculate date range
  const ganttRange = () => {
    const dates = records
      .flatMap(r => [r.StartDate, r.EndDate])
      .filter(Boolean);
    
    if (dates.length === 0) {
      return { start: new Date(), end: new Date() };
    }
    
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    min.setMonth(min.getMonth() - 1);
    max.setMonth(max.getMonth() + 1);
    
    return { start: min, end: max };
  };

  // Generate months for header
  const getMonths = () => {
    const { start, end } = ganttRange();
    const months = [];
    const current = new Date(start);
    
    while (current <= end) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    
    return months;
  };

  // Calculate bar position and width
  const barStyle = (task) => {
    const range = ganttRange();
    
    if (!task.StartDate || !task.EndDate) {
      return { display: 'none' };
    }
    
    const totalDays = (range.end - range.start) / (1000 * 60 * 60 * 24);
    const offsetDays = (task.StartDate - range.start) / (1000 * 60 * 60 * 24);
    const durationDays = (task.EndDate - task.StartDate) / (1000 * 60 * 60 * 24) + 1;
    
    return {
      left: `${(offsetDays / totalDays) * 100}%`,
      width: `${Math.max((durationDays / totalDays) * 100, 2)}%`,
      backgroundColor: getStatusColor(task.StatusText)
    };
  };

  const months = getMonths();

  return (
    <div className="gantt-container">
      <div className="gantt-header">
        <div className="task-column">Задача</div>
        <div className="timeline-header">
          {months.map((m, i) => (
            <div key={i} className="month-header">
              {m.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })}
            </div>
          ))}
        </div>
      </div>
      
      <div className="gantt-body">
        {records.map(task => (
          <div key={task.id} className="gantt-row">
            <div className="gantt-task-name">{task.TaskName}</div>
            <div className="gantt-timeline">
              {task.StartDate && (
                <div 
                  className="gantt-bar" 
                  style={barStyle(task)}
                  title={`${task.TaskName}: ${task.StartDateStr} — ${task.EndDateStr}`}
                >
                  {task.TaskName}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};