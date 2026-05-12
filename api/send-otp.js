import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const client = twilio(accountSid, authToken);
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
        }

          const { phone } = req.body;

            if (!phone) {
                return res.status(400).json({ error: 'Phone number is required' });
                  }

                    try {
                        // Generate OTP
                            const otp = Math.floor(1000 + Math.random() * 9000).toString();

                                // Store OTP in SuperBase with TTL (10 minutes)
                                    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

                                            await supabase
                                                  .from('otp_codes')
                                                        .insert([
                                                                {
                                                                          phone,
                                                                                    code: otp,
                                                                                              expires_at: expiresAt,
                                                                                                      },
                                                                                                            ]);
                                                                                                            
                                                                                                                // Send OTP via Twilio
                                                                                                                    await client.messages.create({
                                                                                                                          body: `Votre code de vérification Novi Finance est: ${otp}`,
                                                                                                                                from: phoneNumber,
                                                                                                                                      to: phone,
                                                                                                                                          });
                                                                                                                                          
                                                                                                                                              return res.status(200).json({ success: true, message: 'OTP sent successfully' });
                                                                                                                                                } catch (error) {
                                                                                                                                                    console.error('Error sending OTP:', error);
                                                                                                                                                        return res.status(500).json({ error: 'Failed to send OTP' });
                                                                                                                                                          }
                                                                                                                                                          }
