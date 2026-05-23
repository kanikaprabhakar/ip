# Software Requirements Specification (SRS)

Project: Zenith Study Buddy
Version: 2.0
Status: Deployed

## 1. Introduction

### 1.1 Purpose

This document defines the current product requirements for Zenith Study Buddy as deployed in production.

### 1.2 Production Endpoints

- Frontend: https://zenith-sb.vercel.app
- Backend API: https://zenith-study-buddy.onrender.com

### 1.3 Scope

Zenith Study Buddy provides:

- Secure user authentication
- Personal task planning and tracking
- Focus session logging and streak insights
- Notes and resources management
- Google Calendar connectivity

## 2. Product Overview

### 2.1 Architecture

- Frontend: Next.js (App Router)
- Backend: Express.js (Node.js)
- Authentication: Clerk
- Database: Postgres (Supabase)
- Deploy: Vercel (frontend), Render (backend)

### 2.2 Core Objectives

- Help learners maintain consistency
- Reduce planning friction with AI suggestions
- Keep progress and learning artifacts in one place

## 3. Functional Requirements

### 3.1 Authentication and Identity

- Users must sign in and sign up through Clerk.
- Each request to protected backend routes must be tied to a Clerk user identity.
- User profile rows must be synced into the database through webhook and internal sync flows.

### 3.2 Tasks and Weekly Planning

- Users must create, update, list, and delete tasks.
- Users must generate weekly plan suggestions via AI with intensity and subject inputs.
- Generated plan entries must be confirmed before insertion into persistent task storage.
- Task completion state and completion date must be trackable.

### 3.3 Focus Sessions and Progress

- Users must log study sessions with duration and mode.
- Users must retrieve active study days for a selected week.
- Users must retrieve streak information derived from sessions and completed tasks.
- Users must retrieve weekly summary metrics including focus minutes and completed tasks.

### 3.4 Notes and Resources

- Users must create, list, update, and delete notes.
- Users must create, list, update, and delete resources.
- Notes and resources must remain user-scoped.

### 3.5 Google Calendar Integration

- Users must connect Google Calendar through OAuth.
- Users must check connection status and disconnect.
- Users must fetch upcoming events.
- Users must add calendar events from planned study items.

## 4. Non-Functional Requirements

### 4.1 Security

- Protected APIs require verified Clerk identity.
- Data isolation is enforced by per-user filtering using Clerk IDs.
- Webhook verification is required for Clerk event processing.

### 4.2 Reliability

- Backend must expose a health endpoint.
- Schema bootstrapping must run safely during service startup.
- AI planning must provide fallback behavior when external generation fails.

### 4.3 Performance

- Common dashboard calls should return in near real time for a single user context.
- Query indexes should exist for user-keyed tables.

## 5. Out of Scope for Current Release

- Enterprise multi-tenant administration
- Advanced adaptive revision engine
- Native mobile applications
