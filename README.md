# Counterline — Trade Counter & Warehouse Notification System

Keep your trade counter and warehouse in sync. Send pick requests, attach visual order notes, track live picking status, and display active orders on a dedicated warehouse board with configurable audio alerts.

## Quick Start (Zero-Config Local Setup)

You can run the app locally right away without setting up an external PostgreSQL server — when `DATABASE_URL` is not set, Counterline automatically uses an embedded PostgreSQL database ([PGlite](https://pglite.dev)) stored in `.local/pglite` and seeds sample data on first launch.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open the app in your browser:**
   - **Shopfront / Counter Workspace:** [http://localhost:3000](http://localhost:3000)
   - **Warehouse Live Display:** [http://localhost:3000/warehouse](http://localhost:3000/warehouse)

---

## Using an External PostgreSQL Database (Optional)

If you want to connect to a standalone PostgreSQL server (local Postgres, Docker, Neon, Supabase, etc.):

1. **Start PostgreSQL** (for example, using Docker):
   ```bash
   docker run --name counterline-db \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=app_db \
     -p 5432:5432 \
     -d postgres:16
   ```

2. **Create a `.env` file** in the project root:
   ```bash
   cp .env.example .env
   ```
   Uncomment and set `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/app_db"
   ```

3. **Start the app** (tables and initial seed data are created automatically on first run, or you can run `npm run db:push`):
   ```bash
   npm run dev
   ```

---

## Available Scripts

- `npm run dev` — Start the Next.js development server
- `npm run build` — Build the application for production
- `npm run start` — Run the production server
- `npm run db:push` — Push the Drizzle schema to a PostgreSQL database
- `npm run typecheck` — Run TypeScript type checking
- `npm run lint` — Run ESLint
