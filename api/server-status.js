
module.exports = async (req, res) => {
  const { readJSON } = require('./_storage');
  const PTERO_API_KEY = process.env.PTERO_API_KEY || 'dummy_key';
  const PTERO_DOMAIN = process.env.PTERO_DOMAIN || 'https://your-ptero-panel.com';
  try {
    const fetchServers = await fetch(`${PTERO_DOMAIN}/api/application/servers`, {
      headers: { 'Authorization': `Bearer ${PTERO_API_KEY}`, 'Accept': 'application/json' }
    });
    const serverData = await fetchServers.json();
    if (!serverData || !Array.isArray(serverData.data)) {
      return res.json({ activeServers: 0, stoppedServers: 0, servers: [] });
    }
    const serverStatus = [];
    let activeCount = 0;
    let stoppedCount = 0;
    const localServers = await readJSON('servers.json');
    for (const server of serverData.data) {
      try {
        const statusRes = await fetch(`${PTERO_DOMAIN}/api/client/servers/${server.attributes.identifier}`, {
          headers: { 'Authorization': `Bearer ${PTERO_API_KEY}`, 'Accept': 'application/json' }
        });
        const status = await statusRes.json();
        const isRunning = status.attributes?.current_state === 'running';
        if (isRunning) activeCount++; else stoppedCount++;
        const localServer = localServers.find(s => s.pterodactylId == server.attributes.id);
        const age = localServer ? Math.floor((Date.now() - new Date(localServer.createdAt).getTime()) / (1000*60*60*24)) : 0;
        serverStatus.push({
          id: server.attributes.id,
          name: server.attributes.name,
          status: isRunning ? 'running' : 'stopped',
          age,
          username: localServer ? localServer.username : 'Unknown'
        });
        if (age >= 30 && process.env.TELEGRAM_BOT_TOKEN && process.env.ADMIN_TELEGRAM_ID) {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: process.env.ADMIN_TELEGRAM_ID, text: `⚠️ Server \"${server.attributes.name}\" is ${age} days old and should be reviewed for deletion.` })
          });
        }
      } catch (err) {
        stoppedCount++;
        serverStatus.push({
          id: server.attributes.id,
          name: server.attributes.name,
          status: 'unknown',
          age: 0,
          username: 'Unknown'
        });
      }
    }
    res.json({ activeServers: activeCount, stoppedServers: stoppedCount, servers: serverStatus });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get server status', detail: err.message });
  }
};
