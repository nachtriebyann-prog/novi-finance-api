// Trigger GHL Automation on form completion
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
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

  const {
    firstName,
    lastName,
    email,
    phone,
    customFields = {},
    tags = [],
    variant = 'a',
  } = req.body;

  console.log('=== GHL Automation Trigger ===');
  console.log('Contact:', { firstName, lastName, email, phone });
  console.log('Variant:', variant);
  console.log('Tags:', tags);
  console.log('Custom Fields:', JSON.stringify(customFields, null, 2));

  if (!email || !firstName || !lastName) {
    return res.status(400).json({
      error: 'Missing required fields: firstName, lastName, email',
    });
  }

  try {
    const ghlApiKey = process.env.GHL_API_KEY;
    const ghlLocationId = process.env.GHL_LOCATION_ID;

    if (!ghlApiKey || !ghlLocationId) {
      throw new Error('GHL credentials not configured');
    }

    // First, find or create the contact in GHL
    console.log('Searching for contact:', email);
    const searchResponse = await fetch(
      `https://services.leadconnectorhq.com/contacts/?query=${encodeURIComponent(email)}&locationId=${ghlLocationId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ghlApiKey}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28',
        },
      }
    );

    let contactId = null;

    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      if (searchData.contacts && searchData.contacts.length > 0) {
        contactId = searchData.contacts[0].id;
        console.log('Found existing contact:', contactId);
      }
    }

    // If no contact found, create one
    if (!contactId) {
      console.log('Creating new contact');
      const createResponse = await fetch(
        'https://services.leadconnectorhq.com/contacts/',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            phone,
            locationId: ghlLocationId,
            tags: ['source:novi-finance-funnel', `variant:${variant}`, ...tags],
            customFields: customFields,
          }),
        }
      );

      const createData = await createResponse.json();

      if (!createResponse.ok) {
        // Handle duplicate contact
        if (createResponse.status === 400 && createData.message?.includes('duplicated')) {
          console.log('Duplicate contact detected, searching again');
          const retrySearch = await fetch(
            `https://services.leadconnectorhq.com/contacts/?query=${encodeURIComponent(phone || firstName)}&locationId=${ghlLocationId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${ghlApiKey}`,
                'Content-Type': 'application/json',
                'Version': '2021-07-28',
              },
            }
          );

          if (retrySearch.ok) {
            const retryData = await retrySearch.json();
            if (retryData.contacts && retryData.contacts.length > 0) {
              contactId = retryData.contacts[0].id;
            }
          }
        } else {
          throw new Error(`GHL API error: ${createData.message || createResponse.statusText}`);
        }
      } else {
        contactId = createData.id;
        console.log('Contact created:', contactId);
      }
    }

    // Now trigger the automation workflow
    if (contactId) {
      console.log('Triggering automation for contact:', contactId);

      // Get the automation ID from environment
      const automationId = process.env.GHL_AUTOMATION_ID;

      if (automationId) {
        // Trigger automation workflow
        const automationResponse = await fetch(
          `https://services.leadconnectorhq.com/contacts/${contactId}/workflow`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ghlApiKey}`,
              'Content-Type': 'application/json',
              'Version': '2021-07-28',
            },
            body: JSON.stringify({
              workflowId: automationId,
              contactId: contactId,
            }),
          }
        );

        const automationData = await automationResponse.json();
        console.log('Automation trigger response:', JSON.stringify(automationData, null, 2));

        if (!automationResponse.ok) {
          console.error('Automation trigger failed:', automationData);
          // Don't fail the whole request if automation trigger fails
        }
      } else {
        console.warn('GHL_AUTOMATION_ID not configured - automation not triggered');
      }

      // Update contact with custom fields and tags
      console.log('Updating contact with custom fields and tags');
      const updateResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Content-Type': 'application/json',
            'Version': '2021-07-28',
          },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            phone,
            tags: ['source:novi-finance-funnel', `variant:${variant}`, ...tags],
            customFields: customFields,
          }),
        }
      );

      const updateData = await updateResponse.json();
      console.log('Contact update response:', JSON.stringify(updateData, null, 2));

      if (!updateResponse.ok) {
        console.error('Update failed:', updateData);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Automation triggered successfully',
      contactId: contactId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error triggering automation:', error);
    return res.status(500).json({
      error: 'Failed to trigger automation',
      details: error.message,
    });
  }
};
