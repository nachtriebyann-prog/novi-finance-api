import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

    const { phone, code } = req.body;

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone number and code are required' });
  }

    try {
          // Query SuperBase for the OTP code
      const { data, error } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .single();

      if (error || !data) {
        return res.status(400).json({ error: 'Invalid or expired OTP code' });
      }

            // Delete the OTP code after successful verification
            await supabase
        .from('otp_codes')
        .delete()
        .eq('id', data.id);

      return res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return res.status(500).json({ error: 'Failed to verify OTP' });
    }
}
