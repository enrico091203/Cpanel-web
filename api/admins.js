
module.exports = async (req, res) => {
  const PTERO_ADMIN_API_KEY = process.env.PTERO_ADMIN_API_KEY || 'dummy_admin_key';
  const PTERO_DOMAIN = process.env.PTERO_DOMAIN || 'https://your-ptero-panel.com';
  try {
    const fetchUsers = await fetch(`${PTERO_DOMAIN}/api/application/users`, {
      headers: {
        'Authorization': `Bearer ${PTERO_ADMIN_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const userData = await fetchUsers.json();
    if (!userData || !Array.isArray(userData.data)) {
      return res.status(400).json({ error: 'Invalid admin response' });
    }
    const admins = userData.data
      .filter(u => u.attributes.root_admin === true && u.attributes.username)
      .map(u => ({
        id: u.attributes.id,
        username: u.attributes.username.trim()
      }));
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admins', detail: err.message });
  }
};
