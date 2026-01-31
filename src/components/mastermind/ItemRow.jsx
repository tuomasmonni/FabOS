// ============================================================================
// ITEM ROW - MasterMind yksittäinen rivi
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';

const ItemRow = ({
  item,
  columns,
  groupColor,
  onUpdate,
  onDelete
}) => {
  const [editingName, setEditingName] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [hovering, setHovering] = useState(false);

  const handleUpdateColumnValue = (columnId, value) => {
    const newValues = { ...item.column_values, [columnId]: value };
    onUpdate(item.id, { columnValues: newValues });
    setEditingColumn(null);
  };

  return (
    <div
      className="flex items-stretch border-l-4 hover:bg-gray-800/30 transition-colors group"
      style={{ borderLeftColor: groupColor }}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Item name */}
      <div className="w-80 flex-shrink-0 px-4 py-2 border-r border-gray-800 flex items-center gap-2">
        {/* Delete button */}
        <button
          onClick={() => onDelete(item.id)}
          className={`p-1 hover:bg-red-500/20 rounded text-red-400 transition-all ${
            hovering ? 'opacity-100' : 'opacity-0'
          }`}
          title="Poista item"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {editingName ? (
          <input
            type="text"
            defaultValue={item.name}
            autoFocus
            className="flex-1 bg-transparent border-b border-[#FF6B35] text-white focus:outline-none"
            onBlur={(e) => {
              if (e.target.value.trim()) {
                onUpdate(item.id, { name: e.target.value.trim() });
              }
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.target.blur();
              if (e.key === 'Escape') setEditingName(false);
            }}
          />
        ) : (
          <span
            onClick={() => setEditingName(true)}
            className="flex-1 text-white cursor-pointer hover:underline"
          >
            {item.name}
          </span>
        )}
      </div>

      {/* Column values */}
      {columns.map((column) => (
        <ColumnCell
          key={column.id}
          column={column}
          value={item.column_values?.[column.id]}
          editing={editingColumn === column.id}
          onStartEdit={() => setEditingColumn(column.id)}
          onEndEdit={(value) => handleUpdateColumnValue(column.id, value)}
          onCancel={() => setEditingColumn(null)}
        />
      ))}

      {/* Spacer for add column button */}
      <div className="w-10 flex-shrink-0" />
    </div>
  );
};

// ============================================================================
// COLUMN CELL - Renders different cell types
// ============================================================================

const ColumnCell = ({
  column,
  value,
  editing,
  onStartEdit,
  onEndEdit,
  onCancel
}) => {
  switch (column.type) {
    case 'status':
      return (
        <StatusCell
          column={column}
          value={value}
          editing={editing}
          onStartEdit={onStartEdit}
          onEndEdit={onEndEdit}
          onCancel={onCancel}
        />
      );

    case 'date':
      return (
        <DateCell
          value={value}
          editing={editing}
          onStartEdit={onStartEdit}
          onEndEdit={onEndEdit}
          onCancel={onCancel}
        />
      );

    case 'number':
      return (
        <NumberCell
          column={column}
          value={value}
          editing={editing}
          onStartEdit={onStartEdit}
          onEndEdit={onEndEdit}
          onCancel={onCancel}
        />
      );

    case 'person':
      return (
        <PersonCell
          value={value}
          editing={editing}
          onStartEdit={onStartEdit}
          onEndEdit={onEndEdit}
          onCancel={onCancel}
        />
      );

    default:
      return (
        <TextCell
          value={value}
          editing={editing}
          onStartEdit={onStartEdit}
          onEndEdit={onEndEdit}
          onCancel={onCancel}
        />
      );
  }
};

// ============================================================================
// TEXT CELL
// ============================================================================

