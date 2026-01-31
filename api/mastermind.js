// ============================================================================
// MASTERMIND API - Vercel Serverless Endpoint
// Monday.com-tyylinen projektinhallinta FabOS:ssa
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, ...params } = req.method === 'GET' ? req.query : req.body;

    switch (action) {
      // ========== BOARDS ==========
      case 'getBoards':
        return await handleGetBoards(res);
      case 'getBoard':
        return await handleGetBoard(params.boardId, res);
      case 'createBoard':
        return await handleCreateBoard(params, res);
      case 'updateBoard':
        return await handleUpdateBoard(params, res);
      case 'deleteBoard':
        return await handleDeleteBoard(params.boardId, res);

      // ========== GROUPS ==========
      case 'getGroups':
        return await handleGetGroups(params.boardId, res);
      case 'createGroup':
        return await handleCreateGroup(params, res);
      case 'updateGroup':
        return await handleUpdateGroup(params, res);
      case 'deleteGroup':
        return await handleDeleteGroup(params.groupId, res);

      // ========== COLUMNS ==========
      case 'getColumns':
        return await handleGetColumns(params.boardId, res);
      case 'createColumn':
        return await handleCreateColumn(params, res);
      case 'updateColumn':
        return await handleUpdateColumn(params, res);
      case 'deleteColumn':
        return await handleDeleteColumn(params.columnId, res);

      // ========== ITEMS ==========
      case 'getItems':
        return await handleGetItems(params.boardId, res);
      case 'createItem':
        return await handleCreateItem(params, res);
      case 'updateItem':
        return await handleUpdateItem(params, res);
      case 'deleteItem':
        return await handleDeleteItem(params.itemId, res);

      // ========== FULL BOARD DATA ==========
      case 'getBoardFull':
        return await handleGetBoardFull(params.boardId, res);

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('MasterMind API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ============================================================================
// BOARDS HANDLERS
// ============================================================================

async function handleGetBoards(res) {
  const { data, error } = await supabase
    .from('mm_boards')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return res.status(200).json({ boards: data });
}

async function handleGetBoard(boardId, res) {
  const { data, error } = await supabase
    .from('mm_boards')
    .select('*')
    .eq('id', boardId)
    .single();

  if (error) throw error;
  return res.status(200).json({ board: data });
}

async function handleCreateBoard(params, res) {
  const { name, description, userId } = params;

  const { data, error } = await supabase
    .from('mm_boards')
    .insert({
      name,
      description,
      created_by: userId || null
    })
    .select()
    .single();

  if (error) throw error;

  // Luo oletusryhmä ja -sarakkeet
  await createDefaultGroupAndColumns(data.id);

  return res.status(200).json({ board: data, success: true });
}

async function handleUpdateBoard(params, res) {
  const { boardId, name, description } = params;

  const { data, error } = await supabase
    .from('mm_boards')
    .update({ name, description })
    .eq('id', boardId)
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json({ board: data, success: true });
}

async function handleDeleteBoard(boardId, res) {
  const { error } = await supabase
    .from('mm_boards')
    .delete()
    .eq('id', boardId);

  if (error) throw error;
  return res.status(200).json({ success: true });
}

// ============================================================================
// GROUPS HANDLERS
// ============================================================================

async function handleGetGroups(boardId, res) {
  const { data, error } = await supabase
    .from('mm_groups')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (error) throw error;
  return res.status(200).json({ groups: data });
}

async function handleCreateGroup(params, res) {
  const { boardId, title, color } = params;

  // Hae seuraava position
  const { data: existing } = await supabase
    .from('mm_groups')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from('mm_groups')
    .insert({
      board_id: boardId,
      title: title || 'Uusi ryhmä',
      color: color || '#6161FF',
      position: nextPosition
    })
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json({ group: data, success: true });
}

async function handleUpdateGroup(params, res) {
  const { groupId, title, color, collapsed, position } = params;

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (color !== undefined) updates.color = color;
  if (collapsed !== undefined) updates.collapsed = collapsed;
  if (position !== undefined) updates.position = position;

  const { data, error } = await supabase
    .from('mm_groups')
    .update(updates)
    .eq('id', groupId)
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json({ group: data, success: true });
}

async function handleDeleteGroup(groupId, res) {
  const { error } = await supabase
    .from('mm_groups')
    .delete()
    .eq('id', groupId);

  if (error) throw error;
  return res.status(200).json({ success: true });
}

// ============================================================================
// COLUMNS HANDLERS
// ============================================================================

async function handleGetColumns(boardId, res) {
  const { data, error } = await supabase
    .from('mm_columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (error) throw error;
  return res.status(200).json({ columns: data });
}

async function handleCreateColumn(params, res) {
  const { boardId, title, type, settings } = params;

  // Hae seuraava position
  const { data: existing } = await supabase
    .from('mm_columns')
    .select('position')
    .eq('board_id', boardId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from('mm_columns')
    .insert({
      board_id: boardId,
      title: title || 'Uusi sarake',
      type: type || 'text',
      settings: settings || getDefaultColumnSettings(type),
      position: nextPosition
    })
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json({ column: data, success: true });
}

async function handleUpdateColumn(params, res) {
  const { columnId, title, type, settings, position } = params;

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (type !== undefined) updates.type = type;
  if (settings !== undefined) updates.settings = settings;
  if (position !== undefined) updates.position = position;

  const { data, error } = await supabase
    .from('mm_columns')
    .update(updates)
    .eq('id', columnId)
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json({ column: data, success: true });
}

async function handleDeleteColumn(columnId, res) {
  const { error } = await supabase
    .from('mm_columns')
    .delete()
    .eq('id', columnId);

  if (error) throw error;
  return res.status(200).json({ success: true });
}

// ============================================================================
// ITEMS HANDLERS
// ============================================================================

async function handleGetItems(boardId, res) {
  const { data, error } = await supabase
    .from('mm_items')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (error) throw error;
  return res.status(200).json({ items: data });
}

async function handleCreateItem(params, res) {
  const { boardId, groupId, name, columnValues, userId } = params;

  // Hae seuraava position ryhmän sisällä
  const { data: existing } = await supabase
    .from('mm_items')
    .select('position')
    .eq('group_id', groupId)
    .order('position', { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const { data, error } = await supabase
    .from('mm_items')
    .insert({
      board_id: boardId,
      group_id: groupId,
      name: name || 'Uusi item',
      column_values: columnValues || {},
      position: nextPosition,
      created_by: userId || null
    })
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json({ item: data, success: true });
}

async function handleUpdateItem(params, res) {
  const { itemId, name, groupId, columnValues, position } = params;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (groupId !== undefined) updates.group_id = groupId;
  if (columnValues !== undefined) updates.column_values = columnValues;
  if (position !== undefined) updates.position = position;

  const { data, error } = await supabase
    .from('mm_items')
    .update(updates)
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return res.status(200).json({ item: data, success: true });
}

async function handleDeleteItem(itemId, res) {
  const { error } = await supabase
    .from('mm_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
  return res.status(200).json({ success: true });
}

// ============================================================================
// FULL BOARD DATA - Hae kaikki yhdellä kutsulla
// ============================================================================

async function handleGetBoardFull(boardId, res) {
  const [boardResult, columnsResult, groupsResult, itemsResult] = await Promise.all([
    supabase.from('mm_boards').select('*').eq('id', boardId).single(),
    supabase.from('mm_columns').select('*').eq('board_id', boardId).order('position'),
    supabase.from('mm_groups').select('*').eq('board_id', boardId).order('position'),
    supabase.from('mm_items').select('*').eq('board_id', boardId).order('position')
  ]);

  if (boardResult.error) throw boardResult.error;

  return res.status(200).json({
    board: boardResult.data,
    columns: columnsResult.data || [],
    groups: groupsResult.data || [],
    items: itemsResult.data || []
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function createDefaultGroupAndColumns(boardId) {
  // Luo oletusryhmä
  await supabase
    .from('mm_groups')
    .insert({
      board_id: boardId,
      title: 'Uudet',
      color: '#6161FF',
      position: 0
    });

  // Luo oletussarakkeet
  const defaultColumns = [
    { title: 'Status', type: 'status', position: 0, settings: getDefaultColumnSettings('status') },
    { title: 'Henkilö', type: 'person', position: 1, settings: {} },
    { title: 'Päivämäärä', type: 'date', position: 2, settings: {} }
  ];

  await supabase
    .from('mm_columns')
    .insert(defaultColumns.map(col => ({ ...col, board_id: boardId })));
}

function getDefaultColumnSettings(type) {
  switch (type) {
    case 'status':
      return {
        labels: [
          { id: 'working', name: 'Työn alla', color: '#fdab3d' },
          { id: 'done', name: 'Valmis', color: '#00c875' },
          { id: 'stuck', name: 'Jumissa', color: '#e2445c' },
          { id: 'pending', name: 'Odottaa', color: '#c4c4c4' }
        ]
      };
    case 'number':
      return { unit: '', decimals: 0 };
    default:
      return {};
  }
}
