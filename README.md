# Kato Dashboard

A Mini Linear-style project dashboard PWA for tracking Kato's work. Built with React + TypeScript + Tailwind CSS + Supabase.

![Dark mode dashboard](https://img.shields.io/badge/theme-dark-030712) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![React](https://img.shields.io/badge/React-19-blue)

## Features

- **Kanban Board** — Backlog → In Progress → Done columns
- **Project Cards** — Name, status, progress bar, GitHub link
- **Task Management** — Click to cycle task status
- **Agent Activity** — Real-time sub-agent status indicator
- **Activity Feed** — Last 10 actions with timestamps
- **PWA** — Installable, mobile-responsive dark mode design
- **Mock Data** — Works without Supabase for local dev

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (works with mock data, no Supabase needed)
npm run dev
```

Open [http://localhost:5174](http://localhost:5174)

## Supabase Setup (Optional)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL editor
3. Copy `.env.example` to `.env.local` and fill in your keys:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Deployment

```bash
# Build for production
npm run build

# Deploy to Vercel
npx vercel --prod
```

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Styling:** Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Realtime)
- **Build:** Vite 7
- **Deploy:** Vercel

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── Layout.tsx
│   ├── KanbanBoard.tsx
│   ├── ProjectCard.tsx
│   ├── TaskCard.tsx
│   ├── StatusBadge.tsx
│   ├── ProgressBar.tsx
│   ├── ActivityFeed.tsx
│   └── AgentIndicator.tsx
├── pages/          # Route pages
│   ├── Dashboard.tsx
│   └── ProjectDetail.tsx
├── hooks/          # React hooks
├── services/       # API & Supabase client
├── data/           # Mock data
└── types/          # TypeScript types
```

## License

MIT
