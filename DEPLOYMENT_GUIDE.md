# Matchly — Real-Time Dating & Chat App

A premium, modern dating and social matching platform built with **Node.js** and **vanilla JavaScript**. Users sign up with email OTP, create profiles, and chat with real people in real-time.

## Features

✨ **Email OTP Login** — Secure, passwordless authentication  
👥 **Real User Profiles** — Create profiles with avatar, age, location, bio  
💬 **Person-to-Person Chat** — Message real users with persistent chat history  
🟢 **Online Status** — See who's online and available  
📱 **Responsive Design** — Works on desktop, tablet, and mobile  
💾 **Persistent Data** — User profiles and messages saved to JSON files  

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Data:** JSON-based file storage (easily swappable with MongoDB/PostgreSQL)
- **Email:** Nodemailer (OTP delivery)

## Quick Start

### 1. Clone or Download

```bash
git clone https://github.com/YOUR_USERNAME/matchly.git
cd matchly
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure SMTP (Optional)

For real email delivery, set environment variables:

```bash
export SMTP_HOST=smtp.gmail.com
export SMTP_PORT=587
export SMTP_USER=your-email@gmail.com
export SMTP_PASS=your-app-password
export EMAIL_FROM=noreply@matchly.com
```

**Without SMTP:** OTP codes are logged to the console for testing.

### 4. Start the Server

```bash
npm start
```

Server runs on **http://localhost:8000**

### 5. Test the App

1. Open http://localhost:8000
2. Click **"Get Started — Login"**
3. Enter any email (e.g., `alice@example.com`)
4. Click **"Send OTP"** → Check console for the code
5. Paste the code and click **"Verify & Login"**
6. Create your profile (name, age, avatar, bio, location)
7. You're now on the Dashboard — see other users and start chatting!

## Project Structure

```
modern-dating/
├── public/
│   ├── index.html          # Landing page
│   ├── login.html          # Email OTP login
│   ├── profile.html        # Profile creation
│   ├── dashboard.html      # Chat & matching
│   ├── styles.css          # Premium CSS
├── data/                   # Persistent JSON data
│   ├── users.json          # User profiles
│   ├── messages.json       # Chat messages
├── server.js               # Express backend
├── package.json            # Dependencies
├── README.md               # This file
```

## API Endpoints

### Authentication
- `POST /api/send-otp` — Send OTP to email
- `POST /api/verify-otp` — Verify code and get session token

### User Profiles
- `POST /api/create-profile` — Create/update user profile
- `GET /api/profile-exists` — Check if profile exists
- `GET /api/profiles` — Get list of online users
- `POST /api/set-online` — Mark user as online

### Messaging
- `POST /api/send-message` — Send a message
- `GET /api/messages` — Fetch conversation history

## Deployment

### Deploy to Heroku

```bash
heroku create your-matchly-app
git push heroku main
```

Set environment variables on Heroku:
```bash
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASS=your-password
```

### Deploy to Replit

1. Upload files to Replit
2. Install dependencies: `npm install`
3. Run: `npm start`
4. Replit generates a public URL automatically

### Deploy to Vercel (Serverless)

Vercel requires modifications for serverless functions. Consider Heroku or Railway for this app.

## File Storage

By default, user data is stored in `/data/users.json` and `/data/messages.json`:

```json
{
  "alice@example.com": {
    "createdAt": "2026-02-04T...",
    "profile": {
      "name": "Alice",
      "age": 25,
      "avatar": "👩",
      "city": "New York",
      "bio": "Love hiking!",
      "gender": "Female"
    }
  }
}
```

**To use a real database (MongoDB/PostgreSQL):**
1. Install the database driver (`npm install mongodb`)
2. Replace JSON file reads/writes in `server.js` with database queries

## Environment Variables

```env
PORT=8000                          # Server port (default: 8000)
SMTP_HOST=smtp.gmail.com           # Email SMTP server
SMTP_PORT=587                      # SMTP port
SMTP_USER=your-email@gmail.com     # SMTP username
SMTP_PASS=your-app-password        # SMTP password
EMAIL_FROM=noreply@matchly.com     # Sender email
```

## Development

### Run with nodemon (auto-restart on changes)

```bash
npm run dev
```

### Debugging

Server logs appear in the terminal:
- OTP codes (when SMTP not configured)
- API request logs
- Error messages

## Production Checklist

- [ ] Set up proper SMTP for email delivery
- [ ] Use a real database (MongoDB, PostgreSQL)
- [ ] Add rate limiting to prevent OTP spam
- [ ] Implement CAPTCHA for signup
- [ ] Use HTTPS/SSL certificate
- [ ] Add user moderation and reporting
- [ ] Implement JWT tokens for session management
- [ ] Add email verification
- [ ] Set up logging and monitoring

## Troubleshooting

**"No OTP for this email yet"**
- Ensure you've clicked "Send OTP" first

**Messages not persisting across server restarts**
- Data is stored in `/data/` folder. Check file permissions.

**SMTP errors**
- Check SMTP credentials
- Allow "Less secure apps" in Gmail settings (if using Gmail)
- Use App Passwords instead of regular password

## Future Enhancements

🔄 **Real-time Chat** — WebSocket support for instant messages  
🖼️ **Image Upload** — Profile photos and chat images  
❤️ **Matching Algorithm** — Smart compatibility scoring  
📍 **Location-based Matching** — Find users nearby  
🔔 **Push Notifications** — Mobile app version  
💳 **Premium Features** — Unlimited likes, message boost  

## License

MIT License — Feel free to modify and deploy!

## Support

Have questions? Open an issue on GitHub or contact: support@matchly.com

---

**Made with ❤️ by Matchly Team** | Deploy today and start connecting!
