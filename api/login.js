
module.exports = async (req, res) => {
  const { readJSON } = require('./_storage');
  const body = req.method === 'POST' ? req.body : {};
  const username = body.username;
  const password = body.password;

  const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    return res.json({ success: true, user: { username: ADMIN_USERNAME, role: 'admin' } });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};
