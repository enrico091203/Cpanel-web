const { readJSON, writeJSON } = require('./_storage');

module.exports = async (req, res) => {
  const PTERO_ADMIN_API_KEY = process.env.PTERO_ADMIN_API_KEY || 'dummy_admin_key';
  const PTERO_DOMAIN = process.env.PTERO_DOMAIN || 'https://your-ptero-panel.com';
  const id = req.query.id || req.url.split('/').pop();
  try {
    await fetch(`${PTERO_DOMAIN}/api/application/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${PTERO_ADMIN_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    const admins = await readJSON('admins.json');
    const filtered = admins.filter(a => a.id != id);
    await writeJSON('admins.json', filtered);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete admin', detail: err.message });
  }
};
