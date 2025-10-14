
module.exports = async (req, res) => {
  const { readJSON } = require('./_storage');
  const PTERO_API_KEY = process.env.PTERO_API_KEY || 'dummy_key';
  const PTERO_DOMAIN = process.env.PTERO_DOMAIN || 'https://your-ptero-panel.com';
  try {
    const fetchRes = await fetch(`${PTERO_DOMAIN}/api/application/servers`, {
      headers: {
        'Authorization': `Bearer ${PTERO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const serverData = await fetchRes.json();
    if (!serverData || !Array.isArray(serverData.data)) {
      return res.status(400).json({ error: 'Invalid server response' });
    }
    const localServers = await readJSON('servers.json');
    const serversWithAge = serverData.data.map(srv => {
      const localServer = localServers.find(s => s.pterodactylId == srv.attributes.id);
      const createdAt = localServer ? new Date(localServer.createdAt) : new Date();
      const age = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...srv.attributes,
        age,
        username: localServer ? localServer.username : 'Unknown'
      };
    });
    res.json(serversWithAge);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch servers', detail: err.message });
  }
};
