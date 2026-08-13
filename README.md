# Workwise

Workwise is a multi-tenant team workspace platform: organizations create workspaces, invite members with role-based access control, and coordinate work through projects, tasks, and an AI assistant that proposes changes for a human to approve before anything is written.

## Features

- **Workspaces & RBAC** — every workspace has members with one of five roles (`OWNER > ADMIN > MANAGER > MEMBER > VIEWER`), each gating a different set of actions.
- **Projects & tasks** — create projects inside a workspace, break them into tasks, assign owners, track status.
- **Pulse, the AI assistant** — ask Pulse to create or update tasks in natural language. Pulse never mutates data directly; it writes a proposal that a member with sufficient permissions must approve.
- **Realtime sync** — Socket.IO keeps every workspace member's board in sync as tasks move.
- **Audit log** — every mutating action (task changes, membership changes, approved AI proposals) is recorded for later review.

## Stack

**Backend**: Node.js, Express 5, Drizzle ORM, PostgreSQL (Neon), Socket.IO, JWT auth via httpOnly cookies, Zod validation, Groq via the Vercel AI SDK.

**Frontend**: Next.js (App Router), React, TanStack Query, Tailwind CSS, Radix UI primitives, react-hook-form + Zod.

## Getting started

```bash
npm install

# copy env templates and fill in DATABASE_URL, JWT_SECRET, GROQ_API_KEY, etc.
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# run database migrations
npm run db:migrate --workspace backend

# start both apps
npm run dev:backend
npm run dev:frontend
```

Backend runs on `http://localhost:4000`, frontend on `http://localhost:3000`.

## Project structure

```
backend/    Express API, Drizzle schema/migrations, Socket.IO server, Pulse AI service
frontend/   Next.js app — landing page, auth, dashboard, workspace/project/task UI
```

## License

MIT © Vishal Malik
