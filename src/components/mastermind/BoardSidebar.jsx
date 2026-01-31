// ============================================================================
// BOARD SIDEBAR - MasterMind board-lista
// ============================================================================

import React, { useState } from 'react';

const BoardSidebar = ({
  boards,
  selectedBoardId,
  onSelectBoard,
  onDeleteBoard,
  onUpdateBoard,
  collapsed,
  onToggleCollapse
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [contextMenu, setContextMenu] = useState(null);

  const handleStartEdit = (board) => {
    setEditingId(board.id);
    setEditName(board.name);
    setContextMenu(null);
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editingId) {
      onUpdateBoard(editingId, { name: editName.trim() });
    }
    setEditingId(null);
    setEditName('');
  };

  const handleContextMenu = (e, board) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      board
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  if (collapsed) {
    return (
      <div className="w-12 bg-[#0F0F1A] border-r border-gray-800 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors mb-4"
          title="Laajenna sivupalkki"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {boards.map((board) => (
          <button
            key={board.id}
            onClick={() => onSelectBoard(board.id)}
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium mb-2 transition-colors
              ${selectedBoardId === board.id
                ? 'bg-[#FF6B35] text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }
            `}
            title={board.name}
          >
            {board.name.charAt(0).toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="w-64 bg-[#0F0F1A] border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-300">Boardit</span>
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
            title="Pienennä sivupalkki"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Board list */}
        <div className="flex-1 overflow-auto p-2">
          {boards.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Ei boardeja
            </div>
          ) : (
            <div className="space-y-1">
              {boards.map((board) => (
                <div
                  key={board.id}
                  onContextMenu={(e) => handleContextMenu(e, board)}
                  className={`
                    group relative rounded-lg transition-colors cursor-pointer
                    ${selectedBoardId === board.id
                      ? 'bg-[#FF6B35]/10 border border-[#FF6B35]/30'
                      : 'hover:bg-gray-800 border border-transparent'
                    }
                  `}
                >
                  {editingId === board.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditName('');
                        }
                      }}
                      autoFocus
                      className="w-full px-3 py-2 bg-gray-800 border border-[#FF6B35] rounded-lg text-white text-sm focus:outline-none"
                    />
                  ) : (
                    <button
                      onClick={() => onSelectBoard(board.id)}
                      className="w-full px-3 py-2 text-left flex items-center gap-2"
                    >
                      <span className="text-lg">📋</span>
                      <span className={`
                        flex-1 truncate text-sm
                        ${selectedBoardId === board.id ? 'text-white font-medium' : 'text-gray-400'}
                      `}>
                        {board.name}
                      </span>

                      {/* More button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleContextMenu(e, board);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                      >
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                        </svg>
                      </button>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Keyboard shortcut hint */}
        <div className="p-3 border-t border-gray-800">
          <p className="text-xs text-gray-500">
            Oikea klikkaus → kontekstivalikko
          </p>
        </div>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleCloseContextMenu}
          />
          <div
            className="fixed z-50 bg-[#1A1A2E] border border-gray-700 rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleStartEdit(contextMenu.board)}
              className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Nimeä uudelleen
            </button>
            <button
              onClick={() => {
                onDeleteBoard(contextMenu.board.id);
                handleCloseContextMenu();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Poista
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default BoardSidebar;
