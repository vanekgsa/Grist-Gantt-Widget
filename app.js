const { useState, useEffect, useRef, useMemo } = React;

const ProjectWidget = () => {
  const [view, setView] = useState('kanban');
  const [records, setRecords] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedId, setDraggedId] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  
  const timeoutRef = useRef(null);
  const dataReceived = useRef(false);
  const isSubscribed = useRef(false);

  // Загрузка справочников
  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [projData, userData, statusData] = await Promise.all([
          grist.docApi.fetchTable("Projects").catch(() => ({})),
          grist.docApi.fetchTable("Users").catch(() => ({})),
          grist.docApi.fetchTable("Status").catch(() => ({}))
        ]);
        
        const projRows = columnsToRows(projData);
        setProjects(projRows.map(p => ({ id: p.id, Name: p.Name || '' })));
        
        const userRows = columnsToRows(userData);
        setUsers(userRows.map(u => ({ id: u.id, Name: u.Name || '' })));
        
        const statusRows = columnsToRows(statusData);
        if (statusRows.length) {
          setStatuses(statusRows.sort((a,b) => (a.Order||0)-(b.Order||0)).map(s => ({ id: s.id, Status: s.Status, Color: s.Color })));
        } else {
          setStatuses([
            { id: 1, Status: 'В ожидании', Color: '#9E9E9E' },
            { id: 2, Status: 'К выполнению', Color: '#607D8B' },
            { id: 3, Status: 'В работе', Color: '#2196F3' },
            { id: 4, Status: 'На согласовании', Color: '#FF9800' },
            { id: 5, Status: 'Выполнено', Color: '#4CAF50' },
            { id: 6, Status: 'Отменено', Color: '#F44336' }
          ]);
        }
      } catch (e) {
        console.error("Error loading references:", e);
      }
    };
    loadReferences();
  }, []);

  // Подписка на данные (только после загрузки справочников)
  const subscribeToData = () => {
    if (isSubscribed.current) return;
    isSubscribed.current = true;
    
    grist.onRecords((data) => {
      console.log("onRecords:", data);
      dataReceived.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      const mapped = grist.mapColumnNames(data);
      if (!mapped) {
        setError("Настройте колонки в опциях виджета");
        setLoading(false);
        setShowConfig(true);
        return;
      }
      
      const rows = Array.isArray(mapped) ? mapped : [mapped];
      const newRecords = rows.map(r => {
        // Статус
        let statusId = null, statusText = "";
        if (r.Status && typeof r.Status === "object") {
          statusId = r.Status.id;
          statusText = r.Status.Status || r.Status.Name || "";
        } else if (typeof r.Status === "number") {
          statusId = r.Status;
          const found = statuses.find(s => s.id === statusId);
          statusText = found ? found.Status : String(statusId);
        } else {
          statusText = str(r.Status);
          const found = statuses.find(s => s.Status === statusText);
          statusId = found ? found.id : null;
        }
        
        // Проект (ссылка)
        let projectId = null, projectName = "";
        if (r.Project && typeof r.Project === "object") {
          projectId = r.Project.id;
          projectName = r.Project.Name || "";
        } else if (typeof r.Project === "number") {
          projectId = r.Project;
          const found = projects.find(p => p.id === projectId);
          projectName = found ? found.Name : String(projectId);
        } else {
          projectName = str(r.Project);
          const found = projects.find(p => p.Name === projectName);
          projectId = found ? found.id : null;
        }
        
        // Исполнитель (ссылка)
        let assigneeId = null, assigneeName = "";
        if (r.Assignee && typeof r.Assignee === "object") {
          assigneeId = r.Assignee.id;
          assigneeName = r.Assignee.Name || "";
        } else if (typeof r.Assignee === "number") {
          assigneeId = r.Assignee;
          const found = users.find(u => u.id === assigneeId);
          assigneeName = found ? found.Name : String(assigneeId);
        } else {
          assigneeName = str(r.Assignee);
          const found = users.find(u => u.Name === assigneeName);
          assigneeId = found ? found.id : null;
        }
        
        // Приоритет
        let priorityStr = "";
        if (r.Priority != null) {
          const p = typeof r.Priority === "number" ? r.Priority : parseInt(r.Priority);
          if (p === 1) priorityStr = "High";
          else if (p === 2) priorityStr = "Medium";
          else if (p === 3) priorityStr = "Low";
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
    }, { format: "rows" });
  };

  // Инициализация виджета и запуск подписки после загрузки справочников
  useEffect(() => {
    grist.ready({
      columns: [
        { name: "TaskName", title: "Task Name" },
        { name: "Status", title: "Status" },
        { name: "StartDate", title: "Start Date" },
        { name: "EndDate", title: "End Date" },
        { name: "Assignee", title: "Assignee", optional: true },
        { name: "Priority", title: "Priority", optional: true },
        { name: "Project", title: "Project", optional: true }
      ],
      requiredAccess: "full"
    });
    
    // Ждём загрузки справочников
    const interval = setInterval(() => {
      if (projects.length > 0 && users.length > 0 && statuses.length > 0) {
        clearInterval(interval);
        subscribeToData();
      }
    }, 100);
    
    timeoutRef.current = setTimeout(() => {
      if (!dataReceived.current) {
        setLoading(false);
        setShowConfig(true);
      }
    }, 5000);
    
    return () => {
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [projects, users, statuses]);

  // Создание задачи
  const handleAddTask = async (taskData) => {
    try {
      await grist.docApi.addRecord("Tasks", {
        TaskName: taskData.TaskName,
        Status: taskData.StatusId,
        Project: taskData.ProjectId || null,
        Assignee: taskData.AssigneeId || null,
        Priority: taskData.PriorityValue,
        StartDate: taskData.StartDate || null,
        EndDate: taskData.EndDate || null
      });
    } catch (e) {
      setError("Ошибка создания: " + e.message);
    }
  };

  // Редактирование задачи
  const handleEditTask = async (taskId, updatedFields) => {
    try {
      await grist.selectedTable.update({
        id: taskId,
        fields: {
          TaskName: updatedFields.TaskName,
          Status: updatedFields.StatusId,
          Project: updatedFields.ProjectId || null,
          Assignee: updatedFields.AssigneeId || null,
          Priority: updatedFields.PriorityValue,
          StartDate: updatedFields.StartDate || null,
          EndDate: updatedFields.EndDate || null
        }
      });
    } catch (e) {
      setError("Ошибка редактирования: " + e.message);
    }
  };

  // Изменение статуса (drag & drop)
  const updateStatus = async (taskId, newStatusText) => {
    const status = statuses.find(s => s.Status === newStatusText);
    if (!status) {
      setError("Статус не найден: " + newStatusText);
      return;
    }
    try {
      await grist.selectedTable.update({
        id: taskId,
        fields: { Status: status.id }
      });
    } catch (e) {
      setError("Ошибка обновления: " + e.message);
    }
  };

  const getStatusColor = (statusText) => {
    const s = statuses.find(x => x.Status === statusText);
    return s?.Color || "#757575";
  };

  // Уникальные проекты для свимлейнов
  const projectList = useMemo(() => {
    const map = new Map();
    records.forEach(r => {
      if (r.ProjectId && r.ProjectName) {
        map.set(r.ProjectId, { id: r.ProjectId, Name: r.ProjectName });
      }
    });
    return Array.from(map.values());
  }, [records]);

  if (showConfig && !loading && records.length === 0 && !error) {
    return React.createElement("div", { style: { padding: "40px", textAlign: "center" } },
      React.createElement("h3", null, "Требуется настройка колонок"),
      React.createElement("p", null, "Укажите соответствие колонок в опциях виджета")
    );
  }

  if (loading) return React.createElement("div", { className: "loading" }, "Загрузка...");
  if (error) return React.createElement("div", { className: "error" }, error);

  return React.createElement("div", { className: "widget-container" }, [
    React.createElement("div", { key: "toolbar", className: "toolbar" },
      React.createElement("h2", null, "Управление проектом"),
      React.createElement("div", { className: "view-toggle" },
        React.createElement("button", { className: view === "kanban" ? "view-btn active" : "view-btn", onClick: () => setView("kanban") }, "Канбан"),
        React.createElement("button", { className: view === "gantt" ? "view-btn active" : "view-btn", onClick: () => setView("gantt") }, "Гантт")
      )
    ),
    React.createElement("div", { key: "content", className: "main-content" },
      view === "kanban"
        ? React.createElement(KanbanView, {
            records, statuses, projects: projectList, users,
            draggedId, setDraggedId,
            onUpdateStatus: updateStatus,
            onAddTask: handleAddTask,
            onEditTask: handleEditTask
          })
        : React.createElement(GanttView, { records, getStatusColor })
    )
  ]);
};

ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(ProjectWidget));