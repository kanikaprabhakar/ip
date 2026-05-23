# Database Schema

Database engine: Postgres (Supabase-hosted)

This document reflects the tables currently used by backend services.

## 1. Ownership Model

Most domain tables are keyed by `clerk_id` (text) for user scoping.

- Authentication is handled by Clerk.
- Backend middleware resolves current Clerk user ID.
- Queries filter by `clerk_id` to isolate user data.

## 2. Tables

### 2.1 users

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key, default `gen_random_uuid()` |
| clerk_id | text | Unique Clerk user ID |
| name | text | Display name |
| email | text | User email |

Indexes/constraints:

- Unique index on `clerk_id`

### 2.2 tasks

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| clerk_id | text | Owner Clerk ID |
| title | text | Task title |
| deadline | date | Optional due date |
| priority | text | `low`, `medium`, or `high` |
| done | boolean | Completion flag |
| completed_on | date | Completion date |
| created_at | timestamptz | Created timestamp |

Indexes:

- `tasks_clerk_id_idx` on `clerk_id`

### 2.3 study_sessions

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| clerk_id | text | Owner Clerk ID |
| duration_min | integer | Session minutes |
| mode | text | Session mode, default `focus` |
| studied_on | date | Study date |
| created_at | timestamptz | Created timestamp |

Indexes:

- `study_sessions_clerk_id_idx` on `clerk_id`
- `study_sessions_studied_on_idx` on (`clerk_id`, `studied_on`)

### 2.4 notes

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| clerk_id | text | Owner Clerk ID |
| heading | text | Note title |
| description | text | Optional short description |
| content | text | Main note content |
| created_at | timestamptz | Created timestamp |
| updated_at | timestamptz | Last update timestamp |

Indexes:

- `notes_clerk_id_idx` on `clerk_id`

### 2.5 resources

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| clerk_id | text | Owner Clerk ID |
| name | text | Resource name |
| url | text | Resource URL |
| description | text | Optional description |
| created_at | timestamptz | Created timestamp |

Indexes:

- `resources_clerk_id_idx` on `clerk_id`

### 2.6 calendar_connections

| Column | Type | Notes |
|---|---|---|
| id | uuid | Primary key |
| clerk_id | text | Owner Clerk ID |
| provider | text | Provider name, currently `google` |
| refresh_token | text | OAuth refresh token |
| access_token | text | OAuth access token |
| token_expiry | timestamptz | Access token expiry |
| gcal_email | text | Connected Google calendar email |
| connected_at | timestamptz | Connection timestamp |

Indexes/constraints:

- Unique index on (`clerk_id`, `provider`) where `clerk_id` is not null

## 3. Notes

- Startup schema checks are handled in backend boot logic.
- Row-level security is enabled for core user tables.
- Existing legacy columns may exist in database depending on migration history.
