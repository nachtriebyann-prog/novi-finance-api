// Test GHL API authentication methods
const ghlApiKey = 'pit-4ab029ba-29dd-4b60-bd32-ad6fef53f8dd';
const ghlLocationId = 'a5lPZ2GZOmR8PaeTDi7B';

async function testGHLAuthentication() {
  console.log('Testing GHL API Authentication Methods...\n');

  // Test data
  const testContact = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '+33757594907',
    locationId: ghlLocationId,
  };

  const endpoint = 'https://services.leadconnectorhq.com/contacts/';

  // Method 1: Bearer token (current method)
  console.log('Method 1: Bearer Token');
  console.log('Header: Authorization: Bearer <key>');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(testContact),
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n---\n');

  // Method 2: Api-Key header
  console.log('Method 2: Api-Key Header');
  console.log('Header: Authorization: Api-Key <key>');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${ghlApiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(testContact),
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n---\n');

  // Method 3: X-Api-Key header
  console.log('Method 3: X-Api-Key Header');
  console.log('Header: X-Api-Key: <key>');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Api-Key': ghlApiKey,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(testContact),
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n---\n');

  // Method 4: Simple API key without Bearer
  console.log('Method 4: No Bearer Prefix');
  console.log('Header: Authorization: <key>');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': ghlApiKey,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(testContact),
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testGHLAuthentication();
