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

    const load = async () => {
      try {
        let s = [];
        try {
          const r = await grist.docApi.fetchTable("Status");
          s = columnsToRows(r).sort((a, b) => (a.Order || 0) - (b.Order || 0));
        } catch (e) {
          s = [
            { id: 1, Status: 'В ожидании', Color: '#9E9E9E', Order: 1 },
            { id: 2, Status: 'К выполнению', Color: '#607D8B', Order: 2 },
            { id: 3, Status: 'В работе', Color: '#2196F3', Order: 3 },
            { id: 4, Status: 'На согласовании', Color: '#FF9800', Order: 4 },
            { id: 5, Status: 'Выполнено', Color: '#4CAF50', Order: 5 },
            { id: 6, Status: 'Отменено', Color: '#F44336', Order: 6 }
          ];
        }
        setStatuses(s);

        grist.onRecords((data) => {
          const mapped = grist.mapColumnNames(data);
          if (!mapped) {
            setError('Настройте колонки в опциях виджета');
            setLoading(false);
            return;
          }
          
          const rows = Array.isArray(mapped) ? mapped : [mapped];
          setRecords(rows.map(r => {
            let sid = null, st = '';
            if (r.Status && typeof r.Status === 'object') {
              sid = r.Status.id || r.Status.Id;
              st = r.Status.Status || r.Status.Name || str(r.Status);
            } else if (typeof r.Status === 'number') {
              sid = r.Status;
              st = s.find(x => x.id === sid)?.Status || String(sid);
            } else {
              st = str(r.Status);
              sid = s.find(x => x.Status === st)?.id || null;
            }
            return {
              id: r.id,
              TaskName: str(r.TaskName),
              StatusId: sid,
              StatusText: st,
              StartDate: toDate(r.StartDate),
              EndDate: toDate(r.EndDate),
              StartDateStr: str(r.StartDate),
              EndDateStr: str(r.EndDate),
              Assignee: str(r.Assignee),
              Priority: str(r.Priority)
            };
          }));
          setLoading(false);
        }, { format: 'rows' });
      } catch (e) {
        setError('Ошибка: ' + e.message);
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateStatus = async (taskId, newStatusText) => {
    const status = statuses.find(s => s.Status === newStatusText);
    if (!status) {
      setError('Статус не найден: ' + newStatusText);
      return;
    }
    try {
      await grist.selectedTable.update({
        id: taskId,
        fields: { Status: status.id }
      });
    } catch (e) {
      setError('Ошибка обновления: ' + e.message);
    }
  };

  const getColor = (name) => statuses.find(s => s.Status === name)?.Color || '#757575';

  if (loading) return React.createElement('div', { className: 'loading' }, 'Загрузка...');
  if (error) return React.createElement('div', { className: 'error' }, error);

  return React.createElement('div', { className: 'widget-container' }, [
    React.createElement('div', { key: 'toolbar', className: 'toolbar' }, [
      React.createElement('h2', { key: 'title' }, 'Управление проектом'),
      React.createElement('div', { key: 'toggle', className: 'view-toggle' }, [
        React.createElement('button', {
          key: 'kanban',
          className: view === 'kanban' ? 'view-btn active' : 'view-btn',
          onClick: () => setView('kanban')
        }, 'Канбан'),
        React.createElement('button', {
          key: 'gantt',
          className: view === 'gantt' ? 'view-btn active' : 'view-btn',
          onClick: () => setView('gantt')
        }, 'Гантт')
      ])
    ]),
    React.createElement('div', { key: 'content', className: 'main-content' },
      view === 'kanban'
        ? React.createElement(KanbanView, {
            records,
            statuses,
            draggedId,
            setDraggedId,
            onUpdateStatus: updateStatus
          })
        : React.createElement(GanttView, {
            records,
            getStatusColor: getColor
          })
    )
  ]);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(ProjectWidget)
);