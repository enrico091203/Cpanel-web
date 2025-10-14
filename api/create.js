
module.exports = async (req, res) => {
  const { readJSON, writeJSON } = require('./_storage');
  const body = req.method === 'POST' ? req.body : {};
  const { username, email, ram, disk, cpu, telegramId } = body;
  const password = username + Math.floor(Math.random() * 10000);
  const name = username + '-server';

  const PTERO_API_KEY = process.env.PTERO_API_KEY || 'dummy_key';
  const PTERO_DOMAIN = process.env.PTERO_DOMAIN || 'https://your-ptero-panel.com';
  const PTERO_NEST_ID = process.env.PTERO_NEST_ID || '5';
  const PTERO_EGG_ID = process.env.PTERO_EGG_ID || '15';
  const PTERO_LOCATION = process.env.PTERO_LOCATION || '1';
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
  const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '';

  try {
    const userRes = await fetch(`${PTERO_DOMAIN}/api/application/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PTERO_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: 'User',
        password,
        language: 'en'
      })
    });

    const userData = await userRes.json();
    if (userData.errors) return res.json({ error: userData.errors[0].detail });

    const userId = userData.attributes.id;

    const eggData = await fetch(`${PTERO_DOMAIN}/api/application/nests/${PTERO_NEST_ID}/eggs/${PTERO_EGG_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PTERO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const eggJson = await eggData.json();
    const startup = eggJson.attributes.startup;

    const serverRes = await fetch(`${PTERO_DOMAIN}/api/application/servers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PTERO_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        user: userId,
        egg: parseInt(PTERO_EGG_ID),
        docker_image: eggJson.attributes.docker_image,
        startup,
        environment: {
          INST: 'npm',
          USER_UPLOAD: '0',
          AUTO_UPDATE: '0',
          CMD_RUN: 'npm start'
        },
        limits: {
          memory: ram,
          swap: 0,
          disk: typeof disk !== 'undefined' ? disk : ram,
          io: 500,
          cpu: cpu ?? 100
        },
        feature_limits: {
          databases: 5,
          backups: 5,
          allocations: 5
        },
        deploy: {
          locations: [parseInt(PTERO_LOCATION)],
          dedicated_ip: false,
          port_range: []
        }
      })
    });

    let serverData;
    try {
      serverData = await serverRes.json();
    } catch (e) {
      const text = await serverRes.text();
      return res.status(500).json({
        error: 'Failed parsing JSON from server creation',
        detail: text || e.message
      });
    }

    if (serverData.errors) {
      return res.json({ error: serverData.errors[0].detail });
    }

    const servers = await readJSON('servers.json');
    const users = await readJSON('users.json');

    const serverObj = {
      id: serverData.attributes.id,
      name,
      username,
      pterodactylId: serverData.attributes.id,
      status: 'stopped',
      ram,
      disk: disk || ram,
      cpu: cpu || 100,
      createdAt: new Date().toISOString(),
      userId
    };
    servers.push(serverObj);

    const userObj = {
      id: userId,
      username,
      email,
      password,
      telegramId,
      createdAt: new Date().toISOString()
    };
    users.push(userObj);

    await writeJSON('servers.json', servers);
    await writeJSON('users.json', users);

    const telegramMessage = `🆕 <b>New Panel Created!</b>

📊 <b>Panel Details:</b>
🌐 Domain: ${PTERO_DOMAIN}
👤 Username: <code>${username}</code>
🔑 Password: <code>${password}</code>
📧 Email: ${email}
🖥️ Server ID: ${serverData.attributes.id}
💾 RAM: ${ram}MB
💿 Disk: ${disk || ram}MB
⚡ CPU: ${cpu || 100}%

🎉 Panel siap digunakan!`;

    if (telegramId && TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramId, text: telegramMessage, parse_mode: 'HTML' })
      });
    }

    if (ADMIN_TELEGRAM_ID && TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: ADMIN_TELEGRAM_ID, text: telegramMessage, parse_mode: 'HTML' })
      });
    }

    return res.json({
      username,
      password,
      email,
      panel_url: PTERO_DOMAIN,
      server_id: serverData.attributes.id
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create panel', detail: err.message });
  }
};
