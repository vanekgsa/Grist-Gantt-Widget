// Constants
const PRIORITY_CLASSES = {
  'High': 'priority-high',
  'Medium': 'priority-medium',
  'Low': 'priority-low'
};

const STATUS_COLORS = {
  'В ожидании': '#9E9E9E',
  'К выполнению': '#607D8B',
  'В работе': '#2196F3',
  'На согласовании': '#FF9800',
  'Выполнено': '#4CAF50',
  'Отменено': '#F44336'
};

// String conversion
const str = (val) => {
  if (val == null) return '';
  if (val instanceof Date) return val.toLocaleDateString('ru-RU');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

// Date parsing
const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// Convert Grist column format to rows
const columnsToRows = (colData) => {
  if (!colData || typeof colData !== 'object') return [];
  if (Array.isArray(colData)) return colData;
  
  const columns = Object.keys(colData);
  if (columns.length === 0) return [];
  
  const rowCount = colData[columns[0]].length;
  const rows = [];
  
  for (let i = 0; i < rowCount; i++) {
    const row = {};
    columns.forEach(col => {
      row[col] = colData[col][i];
    });
    rows.push(row);
  }
  return rows;
};

// Get status color
const getStatusColor = (statuses, statusText) => {
  const status = statuses.find(s => s.Status === statusText);
  return status?.Color || STATUS_COLORS[statusText] || '#757575';
};

// Get status ID
const getStatusId = (statuses, statusText) => {
  const status = statuses.find(s => s.Status === statusText);
  return status?.id || null;
};