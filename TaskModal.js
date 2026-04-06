// TaskModal.js
const TaskModal = ({ isOpen, task, onSave, onClose, statuses, projects }) => {
  const [formData, setFormData] = React.useState({
    TaskName: '',
    StatusId: statuses[0]?.id || null,
    StatusText: statuses[0]?.Status || '',
    Assignee: '',
    Priority: '',
    StartDate: '',
    EndDate: '',
    Project: ''
  });

  React.useEffect(() => {
    if (task) {
      // Режим редактирования
      setFormData({
        TaskName: task.TaskName || '',
        StatusId: task.StatusId,
        StatusText: task.StatusText,
        Assignee: task.Assignee || '',
        Priority: task.Priority || '',
        StartDate: task.StartDate ? task.StartDate.toISOString().split('T')[0] : '',
        EndDate: task.EndDate ? task.EndDate.toISOString().split('T')[0] : '',
        Project: task.Project || ''
      });
    } else {
      // Режим создания: статус можно предустановить из пропса defaultStatus
      setFormData({
        TaskName: '',
        StatusId: statuses[0]?.id || null,
        StatusText: statuses[0]?.Status || '',
        Assignee: '',
        Priority: '',
        StartDate: '',
        EndDate: '',
        Project: ''
      });
    }
  }, [task, statuses]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.TaskName.trim()) {
      alert('Введите название задачи');
      return;
    }
    onSave(formData);
  };

  if (!isOpen) return null;

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    },
    onClick: (e) => { if (e.target === e.currentTarget) onClose(); }
  }, React.createElement('div', {
    style: {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      width: '500px',
      maxWidth: '90%',
      maxHeight: '90%',
      overflow: 'auto',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }
  }, [
    React.createElement('h3', { key: 'title', style: { marginTop: 0, marginBottom: '20px' } },
      task ? 'Редактировать задачу' : 'Новая задача'
    ),
    React.createElement('div', { key: 'form', style: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
      // Название задачи
      React.createElement('div', { key: 'name' }, [
        React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Название *'),
        React.createElement('input', {
          type: 'text',
          value: formData.TaskName,
          onChange: (e) => handleChange('TaskName', e.target.value),
          style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
        })
      ]),
      // Проект (выпадающий список или текстовое поле)
      React.createElement('div', { key: 'project' }, [
        React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Проект'),
        projects && projects.length > 0 ?
          React.createElement('select', {
            value: formData.Project,
            onChange: (e) => handleChange('Project', e.target.value),
            style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
          }, [
            React.createElement('option', { key: '', value: '' }, '— Без проекта —'),
            ...projects.map(p => React.createElement('option', { key: p, value: p }, p))
          ]) :
          React.createElement('input', {
            type: 'text',
            value: formData.Project,
            onChange: (e) => handleChange('Project', e.target.value),
            placeholder: 'Название проекта',
            style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
          })
      ]),
      // Статус
      React.createElement('div', { key: 'status' }, [
        React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Статус'),
        React.createElement('select', {
          value: formData.StatusId || '',
          onChange: (e) => {
            const status = statuses.find(s => s.id == e.target.value);
            if (status) handleChange('StatusId', status.id);
            if (status) handleChange('StatusText', status.Status);
          },
          style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
        }, statuses.map(s => React.createElement('option', { key: s.id, value: s.id }, s.Status)))
      ]),
      // Исполнитель
      React.createElement('div', { key: 'assignee' }, [
        React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Исполнитель'),
        React.createElement('input', {
          type: 'text',
          value: formData.Assignee,
          onChange: (e) => handleChange('Assignee', e.target.value),
          style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
        })
      ]),
      // Приоритет
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
      // Даты
      React.createElement('div', { key: 'dates', style: { display: 'flex', gap: '12px' } }, [
        React.createElement('div', { style: { flex: 1 } }, [
          React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Дата начала'),
          React.createElement('input', {
            type: 'date',
            value: formData.StartDate,
            onChange: (e) => handleChange('StartDate', e.target.value),
            style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
          })
        ]),
        React.createElement('div', { style: { flex: 1 } }, [
          React.createElement('label', { style: { display: 'block', marginBottom: '4px', fontWeight: 500 } }, 'Дата окончания'),
          React.createElement('input', {
            type: 'date',
            value: formData.EndDate,
            onChange: (e) => handleChange('EndDate', e.target.value),
            style: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }
          })
        ])
      ])
    ]),
    React.createElement('div', { key: 'buttons', style: { marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' } }, [
      React.createElement('button', {
        key: 'cancel',
        onClick: onClose,
        style: { padding: '8px 16px', background: '#f0f0f0', border: 'none', borderRadius: '6px', cursor: 'pointer' }
      }, 'Отмена'),
      React.createElement('button', {
        key: 'save',
        onClick: handleSubmit,
        style: { padding: '8px 16px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }
      }, 'Сохранить')
    ])
  ]));
};