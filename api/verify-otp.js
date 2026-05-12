import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone number and code are required' });
  }

  const { SUPABASE_URL, SUPABASE_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase env vars');
    return res.status(500).json({ error: 'Configuration Supabase manquante sur le serveur' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return res.status(400).json({ error: 'Code incorrect ou expiré' });
    }

    await supabase.from('otp_codes').delete().eq('id', data.id);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ error: error.message || 'Échec de la vérification' });
  }
}
