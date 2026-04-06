const { useState, useEffect } = React;

const ProjectWidget = () => {
  const [view, setView] = useState('kanban');
  const [records, setRecords] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [columnMappings, setColumnMappings] = useState(null); // Store actual column mappings

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

    // Listen for options/mappings changes
    grist.onOptions((options, mappings) => {
      console.log('onOptions fired:', { options, mappings });
      
      // Check if we have actual column mappings (not just accessLevel)
      // mappings.columns contains the actual column mappings
      const cols = mappings?.columns || options?.columnsMapping;
      
      if (cols && Object.keys(cols).length > 0) {
        console.log('Column mappings found:', cols);
        setColumnMappings(cols);
      } else {
        console.log('No column mappings yet');
        setColumnMappings(null);
      }
    });

    const load = async () => {
      try {
        // Load statuses first
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

        // Subscribe to records
        grist.onRecords((data, mappings) => {
          console.log('onRecords fired:', { data, mappings });
          
          // Check for column mappings in the mappings parameter
          const cols = mappings?.columns;
          if (cols && Object.keys(cols).length > 0) {
            setColumnMappings(cols);
          }
          
          const mapped = grist.mapColumnNames(data);
          
          if (!mapped) {
            console.log('mapColumnNames returned null - mappings missing');
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

        // Set loading to false after a short delay if no data arrives
        // This ensures we show the config UI if onRecords never fires
        setTimeout(() => {
          setLoading(prev => {
            if (prev) {
              console.log('Timeout: no data received, assuming no mappings');
              return false; // Stop loading, show config UI
            }
            return prev;
          });
        }, 1000);

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

  // Show configuration needed UI when no column mappings
  if (!columnMappings && !loading && records.length === 0) {
    return React.createElement('div', {
      style: {
        padding: '40px',
        textAlign: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
      }
    }, [
      React.createElement('div', {
        key: 'icon',
        style: { fontSize: '48px', marginBottom: '20px' }
      }, '⚙️'),
      React.createElement('h3', { key: 'title', style: { marginBottom: '15px' } }, 
        'Требуется настройка колонок'
      ),
      React.createElement('p', { 
        key: 'desc', 
        style: { color: '#666', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' } 
      }, 'Для работы виджета нужно указать, какие колонки таблицы соответствуют полям задач'),
      React.createElement('div', {
        key: 'steps',
        style: { 
          background: '#f5f5f5', 
          padding: '20px', 
          borderRadius: '8px',
          display: 'inline-block',
          textAlign: 'left'
        }
      }, [
        React.createElement('ol', { style: { margin: 0, paddingLeft: '20px', color: '#333' } }, [
          React.createElement('li', { key: 1, style: { marginBottom: '8px' } }, 
            'Нажмите на меню виджета (три точки ⋮ справа сверху)'
          ),
          React.createElement('li', { key: 2, style: { marginBottom: '8px' } }, 
            'Выберите "Настроить виджет" (Widget options)'
          ),
          React.createElement('li', { key: 3 }, 
            'Укажите соответствие колонок: Task Name, Status, Start Date, End Date'
          )
        ])
      ])
    ]);
  }

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