# Study Buddy Frontend

Next.js App Router frontend for Zenith Study Buddy.

## Live URLs

- Frontend: https://zenith-sb.vercel.app
- Backend API: https://zenith-study-buddy.onrender.com

## Features

- Clerk sign in and sign up flows
- Dashboard with weekly planner and progress widgets
- Task management with AI-generated weekly plan suggestions
- Focus sessions and streak tracking
- Notes and resources pages
- Google Calendar connect and sync actions

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

3. Open:

```text
http://localhost:3000
```

## Environment Variables

Create `.env.local` in `frontend/`:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SIGNING_SECRET=...
BACKEND_URL=http://localhost:4000
BACKEND_INTERNAL_SYNC_SECRET=...
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, set:

- `NEXT_PUBLIC_APP_URL=https://zenith-sb.vercel.app`
- `NEXT_PUBLIC_BACKEND_URL=https://zenith-study-buddy.onrender.com`

## Clerk Webhook Setup

Backend endpoint:

- `POST https://zenith-study-buddy.onrender.com/api/webhooks/clerk`

In Clerk dashboard:

1. Open Webhooks.
2. Add the endpoint above.
3. Subscribe to `user.created`, `user.updated`, and `user.deleted`.
4. Add the signing secret to your backend env as `CLERK_WEBHOOK_SIGNING_SECRET`.

## Notes

- User sync to database is handled by backend webhook and internal sync API.
- Clerk user IDs are persisted as `clerk_id` in database tables.
