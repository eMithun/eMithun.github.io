// Secure API: Get projects from Vercel KV
const { kv } = require('@vercel/kv');

const defaultProjects = [
  { id: Date.now(), name: "CodeFX", description: "Modular multi-platform web framework", tags: ["Web", "Framework"], status: "live", version: "v1.0.0", githubUrl: "https://github.com/eMithun/CodeFX", trackingUrl: "", devices: ["Desktop", "Mobile"] },
  { id: Date.now() + 1, name: "Photography Portfolio", description: "Professional photography showcase", tags: ["Photography", "Portfolio"], status: "maintenance", version: "v2.1.0", githubUrl: "", trackingUrl: "", devices: ["Desktop", "Mobile", "Tablet"] },
  { id: Date.now() + 2, name: "Garden Shop", description: "Plant shop with fertilizer & tools", tags: ["E-Commerce", "Plants"], status: "offline", version: "v0.5.0", githubUrl: "", trackingUrl: "", devices: ["Desktop"] }
];

module.exports = async (req, res) => {
  // CORS headers (allow requests from your GitHub Pages domain)
  res.setHeader('Access-Control-Allow-Origin', 'https://emithun.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let projects = await kv.get('portfolio-projects');
    if (!projects) {
      // Initialize KV with default projects if empty
      await kv.set('portfolio-projects', JSON.stringify(defaultProjects));
      projects = defaultProjects;
    } else {
      projects = JSON.parse(projects);
    }
    res.status(200).json(projects);
  } catch (error) {
    console.error('Error getting projects:', error);
    // Fallback to default projects if KV fails
    res.status(200).json(defaultProjects);
  }
};
