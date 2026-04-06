const KanbanView = ({ 
  records, 
  statuses, 
  draggedId, 
  setDraggedId, 
  onUpdateStatus, 
  getStatusColor 
}) => {
  
  // Group by status
  const byStatus = () => {
    const grouped = {};
    
    // Initialize all status columns
    statuses.forEach(status => {
      if (status.IsActive !== false) {
        grouped[status.Status] = [];
      }
    });
    
    // Distribute records
    records.forEach(r => {
      const s = r.StatusText || 'Uncategorized';
      if (!grouped[s]) grouped[s] = [];
      grouped[s].push(r);
    });
    
    return grouped;
  };

  const grouped = byStatus();

  return (
    <div className="kanban-board">
      {Object.entries(grouped).map(([statusText, tasks]) => (
        <div 
          key={statusText} 
          className="kanban-column"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedId) onUpdateStatus(draggedId, statusText);
          }}
        >
          <div 
            className="column-header" 
            style={{borderBottomColor: getStatusColor(statusText)}}
          >
            <span>
              <span 
                className="status-badge" 
                style={{backgroundColor: getStatusColor(statusText)}}
              ></span>
              {statusText}
            </span>
            <span className="column-count">{tasks.length}</span>
          </div>
          
          <div className="kanban-tasks">
            {tasks.length === 0 ? (
              <div className="empty-state">Перетащите задачи сюда</div>
            ) : (
              tasks.map(task => (
                <div 
                  key={task.id} 
                  className="kanban-card"
                  draggable
                  style={{borderLeftColor: getStatusColor(task.StatusText)}}
                  onDragStart={() => setDraggedId(task.id)}
                  onDragEnd={() => setDraggedId(null)}
                >
                  <div className="card-title">{task.TaskName}</div>
                  <div className="card-meta">
                    <span>{task.Assignee || 'Не назначен'}</span>
                    {task.Priority && (
                      <span className={PRIORITY_CLASSES[task.Priority] || ''}>
                        {task.Priority}
                      </span>
                    )}
                  </div>
                  {task.StartDate && (
                    <div className="card-dates">
                      {task.StartDateStr} — {task.EndDateStr}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
};