// Test Vercel API function
module.exports = (req, res) => {
  res.json({
    message: 'Vercel API is working!',
    timestamp: new Date().toISOString()
  });
};
