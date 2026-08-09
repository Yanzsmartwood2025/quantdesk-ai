# QuantDesk AI - Web Dashboard

This is the frontend dashboard for the QuantDesk AI trading system. It provides a real-time view into the actions and decisions of the AI agents (Analyst, Risk Manager, Portfolio Manager) and displays market conditions.

## Tech Stack
- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4
- Supabase (Realtime Subscriptions - Anon Key Only)
- Lightweight Charts V5

## Getting Started

### 1. Configure Environment Variables

Create a `.env.local` file in the root of the `/web` directory using `.env.example` as a template:

```bash
cp .env.example .env.local
```

Set the values to point to your Supabase project:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL (e.g., https://xyz.supabase.co)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase **anon** key.

> **Security Note:** Never use the `service_role` key here. The application is designed to only read public data and listen to events securely.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Design Decisions
- **Empty State Experience:** The dashboard intentionally uses a visual "waiting" state when there's no data instead of looking broken. This reflects the reality that the backend needs time to generate its first insights and candles.
- **Agent Status Visualization:** Instead of plain logs, agents are represented as modules that "glow" and pulse when they insert new traces to the database, simulating a "thinking" state.
- **Realtime Reasoning Feed:** Raw JSON outputs are parsed and formatted into human-readable actions, emphasizing signals (BUY/SELL) with clear visual color coding.
- **Vercel Native:** Built entirely on standard Next.js App Router for zero-config deployments to Vercel.
