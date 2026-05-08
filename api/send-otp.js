const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
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

  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  try {
    // Générer un code OTP aléatoire (6 chiffres)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('Generated OTP:', otpCode, 'for phone:', phoneNumber);

    // Stocker le code dans Supabase avec expiration 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error: upsertError } = await supabase.from('otp_codes').upsert({
      phone_number: phoneNumber,
      code: otpCode,
      expires_at: expiresAt,
    }, { onConflict: 'phone_number' });

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      throw upsertError;
    }
    console.log('OTP stored successfully');

    // Envoyer le SMS via Twilio
    await twilioClient.messages.create({
      body: `Votre code de vérification Novi Finance est: ${otpCode}. Code à 6 chiffres. Valide pendant 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({
      error: 'Failed to send OTP',
      details: error.message,
    });
  }
}
