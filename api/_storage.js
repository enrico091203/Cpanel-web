
const fs = require('fs').promises;
const path = require('path');
const DATA_DIR = path.join(process.cwd(), '.data');

async function ensureDataDir(){
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch(e){}
}

async function readJSON(name){
  await ensureDataDir();
  const p = path.join(DATA_DIR, name);
  try {
    const txt = await fs.readFile(p, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (e) {
    await fs.writeFile(p, '[]', 'utf8');
    return [];
  }
}

async function writeJSON(name, data){
  await ensureDataDir();
  const p = path.join(DATA_DIR, name);
  await fs.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readJSON, writeJSON };
