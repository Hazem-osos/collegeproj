# Course Management — Next.js app

Everything needed to **run**, **migrate**, and **build** lives here end-to-end.

## First-time setup

1. Copy env: **`cp .env.example .env`**
2. Ensure MySQL is running (repo root: **`docker compose up -d`** if you use the bundled compose file).
3. **`npm install`** (runs **`postinstall` → `prisma generate`**).
4. Sync DB + seed (pick one):
   - **`npm run setup:dev`** — `db push` + seed (fastest for a new local DB)
   - **`npm run db:deploy`** then **`npm run db:seed`** — uses migration history (better for teams/CI)
5. **`npm run dev`** → [http://localhost:3000](http://localhost:3000)

## Scripts (see `package.json`)

- **`npm run dev`** — development server  
- **`npm run build`** / **`npm start`** — production  
- **`npm run lint`** — ESLint  
- **`npm run setup:dev`** — fresh schema + seed  
- **`npm run db:push`** / **`db:migrate`** / **`db:deploy`** / **`db:seed`** — Prisma  

## Docs

- Full repo instructions: **[../README.md](../README.md)**  
- Tutor / assignment walkthrough: **`TUTOR_PROJECT_DISCUSSION.md`**
