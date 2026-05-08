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

  if (!phoneNumber || !otpCode || !firstName || !lastName || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Récupérer le code OTP stocké depuis Supabase
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('code, expires_at')
      .eq('phone_number', phoneNumber)
      .single();

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

    // OTP valide - créer le contact dans GHL
    const ghlResponse = await createContactInGHL({
      firstName,
      lastName,
      email,
      phone: phoneNumber,
    });

    if (!ghlResponse.success) {
      return res.status(500).json({ error: 'Failed to create contact in GHL' });
    }

    // Supprimer le code OTP après utilisation
    await supabase
      .from('otp_codes')
      .delete()
      .eq('phone_number', phoneNumber);

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

async function createContactInGHL({ firstName, lastName, email, phone }) {
  const ghlApiKey = process.env.GHL_API_KEY;
  const ghlLocationId = process.env.GHL_LOCATION_ID;

  if (!ghlApiKey || !ghlLocationId) {
    throw new Error('GHL credentials not configured');
  }

  try {
    const response = await fetch('https://services.leadconnectorhq.com/contacts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        phone,
        locationId: ghlLocationId,
        tags: ['lead-novi-finance', 'source-web-form'],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GHL API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      contactId: data.id,
    };
  } catch (error) {
    console.error('GHL API error:', error);
    throw error;
  }
}
