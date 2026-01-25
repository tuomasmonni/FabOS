// ============================================================================
// SUPABASE CLIENT
// ============================================================================
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Running in demo mode.');
}

// Pää-client auth-toiminnoille
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Erillinen client tietokanta-operaatioille (ei auth-häiriöitä)
// Tämä estää auth session checkin AbortError:ien vaikuttamasta data-operaatioihin
export const supabaseData = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  : null;

// ============================================================================
// DEMO MODE - Käytetään kun Supabase ei ole konfiguroitu
// ============================================================================
const demoVersions = [
  {
    id: 'demo-stable-1',
    module_id: 'pipe-bending',
    name: 'Perusversio',
    description: 'Alkuperäinen putkentaivutusmoduuli kaikilla perustoiminnoilla.',
    version_number: '1.0.0',
    version_type: 'stable',
    author_name: 'Levykauppa Team',
    votes_up: 45,
    votes_down: 2,
    view_count: 1250,
    test_count: 89,
    created_at: '2025-01-01T00:00:00Z',
    config: {
      version: '1.0.0',
      features: {
        '3dVisualization': true,
        multipleBends: true,
        maxBends: 10
      }
    }
  },
  {
    id: 'demo-exp-1',
    module_id: 'pipe-bending',
    name: 'Lisätty DXF-vienti',
    description: 'Mahdollistaa taivutusmallin viemisen DXF-tiedostona CAD-ohjelmiin.',
    version_number: '1.1.0-alpha',
    version_type: 'experimental',
    author_name: 'Matti M.',
    votes_up: 23,
    votes_down: 1,
    view_count: 156,
    test_count: 34,
    created_at: '2025-01-20T10:30:00Z',
    config: {
      version: '1.1.0-alpha',
      features: {
        '3dVisualization': true,
        exportDXF: true,
        multipleBends: true,
        maxBends: 10
      }
    }
  },
  {
    id: 'demo-exp-2',
    module_id: 'pipe-bending',
    name: 'Automaattinen kierto',
    description: ' 3D-malli pyörii automaattisesti esikatsellessa.',
    version_number: '1.0.1-beta',
    version_type: 'experimental',
    author_name: 'Liisa K.',
    votes_up: 15,
    votes_down: 5,
    view_count: 87,
    test_count: 12,
    created_at: '2025-01-22T14:15:00Z',
    config: {
      version: '1.0.1-beta',
      features: {
        '3dVisualization': true,
        multipleBends: true,
        maxBends: 10
      },
      ui: {
        autoRotate: true,
        rotateSpeed: 0.5
      }
    }
  },
  {
    id: 'demo-exp-3',
    module_id: 'pipe-bending',
    name: 'Enemmän taivutuksia',
    description: 'Nostettu maksimitaivutusten määrä 10:stä 20:een monimutkaisempia putkia varten.',
    version_number: '1.0.2-alpha',
    version_type: 'experimental',
    author_name: 'Antti P.',
    votes_up: 31,
    votes_down: 0,
    view_count: 203,
    test_count: 45,
    created_at: '2025-01-24T09:00:00Z',
    config: {
      version: '1.0.2-alpha',
      features: {
        '3dVisualization': true,
        multipleBends: true,
        maxBends: 20
      }
    }
  }
];

// ============================================================================
// API FUNCTIONS
// ============================================================================

// Hae moduulin tiedot
export async function getModule(moduleId) {
  if (!supabase) {
    return {
      id: 'pipe-bending',
      name: 'Putkentaivutus',
      description: 'Taivuta putkia 3D-visualisoinnilla',
      icon: '🔧',
      base_config: demoVersions[0].config
    };
  }

  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .eq('id', moduleId)
    .single();

  if (error) throw error;
  return data;
}

