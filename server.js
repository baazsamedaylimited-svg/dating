const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize data files if they don't exist
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify({}));
}
if (!fs.existsSync(MESSAGES_FILE)) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));
}

// In-memory stores
const otps = new Map();
const onlineUsers = new Map(); // { email: { name, avatar, lastSeen } }
const profiles = [];

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function getTransporter() {
  // Use SMTP if configured, otherwise use a stub that logs
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Fallback transporter that logs the message (no email sent)
  return {
    sendMail: async (mailOptions) => {
      console.log('--- Mock email send ---');
      console.log(mailOptions);
      console.log('--- End mock ---');
      return Promise.resolve();
    }
  };
}

app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email' });
  }

  const code = generateOTP();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otps.set(email, { code, expiresAt });

  const transporter = await getTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'noreply@dating.example',
    to: email,
    subject: 'Your login code',
    text: `Your login code is: ${code} (valid for 5 minutes)`
  };

  try {
    await transporter.sendMail(mailOptions);
    return res.json({ success: true, message: 'OTP sent (check email or console)' });
  } catch (err) {
    console.error('Mail error', err);
    return res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

app.post('/api/verify-otp', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ success: false, message: 'Missing fields' });

  const record = otps.get(email);
  if (!record) return res.status(400).json({ success: false, message: 'No OTP requested for this email' });

  if (Date.now() > record.expiresAt) {
    otps.delete(email);
    return res.status(400).json({ success: false, message: 'OTP expired' });
  }

  if (record.code !== code) return res.status(400).json({ success: false, message: 'Invalid OTP' });

  // OTP valid — create a simple session token for demo (in production use JWT or server sessions)
  otps.delete(email);
  const demoToken = Buffer.from(`${email}:${Date.now()}`).toString('base64');
  return res.json({ success: true, token: demoToken, message: 'Logged in (demo token)' });
});

// DEBUG route for local testing: returns OTP for an email (do NOT use in production)
app.get('/debug/otp', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ success: false, message: 'Missing email' });
  const record = otps.get(email);
  if (!record) return res.json({ success: false, message: 'No OTP for this email' });
  return res.json({ success: true, email, code: record.code, expiresAt: record.expiresAt });
});

// Get random profiles excluding the current user
app.get('/api/profiles', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ success: false, message: 'Missing email' });
  
  // Read users from file
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  const currentGender = users[email]?.profile?.gender || '';

  const candidates = Object.entries(users)
    .filter(([userEmail]) => userEmail !== email && users[userEmail].profile)
    .map(([userEmail, user]) => ({
      email: userEmail,
      name: user.profile.name,
      age: user.profile.age,
      avatar: user.profile.avatar,
      city: user.profile.city,
      gender: user.profile.gender || '',
      status: onlineUsers.has(userEmail) ? 'Online' : 'Offline'
    }));

  // Prioritize: online first, then opposite gender, then randomize within groups
  function scoreProfile(p) {
    let score = 0;
    if (p.status === 'Online') score += 100;
    // prefer opposite gender when currentGender is Male/Female
    if ((currentGender === 'Male' && p.gender === 'Female') || (currentGender === 'Female' && p.gender === 'Male')) {
      score += 50;
    }
    // small random to shuffle within same score
    score += Math.random();
    return score;
  }

  const allProfiles = candidates.sort((a, b) => scoreProfile(b) - scoreProfile(a));

  return res.json({ success: true, profiles: allProfiles });
});

// Get messages between two users
app.get('/api/messages', (req, res) => {
  const { from, with: withUser } = req.query;
  if (!from || !withUser) return res.status(400).json({ success: false, message: 'Missing parameters' });
  
  const allMessages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  const conversation = allMessages.filter(m => 
    (m.from === from && m.to === withUser) || (m.from === withUser && m.to === from)
  );
  
  return res.json({ success: true, messages: conversation });
});

// Send a message
app.post('/api/send-message', (req, res) => {
  const { from, to, text } = req.body;
  if (!from || !to || !text) return res.status(400).json({ success: false, message: 'Missing fields' });
  
  const allMessages = JSON.parse(fs.readFileSync(MESSAGES_FILE, 'utf8'));
  allMessages.push({
    from,
    to,
    text,
    time: new Date().toISOString()
  });
  
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(allMessages, null, 2));
  return res.json({ success: true, message: 'Message sent' });
});

// Create or update user profile
app.post('/api/create-profile', (req, res) => {
  const { email, name, age, avatar, city, bio, gender } = req.body;
  if (!email || !name || !age) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  users[email] = {
    createdAt: users[email]?.createdAt || new Date().toISOString(),
    profile: {
      name,
      age: parseInt(age),
      avatar,
      city: city || '',
      bio: bio || '',
      gender: gender || ''
    }
  };
  
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  onlineUsers.set(email, { name, avatar, lastSeen: new Date().toISOString() });
  
  return res.json({ success: true, message: 'Profile created' });
});

// Check if profile exists
app.get('/api/profile-exists', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ success: false });
  
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  const exists = !!users[email]?.profile;
  return res.json({ success: true, exists });
});

// Mark user as online
app.post('/api/set-online', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false });
  
  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  if (users[email]?.profile) {
    onlineUsers.set(email, {
      name: users[email].profile.name,
      avatar: users[email].profile.avatar,
      lastSeen: new Date().toISOString()
    });
  }
  
  return res.json({ success: true });
});

// Find a match for a given email: prefer online + opposite gender
app.get('/api/find-match', (req, res) => {
  const email = req.query.email;
  if (!email) return res.status(400).json({ success: false, message: 'Missing email' });

  const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  const current = users[email];
  const currentGender = current?.profile?.gender || '';

  const candidates = Object.entries(users)
    .filter(([userEmail]) => userEmail !== email && users[userEmail].profile)
    .map(([userEmail, user]) => ({
      email: userEmail,
      name: user.profile.name,
      gender: user.profile.gender || '',
      status: onlineUsers.has(userEmail) ? 'Online' : 'Offline'
    }));

  if (candidates.length === 0) return res.json({ success: false, message: 'No matches available' });

  // Score: online + opposite gender
  candidates.sort((a, b) => {
    const score = (p) => (p.status === 'Online' ? 100 : 0) + ((currentGender === 'Male' && p.gender === 'Female') || (currentGender === 'Female' && p.gender === 'Male') ? 50 : 0) + Math.random();
    return score(b) - score(a);
  });

  return res.json({ success: true, match: candidates[0] });
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
