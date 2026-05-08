// Debug endpoint to retrieve OTP code from Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { phoneNumber } = req.query;

  if (!phoneNumber) {
    return res.status(400).json({ error: 'Phone number required' });
  }

  try {
    const { data, error } = await supabase
      .from('otp_codes')
      .select('code, expires_at')
      .eq('phone_number', phoneNumber)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'OTP not found', details: error?.message });
    }

    return res.status(200).json({
      phoneNumber,
      otpCode: data.code,
      expiresAt: data.expires_at,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
