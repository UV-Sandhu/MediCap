# Task: Initialize "MediCap" Full-Stack Repository Structure

You are initializing the foundational folder structure, package manifests, and Git configuration for **MediCap** inside an existing local Git repository. 

Read all constraints carefully before executing any shell commands or writing files.

## 1. Strict Architectural & Version Constraints
Do NOT deviate from these exact versions and patterns:
- **Git Rules:** A Git repository is already initialized. Make atomic commits locally to the `master` branch (ensure the branch is named `master` via `git branch -M master`). **DO NOT** run `git push` or interact with any remote repository.
- **No Unrequested Tooling:** Do NOT install TypeScript, Tailwind CSS, Prisma/Sequelize/Knex (no ORMs), Jest/Vitest, or Next.js.
- **Backend (`/server`):**
  - Runtime: Node.js 18+ using **ES Modules** (`"type": "module"` in `package.json`). Plain JavaScript (`.js`) only.
  - Framework: `express@^4.21.0` (Strictly Express 4.x — do NOT install Express 5).
  - Database Driver: `mysql2` (Use the `mysql2/promise` API directly. Raw SQL only, no ORM).
  - Auth & Validation: `jsonwebtoken`, `bcryptjs` (needed for `$2b$` seed hashes), `zod`.
  - Utilities: `cors`, `dotenv`.
  - Testing: Built-in Node test runner (`node --test`). No external test libraries.
- **Frontend (`/client`):**
  - Framework: `react@^18.3.1` and `react-dom@^18.3.1` (Strictly React 18 — do NOT install React 19).
  - Bundler: `vite` with `@vitejs/plugin-react` (Plain JavaScript `.jsx`).
  - Routing: `react-router-dom@^6.28.0` (Strictly React Router v6 — do NOT install v7).
  - Map: `leaflet@^1.9.4` (Include standard Leaflet CSS import; we will use OpenStreetMap tiles directly).
  - Styling: Plain CSS using native CSS variables (`:root`) in `src/index.css`.
- **Database (`/database`):**
  - Target: MySQL 8.0.16+ (to support `CHECK` constraints).
  - Create placeholder files: `database/schema.sql` and `database/seed.sql`.

---

## 2. Target Directory Structure
Set up the workspace to match this exact layout:

```text
.
├── .gitignore
├── README.md
├── database/
│   ├── schema.sql
│   └── seed.sql
├── server/
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── index.js          # Express app entry point + server listener
│   │   ├── config/
│   │   │   └── db.js         # mysql2/promise connection pool setup
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT verification middleware placeholder
│   │   ├── routes/
│   │   │   └── health.js     # GET /api/health route
│   │   └── services/
│   │       └── weather.js    # Open-Meteo fetch helper placeholder
│   └── tests/
│       └── health.test.js    # Basic node --test sanity check
└── client/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx           # Basic React Router v6 setup
        ├── index.css         # CSS reset + :root CSS variables
        ├── api/              # Fetch wrappers
        ├── components/       # Reusable UI & Leaflet map components
        └── pages/            # Route views
```

---

## 3. Step-by-Step Execution Plan

Execute the setup in the following sequence, verifying each step before committing:

### Step 1: Root `.gitignore`, `README.md`, and Database Directory
1. Ensure the active git branch is `master` (`git branch -M master`).
2. Create a comprehensive root `.gitignore` covering:
   - `node_modules/`, `dist/`, `build/`, `.vite/`
   - `.env`, `.env.*`, `!.env.example`
   - Logs (`*.log`, `npm-debug.log*`)
   - OS/IDE files (`.DS_Store`, `Thumbs.db`, `.vscode/`, `.idea/`)
3. Create `/database/schema.sql` and `/database/seed.sql` with header comments noting the MySQL 8.0.16+ requirement (`CHECK` constraint compatibility).
4. Create a clean `README.md` documenting the stack and local setup commands.
5. **Commit 1:** Stage and commit to `master` with message: `chore: initialize root gitignore, readme, and database sql placeholders`.

### Step 2: Backend (`/server`) Initialization
1. Initialize `/server/package.json` with `"type": "module"` and scripts:
   - `"start": "node src/index.js"`
   - `"dev": "node --watch src/index.js"`
   - `"test": "node --test tests/*.test.js"`
2. Install exact dependencies (`express@^4`, `mysql2`, `jsonwebtoken`, `bcryptjs`, `zod`, `cors`, `dotenv`).
3. Create `/server/.env.example` with `PORT=5000`, `DB_HOST=localhost`, `DB_PORT=3306`, `DB_USER=root`, `DB_PASSWORD=`, `DB_NAME=medicap`, `JWT_SECRET=your_jwt_secret`.
4. Write `src/config/db.js` exporting a `mysql2/promise` pool configured from `process.env`.
5. Write `src/index.js` and `src/routes/health.js` so `GET /api/health` returns `{ status: "ok" }`.
6. Write a minimal test in `tests/health.test.js` using `node:test` and `node:assert/strict` and run `npm test` inside `/server` to verify it passes.
7. **Commit 2:** Stage `/server` and commit to `master` with message: `feat(server): scaffold express 4 ESM backend with mysql2 and node test runner`.

### Step 3: Frontend (`/client`) Initialization
1. Scaffold `/client` with Vite (`react` template, plain JS), ensuring `react@^18`, `react-dom@^18`, `react-router-dom@^6`, and `leaflet@^1.9` are installed.
2. Configure `vite.config.js` with a dev server proxy forwarding `/api` requests to `http://localhost:5000`.
3. Set up `src/index.css` with clean `:root` CSS variables (primary colors, status colors, spacing, font family) and basic resets. Import `leaflet/dist/leaflet.css` in `main.jsx`.
4. Set up `src/App.jsx` with a basic `BrowserRouter`, `Routes`, and a placeholder root `<Route path="/" />`.
5. Run `npm run build` in `/client` once to verify there are no syntax or resolution errors (`.gitignore` will ignore `dist/`).
6. **Commit 3:** Stage `/client` and commit to `master` with message: `feat(client): scaffold react 18 vite frontend with react-router 6 and leaflet 1.9`.

### Step 4: Final Verification
Run `git status` and `git log --oneline -n 5` to confirm the working tree is clean and all 3 commits are recorded on `master`. Remember: do NOT push to any remote.