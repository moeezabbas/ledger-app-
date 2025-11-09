export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sheetId } = req.query;

  // Validate sheetId
  if (!sheetId || !/^[a-zA-Z0-9-_]{20,}$/.test(sheetId)) {
    return res.status(400).json({ error: 'Invalid sheet ID' });
  }

  try {
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=Balance%20Sheet`
    );
    
    if (!response.ok) {
      return res.status(400).json({ error: 'Sheet not accessible' });
    }
    
    const text = await response.text();
    
    // Validate response
    if (!text.includes('google.visualization.Query.setResponse')) {
      return res.status(400).json({ error: 'Invalid sheet format' });
    }

    res.status(200).json({ data: text });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch sheet data' });
  }
}
