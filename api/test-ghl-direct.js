// Direct test of GHL API from Vercel environment
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Log environment variables (masked for security)
  const ghlApiKey = process.env.GHL_API_KEY;
  const ghlLocationId = process.env.GHL_LOCATION_ID;

  console.log('=== GHL Diagnostic Test ===');
  console.log('API Key exists:', !!ghlApiKey);
  console.log('API Key length:', ghlApiKey ? ghlApiKey.length : 0);
  console.log('API Key first 10 chars:', ghlApiKey ? ghlApiKey.substring(0, 10) : 'NOT SET');
  console.log('Location ID:', ghlLocationId);
  console.log('---');

  try {
    const testContact = {
      firstName: 'Test',
      lastName: 'Diagnostic',
      email: 'test@example.com',
      phone: '+33757594907',
      locationId: ghlLocationId,
      tags: ['diagnostic'],
    };

    console.log('Making GHL API request with:');
    console.log('- API Key prefix:', ghlApiKey ? ghlApiKey.substring(0, 20) + '...' : 'MISSING');
    console.log('- Location ID:', ghlLocationId);
    console.log('- Endpoint: https://services.leadconnectorhq.com/contacts/');

    const response = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(testContact),
    });

    console.log('Response status:', response.status);

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    return res.status(200).json({
      success: true,
      diagnostics: {
        ghlApiKeyExists: !!ghlApiKey,
        ghlApiKeyLength: ghlApiKey ? ghlApiKey.length : 0,
        ghlLocationId,
        responseStatus: response.status,
        responseOk: response.ok,
      },
      ghlResponse: data,
    });
  } catch (error) {
    console.error('Error during GHL test:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
