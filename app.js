const { useState, useEffect } = React;

const ProjectWidget = () => {
  const [view, setView] = useState('kanban');
  const [records, setRecords] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedId, setDraggedId] = useState(null);

  useEffect(() => {
    grist.ready({
      columns: [
        { name: 'TaskName', title: 'Task Name' },
        { name: 'Status', title: 'Status' },
        { name: 'StartDate', title: 'Start Date' },
        { name: 'EndDate', title: 'End Date' },
        { name: 'Assignee', title: 'Assignee', optional: true },
        { name: 'Priority', title: 'Priority', optional: true }
      ],
      requiredAccess: 'full'
    });

    const loadData = async () => {
      try {
        // Load statuses from Status table
        let statusRows = [];
        try {
          const statusResult = await grist.docApi.fetchTable("Status");
          const statusData = columnsToRows(statusResult);
          statusRows = statusData.sort((a, b) => (a.Order || 0) - (b.Order || 0));
        } catch (e) {
          console.warn('Could not load Status table:', e);
          // Fallback with Russian statuses
          statusRows = [
            { id: 1, Status: 'В ожидании', Color: '#9E9E9E', Order: 1 },
            { id: 2, Status: 'К выполнению', Color: '#607D8B', Order: 2 },
            { id: 3, Status: 'В работе', Color: '#2196F3', Order: 3 },
            { id: 4, Status: 'На согласовании', Color: '#FF9800', Order: 4 },
            { id: 5, Status: 'Выполнено', Color: '#4CAF50', Order: 5 },
            { id: 6, Status: 'Отменено', Color: '#F44336', Order: 6 }
          ];
        }

        setStatuses(statusRows);

        // Subscribe to task records
        grist.onRecords((data) => {
          try {
            const mapped = grist.mapColumnNames(data);
            if (!mapped) {
              setError('Please map columns in widget options');
              setLoading(false);
              return;
            }

            const rows = Array.isArray(mapped) ? mapped : [mapped];
            
            const processed = rows.map(r => {
              let statusId = null;
              let statusText = '';
              
              if (r.Status && typeof r.Status === 'object') {
                statusId = r.Status.id || r.Status.Id;
                statusText = r.Status.Status || r.Status.Name || str(r.Status);
              } else if (typeof r.Status === 'number') {
                statusId = r.Status;
                const found = statusRows.find(s => s.id === statusId);
                statusText = found ? found.Status : String(statusId);
              } else {
                statusText = str(r.Status);
                const found = statusRows.find(s => s.Status === statusText);
                statusId = found ? found.id : null;
              }

              return {
                id: r.id,
                TaskName: str(r.TaskName),
                StatusId: statusId,
                StatusText: statusText,
                StartDate: toDate(r.StartDate),
                EndDate: toDate(r.EndDate),
                StartDateStr: str(r.StartDate),
                EndDateStr: str(r.EndDate),
                Assignee: str(r.Assignee),
                Priority: str(r.Priority)
              };
            });

            setRecords(processed);
            setLoading(false);
          } catch (err) {
            setError('Error: ' + err.message);
            setLoading(false);
          }
        }, { format: 'rows' });

      } catch (err) {
        setError('Failed to initialize: ' + err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Update task status
  const handleUpdateStatus = async (taskId, newStatusText) => {
    try {
      const statusId = getStatusId(statuses, newStatusText);
      
      if (!statusId) {
        setError('Status ID not found: ' + newStatusText);
        return;
      }

      await grist.selectedTable.update({
        id: taskId,
        fields: { Status: statusId }
      });
    } catch (e) {
      setError('Update failed: ' + e.message);
    }
  };

  // Wrapper for getStatusColor with current statuses
  const handleGetStatusColor = (statusText) => {
    return getStatusColor(statuses, statusText);
  };

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="widget-container">
      <div className="toolbar">
        <h2><i className="fas fa-project-diagram"></i> Управление проектом</h2>
        <div className="view-toggle">
          <button 
            className={view === 'kanban' ? 'view-btn active' : 'view-btn'} 
            onClick={() => setView('kanban')}
          >
            <i className="fas fa-columns"></i> Канбан
          </button>
          <button 
            className={view === 'gantt' ? 'view-btn active' : 'view-btn'} 
            onClick={() => setView('gantt')}
          >
            <i className="fas fa-stream"></i> Гантт
          </button>
        </div>
      </div>

      <div className="main-content">
        {view === 'kanban' ? (
          <KanbanView 
            records={records}
            statuses={statuses}
            draggedId={draggedId}
            setDraggedId={setDraggedId}
            onUpdateStatus={handleUpdateStatus}
            getStatusColor={handleGetStatusColor}
          />
        ) : (
          <GanttView 
            records={records}
            getStatusColor={handleGetStatusColor}
          />
        )}
      </div>
    </div>
  );
};

// Render
ReactDOM.createRoot(document.getElementById('root')).render(<ProjectWidget />);