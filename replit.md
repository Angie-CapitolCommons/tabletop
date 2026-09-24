# Running Tabletop on Replit

- Use the **Start application** workflow for the web preview. It runs `npm run build && PORT=5000 npm start`.
- Install the existing locked Node dependencies with `npm ci` if they are missing.
- The app requires the Replit-provided `DATABASE_URL` and two Replit Secrets: `ROOM_CODES` (four distinct comma-separated room codes) and `ADMIN_CODE` (a different code). `ANTHROPIC_API_KEY` enables live Elder challenges; without it, facilitators can hold an answer and continue.
- Open `/` for room facilitators and `/admin` for the lead facilitator. Printable materials are at `/api/print`; `/api/health` reports server readiness.
- Do not put access codes, API keys, or database credentials in this file or in the repository. The app stores room progress in PostgreSQL.