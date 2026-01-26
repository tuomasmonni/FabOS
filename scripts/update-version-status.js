// ============================================================================
// UPDATE VERSION STATUS
// ============================================================================
// Päivittää version statuksen Supabasessa koodin generoinnin jälkeen

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const versionId = process.env.VERSION_ID;
  const success = process.env.SUCCESS === 'true';

  if (!supabaseUrl || !supabaseServiceKey || !versionId) {
    console.log('Missing environment variables, skipping status update');
    return;
  }

  console.log('Updating version status...');
  console.log('Version ID:', versionId);
  console.log('Success:', success);

  try {
    const newStatus = success ? 'deployed' : 'failed';

    const response = await fetch(`${supabaseUrl}/rest/v1/versions?id=eq.${versionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        deployment_status: newStatus,
        deployed_at: success ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to update status:', response.status, errorText);
      process.exit(1);
    }

    console.log(`Version status updated to: ${newStatus}`);

  } catch (error) {
    console.error('Error updating version status:', error);
    process.exit(1);
  }
}

main();
