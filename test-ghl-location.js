// Test GHL API with the exact credentials from .env.local
const ghlApiKey = 'pit-4ab029ba-29dd-4b60-bd32-ad6fef53f8dd';
const ghlLocationId = 'a5lPZ2GZOmR8PaeTDi7B';

async function testGHLWithLocation() {
  console.log('Testing GHL API with location ID...');
  console.log('Location ID:', ghlLocationId);
  console.log('API Key:', ghlApiKey);
  console.log('---\n');

  const testContact = {
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '+33757594907',
    locationId: ghlLocationId,
    tags: ['test', 'verification'],
  };

  try {
    const response = await fetch('https://services.leadconnectorhq.com/contacts/', {
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

    if (response.ok) {
      console.log('\n✓ Success! Contact created with ID:', data.contact.id);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testGHLWithLocation();
