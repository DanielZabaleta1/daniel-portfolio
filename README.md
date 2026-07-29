# Daniel Zabaleta — Portfolio

Personal portfolio site: VSL funnel + selected work. Built with Vite + TypeScript, deployed on Vercel.

## Stack
- Vite + vanilla TypeScript (no framework — single static page, small bundle)
- Self-hosted [Inter](https://rsms.me/inter/) via `@fontsource/inter`
- Vercel (hosting) + Vercel KV / Upstash Redis (the wall, added in a later phase)

## Development
```bash
npm install
npm run dev
```

## Environment variables
Copy `.env.example` to `.env` and fill in what you have. See that file for what each one does and when it's needed.

## Status
Scaffold phase — sections, the wall, and VSL integration land in later phases. See `pasos_daniel.md` in the Personal Tracking repo for steps that require manual action.
