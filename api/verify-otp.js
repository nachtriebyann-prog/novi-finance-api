const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

module.exports = async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phoneNumber, otpCode, firstName, lastName, email } = req.body;

  console.log('=== OTP Verification Request ===');
  console.log('Phone:', phoneNumber);
  console.log('OTP Code:', otpCode);
  console.log('First Name:', firstName);
  console.log('Last Name:', lastName);
  console.log('Email:', email);
  console.log('All fields present:', !(!phoneNumber || !otpCode || !firstName || !lastName || !email));

  if (!phoneNumber || !otpCode || !firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Récupérer le code OTP stocké depuis Supabase
    console.log('Verifying OTP for phone:', phoneNumber);
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('code, expires_at')
      .eq('phone_number', phoneNumber)
      .single();

    console.log('OTP Record found:', !!otpRecord, 'Error:', fetchError);
    if (fetchError) console.log('Fetch error details:', fetchError);

    if (fetchError || !otpRecord) {
      return res.status(400).json({ error: 'OTP expired or invalid' });
    }

    // Vérifier si l'OTP a expiré
    if (new Date(otpRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'OTP expired or invalid' });
    }

    if (otpRecord.code !== otpCode) {
      return res.status(400).json({ error: 'Invalid OTP code' });
    }

    // OTP valide - créer ou mettre à jour le contact dans GHL
    console.log('OTP verified successfully, creating or updating contact in GHL');
    const ghlResponse = await createOrUpdateContactInGHL({
      firstName,
      lastName,
      email,
      phone: phoneNumber,
    });

    console.log('GHL Response:', ghlResponse);

    if (!ghlResponse.success) {
      console.error('GHL contact creation failed');
      return res.status(500).json({ error: 'Failed to create contact in GHL' });
    }

    // Supprimer le code OTP après utilisation
    console.log('Deleting OTP code from Supabase');
    const { error: deleteError } = await supabase
      .from('otp_codes')
      .delete()
      .eq('phone_number', phoneNumber);

    if (deleteError) {
      console.error('Error deleting OTP code:', deleteError);
      // Don't fail the request, OTP is already verified
    } else {
      console.log('OTP code deleted successfully');
    }

    console.log('Returning success response');
    return res.status(200).json({
      success: true,
      message: 'Contact created successfully',
      contactId: ghlResponse.contactId,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({
      error: 'Failed to verify OTP',
      details: error.message,
    });
  }
}

async function createOrUpdateContactInGHL({ firstName, lastName, email, phone }) {
  const ghlApiKey = process.env.GHL_API_KEY;
  const ghlLocationId = process.env.GHL_LOCATION_ID;

  console.log('=== GHL Contact Creation/Update ===');
  console.log('API Key exists:', !!ghlApiKey);
  console.log('Location ID:', ghlLocationId);

  if (!ghlApiKey || !ghlLocationId) {
    throw new Error('GHL credentials not configured');
  }

  try {
    // First, try to find existing contact by email
    console.log('Searching for existing contact by email:', email);
    const searchResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/?query=${encodeURIComponent(email)}&locationId=${ghlLocationId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
      }
    );

    let existingContactId = null;

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('Search response:', searchData);

      if (searchData.contacts && searchData.contacts.length > 0) {
        existingContactId = searchData.contacts[0].id;
        console.log('Found existing contact:', existingContactId);
      }
    }

    const payload = {
      firstName,
      lastName,
      email,
      phone,
      locationId: ghlLocationId,
      tags: ['lead-novi-finance', 'source-web-form'],
    };

    let response;
    let method;
    let url;

    if (existingContactId) {
      // Update existing contact
      console.log('Updating existing contact:', existingContactId);
      method = 'PUT';
      url = `https://services.leadconnectorhq.com/contacts/${existingContactId}`;
    } else {
      // Create new contact
      console.log('Creating new contact');
      method = 'POST';
      url = 'https://services.leadconnectorhq.com/contacts/';
    }

    console.log(`${method} request to:`, url);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    response = await fetch(url, {
      method: method,
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Content-Type': 'application/json',
        'Version': '2021-07-28',
      },
      body: JSON.stringify(payload),
    });

    console.log('GHL Response Status:', response.status);
    console.log('GHL Response OK:', response.ok);

    const data = await response.json();
    console.log('GHL Response Data:', JSON.stringify(data, null, 2));

    // Handle 400 error for duplicate contacts - this is OK, contact already exists
    if (response.status === 400 && data.message && data.message.includes('duplicated contacts')) {
      console.log('Contact already exists (duplicate error) - this is OK');
      return {
        success: true,
        contactId: null,
        isDuplicate: true,
      };
    }

    if (!response.ok) {
      console.error('GHL API Error - Not OK:', data);
      throw new Error(`GHL API error (${response.status}): ${data.message || data.error || response.statusText}`);
    }

    const contactId = data.id || existingContactId;

    return {
      success: true,
      contactId: contactId,
      isUpdate: !!existingContactId,
    };
  } catch (error) {
    console.error('GHL API error:', error);
    throw error;
  }
}
