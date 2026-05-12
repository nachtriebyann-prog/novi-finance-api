import axios from 'axios';

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_URL = 'https://rest.gohighlevel.com/v1';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
}

  const {
    fullName,
          email,
          phone,
          age_range,
          family_status,
          taxrange,
          patrimoine_range,
          objective_target,
          rgpdConsent,
      } = req.body;

  // Check eligibility
  const isIneligible = taxrange === 'Moins de 2 000 € / an' && patrimoine_range === 'Moins de 20 000 €';
  if (isIneligible) {
    return res.status(200).json({ 
            success: false, 
            eligible: false,
            message: 'Contact is not eligible for our services' 
  });
  }

  try {
    // Parse full name into first and last name
    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';

    // Prepare custom fields mapping
    const customFields = [
{ id: 'age_range', value: age_range },
      { id: 'family_status', value: family_status },
      { id: 'taxrange', value: taxrange },
      { id: 'patrimoine_range', value: patrimoine_range },
      { id: 'objective_target', value: objective_target },
          ];

    // Try to get existing contact by phone
    let contactId = null;
    try {
      const searchRes = await axios.get(`${GHL_API_URL}/contacts/search`, {
                params: {
          locationId: GHL_LOCATION_ID,
                      phone: phone,
            },
                    headers: {
          Authorization: `Bearer ${GHL_API_KEY}`,
            },
                });

      if (searchRes.data && searchRes.data.contacts && searchRes.data.contacts.length > 0) {
        contactId = searchRes.data.contacts[0].id;
      }
      } catch (searchError) {
              console.log('Contact search failed, will create new:', searchError.message);
    }

    let response;
    if (contactId) {
      // Update existing contact
      response = await axios.put(
                `${GHL_API_URL}/contacts/${contactId}`,
        {
                  firstName,
                  lastName,
                  email,
                  phone,
                  locationId: GHL_LOCATION_ID,
                  customFields,
        },
        {
                  headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
              },
              }
                    );
                  } else {
      // Create new contact
      response = await axios.post(
                `${GHL_API_URL}/contacts`,
        {
                  firstName,
                  lastName,
                  email,
                  phone,
                  locationId: GHL_LOCATION_ID,
                  customFields,
        },
        {
                  headers: {
            Authorization: `Bearer ${GHL_API_KEY}`,
              },
              }
                    );
      contactId = response.data.contact.id;
                  }

    return res.status(200).json({ 
            success: true, 
            eligible: true,
            contactId: contactId,
            message: 'Contact created/updated successfully' 
      });
      } catch (error) {
            console.error('Error creating/updating GHL contact:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to create/update contact' });
                  }
      }
