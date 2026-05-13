import axios from 'axios';

const GHL_BASE = 'https://services.leadconnectorhq.com';
const GHL_VERSION = '2021-07-28';

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
  } = req.body;

  const isIneligible = taxrange === 'Moins de 2 000 € / an' && patrimoine_range === 'Moins de 20 000 €';
  if (isIneligible) {
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
      tags: ["bilan-novi"],
    };

    if (contactId) {
      await axios.put(`${GHL_BASE}/contacts/${contactId}`, contactData, { headers });
    } else {
      const createRes = await axios.post(`${GHL_BASE}/contacts/`, contactData, { headers });
      contactId = createRes.data?.contact?.id;
    }

    console.log('GHL contact upserted:', contactId);
    return res.status(200).json({ success: true, eligible: true, contactId });
  } catch (error) {
    console.error('GHL error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to create/update contact',
      details: error.response?.data,
    });
  }
}
