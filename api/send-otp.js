import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, SUPABASE_URL, SUPABASE_KEY } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('Missing Twilio env vars');
    return res.status(500).json({ error: 'Configuration Twilio manquante sur le serveur' });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing Supabase env vars');
    return res.status(500).json({ error: 'Configuration Supabase manquante sur le serveur' });
  }

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase
      .from('otp_codes')
      .insert([{ phone, code: otp, expires_at: expiresAt }]);

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      return res.status(500).json({ error: 'Erreur base de données: ' + dbError.message });
    }

    await client.messages.create({
      body: `Votre code de vérification Novi Finance est: ${otp}`,
      from: TWILIO_PHONE_NUMBER,
      to: phone,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ error: error.message || 'Échec de l\'envoi du SMS' });
  }
}
