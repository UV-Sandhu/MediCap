# MediCap

A full-stack healthcare and pharmacy management platform.

## Architecture & Technology Stack

- **Backend (`/server`)**:
  - Runtime: Node.js 18+ (ES Modules: `"type": "module"`)
  - Framework: Express 4 (`express@^4.21.0`)
  - Database Driver: `mysql2` using the `mysql2/promise` API directly (Raw SQL, no ORM)
  - Auth & Validation: `jsonwebtoken`, `bcryptjs`, `zod`
  - Testing: Built-in Node test runner (`node --test`)
  - Utilities: `cors`, `dotenv`

- **Frontend (`/client`)**:
  - Framework: React 18 (`react@^18.3.1`, `react-dom@^18.3.1`)
  - Bundler: Vite (`@vitejs/plugin-react`)
  - Routing: React Router v6 (`react-router-dom@^6.28.0`)
  - Mapping: Leaflet (`leaflet@^1.9.4`) with OpenStreetMap tiles
  - Styling: Native CSS variables (`:root`) and plain CSS

- **Database (`/database`)**:
  - Target: MySQL 8.0.16+ (requires native enforced `CHECK` constraints)
  - `database/schema.sql`: Table definitions and DDL constraints
  - `database/seed.sql`: Initial seed data and test fixtures

---

## Repository Structure

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
│   │   ├── index.js          # Express app entry point & HTTP listener
│   │   ├── config/
│   │   │   └── db.js         # mysql2/promise connection pool
│   │   ├── middleware/
│   │   │   └── auth.js       # JWT authentication middleware placeholder
│   │   ├── routes/
│   │   │   └── health.js     # Health check endpoint (/api/health)
│   │   └── services/
│   │       └── weather.js    # Open-Meteo fetch helper placeholder
│   └── tests/
│       └── health.test.js    # Built-in node --test runner tests
└── client/
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx           # React Router v6 setup
        ├── index.css         # CSS reset & :root design tokens
        ├── api/              # Fetch wrappers
        ├── components/       # Reusable components
        └── pages/            # Route views
```

---

## Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- MySQL 8.0.16 or higher

### 1. Database Setup
1. Create a MySQL database (e.g. `medicap`).
2. Execute the schema script:
   ```bash
   mysql -u root -p medicap < database/schema.sql
   ```
3. (Optional) Populate initial seed data:
   ```bash
   mysql -u root -p medicap < database/seed.sql
   ```

### 2. Backend Setup (`/server`)
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run in development mode:
   ```bash
   npm run dev
   ```
   Or run the server in production mode:
   ```bash
   npm start
   ```
5. Run tests:
   ```bash
   npm test
   ```

### 3. Frontend Setup (`/client`)
1. Navigate to the client folder:
   ```bash
   cd client
   ```
2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   ```