const TextCell = ({ value, editing, onStartEdit, onEndEdit, onCancel }) => {
  return (
    <div className="w-40 flex-shrink-0 px-3 py-2 border-r border-gray-800">
      {editing ? (
        <input
          type="text"
          defaultValue={value || ''}
          autoFocus
          className="w-full bg-transparent border-b border-[#FF6B35] text-white text-sm focus:outline-none"
          onBlur={(e) => onEndEdit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur();
            if (e.key === 'Escape') onCancel();
          }}
        />
      ) : (
        <span
          onClick={onStartEdit}
          className="block text-sm text-gray-300 cursor-pointer hover:text-white min-h-[20px]"
        >
          {value || <span className="text-gray-600">-</span>}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// STATUS CELL
// ============================================================================

const StatusCell = ({ column, value, editing, onStartEdit, onEndEdit, onCancel }) => {
  const labels = column.settings?.labels || [
    { id: 'working', name: 'Työn alla', color: '#fdab3d' },
    { id: 'done', name: 'Valmis', color: '#00c875' },
    { id: 'stuck', name: 'Jumissa', color: '#e2445c' },
    { id: 'pending', name: 'Odottaa', color: '#c4c4c4' }
  ];

  const selectedLabel = labels.find(l => l.id === value) || null;

  return (
    <div className="w-40 flex-shrink-0 px-3 py-2 border-r border-gray-800 relative">
      <button
        onClick={onStartEdit}
        className="w-full px-2 py-1 rounded text-sm font-medium text-center transition-colors"
        style={{
          backgroundColor: selectedLabel ? `${selectedLabel.color}20` : '#374151',
          color: selectedLabel ? selectedLabel.color : '#9CA3AF'
        }}
      >
        {selectedLabel?.name || 'Valitse'}
      </button>

      {editing && (
        <>
          <div className="fixed inset-0 z-40" onClick={onCancel} />
          <div className="absolute left-0 top-full mt-1 z-50 bg-[#1A1A2E] border border-gray-700 rounded-lg shadow-xl py-1 min-w-[140px]">
            {labels.map((label) => (
              <button
                key={label.id}
                onClick={() => onEndEdit(label.id)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-800 flex items-center gap-2"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span style={{ color: label.color }}>{label.name}</span>
              </button>
            ))}
            <button
              onClick={() => onEndEdit(null)}
              className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-800 border-t border-gray-700 mt-1"
            >
              Tyhjennä
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// DATE CELL
// ============================================================================

const DateCell = ({ value, editing, onStartEdit, onEndEdit, onCancel }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="w-40 flex-shrink-0 px-3 py-2 border-r border-gray-800">
      {editing ? (
        <input
          type="date"
          defaultValue={value || ''}
          autoFocus
          className="w-full bg-gray-800 border border-[#FF6B35] rounded px-2 py-1 text-white text-sm focus:outline-none"
          onBlur={(e) => onEndEdit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur();
            if (e.key === 'Escape') onCancel();
          }}
        />
      ) : (
        <span
          onClick={onStartEdit}
          className="block text-sm text-gray-300 cursor-pointer hover:text-white min-h-[20px]"
        >
          {formatDate(value) || <span className="text-gray-600">📅 Valitse</span>}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// NUMBER CELL
// ============================================================================

const NumberCell = ({ column, value, editing, onStartEdit, onEndEdit, onCancel }) => {
  const unit = column.settings?.unit || '';
  const decimals = column.settings?.decimals ?? 0;

  const formatNumber = (num) => {
    if (num === null || num === undefined || num === '') return null;
    const formatted = Number(num).toFixed(decimals);
    return unit ? `${formatted} ${unit}` : formatted;
  };

  return (
    <div className="w-40 flex-shrink-0 px-3 py-2 border-r border-gray-800">
      {editing ? (
        <input
          type="number"
          defaultValue={value || ''}
          autoFocus
          className="w-full bg-transparent border-b border-[#FF6B35] text-white text-sm focus:outline-none"
          onBlur={(e) => onEndEdit(e.target.value ? Number(e.target.value) : null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur();
            if (e.key === 'Escape') onCancel();
          }}
        />
      ) : (
        <span
          onClick={onStartEdit}
          className="block text-sm text-gray-300 cursor-pointer hover:text-white min-h-[20px] text-right font-mono"
        >
          {formatNumber(value) || <span className="text-gray-600">-</span>}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// PERSON CELL
// ============================================================================

const PersonCell = ({ value, editing, onStartEdit, onEndEdit, onCancel }) => {
  // Yksinkertainen versio - vain nimi tekstikenttänä
  // Myöhemmin voidaan lisätä käyttäjävalitsin

  return (
    <div className="w-40 flex-shrink-0 px-3 py-2 border-r border-gray-800">
      {editing ? (
        <input
          type="text"
          defaultValue={value || ''}
          placeholder="Nimi..."
          autoFocus
          className="w-full bg-transparent border-b border-[#FF6B35] text-white text-sm focus:outline-none"
          onBlur={(e) => onEndEdit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur();
            if (e.key === 'Escape') onCancel();
          }}
        />
      ) : (
        <div
          onClick={onStartEdit}
          className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 rounded px-1 py-0.5 -mx-1"
        >
          {value ? (
            <>
              <div
                className="w-6 h-6 rounded-full bg-[#FF6B35] flex items-center justify-center text-white text-xs font-medium"
              >
                {value.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm text-gray-300">{value}</span>
            </>
          ) : (
            <span className="text-sm text-gray-600">👤 Valitse</span>
          )}
        </div>
      )}
    </div>
  );
};

export default ItemRow;
