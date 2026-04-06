const { useState, useEffect, useRef } = React;

const ProjectWidget = () => {
  const [view, setView] = useState('kanban');
  const [records, setRecords] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [projects, setProjects] = useState([]);      // [{ id, Name }]
  const [users, setUsers] = useState([]);            // [{ id, Name }]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  
  const timeoutRef = useRef(null);
  const dataReceived = useRef(false);

  // Загрузка справочников
  useEffect(() => {
    const loadReferenceTables = async () => {
      try {
        const projectsData = await grist.docApi.fetchTable("Projects");
        const projectsRows = columnsToRows(projectsData);
        setProjects(projectsRows.map(p => ({ id: p.id, Name: p.Name || '' })));

        const usersData = await grist.docApi.fetchTable("Users");
        const usersRows = columnsToRows(usersData);
        setUsers(usersRows.map(u => ({ id: u.id, Name: u.Name || '' })));
      } catch (e) {
        console.warn("Could not load references:", e);
        // Не фатально, просто не будет выпадающих списков
      }
    };
    loadReferenceTables();

    const loadStatuses = async () => {
      try {
        const r = await grist.docApi.fetchTable("Status");
        const s = columnsToRows(r).sort((a, b) => (a.Order || 0) - (b.Order || 0));
        setStatuses(s.map(st => ({ id: st.id, Status: st.Status, Color: st.Color })));
      } catch (e) {
        setStatuses([
          { id: 1, Status: 'В ожидании', Color: '#9E9E9E' },
          { id: 2, Status: 'К выполнению', Color: '#607D8B' },
          { id: 3, Status: 'В работе', Color: '#2196F3' },
          { id: 4, Status: 'На согласовании', Color: '#FF9800' },
          { id: 5, Status: 'Выполнено', Color: '#4CAF50' },
          { id: 6, Status: 'Отменено', Color: '#F44336' }
        ]);
      }
    };
    loadStatuses();
  }, []);

  // Инициализация виджета
  useEffect(() => {
    grist.ready({
      columns: [
        { name: 'TaskName', title: 'Task Name' },
        { name: 'Status', title: 'Status' },
        { name: 'StartDate', title: 'Start Date' },
        { name: 'EndDate', title: 'End Date' },
        { name: 'Assignee', title: 'Assignee', optional: true },
        { name: 'Priority', title: 'Priority', optional: true },
        { name: 'Project', title: 'Project', optional: true }
      ],
      requiredAccess: 'full'
    });

    grist.onRecords((data) => {
      console.log('onRecords received:', data);
      dataReceived.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const mapped = grist.mapColumnNames(data);
      if (!mapped) {
        setError('Не удалось сопоставить колонки. Проверьте настройки виджета.');
        setLoading(false);
        setShowConfig(true);
        return;
      }

      const rows = Array.isArray(mapped) ? mapped : [mapped];
      const newRecords = rows.map(r => {
        // Обработка ссылок: Project, Assignee, Status
        let projectId = null, projectName = '';
        if (r.Project && typeof r.Project === 'object') {
          projectId = r.Project.id;
          projectName = r.Project.Name || str(r.Project);
        } else if (typeof r.Project === 'number') {
          projectId = r.Project;
          const found = projects.find(p => p.id === projectId);
          projectName = found ? found.Name : String(projectId);
        }

        let assigneeId = null, assigneeName = '';
        if (r.Assignee && typeof r.Assignee === 'object') {
          assigneeId = r.Assignee.id;
          assigneeName = r.Assignee.Name || str(r.Assignee);
        } else if (typeof r.Assignee === 'number') {
          assigneeId = r.Assignee;
          const found = users.find(u => u.id === assigneeId);
          assigneeName = found ? found.Name : String(assigneeId);
        } else {
          assigneeName = str(r.Assignee);
        }

        let statusId = null, statusText = '';
        if (r.Status && typeof r.Status === 'object') {
          statusId = r.Status.id;
          statusText = r.Status.Status || r.Status.Name || str(r.Status);
        } else if (typeof r.Status === 'number') {
          statusId = r.Status;
          const found = statuses.find(s => s.id === statusId);
          statusText = found ? found.Status : String(statusId);
        } else {
          statusText = str(r.Status);
          const found = statuses.find(s => s.Status === statusText);
          statusId = found ? found.id : null;
        }

        // Priority: может быть числом или строкой
        let priorityStr = '';
        if (r.Priority !== undefined && r.Priority !== null) {
          const p = typeof r.Priority === 'number' ? r.Priority : parseInt(r.Priority);
          if (p === 1) priorityStr = 'High';
          else if (p === 2) priorityStr = 'Medium';
          else if (p === 3) priorityStr = 'Low';
          else priorityStr = str(r.Priority);
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
          AssigneeId: assigneeId,
          AssigneeName: assigneeName,
          Priority: priorityStr,
          ProjectId: projectId,
          ProjectName: projectName
        };
      });
      setRecords(newRecords);
      setLoading(false);
      setShowConfig(false);
      setError(null);
    }, { format: 'rows' });

    timeoutRef.current = setTimeout(() => {
      if (!dataReceived.current) {
        console.log('No data received after 5s, showing config screen');
        setLoading(false);
        setShowConfig(true);
      }
    }, 5000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [projects, users, statuses]); // перезапускаем подписку при загрузке справочников

  // Создание задачи
  const handleAddTask = async (taskData) => {
  try {
    const fields = {
      TaskName: taskData.TaskName,
      Status: taskData.StatusId,          // поле в таблице называется Status
      Project: taskData.ProjectId || null,
      Assignee: taskData.AssigneeId || null,
      Priority: taskData.PriorityValue,   // поле Priority (целое число)
      StartDate: taskData.StartDate || null,
      EndDate: taskData.EndDate || null
    };
    await grist.docApi.addRecord("Tasks", fields);
  } catch (e) {
    setError('Ошибка создания: ' + e.message);
  }
};

const handleEditTask = async (taskId, updatedFields) => {
  try {
    const fields = {
      TaskName: updatedFields.TaskName,
      Status: updatedFields.StatusId,
      Project: updatedFields.ProjectId || null,
      Assignee: updatedFields.AssigneeId || null,
      Priority: updatedFields.PriorityValue,
      StartDate: updatedFields.StartDate || null,
      EndDate: updatedFields.EndDate || null
    };
    await grist.selectedTable.update({ id: taskId, fields });
  } catch (e) {
    setError('Ошибка редактирования: ' + e.message);
  }
};

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

  const getStatusColor = (statusText) => {
    const s = statuses.find(x => x.Status === statusText);
    return s?.Color || '#757575';
  };

  // Получаем уникальные проекты для свимлейнов (из записей)
  const projectList = React.useMemo(() => {
    const unique = new Map();
    records.forEach(r => {
      if (r.ProjectId && r.ProjectName) {
        unique.set(r.ProjectId, { id: r.ProjectId, Name: r.ProjectName });
      }
    });
    return Array.from(unique.values());
  }, [records]);

  if (showConfig && !loading && records.length === 0 && !error) {
    return React.createElement('div', { style: { padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' } }, [
      React.createElement('div', { key: 'icon', style: { fontSize: '48px', marginBottom: '20px' } }, '⚙️'),
      React.createElement('h3', { key: 'title', style: { marginBottom: '15px' } }, 'Требуется настройка колонок'),
      React.createElement('p', { key: 'desc', style: { color: '#666', marginBottom: '20px' } }, 'Укажите соответствие колонок в опциях виджета')
    ]);
  }

  if (loading) return React.createElement('div', { className: 'loading' }, 'Загрузка...');
  if (error) return React.createElement('div', { className: 'error' }, error);

  return React.createElement('div', { className: 'widget-container' }, [
    React.createElement('div', { key: 'toolbar', className: 'toolbar' }, [
      React.createElement('h2', { key: 'title' }, 'Управление проектом'),
      React.createElement('div', { key: 'toggle', className: 'view-toggle' }, [
        React.createElement('button', { key: 'kanban', className: view === 'kanban' ? 'view-btn active' : 'view-btn', onClick: () => setView('kanban') }, 'Канбан'),
        React.createElement('button', { key: 'gantt', className: view === 'gantt' ? 'view-btn active' : 'view-btn', onClick: () => setView('gantt') }, 'Гантт')
      ])
    ]),
    React.createElement('div', { key: 'content', className: 'main-content' },
      view === 'kanban'
        ? React.createElement(KanbanView, {
            records,
            statuses,
            projects: projectList,
            users,
            draggedId,
            setDraggedId,
            onUpdateStatus: updateStatus,
            onAddTask: handleAddTask,
            onEditTask: handleEditTask
          })
        : React.createElement(GanttView, { records, getStatusColor: getStatusColor })
    )
  ]);
};

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ProjectWidget));