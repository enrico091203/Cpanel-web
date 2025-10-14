
module.exports = async (req, res) => {
  const PTERO_API_KEY = process.env.PTERO_API_KEY || 'dummy_key';
  const PTERO_DOMAIN = process.env.PTERO_DOMAIN || 'https://your-ptero-panel.com';
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
  const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '';
  try {
    const fetchServers = await fetch(`${PTERO_DOMAIN}/api/application/servers`, {
      headers: { 'Authorization': `Bearer ${PTERO_API_KEY}`, 'Accept': 'application/json' }
    });
    const serverData = await fetchServers.json();
    let deletedCount = 0;
    if (serverData && Array.isArray(serverData.data)) {
      for (const server of serverData.data) {
        try {
          const userRes = await fetch(`${PTERO_DOMAIN}/api/application/users/${server.attributes.user}`, {
            headers: { 'Authorization': `Bearer ${PTERO_API_KEY}`, 'Accept': 'application/json' }
          });
          const userData = await userRes.json();
          if (userData && userData.attributes && userData.attributes.email !== (process.env.ADMIN_EMAIL || 'admin@example.com') && !userData.attributes.root_admin) {
            await fetch(`${PTERO_DOMAIN}/api/application/servers/${server.attributes.id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${PTERO_API_KEY}`, 'Accept': 'application/json' }
            });
            deletedCount++;
          }
        } catch (err) {
          console.error('Failed to delete server:', server.attributes.id);
        }
      }
    }
    const { writeJSON } = require('./_storage');
    await writeJSON('servers.json', []);
    if (TELEGRAM_BOT_TOKEN && ADMIN_TELEGRAM_ID) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: ADMIN_TELEGRAM_ID, text: `🗑️ Bulk Delete: ${deletedCount} servers deleted` })
      });
    }
    res.json({ success: true, deletedCount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete servers', detail: err.message });
  }
};
