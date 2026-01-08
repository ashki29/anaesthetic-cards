# AnaesCards - Anaesthetic Preference Cards

A Progressive Web App for UK theatre teams to collaboratively manage anaesthetist preference cards.

## Features

- **Search & Browse**: Find preference cards by consultant name or procedure
- **Collaborative Editing**: All team members can update cards
- **Team-based Access**: Join teams via invite codes
- **Mobile-friendly**: PWA installable on phones
- **Comprehensive Cards**: Drugs, equipment, positioning, and notes

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS
- Supabase (PostgreSQL, Auth, RLS)
- PWA with vite-plugin-pwa

## Setup

### 1. Clone and Install

```bash
cd anaesthetic-cards
npm install
```

### 2. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and run the SQL files in order:
   - `supabase/schema.sql` - Creates tables and functions
   - `supabase/policies.sql` - Sets up row-level security

### 3. Configure Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Get your Supabase credentials from **Project Settings > API**:
   - `VITE_SUPABASE_URL` - Your project URL
   - `VITE_SUPABASE_ANON_KEY` - Your anon/public key

3. Add them to `.env`:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Netlify

1. Push to GitHub
2. Import in [Netlify](https://netlify.com)
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables
6. Deploy

## Usage

### First Time Setup

1. Register with your email
2. Either:
   - **Create a team**: You'll get an invite code to share
   - **Join a team**: Enter the invite code from your team lead

### Adding Preference Cards

1. Go to **Consultants** → **Add Consultant**
2. Enter consultant name and specialty
3. Open the consultant → **Add Procedure**
4. Fill in the preference card details

### Quick Search

Use the search bar on the dashboard to find:
- Consultants by name
- Procedures by name

## Project Structure

```
src/
├── components/       # Reusable UI components
├── context/          # React contexts (Auth)
├── hooks/            # Custom React hooks
├── lib/              # Supabase client, types
├── pages/            # Page components
└── App.tsx           # Router setup
```

## Security

- Row-level security ensures users only see their team's data
- Invite codes required to join teams
- No patient data stored - only consultant preferences
- HTTPS enforced in production
