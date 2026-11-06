# Frontend (React + Vite + TypeScript)

Complaint form with validation, filterable table (status, priority, search), inline status
change, and per-status counters. Types come from `../shared/types.ts`.

```bash
npm install
npm run dev     # http://localhost:5173, proxies /api to http://localhost:3001
npm run build
```

Start the API first: `cd ../backend && npm install && npm run dev`.
