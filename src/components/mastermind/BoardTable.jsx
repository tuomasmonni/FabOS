// ============================================================================
// BOARD TABLE - MasterMind taulukkonäkymä
// ============================================================================

import React, { useState } from 'react';
import ItemRow from './ItemRow';

const COLUMN_TYPES = [
  { id: 'text', name: 'Teksti', icon: '📝' },
  { id: 'status', name: 'Status', icon: '🔘' },
  { id: 'date', name: 'Päivämäärä', icon: '📅' },
  { id: 'number', name: 'Numero', icon: '#️⃣' },
  { id: 'person', name: 'Henkilö', icon: '👤' }
];

const GROUP_COLORS = [
  '#6161FF', '#00C875', '#FDAB3D', '#E2445C',
  '#A25DDC', '#579BFC', '#CAB641', '#FF642E'
];

const BoardTable = ({
  board,
  columns,
  groups,
  items,
  onCreateGroup,
  onUpdateGroup,
  onDeleteGroup,
  onCreateColumn,
  onUpdateColumn,
  onDeleteColumn,
  onCreateItem,
  onUpdateItem,
  onDeleteItem
}) => {
  const [editingBoardName, setEditingBoardName] = useState(false);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [editingColumnId, setEditingColumnId] = useState(null);

  // Group items by group_id
  const itemsByGroup = groups.reduce((acc, group) => {
    acc[group.id] = items.filter(item => item.group_id === group.id);
    return acc;
  }, {});

  return (
    <div className="p-6">
      {/* Board header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          {board?.name || 'Board'}
        </h1>
        {board?.description && (
          <p className="text-gray-400 text-sm">{board.description}</p>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#0F0F1A] rounded-xl border border-gray-800 overflow-hidden">
        {/* Column headers */}
        <div className="flex items-center border-b border-gray-800 bg-[#1A1A2E]">
          {/* Item name column */}
          <div className="w-80 flex-shrink-0 px-4 py-3 text-sm font-medium text-gray-400 border-r border-gray-800">
            Item
          </div>

          {/* Dynamic columns */}
          {columns.map((column) => (
            <div
              key={column.id}
              className="w-40 flex-shrink-0 px-3 py-3 text-sm font-medium text-gray-400 border-r border-gray-800 group relative"
            >
              <div className="flex items-center justify-between">
                {editingColumnId === column.id ? (
                  <input
                    type="text"
                    defaultValue={column.title}
                    autoFocus
                    className="w-full bg-transparent border-b border-[#FF6B35] text-white text-sm focus:outline-none"
                    onBlur={(e) => {
                      if (e.target.value.trim()) {
                        onUpdateColumn(column.id, { title: e.target.value.trim() });
                      }
                      setEditingColumnId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.target.blur();
                      if (e.key === 'Escape') setEditingColumnId(null);
                    }}
                  />
                ) : (
                  <>
                    <span
                      onClick={() => setEditingColumnId(column.id)}
                      className="cursor-pointer hover:text-white transition-colors"
                    >
                      {column.title}
                    </span>
                    <button
                      onClick={() => onDeleteColumn(column.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400 transition-all"
                      title="Poista sarake"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* Add column button */}
          <div className="w-10 flex-shrink-0 px-2 py-3 relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="p-1 hover:bg-gray-800 rounded text-gray-500 hover:text-white transition-colors"
              title="Lisää sarake"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {/* Column type menu */}
            {showColumnMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowColumnMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 bg-[#1A1A2E] border border-gray-700 rounded-lg shadow-xl py-2 min-w-[180px]">
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase">
                    Saraketyyppi
                  </div>
                  {COLUMN_TYPES.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        onCreateColumn(type.id);
                        setShowColumnMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
                    >
                      <span>{type.icon}</span>
                      <span>{type.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Groups and items */}
        <div>
          {groups.map((group) => (
            <GroupSection
              key={group.id}
              group={group}
              columns={columns}
              items={itemsByGroup[group.id] || []}
              onUpdateGroup={onUpdateGroup}
              onDeleteGroup={onDeleteGroup}
              onCreateItem={onCreateItem}
              onUpdateItem={onUpdateItem}
              onDeleteItem={onDeleteItem}
            />
          ))}

          {/* Add group button */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={onCreateGroup}
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Lisää ryhmä
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// GROUP SECTION
// ============================================================================

const GroupSection = ({
  group,
  columns,
  items,
  onUpdateGroup,
  onDeleteGroup,
  onCreateItem,
  onUpdateItem,
  onDeleteItem
}) => {
  const [collapsed, setCollapsed] = useState(group.collapsed || false);
  const [editing, setEditing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleToggleCollapse = () => {
    setCollapsed(!collapsed);
    onUpdateGroup(group.id, { collapsed: !collapsed });
  };

  return (
    <div className="border-t border-gray-800">
      {/* Group header */}
      <div
        className="flex items-center px-4 py-2 hover:bg-gray-800/30 transition-colors cursor-pointer"
        style={{ borderLeft: `4px solid ${group.color}` }}
      >
        <button
          onClick={handleToggleCollapse}
          className="p-1 hover:bg-gray-700 rounded mr-2 text-gray-400"
        >
          <svg
            className={`w-4 h-4 transition-transform ${collapsed ? '' : 'rotate-90'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {editing ? (
          <input
            type="text"
            defaultValue={group.title}
            autoFocus
            className="bg-transparent border-b border-[#FF6B35] text-white font-medium focus:outline-none"
            onBlur={(e) => {
              if (e.target.value.trim()) {
                onUpdateGroup(group.id, { title: e.target.value.trim() });
              }
              setEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.target.blur();
              if (e.key === 'Escape') setEditing(false);
            }}
          />
        ) : (
          <span
            onClick={() => setEditing(true)}
            className="font-medium text-white cursor-pointer hover:underline"
            style={{ color: group.color }}
          >
            {group.title}
          </span>
        )}

        <span className="ml-2 text-xs text-gray-500">
          {items.length} {items.length === 1 ? 'item' : 'itemiä'}
        </span>

        {/* Color picker */}
        <div className="relative ml-auto mr-2">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="w-5 h-5 rounded-full border-2 border-gray-600 hover:border-gray-400 transition-colors"
            style={{ backgroundColor: group.color }}
            title="Vaihda väri"
          />

          {showColorPicker && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowColorPicker(false)}
              />
              <div className="absolute right-0 top-full mt-2 z-50 bg-[#1A1A2E] border border-gray-700 rounded-lg shadow-xl p-2 flex gap-1 flex-wrap w-36">
                {GROUP_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      onUpdateGroup(group.id, { color });
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-full hover:scale-110 transition-transform ${
                      group.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1A1A2E]' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Delete group */}
        <button
          onClick={() => onDeleteGroup(group.id)}
          className="p-1 hover:bg-red-500/20 rounded text-gray-500 hover:text-red-400 transition-colors"
          title="Poista ryhmä"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Items */}
      {!collapsed && (
        <div>
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              columns={columns}
              groupColor={group.color}
              onUpdate={onUpdateItem}
              onDelete={onDeleteItem}
            />
          ))}

          {/* Add item button */}
          <div
            className="flex items-center px-4 py-2 border-l-4 hover:bg-gray-800/30 transition-colors"
            style={{ borderLeftColor: 'transparent' }}
          >
            <button
              onClick={() => onCreateItem(group.id)}
              className="flex items-center gap-2 text-gray-500 hover:text-white text-sm transition-colors pl-6"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Lisää item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardTable;
