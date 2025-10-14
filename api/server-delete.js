
module.exports = async (req, res) => {
  const { readJSON, writeJSON } = require('./_storage');
  const id = req.query.id || req.url.split('/').pop();
  const PTERO_API_KEY = process.env.PTERO_API_KEY || 'dummy_key';
  const PTERO_DOMAIN = process.env.PTERO_DOMAIN || 'https://your-ptero-panel.com';
  try {
    await fetch(`${PTERO_DOMAIN}/api/application/servers/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${PTERO_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    const servers = await readJSON('servers.json');
    const filtered = servers.filter(s => s.pterodactylId != id);
    await writeJSON('servers.json', filtered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete server', detail: err.message });
  }
};