// Hae moduulin versiot
export async function getVersions(moduleId, filter = 'all') {
  if (!supabaseData) {
    if (filter === 'all') return demoVersions;
    return demoVersions.filter(v => v.version_type === filter);
  }

  let query = supabaseData
    .from('versions')
    .select('*')
    .eq('module_id', moduleId)
    .order('created_at', { ascending: false });

  if (filter !== 'all') {
    query = query.eq('version_type', filter);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Hae yksittäinen versio
export async function getVersion(versionId) {
  if (!supabaseData) {
    return demoVersions.find(v => v.id === versionId) || demoVersions[0];
  }

  const { data, error } = await supabaseData
    .from('versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (error) throw error;
  return data;
}

// Luo uusi versio
export async function createVersion(versionData) {
  if (!supabaseData) {
    const newVersion = {
      id: `demo-new-${Date.now()}`,
      ...versionData,
      votes_up: 0,
      votes_down: 0,
      view_count: 0,
      test_count: 0,
      created_at: new Date().toISOString()
    };
    demoVersions.push(newVersion);
    return newVersion;
  }

  // Käytetään supabaseData-clientia joka ei tee auth session -tarkistuksia
  // Tämä estää AbortError:it jotka tulevat auth-systeemistä
  const { data, error } = await supabaseData
    .from('versions')
    .insert(versionData)
    .select()
    .single();

  if (error) {
    console.error('Version creation database error:', error);
    throw error;
  }

  return data;
}

// Äänestä versiota
export async function voteVersion(versionId, voteType, userFingerprint) {
  if (!supabaseData) {
    const version = demoVersions.find(v => v.id === versionId);
    if (version) {
      if (voteType === 'up') version.votes_up++;
      else version.votes_down++;
    }
    return { success: true };
  }

  const { data, error } = await supabaseData
    .from('votes')
    .insert({
      version_id: versionId,
      vote_type: voteType,
      user_fingerprint: userFingerprint
    });

  if (error) {
    if (error.code === '23505') {
      // Duplicate - käyttäjä on jo äänestänyt
      return { success: false, message: 'Olet jo äänestänyt tätä versiota' };
    }
    throw error;
  }
  return { success: true };
}

// Kasvata katselukertoja
export async function incrementViewCount(versionId) {
  if (!supabaseData) {
    const version = demoVersions.find(v => v.id === versionId);
    if (version) version.view_count++;
    return;
  }

  await supabaseData.rpc('increment_view_count', { version_id: versionId });
}

// Kasvata testikertoja
export async function incrementTestCount(versionId) {
  if (!supabaseData) {
    const version = demoVersions.find(v => v.id === versionId);
    if (version) version.test_count++;
    return;
  }

  await supabaseData.rpc('increment_test_count', { version_id: versionId });
}

// ============================================================================
// CONVERSATION API
// ============================================================================

// Luo uusi keskustelu
export async function createConversation(moduleId, userFingerprint) {
  if (!supabaseData) {
    return { id: `demo-conv-${Date.now()}`, module_id: moduleId };
  }

  const { data, error } = await supabaseData
    .from('conversations')
    .insert({
      module_id: moduleId,
      user_fingerprint: userFingerprint
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Lisää viesti keskusteluun
export async function addMessage(conversationId, role, content, proposedConfig = null) {
  if (!supabaseData) {
    return { id: `demo-msg-${Date.now()}`, role, content, proposed_config: proposedConfig };
  }

  const { data, error } = await supabaseData
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      proposed_config: proposedConfig
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Hae keskustelun viestit
export async function getConversationMessages(conversationId) {
  if (!supabaseData) {
    return [];
  }

  const { data, error } = await supabaseData
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// ============================================================================
// FINGERPRINT - Tunnista anonyymit käyttäjät
// ============================================================================
export function generateFingerprint() {
  // Yksinkertainen fingerprint - tuotannossa käytä FingerprintJS:ää
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('fingerprint', 2, 2);

  const data = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'fp_' + Math.abs(hash).toString(36);
}
