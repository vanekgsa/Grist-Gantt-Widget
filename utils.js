
const PRIORITY_CLASSES = {
  'High': 'priority-high',
  'Medium': 'priority-medium',
  'Low': 'priority-low'
};

const str = (val) => {
  if (val == null) return '';
  if (val instanceof Date) return val.toLocaleDateString('ru-RU');
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

const toDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

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
