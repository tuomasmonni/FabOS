// ============================================================================
// MASTERMIND APP - Monday.com-tyylinen projektinhallinta FabOS:ssa
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import BoardSidebar from './components/mastermind/BoardSidebar';
import BoardTable from './components/mastermind/BoardTable';

// API Base URL
const API_URL = import.meta.env.VITE_API_URL || '/api';

// API Helper
async function apiCall(action, params = {}) {
  const response = await fetch(`${API_URL}/mastermind`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

const MasterMindApp = ({ onBack }) => {
  const { user } = useAuth();

  // State
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Lataa boardit
  const loadBoards = useCallback(async () => {
    try {
      const result = await apiCall('getBoards');
      setBoards(result.boards || []);

      // Valitse ensimmäinen board automaattisesti
      if (result.boards?.length > 0 && !selectedBoardId) {
        setSelectedBoardId(result.boards[0].id);
      }
    } catch (err) {
      console.error('Failed to load boards:', err);
      setError('Boardien lataus epäonnistui');
    }
  }, [selectedBoardId]);

  // Lataa valitun boardin data
  const loadBoardData = useCallback(async (boardId) => {
    if (!boardId) return;

    try {
      setLoading(true);
      const result = await apiCall('getBoardFull', { boardId });
      setBoardData(result);
    } catch (err) {
      console.error('Failed to load board data:', err);
      setError('Boardin lataus epäonnistui');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadBoards().finally(() => setLoading(false));
  }, [loadBoards]);

  // Load board when selected
  useEffect(() => {
    if (selectedBoardId) {
      loadBoardData(selectedBoardId);
    }
  }, [selectedBoardId, loadBoardData]);

  // ========== BOARD ACTIONS ==========

  const handleCreateBoard = async () => {
    try {
      const result = await apiCall('createBoard', {
        name: 'Uusi Board',
        description: '',
        userId: user?.id
      });

      if (result.success) {
        await loadBoards();
        setSelectedBoardId(result.board.id);
      }
    } catch (err) {
      console.error('Failed to create board:', err);
      setError('Boardin luonti epäonnistui');
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!confirm('Haluatko varmasti poistaa tämän boardin?')) return;

    try {
      await apiCall('deleteBoard', { boardId });
      await loadBoards();

      if (selectedBoardId === boardId) {
        setSelectedBoardId(boards.find(b => b.id !== boardId)?.id || null);
      }
    } catch (err) {
      console.error('Failed to delete board:', err);
      setError('Boardin poisto epäonnistui');
    }
  };

  const handleUpdateBoard = async (boardId, updates) => {
    try {
      await apiCall('updateBoard', { boardId, ...updates });
      await loadBoards();
      if (selectedBoardId === boardId) {
        await loadBoardData(boardId);
      }
    } catch (err) {
      console.error('Failed to update board:', err);
    }
  };

  // ========== GROUP ACTIONS ==========

  const handleCreateGroup = async () => {
    if (!selectedBoardId) return;

    try {
      const result = await apiCall('createGroup', {
        boardId: selectedBoardId,
        title: 'Uusi ryhmä'
      });

      if (result.success) {
        await loadBoardData(selectedBoardId);
      }
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const handleUpdateGroup = async (groupId, updates) => {
    try {
      await apiCall('updateGroup', { groupId, ...updates });
      await loadBoardData(selectedBoardId);
    } catch (err) {
      console.error('Failed to update group:', err);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await apiCall('deleteGroup', { groupId });
      await loadBoardData(selectedBoardId);
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  };

  // ========== COLUMN ACTIONS ==========

  const handleCreateColumn = async (type = 'text') => {
    if (!selectedBoardId) return;

    const columnNames = {
      text: 'Teksti',
      status: 'Status',
      date: 'Päivämäärä',
      number: 'Numero',
      person: 'Henkilö'
    };

    try {
      const result = await apiCall('createColumn', {
        boardId: selectedBoardId,
        title: columnNames[type] || 'Uusi sarake',
        type
      });

      if (result.success) {
        await loadBoardData(selectedBoardId);
      }
    } catch (err) {
      console.error('Failed to create column:', err);
    }
  };

  const handleUpdateColumn = async (columnId, updates) => {
    try {
      await apiCall('updateColumn', { columnId, ...updates });
      await loadBoardData(selectedBoardId);
    } catch (err) {
      console.error('Failed to update column:', err);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    try {
      await apiCall('deleteColumn', { columnId });
      await loadBoardData(selectedBoardId);
    } catch (err) {
      console.error('Failed to delete column:', err);
    }
  };

  // ========== ITEM ACTIONS ==========

  const handleCreateItem = async (groupId) => {
    if (!selectedBoardId || !groupId) return;

    try {
      const result = await apiCall('createItem', {
        boardId: selectedBoardId,
        groupId,
        name: 'Uusi item',
        userId: user?.id
      });

      if (result.success) {
        await loadBoardData(selectedBoardId);
      }
    } catch (err) {
      console.error('Failed to create item:', err);
    }
  };

  const handleUpdateItem = async (itemId, updates) => {
    try {
      await apiCall('updateItem', { itemId, ...updates });
      await loadBoardData(selectedBoardId);
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await apiCall('deleteItem', { itemId });
      await loadBoardData(selectedBoardId);
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // ========== RENDER ==========

  return (
    <div className="min-h-screen bg-[#1A1A2E] flex flex-col">
      {/* Header */}
      <header className="bg-[#0F0F1A] border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-2xl">🧠</span>
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              MasterMind
            </span>
            <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-medium rounded-full">
              BETA
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateBoard}
            className="px-4 py-2 bg-[#FF6B35] hover:bg-[#e5612f] text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Uusi Board
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <BoardSidebar
          boards={boards}
          selectedBoardId={selectedBoardId}
          onSelectBoard={setSelectedBoardId}
          onDeleteBoard={handleDeleteBoard}
          onUpdateBoard={handleUpdateBoard}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main area */}
        <main className="flex-1 overflow-auto">
          {error && (
            <div className="m-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-4 text-red-300 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {loading && !boardData ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !selectedBoardId ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <span className="text-6xl mb-4">📋</span>
              <p className="text-lg mb-4">Ei valittua boardia</p>
              <button
                onClick={handleCreateBoard}
                className="px-6 py-3 bg-[#FF6B35] hover:bg-[#e5612f] text-white font-medium rounded-lg transition-colors"
              >
                Luo ensimmäinen Board
              </button>
            </div>
          ) : boardData ? (
            <BoardTable
              board={boardData.board}
              columns={boardData.columns}
              groups={boardData.groups}
              items={boardData.items}
              onCreateGroup={handleCreateGroup}
              onUpdateGroup={handleUpdateGroup}
              onDeleteGroup={handleDeleteGroup}
              onCreateColumn={handleCreateColumn}
              onUpdateColumn={handleUpdateColumn}
              onDeleteColumn={handleDeleteColumn}
              onCreateItem={handleCreateItem}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default MasterMindApp;
