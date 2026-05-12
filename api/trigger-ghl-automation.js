import axios from 'axios';

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = process.env.GHL_LOCATION_ID;
const GHL_API_URL = 'https://rest.gohighlevel.com/v1';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
    }

  const { contactId, workflowId } = req.body;

  if (!contactId || !workflowId) {
        return res.status(400).json({ error: 'Contact ID and Workflow ID are required' });
  }

  try {
        // Trigger GHL automation workflow
      const response = await axios.post(
              `${GHL_API_URL}/contacts/${contactId}/workflow/${workflowId}`,
        {},
        {
                  headers: {
                              Authorization: `Bearer ${GHL_API_KEY}`,
                              'Content-Type': 'application/json',
                  },
        }
            );

      return res.status(200).json({ 
                                        success: true, 
              message: 'Workflow triggered successfully',
              data: response.data
      });
  } catch (error) {
        console.error('Error triggering GHL workflow:', error.response?.data || error.message);

      // If workflow is already triggered or contact not found, return success
      if (error.response?.status === 404 || error.response?.status === 409) {
              return res.status(200).json({ 
                                                  success: true, 
                        message: 'Workflow trigger completed',
                        note: error.response?.data?.message || 'Contact or workflow not found'
              });
      }

      return res.status(500).json({ error: 'Failed to trigger workflow' });
  }
}
