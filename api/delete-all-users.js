
module.exports = async (req, res) => {
  const PTERO_API_KEY = process.env.PTERO_API_KEY || 'dummy_key';
  const PTERO_DOMAIN = process.env.PTERO_DOMAIN || 'https://your-ptero-panel.com';
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
  const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '';

  try {
    const fetchUsers = await fetch(`${PTERO_DOMAIN}/api/application/users`, {
      headers: { 'Authorization': `Bearer ${PTERO_API_KEY}`, 'Accept': 'application/json' }
    });
    const userData = await fetchUsers.json();
    let deletedCount = 0;
    if (userData && Array.isArray(userData.data)) {
      for (const user of userData.data) {
        if (user.attributes.email !== ADMIN_EMAIL && !user.attributes.root_admin) {
          try {
            await fetch(`${PTERO_DOMAIN}/api/application/users/${user.attributes.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${PTERO_API_KEY}`, 'Accept': 'application/json' }
            });
            deletedCount++;
          } catch (err) {
            console.error('Failed to delete user:', user.attributes.username);
          }
        }
      }
    }
    const { readJSON, writeJSON } = require('./_storage');
    let users = await readJSON('users.json');
    users = users.filter(u => u.email === ADMIN_EMAIL);
    await writeJSON('users.json', users);
    if (TELEGRAM_BOT_TOKEN && ADMIN_TELEGRAM_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: ADMIN_TELEGRAM_ID, text: `🗑️ Bulk Delete: ${deletedCount} users deleted` })
      });
    }
    res.json({ success: true, deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete users', detail: err.message });
  }
};
