// Meta Conversions API (CAPI) - Track funnel events
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

  const { event_name, event_data, timestamp, variant } = req.body;

  console.log('=== Meta CAPI Event ===');
  console.log('Event Name:', event_name);
  console.log('Variant:', variant);
  console.log('Event Data:', JSON.stringify(event_data, null, 2));
  console.log('Timestamp:', timestamp);

  if (!event_name) {
    return res.status(400).json({ error: 'Missing event_name' });
  }

  try {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_CAPI_TOKEN;

    if (!pixelId || !accessToken) {
      console.warn('Meta CAPI credentials not configured - event logged locally only');
      return res.status(200).json({
        success: true,
        message: 'Event logged (CAPI not configured)',
        event: event_name,
      });
    }

    // Prepare event for Meta Conversions API
    const capiEvent = {
      event_name: mapEventName(event_name),
      event_time: Math.floor(new Date(timestamp).getTime() / 1000),
      event_id: `${Date.now()}_${variant}`, // Unique event ID for deduplication
      user_data: {
        // Email, phone, first name, last name would be hashed by Meta
        email: event_data.email || null,
        phone: event_data.phone || null,
        first_name: event_data.first_name || null,
        last_name: event_data.last_name || null,
      },
      custom_data: {
        variant: variant,
        ...event_data,
      },
    };

    console.log('Sending to Meta CAPI:', JSON.stringify(capiEvent, null, 2));

    // Send to Meta Conversions API
    const capiResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: [capiEvent],
          access_token: accessToken,
        }),
      }
    );

    const capiData = await capiResponse.json();
    console.log('Meta CAPI Response:', JSON.stringify(capiData, null, 2));

    if (!capiResponse.ok) {
      console.error('Meta CAPI Error:', capiData);
      // Log but don't fail the request
      return res.status(200).json({
        success: true,
        message: 'Event logged locally',
        capiError: capiData.error?.message || 'Unknown error',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Event sent to Meta CAPI',
      eventId: capiEvent.event_id,
      capiResponse: capiData,
    });
  } catch (error) {
    console.error('Meta tracking error:', error);
    return res.status(500).json({
      error: 'Failed to track event',
      details: error.message,
    });
  }
};

// Map funnel event names to Meta standard events
function mapEventName(eventName) {
  const eventMap = {
    'PageView': 'PageView',
    'QuestionAnswered': 'ViewContent',
    'OTPSent': 'InitiateCheckout', // Treat OTP as checkout initiation
    'OTPVerified': 'AddPaymentInfo',
    'FormSubmitted': 'Purchase', // Final conversion
  };

  return eventMap[eventName] || 'CustomEvent';
}
