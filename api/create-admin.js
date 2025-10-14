
module.exports = async (req, res) => {
  const { readJSON, writeJSON } = require('./_storage');
  const body = req.method === 'POST' ? req.body : {};
  const { username, email } = body;
  const password = username + Math.floor(Math.random() * 10000);

  const PTERO_DOMAIN = process.env.PTERO_DOMAIN || 'https://your-ptero-panel.com';
  const PTERO_ADMIN_API_KEY = process.env.PTERO_ADMIN_API_KEY || 'dummy_admin_key';
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
  const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || '';

  try {
    const userRes = await fetch(`${PTERO_DOMAIN}/api/application/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PTERO_ADMIN_API_KEY}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        email,
        username,
        first_name: username,
        last_name: 'Admin',
        password,
        language: 'en',
        root_admin: true
      })
    });

    const userData = await userRes.json();
    if (!userRes.ok || userData.errors) {
      return res.json({ error: userData.errors?.[0]?.detail || 'Failed to create admin' });
    }

    const admins = await readJSON('admins.json');
    admins.push({
      id: userData.attributes.id,
      username,
      email,
      password,
      createdAt: new Date().toISOString()
    });
    await writeJSON('admins.json', admins);

    const telegramMessage = `👑 <b>New Admin Created!</b>

📊 <b>Admin Details:</b>
🌐 Panel URL: ${PTERO_DOMAIN}
👤 Username: <code>${username}</code>
🔑 Password: <code>${password}</code>
📧 Email: ${email}

🎉 Admin account ready!`;

    if (ADMIN_TELEGRAM_ID && TELEGRAM_BOT_TOKEN) {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: ADMIN_TELEGRAM_ID, text: telegramMessage, parse_mode: 'HTML' })
      });
    }

    res.json({ username, password, panel_url: PTERO_DOMAIN });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create admin', detail: err.message });
  }
};
