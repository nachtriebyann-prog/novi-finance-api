import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

function sanitizeTag(prefix, value) {
  if (!value) return null;
  const clean = String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return clean ? `${prefix}-${clean}` : null;
}

// Best-effort insert into novi_leads. Never throws — lead capture must not
// break contact creation. Returns true/false for logging only.
async function recordLead(payload) {
  const { SUPABASE_URL, SUPABASE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn('[lead] Supabase env missing, skipping novi_leads insert');
    return false;
  }
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await supabase.from('novi_leads').insert([payload]);
    if (error) { console.warn('[lead] insert error:', error.message); return false; }
    return true;
  } catch (e) {
    console.warn('[lead] insert threw:', e.message);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { GHL_API_KEY, GHL_LOCATION_ID } = process.env;
  if (!GHL_API_KEY || !GHL_LOCATION_ID) {
    console.error('Missing GHL env vars');
    return res.status(500).json({ error: 'Configuration GHL manquante' });
  }

  const {
    fullName, email, phone,
    age_range, family_status, taxrange,
    patrimoine_range, objective_target,
    tracking,
  } = req.body;

  // Origine pub (lead_id + UTM/fbclid), capté côté navigateur dès la landing.
  const t = tracking || {};
  const leadBase = {
    lead_id: t.lead_id || null,
    full_name: fullName || null,
    email: email || null,
    phone: phone || null,
    utm_source: t.utm_source || null,
    utm_medium: t.utm_medium || null,
    utm_campaign: t.utm_campaign || null,
    utm_content: t.utm_content || null,
    utm_term: t.utm_term || null,
    fbclid: t.fbclid || null,
    gclid: t.gclid || null,
    referrer: t.referrer || null,
    age_range: age_range || null,
    family_status: family_status || null,
    taxrange: taxrange || null,
    patrimoine_range: patrimoine_range || null,
    objective_target: objective_target || null,
    landing_at: t.landing_at || null,
  };

  const isIneligible = taxrange === 'Moins de 2 000 € / an' && patrimoine_range === 'Moins de 20 000 €';
  if (isIneligible) {
    // On enregistre quand même le lead (il a coûté de la pub) pour le CPL/attribution.
    await recordLead({ ...leadBase, eligible: false, ghl_contact_id: null });
    return res.status(200).json({ success: false, eligible: false });
  }

  const headers = {
    Authorization: `Bearer ${GHL_API_KEY}`,
    Version: GHL_VERSION,
    'Content-Type': 'application/json',
  };

  try {
    const nameParts = (fullName || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const customFields = [
      { key: 'age_range', field_value: age_range },
      { key: 'family_status', field_value: family_status },
      { key: 'taxrange', field_value: taxrange },
      { key: 'patrimoine_range', field_value: patrimoine_range },
      { key: 'objective_target', field_value: objective_target },
    ];

    // Tags d'origine pub (free-form, toujours acceptés par GHL) → visibilité CRM
    const tags = ['bilan-novi'];
    const srcTag = sanitizeTag('src', t.utm_source);
    const campTag = sanitizeTag('camp', t.utm_campaign);
    if (srcTag) tags.push(srcTag);
    if (campTag) tags.push(campTag);

    // Search for existing contact by phone
    let contactId = null;
    try {
      const searchRes = await axios.get(`${GHL_BASE}/contacts/`, {
        params: { locationId: GHL_LOCATION_ID, query: phone, limit: 1 },
        headers,
      });
      const contacts = searchRes.data?.contacts || [];
      if (contacts.length > 0) contactId = contacts[0].id;
    } catch (searchErr) {
      console.log('Search failed, will create new contact:', searchErr.message);
    }

    const contactData = {
      firstName,
      lastName,
      email,
      phone,
      locationId: GHL_LOCATION_ID,
      customFields,
      tags,
    };

    if (contactId) {
      await axios.put(`${GHL_BASE}/contacts/${contactId}`, contactData, { headers });
    } else {
      const createRes = await axios.post(`${GHL_BASE}/contacts/`, contactData, { headers });
      contactId = createRes.data?.contact?.id;
    }

    console.log('GHL contact upserted:', contactId);

    // Enregistre le lead avec son origine (best-effort, non bloquant)
    await recordLead({ ...leadBase, eligible: true, ghl_contact_id: contactId });

    return res.status(200).json({ success: true, eligible: true, contactId });
  } catch (error) {
    console.error('GHL error:', error.response?.data || error.message);
    // Même si GHL échoue, on garde la trace du lead côté Supabase.
    await recordLead({ ...leadBase, eligible: true, ghl_contact_id: null });
    return res.status(500).json({
      error: 'Failed to create/update contact',
      details: error.response?.data,
    });
  }
}
