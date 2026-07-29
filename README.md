# Daniel Zabaleta — Portfolio

Personal portfolio site: VSL funnel + selected work. Built with Vite + TypeScript, deployed on Vercel.

**Live:** https://daniel-zabaleta-portfolio.vercel.app/

## Stack
- Vite + vanilla TypeScript (no framework — single static page, small bundle)
- Self-hosted [Inter](https://rsms.me/inter/) via `@fontsource/inter`
- Vercel (hosting) + serverless functions in `api/` for the wall
- Vercel KV / Upstash Redis (`@upstash/redis`) for the wall's storage, with a localStorage fallback if it isn't configured

## Development
```bash
npm install
npm run dev
```
The `api/` serverless functions don't run under `vite dev` — locally the wall falls back to a per-browser localStorage version automatically. To test the real API locally, use `vercel dev` (requires the project linked to Vercel).

## Environment variables
Copy `.env.example` to `.env` and fill in what you have. See that file for what each one does and when it's needed. `KV_REST_API_URL` / `KV_REST_API_TOKEN` are injected automatically once a KV store is connected in the Vercel dashboard — you don't need to copy them by hand there, only for local `vercel dev`.

## The wall
- Anonymous comments, no login. Stored in a Vercel KV (Redis) list, capped at the 200 most recent.
- `GET /api/comments` — list, most recent first.
- `POST /api/comments` — add one. Server-side guardrails: rejects empty text, text over 80 characters, and anything that looks like a URL; best-effort rate limit of 1 post per IP per 10 seconds. The client also checks these before sending, for instant feedback, but the server is the real gate.
- Rendering always uses `textContent`, never raw HTML, so stored text can't execute as a script regardless of what's in it.
- If `KV_REST_API_URL` / `KV_REST_API_TOKEN` aren't set, the API returns 503 and the frontend transparently falls back to a localStorage-only version of the wall (same behavior as the Phase 2 demo) — the build and the page never break because KV isn't configured yet.

### Moderating the wall
To remove a comment:
1. Find its `id` — call `GET /api/comments` (e.g. open it in the browser or `curl https://<your-domain>/api/comments`) and locate the comment's `id` field.
2. Delete it:
   ```bash
   curl -X DELETE https://<your-domain>/api/comments/<id> \
     -H "Authorization: Bearer <ADMIN_TOKEN>"
   ```
   `<ADMIN_TOKEN>` is the value you set for the `ADMIN_TOKEN` environment variable in the Vercel project. Without a matching token the endpoint returns 401.

## Status
All 5 build phases done and deployed. Still pending (all manual, tracked in `pasos_daniel.md` in the Personal Tracking repo):
- Connect a Vercel KV store so the wall persists across visitors (works fine without it, just falls back to per-browser localStorage)
- Set `ADMIN_TOKEN` for wall moderation
- Record the VSL and set `VITE_VSL_URL`
- Update Lead Triage Engine / Portfolio Command from "In progress" once built (search `not-built` in `index.html`)
