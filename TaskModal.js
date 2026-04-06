const TaskModal = ({ isOpen, task, onSave, onClose, statuses, projects, users, initialStatus }) => {
  const [formData, setFormData] = React.useState({
    TaskName: '',
    StatusId: '',
    AssigneeId: '',
    Priority: '',
    PriorityValue: null,
    StartDate: '',
    EndDate: '',
    ProjectId: ''
  });

  React.useEffect(() => {
    if (task) {
      setFormData({
        TaskName: task.TaskName || '',
        StatusId: task.StatusId || '',
        AssigneeId: task.AssigneeId || '',
        Priority: task.Priority || '',
        PriorityValue: task.Priority === 'High' ? 1 : (task.Priority === 'Medium' ? 2 : (task.Priority === 'Low' ? 3 : null)),
        StartDate: task.StartDate ? task.StartDate.toISOString().split('T')[0] : '',
        EndDate: task.EndDate ? task.EndDate.toISOString().split('T')[0] : '',
        ProjectId: task.ProjectId || ''
      });
    } else {
      const defaultStatusId = initialStatus?.id || (statuses[0]?.id) || '';
      setFormData({
        TaskName: '',
        StatusId: defaultStatusId,
        AssigneeId: '',
        Priority: '',
        PriorityValue: null,
        StartDate: '',
        EndDate: '',
        ProjectId: ''
      });
    }
  }, [task, statuses, initialStatus]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'Priority') {
      const priorityValue = value === 'High' ? 1 : (value === 'Medium' ? 2 : (value === 'Low' ? 3 : null));
      setFormData(prev => ({ ...prev, PriorityValue: priorityValue }));
    }
  };

  const handleSubmit = () => {
    if (!formData.TaskName.trim()) {
      alert('Введите название задачи');
      return;
    }
    onSave({
      TaskName: formData.TaskName,
      StatusId: formData.StatusId,
      AssigneeId: formData.AssigneeId || null,
      PriorityValue: formData.PriorityValue,
      StartDate: formData.StartDate || null,
      EndDate: formData.EndDate || null,
      ProjectId: formData.ProjectId || null
    });
  };

  if (!isOpen) return null;

  return React.createElement('div', {
    style: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    },
    onClick: (e) => { if (e.target === e.currentTarget) onClose(); }
  }, React.createElement('div', {
    style: {
      backgroundColor: 'white', borderRadius: '12px', padding: '24px',
      width: '500px', maxWidth: '90%', maxHeight: '90%', overflow: 'auto',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }
  }, [
    React.createElement('h3', { key: 'title', style: { marginTop: 0, marginBottom: '20px' } },
      task ? 'Редактировать задачу' : 'Новая задача'
    ),
    React.createElement('div', { key: 'form', style: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
      React.createElement('div', { key: 'name' }, [
        React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Название *'),
        React.createElement('input', {
          type: 'text', value: formData.TaskName,
          onChange: (e) => handleChange('TaskName', e.target.value),
          style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
        })
      ]),
      React.createElement('div', { key: 'project' }, [
        React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Проект'),
        React.createElement('select', {
          value: formData.ProjectId,
          onChange: (e) => handleChange('ProjectId', e.target.value),
          style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
        }, [
          React.createElement('option', { key: '', value: '' }, '— Без проекта —'),
          ...projects.map(p => React.createElement('option', { key: p.id, value: p.id }, p.Name))
        ])
      ]),
      React.createElement('div', { key: 'status' }, [
        React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Статус'),
        React.createElement('select', {
          value: formData.StatusId,
          onChange: (e) => handleChange('StatusId', e.target.value),
          style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
        }, statuses.map(s => React.createElement('option', { key: s.id, value: s.id }, s.Status)))
      ]),
      React.createElement('div', { key: 'assignee' }, [
        React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Исполнитель'),
        React.createElement('select', {
          value: formData.AssigneeId,
          onChange: (e) => handleChange('AssigneeId', e.target.value),
          style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
        }, [
          React.createElement('option', { key: '', value: '' }, '— Не назначен —'),
          ...users.map(u => React.createElement('option', { key: u.id, value: u.id }, u.Name))
        ])
      ]),
      React.createElement('div', { key: 'priority' }, [
        React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Приоритет'),
        React.createElement('select', {
          value: formData.Priority,
          onChange: (e) => handleChange('Priority', e.target.value),
          style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
        }, [
          React.createElement('option', { key: '', value: '' }, '— Нет —'),
          React.createElement('option', { key: 'High', value: 'High' }, 'Высокий'),
          React.createElement('option', { key: 'Medium', value: 'Medium' }, 'Средний'),
          React.createElement('option', { key: 'Low', value: 'Low' }, 'Низкий')
        ])
      ]),
      React.createElement('div', { key: 'dates', style: { display: 'flex', gap: '12px' } }, [
        React.createElement('div', { style: { flex: 1 } }, [
          React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Дата начала'),
          React.createElement('input', {
            type: 'date', value: formData.StartDate,
            onChange: (e) => handleChange('StartDate', e.target.value),
            style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
          })
        ]),
        React.createElement('div', { style: { flex: 1 } }, [
          React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Дата окончания'),
          React.createElement('input', {
            type: 'date', value: formData.EndDate,
            onChange: (e) => handleChange('EndDate', e.target.value),
            style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
          })
        ])
      ])
    ]),
    React.createElement('div', { key: 'buttons', style: { marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' } }, [
      React.createElement('button', { key: 'cancel', onClick: onClose, style: { padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Отмена'),
      React.createElement('button', { key: 'save', onClick: handleSubmit, style: { padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' } }, 'Сохранить')
    ])
  ]));
};