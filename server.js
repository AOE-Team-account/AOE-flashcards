const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-before-production';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || '*';
const STORE_PATH = path.join(__dirname, 'data', 'store.json');

app.use(cors({ origin: FRONTEND_ORIGIN === '*' ? true : FRONTEND_ORIGIN, credentials: false }));
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

function ensureStore() {
  if (!fs.existsSync(path.dirname(STORE_PATH))) {
    fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify({ users: [] }, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
}

function writeStore(data) {
  ensureStore();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
}

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    updatedAt: user.updatedAt || null
  };
}

function createToken(user) {
  return jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function isValidAppData(appData) {
  return !!appData && typeof appData === 'object' && Array.isArray(appData.decks) && typeof appData.globalSettings === 'object';
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || '');

    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const store = readStore();
    const existing = store.users.find((u) => normalizeUsername(u.username) === username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = Date.now();
    const user = {
      id: `u_${now}_${Math.random().toString(36).slice(2, 8)}`,
      username,
      passwordHash,
      appData: null,
      createdAt: now,
      updatedAt: now
    };

    store.users.push(user);
    writeStore(store);

    res.json({ token: createToken(user), username: user.username, user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || '');
    const store = readStore();
    const user = store.users.find((u) => normalizeUsername(u.username) === username);

    if (!user) {
      return res.status(401).json({ error: 'Wrong username or password.' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Wrong username or password.' });
    }

    res.json({ token: createToken(user), username: user.username, user: publicUser(user) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not log in.' });
  }
});

app.get('/api/sync', auth, (req, res) => {
  const store = readStore();
  const user = store.users.find((u) => u.id === req.auth.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  res.json({
    appData: user.appData || null,
    updatedAt: user.updatedAt || null,
    username: user.username
  });
});

app.post('/api/sync', auth, (req, res) => {
  const appData = req.body.appData;
  if (!isValidAppData(appData)) {
    return res.status(400).json({ error: 'Invalid app data.' });
  }

  const store = readStore();
  const user = store.users.find((u) => u.id === req.auth.userId);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  user.appData = appData;
  user.updatedAt = Date.now();
  writeStore(store);

  res.json({ ok: true, updatedAt: user.updatedAt });
});

app.listen(PORT, () => {
  ensureStore();
  console.log(`AOE backend running on http://localhost:${PORT}`);
});
