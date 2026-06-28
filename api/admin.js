// Secure API: Admin only for saving projects (password-protected!)
const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check password from Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const password = authHeader.substring(7);
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Invalid password' });
  }

  // Save projects to KV
  try {
    const { projects } = req.body;
    await kv.set('portfolio-projects', JSON.stringify(projects));
    res.status(200).json({ message: 'Projects saved successfully!' });
  } catch (error) {
    console.error('Error saving projects:', error);
    res.status(500).json({ error: 'Failed to save projects' });
  }
};
