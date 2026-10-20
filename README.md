# FocusTube

> Watch what you came for. Nothing else.

FocusTube is a distraction-reduced YouTube companion. You follow the channels you choose and browse videos from those channels only, with no algorithmic recommendations. When you want to learn from a video, the built-in study workspace lets you watch and take notes side by side.

I built it because I follow creators who share how they overcame challenges in my field, but kept losing hours to algorithmic feeds and forgetting the people I actually meant to learn from.

**Live demo:** _add link_  ·  **Screenshots:** _add a feed screenshot and a study-page GIF here_

## Features

- **Accounts:** register and log in with Supabase Auth. Every user has a private feed.
- **Follow channels:** add a channel by `@handle`, channel URL or channel ID. The API resolves it through the YouTube Data API.
- **Curated feed:** videos from followed channels only, with per-channel "Load More" pagination.
- **Video search:** search YouTube with paginated results.
- **Saved videos:** save and unsave videos (protected by Row Level Security).
- **Distraction-free playback:** the official embedded player with `rel=0`, so end screens only suggest videos from the same channel.
- **Settings and theme:** account settings, light and dark mode.
- **Responsive UI:** sidebar on desktop, bottom tab bar on mobile.

### Study workspace

The Study workspace brings a YouTube video and its notes together. Each study page stores a title, rich-text notes and a link to its video, and is saved to Supabase per user.

- **Rich-text notes:** a BlockNote editor (with Mantine) for each study page.
- **Timestamped key moments:** capture a moment while watching and add a timestamp link to your notes. Selecting a timestamp seeks the player to that point and resumes playback.
- **Synced player:** the embedded player stays in sync with the active study page.
- **Focus controls:** playback-rate controls and focus statistics.
- **Resume where you left off:** playback position is saved periodically and restored on your next visit.
- **Mobile layout:** on small screens the player can stay visible in a compact floating view while you edit notes.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router, React Hot Toast, Lucide React |
| Study workspace | BlockNote + Mantine (editor), YouTube IFrame Player API via `react-youtube` |
| Backend | Node.js, Express, TypeScript (`server/`) |
| Database and auth | Supabase (Postgres, Auth, Row Level Security) |
| External API | YouTube Data API v3 |
| Hosting | Vercel (frontend), Render (backend) |

## Architecture

- The React client signs in through Supabase and sends the user's JWT as a bearer token on every API call.
- An Express middleware verifies the token with Supabase and attaches the user ID to the request.
- The API uses the Supabase service-role key, kept server-side only, to read and write channel data. The browser only ever holds the public anon key, and RLS protects data the client reads directly (such as saved videos and study pages).
- Channels are stored once in a shared `channels` table. A `user_channels` junction table (unique on user and channel) links each user to the channels they follow.
- Video lists come from each channel's uploads playlist, which avoids the 100-quota-unit YouTube search endpoint wherever possible. Pagination follows YouTube's `nextPageToken`.
- The study workspace passes video context through the URL, so a study page can be opened and shared as a link to a specific video.

## Run locally

Install and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

In a second terminal, start the API:

```bash
cd server
npm install
npm run dev
```

### Environment variables

| Where | Variable | Purpose |
|---|---|---|
| `frontend/` | `VITE_SUPABASE_URL` | Supabase project URL |
| `frontend/` | `VITE_SUPABASE_ANON_KEY` | Supabase public (anon) key |
| `frontend/` | `VITE_API_URL` | API address (defaults to `http://localhost:5000`) |
| `server/` | `SUPABASE_URL` | Supabase project URL |
| `server/` | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key. Never expose this to the client. |
| `server/` | `YOUTUBE_API_KEY` | YouTube Data API v3 key |

Put these in local `.env` files and never commit them. The API allows the local Vite origins by default.

### Useful commands

From `frontend/`: `npm run build` (production build), `npm run lint` (ESLint), `npm run preview` (serve the build locally). The server has `npm run dev` and no test suite yet.

## Project map

- `frontend/src/pages/`: main screens (home, register, login, channels, feed, saved, settings, study).
- `frontend/src/pages/Study.tsx` and `frontend/src/pages/study/`: the study workspace (player, notes, editor, key moments, focus stats, playback position).
- `frontend/src/components/`: shared navigation and channel/feed UI.
- `frontend/src/lib/`: Supabase setup, auth helpers, protected routes.
- `server/server.ts`: Express setup, CORS and the health check.
- `server/src/routes/channelurl.ts`: authenticated channel and video endpoints.
- `server/src/lib/` and `server/src/middleware/`: Supabase client setup and bearer-token validation.

