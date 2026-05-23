# User Flows and Use Cases

This document describes implemented user flows in Zenith Study Buddy.

## Flow 1: Authentication and First Dashboard Load

1. User opens https://zenith-sb.vercel.app.
2. User signs in or signs up through Clerk pages.
3. User is redirected to dashboard.
4. Frontend triggers internal user sync request to backend.
5. User profile is upserted in database if needed.

## Flow 2: Generate and Confirm Weekly Plan

1. User opens planner modal and selects study inputs.
2. Frontend requests task suggestions from backend AI planner endpoint.
3. User reviews suggested tasks.
4. User confirms plan to persist tasks.
5. Tasks are inserted and reflected in dashboard/task views.

## Flow 3: Task Completion and Day Summary

1. User views personal task list.
2. User updates completion state on tasks.
3. Backend sets or clears completion date accordingly.
4. Day summary endpoint aggregates completed tasks and sessions for selected date.

## Flow 4: Focus Sessions and Streaks

1. User starts and completes a focus session.
2. Session is logged with duration, mode, and study date.
3. Streak endpoint computes continuous active days from tasks and sessions.
4. Weekly summary endpoint provides focus minutes, active days, tasks completed, and notes written.

## Flow 5: Notes Management

1. User opens notes page.
2. User creates a note with heading, description, and content.
3. User edits existing notes.
4. User deletes notes no longer needed.
5. All note actions are scoped to current authenticated user.

## Flow 6: Resources Management

1. User opens resources page.
2. User adds a resource with name, URL, and optional description.
3. User edits resource metadata.
4. User deletes outdated resources.
5. Backend validates URL input before saving.

## Flow 7: Google Calendar Integration

1. User starts Google connect flow.
2. Backend returns OAuth URL.
3. User approves access and is redirected back to dashboard.
4. Connection details are saved in `calendar_connections`.
5. User can fetch events, add events, check status, or disconnect.

## Flow 8: Clerk Webhook Sync

1. Clerk emits user lifecycle events.
2. Backend webhook endpoint verifies signature.
3. User row is inserted or updated in database.
4. Deleted users are handled through webhook event processing logic.
