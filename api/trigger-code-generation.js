// ============================================================================
// TRIGGER CODE GENERATION API
// ============================================================================
// POST /api/trigger-code-generation
// Triggeröi GitHub Actions workflown koodin generointiin

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const githubToken = process.env.GITHUB_PAT;
  const githubRepo = process.env.GITHUB_REPO || 'tuomasmonni/FabOS';

  if (!githubToken) {
    console.error('GITHUB_PAT not configured');
    return res.status(500).json({ error: 'GitHub token not configured' });
  }

  try {
    const {
      versionId,
      moduleId,
      versionName,
      userRequest,
      proposedChanges,
      userEmail
    } = req.body;

    if (!versionId || !moduleId || !userRequest) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Triggering code generation workflow...');
    console.log('Version ID:', versionId);
    console.log('Module ID:', moduleId);
    console.log('User email:', userEmail || 'not provided');

    // 1. Päivitä version status -> 'pending'
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/versions?id=eq.${versionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          deployment_status: 'pending',
          user_request: userRequest,
          creator_email: userEmail,
          updated_at: new Date().toISOString()
        })
      });
    }

    // 2. Triggeröi GitHub Actions workflow (repository_dispatch)
    const dispatchResponse = await fetch(
      `https://api.github.com/repos/${githubRepo}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${githubToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'generate-code',
          client_payload: {
            version_id: versionId,
            module_id: moduleId,
            version_name: versionName || 'AI-generoitu versio',
            user_request: userRequest,
            proposed_changes: JSON.stringify(proposedChanges || {}),
            user_email: userEmail || ''
          }
        })
      }
    );

    if (!dispatchResponse.ok) {
      const errorText = await dispatchResponse.text();
      console.error('GitHub dispatch failed:', dispatchResponse.status, errorText);

      // Päivitä status -> 'failed'
      if (supabaseUrl && supabaseKey) {
        await fetch(`${supabaseUrl}/rest/v1/versions?id=eq.${versionId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            deployment_status: 'failed',
            updated_at: new Date().toISOString()
          })
        });
      }

      return res.status(500).json({
        error: 'Failed to trigger workflow',
        details: errorText
      });
    }

    // 3. Päivitä status -> 'generating'
    if (supabaseUrl && supabaseKey) {
      await fetch(`${supabaseUrl}/rest/v1/versions?id=eq.${versionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          deployment_status: 'generating',
          updated_at: new Date().toISOString()
        })
      });
    }

    console.log('Workflow triggered successfully');

    return res.status(200).json({
      success: true,
      message: 'Code generation started',
      versionId,
      status: 'generating'
    });

  } catch (error) {
    console.error('Trigger error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
