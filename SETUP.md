# StudyRoom Setup Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier available)
- Firebase project (Google Cloud Console)
- Anthropic API key

## 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Google Authentication:
   - Authentication → Sign-in method → Google → Enable
4. Create a Web app and copy config
5. Generate service account key:
   - Project Settings → Service Accounts → Generate new private key

## 2. MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a cluster
4. Create a database user with strong password
5. Get connection string and add `?retryWrites=true&w=majority`
6. Add your IP to whitelist (or 0.0.0.0 for all)

## 3. Anthropic API

1. Visit [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Create an API key
4. Keep it secure

## 4. Backend Configuration

```bash
cd server
cp .env.example .env
```

Fill in `.env`:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/studyroom?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@project-id.iam.gserviceaccount.com
ANTHROPIC_API_KEY=sk-ant-...
CLIENT_URL=http://localhost:3000
```

Install and run:
```bash
npm install
npm run dev
```

Server should run on http://localhost:5000

## 5. Frontend Configuration

```bash
cd ../client
cp .env.example .env
```

Fill in `.env` with your Firebase web config:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=AIzaSy...
REACT_APP_FIREBASE_AUTH_DOMAIN=project-id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=project-id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123...
```

Install and run:
```bash
npm install
npm start
```

Frontend should run on http://localhost:3000

## 6. Using Docker (Optional)

```bash
# From root directory
docker-compose up -d
```

This starts MongoDB, Backend (port 5000), and Frontend (port 3000).

## Testing the App

1. Visit http://localhost:3000
2. Click "Sign in with Google"
3. Create or join a study room
4. Start the Pomodoro timer
5. Add tasks and interact with features

## Deployment

### Vercel (Frontend)
1. Connect GitHub repo to Vercel
2. Set environment variables
3. Deploy with `npm run build`

### Railway/Render (Backend)
1. Connect GitHub repo
2. Set environment variables
3. Configure MongoDB whitelist for server IP
4. Deploy with `npm start`

## Troubleshooting

### "MongoDB connection error"
- Check connection string in .env
- Verify IP whitelist in Atlas
- Ensure network connectivity

### "Firebase token invalid"
- Verify FIREBASE_PROJECT_ID matches service account
- Check FIREBASE_PRIVATE_KEY formatting (must have \n for newlines)
- Ensure Firebase project has Web app created

### "Socket.io connection refused"
- Ensure backend is running on correct port
- Check REACT_APP_SOCKET_URL in .env
- Verify CORS settings in server.js

### "Anthropic API errors"
- Verify ANTHROPIC_API_KEY in .env
- Check API key hasn't expired
- Monitor usage at console.anthropic.com

## Project Structure

See README.md for detailed structure and features.

## Next Steps

1. Customize colors and fonts if desired
2. Add more audio tracks to AmbientPlayer
3. Implement user profiles page
4. Add session history/analytics
5. Create mobile app with React Native
