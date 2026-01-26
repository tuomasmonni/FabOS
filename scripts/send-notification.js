// ============================================================================
// SEND EMAIL NOTIFICATION
// ============================================================================
// Lähettää sähköposti-ilmoituksen käyttäjälle kun koodi on päivitetty
// Käyttää Resend API:a

async function main() {
  const resendApiKey = process.env.RESEND_API_KEY;
  const userEmail = process.env.USER_EMAIL;
  const versionName = process.env.VERSION_NAME;
  const versionId = process.env.VERSION_ID;
  const success = process.env.SUCCESS === 'true';
  const deployUrl = process.env.DEPLOY_URL || 'https://levykauppa.vercel.app';

  if (!resendApiKey) {
    console.log('RESEND_API_KEY not set, skipping email notification');
    return;
  }

  if (!userEmail) {
    console.log('No user email provided, skipping notification');
    return;
  }

  console.log('Sending email notification...');
  console.log('To:', userEmail);
  console.log('Version:', versionName);
  console.log('Success:', success);

  const subject = success
    ? `FabOS: Versiosi "${versionName}" on nyt käytettävissä!`
    : `FabOS: Virhe version "${versionName}" päivityksessä`;

  const htmlContent = success
    ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #FF6B35, #e5612f); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #FF6B35; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .success-icon { font-size: 48px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">&#x2714;</div>
      <h1>Versiosi on valmis!</h1>
    </div>
    <div class="content">
      <p>Hei!</p>
      <p>Versiosi <strong>"${versionName}"</strong> on nyt generoitu ja otettu käyttöön FabOS-alustalla.</p>
      <p>Muutokset ovat automaattisesti deployattu tuotantoympäristöön ja ovat heti testattavissa.</p>
      <a href="${deployUrl}?version=v03" class="button">Testaa nyt &rarr;</a>
      <p style="margin-top: 30px; color: #666; font-size: 14px;">
        Jos kohtaat ongelmia tai haluat tehdä lisämuutoksia, voit aloittaa uuden keskustelun AI-assistentin kanssa.
      </p>
    </div>
    <div class="footer">
      <p>FabOS - Valmistuksen tulevaisuus</p>
      <p style="font-size: 12px; color: #999;">Tämä on automaattinen viesti. Älä vastaa tähän sähköpostiin.</p>
    </div>
  </div>
</body>
</html>
`
    : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .content { background: #f7f7f7; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: #FF6B35; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
    .error-icon { font-size: 48px; margin-bottom: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="error-icon">&#x26A0;</div>
      <h1>Virhe päivityksessä</h1>
    </div>
    <div class="content">
      <p>Hei!</p>
      <p>Valitettavasti version <strong>"${versionName}"</strong> automaattinen generointi ei onnistunut.</p>
      <p>Tämä voi johtua esimerkiksi:</p>
      <ul>
        <li>Pyydetyt muutokset olivat liian monimutkaisia</li>
        <li>Koodin generoinnissa tapahtui tekninen virhe</li>
        <li>Konfliktit olemassa olevan koodin kanssa</li>
      </ul>
      <p>Voit yrittää uudelleen yksinkertaisemmalla pyynnöllä tai ottaa yhteyttä tukeen.</p>
      <a href="${deployUrl}?version=v03" class="button">Yritä uudelleen</a>
    </div>
    <div class="footer">
      <p>FabOS - Valmistuksen tulevaisuus</p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'FabOS <noreply@fabos.fi>',
        to: [userEmail],
        subject: subject,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to send email:', response.status, errorData);
      // Don't exit with error - email is not critical
      return;
    }

    const result = await response.json();
    console.log('Email sent successfully:', result.id);

  } catch (error) {
    console.error('Error sending email:', error);
    // Don't exit with error - email is not critical
  }
}

main();
