import fetch from 'node-fetch';

const FREESOUND_BASE = 'https://freesound.org/apiv2';

export const searchFreesound = async (req, res) => {
  const q = req.query.q || '';
  const page_size = parseInt(req.query.page_size || '10', 10);

  const apiKey = process.env.FREESOUND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'FREESOUND_API_KEY not configured on server' });
  }

  try {
    const url = `${FREESOUND_BASE}/search/text/?query=${encodeURIComponent(q)}&page_size=${page_size}`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Token ${apiKey}`
      }
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(resp.status).json({ error: 'Freesound API error', details: txt });
    }

    const data = await resp.json();

    // Map to useful fields (including preview URLs)
    const results = data.results.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      username: item.username,
      duration: item.duration,
      tags: item.tags,
      previews: item.previews, // contains preview-lq-mp3, preview-hq-mp3, etc.
      url: item.url
    }));

    res.json({ count: data.count, results });
  } catch (error) {
    console.error('searchFreesound error:', error);
    res.status(500).json({ error: error.message });
  }
};

export default { searchFreesound };
