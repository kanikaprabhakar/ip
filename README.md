# StudyRoom — Full-Stack Collaborative Study Platform

A modern, premium web application for virtual collaborative studying using the MERN stack with real-time features powered by Socket.io.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account
- Firebase project
- Anthropic API key

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Update .env with your credentials
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
cp .env.example .env
# Update .env with your credentials
npm start
```

## 📋 Features

### Authentication
- Google OAuth via Firebase Authentication
- Secure Bearer token validation on protected routes
- User profile persistence in MongoDB

### Room System
- Create rooms with unique 6-character alphanumeric codes
- Public/private room settings
- Real-time member presence tracking
- Subject tagging and room discovery

### Real-Time Collaboration (Socket.io)
- **Presence**: User join/leave events with live member lists
- **Pomodoro Timer**: Server-authoritative timer synced across all members
- **Tasks**: Real-time to-do list with add/delete/toggle
- **Reactions**: Emoji reactions (🔥 🔥 💪 👏 🚀)
- **Reconnection**: Automatic state recovery on disconnect

### Pomodoro Timer
- 25-min focus / 5-min break cycles (customizable)
- Animated SVG stroke-dashoffset circle progress
- Server-side state management
- Automatic session logging

### To-Do List
- Personal task tracking visible to all room members
- Real-time broadcast of changes
- Task persistence per session

### Ambient Audio
- 4 tracks: Lo-fi music, Rain, Café noise, White noise
- Individual volume sliders
- Layerable sounds with Howler.js
- Persistent within study session

### AI Study Buddy
- Floating chat panel powered by Anthropic Claude
- Context-aware academic assistance
- Streaming responses
- Typing indicators

### Leaderboard
- Weekly focus minutes ranking
- Real-time updates
- Top 50 users displayed
- Weekly reset capability

### UI/UX
- **Dark Theme**: Deep backgrounds (#0a0a0f, #0f0f1a, #13131f)
- **Glass-morphism**: Backdrop blur with subtle rgba fills
- **Accent Colors**: Soft purple (#7c6fff) and teal (#00d4aa)
- **Typography**: Inter font, clean hierarchy
- **Animations**: Smooth transitions on all interactive elements
- **Premium Feel**: High-end SaaS + Notion + Lofi study aesthetics

## 📁 Project Structure

```
studyroom/
├── server/
│   ├── controllers/        # Business logic
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── services/          # Utilities (timer, leaderboard)
│   ├── socket/            # Socket.io handlers
│   ├── middleware/        # Firebase auth validation
│   ├── server.js          # Express app setup
│   └── package.json
│
└── client/
    ├── src/
    │   ├── components/     # React components
    │   ├── context/        # Auth & Room contexts
    │   ├── hooks/          # Custom hooks
    │   ├── services/       # API & Socket clients
    │   ├── App.jsx
    │   ├── index.jsx
    │   └── index.css
    ├── public/
    ├── package.json
    └── tailwind.config.js
```

## 🔧 Tech Stack

**Frontend:**
- React 18
- Tailwind CSS
- Socket.io Client
- Firebase Auth
- Howler.js
- Axios

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io
- Firebase Admin SDK
- Anthropic Claude API

## 📝 Environment Variables

### Server `.env`
```
MONGODB_URI=mongodb+srv://...
PORT=5000
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
ANTHROPIC_API_KEY=...
CLIENT_URL=http://localhost:3000
```

### Client `.env`
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
... (other Firebase config)
```

## 🌐 Deployment

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set environment variables
3. Deploy automatically on push

### Backend (Railway/Render)
1. Connect GitHub repo
2. Set environment variables
3. Configure MongoDB Atlas IP whitelist
4. Deploy with automatic restarts

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` — Register or update user
- `GET /api/auth/profile` — Get user profile (protected)

### Rooms
- `POST /api/rooms` — Create room (protected)
- `GET /api/rooms` — List public rooms
- `GET /api/rooms/code/:code` — Get room by code
- `POST /api/rooms/join/:code` — Join room (protected)

### Sessions
- `POST /api/sessions` — Create session (protected)
- `PUT /api/sessions/:id/end` — End session (protected)
- `GET /api/sessions/:id` — Get session

### Leaderboard
- `GET /api/leaderboard` — Get weekly rankings

### AI
- `POST /api/ai/chat` — Chat with Study Buddy

## 🔐 Security

- Firebase ID tokens validated on all protected routes
- CORS properly configured
- MongoDB connection pooling
- Rate limiting recommended for production
- XSS protection via React's default escaping

## 📱 Responsive Design

- Mobile-first Tailwind CSS
- Touch-friendly buttons and inputs
- Optimized layouts for tablets and desktops
- Floating action buttons repositioned on mobile

## 🎨 Design System

All components follow the premium dark theme aesthetic:
- Consistent spacing and padding
- Hover states with soft glow effects
- Loading states with spinners
- Error states with clear messaging
- Focus states for accessibility

## 🚀 Future Enhancements

- Video/audio call integration for group sessions
- Study resources library (books, notes, links)
- Session recording and playback
- Advanced analytics dashboard
- Mobile native apps
- Dark mode time-based auto-switching
- Notification system for study invites
- Calendar integration

## 📄 License

MIT

## 👥 Contributing

Contributions welcome! Please follow the existing code style and file structure.

---

Built with ❤️ for focused learners everywhere
