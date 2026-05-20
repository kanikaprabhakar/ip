import axios from 'axios';

export const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !process.env.ANTHROPIC_API_KEY) {
      return res.status(400).json({ error: 'Message and API key required' });
    }

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: 'You are a helpful, concise study assistant. Answer academic questions clearly and briefly. Stay focused on the student\'s subject.',
        messages: [{ role: 'user', content: message }]
      },
      {
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        }
      }
    );

    const content = response.data.content[0]?.text || 'No response generated';
    res.json({ reply: content });
  } catch (error) {
    console.error('AI API error:', error.message);
    res.status(500).json({ error: 'Failed to get AI response', details: error.message });
  }
};

export default { chatWithAI };
