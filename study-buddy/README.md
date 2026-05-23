# Zenith Study Buddy

Zenith Study Buddy is a full-stack study and productivity app for students. It combines task planning, focus sessions, notes, resources, Google Calendar integration, and collaborative study rooms in one aesthetic workspace.

## Highlights

- Clerk authentication with protected user-specific data
- Dashboard with weekly planner, progress widgets, and study insights
- Task CRUD plus AI weekly plan suggestions
- Focus timer and study session tracking
- Notes and resources management
- Google Calendar connect, sync, and event actions
- Collaborative study rooms with join codes, room tasks, chat, and host controls

## Tech Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
- Backend: Express.js, Node.js
- Database: PostgreSQL via `postgres`
- Auth: Clerk
- Integrations: Google Calendar, webhook-based user sync, AI task planning

## Project Structure

- `frontend/` — Next.js app, pages, components, and client API helpers
- `backend/` — Express API, controllers, routes, middleware, and DB bootstrap
- `docs/` — Product docs, schema notes, roadmap, and user flows

## Features

### Authentication

- Sign up and sign in with Clerk
- Protected backend routes require a verified Clerk identity
- Clerk users are synced into the database through webhook and internal sync flows

### Dashboard

- Weekly planner view
- Progress and streak widgets
- Quick access to tasks, focus sessions, notes, resources, and rooms

### Tasks

- Create, edit, complete, and delete tasks
- AI-generated weekly study plan suggestions
- Daily summary and weekly progress metrics

### Focus Sessions

- Pomodoro-style focus timer
- Study session logging
- Weekly active-day and streak tracking
- Motivational landing and focus screens with animated visuals

### Notes

- Create, edit, list, and delete notes
- User-scoped note storage

### Resources

- Save, organize, list, update, and delete study resources
- User-scoped resource storage

### Google Calendar

- Connect and disconnect Google Calendar
- Check connection status
- Fetch upcoming events
- Add calendar events from planned study items

### Study Rooms

- Create a room or join with an invite code
- Lobby page for recent rooms and quick entry
- Active room page with a Pomodoro-style layout
- Room tasks shared across members
- Live room chat
- Presence lifecycle with active/inactive membership
- Host-only member removal
- Host-only room ending
- Room status handling for ended rooms

## Rooms Behavior

- Leaving a room marks the member inactive
- Rejoining reactivates the membership row
- The room page refreshes room state on a short polling interval
- The timer UI is currently local to each browser and stored in `localStorage`

## Backend API

Health:

- `GET /health`

Core routes:

- `GET /api/tasks`
- `GET /api/sessions`
- `GET /api/resources`
- `GET /api/notes`
- `GET /api/rooms`
- `GET /api/gcal`
- `POST /api/webhooks/clerk`
- `POST /api/internal/sync-user`
- `GET /api/day-summary`

Rooms routes include room creation, join, detail fetch, leave, member removal, end room, tasks, and messages.

## Local Development

### 1) Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2) Run the backend

```bash
cd backend
npm run dev
```

### 3) Run the frontend

```bash
cd frontend
npm run dev
```

### 4) Open the app

```text
http://localhost:3000
```

## Environment Variables

### Frontend

Create `frontend/.env.local`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SIGNING_SECRET=...
BACKEND_URL=http://localhost:4000
BACKEND_INTERNAL_SYNC_SECRET=...
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend

Create `backend/.env`:

```bash
DATABASE_URL=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SIGNING_SECRET=...
BACKEND_INTERNAL_SYNC_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=...
OPENAI_API_KEY=...
GEMINI_API_KEY=...
```

## Scripts

### Backend

- `npm run dev` — start the API with nodemon
- `npm start` — start the API in production mode

### Frontend

- `npm run dev` — start the Next.js dev server
- `npm run build` — build the app
- `npm start` — start the production server
- `npm run lint` — run ESLint

## Deployment

- Frontend: https://zenith-sb.vercel.app
- Backend API: https://zenith-study-buddy.onrender.com

## Documentation

- `docs/README.md` — documentation index
- `docs/srs.md` — requirements and scope
- `docs/schema.md` — database schema notes
- `docs/roadmap.md` — delivery roadmap
- `docs/user-flows.md` — implemented journeys
- `docs/resume-summary.md` — resume-ready summary

## Notes

- The backend bootstraps database tables on startup.
- Room membership is tracked with an `active` flag so users can leave and rejoin cleanly.
- Room data is refreshed through polling; timer state is not shared in real time yet.
