export default function handler(req, res) {
  const vars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER', 'SUPABASE_URL', 'SUPABASE_KEY'];
  const result = {};
  for (const v of vars) {
    const val = process.env[v];
    result[v] = val ? `SET (${val.length} chars, starts: ${val.slice(0, 6)}...)` : 'MISSING';
  }
  return res.status(200).json(result);
}
