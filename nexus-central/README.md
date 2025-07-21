# Nexus Central Server

Central management server for Nexus desktop application installations.

## Overview

This Next.js application deployed on Vercel provides:
- Company registration and access code generation
- Database provisioning for each company
- Installation tracking and management
- Software update distribution (electron-updater compatible)
- Admin dashboard for monitoring

## Setup

### 1. Supabase Setup

1. Create a new Supabase project
2. Run the database schema from `scripts/database-schema.sql`
3. Copy the project URL and service key

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
ENCRYPTION_KEY=generate_a_32_char_key
NEXUS_ADMIN_SECRET=admin_dashboard_secret
```

### 3. Development

```bash
npm install
npm run dev
```

Visit http://localhost:3000

### 4. Deployment

Deploy to Vercel:

```bash
vercel
```

Set environment variables in Vercel dashboard.

## API Endpoints

### Company Management

- `POST /api/company/register` - Register new company
- `POST /api/company/validate` - Validate company code
- `POST /api/company/heartbeat` - Installation heartbeat

### Update Management

- `GET /api/updates/check` - Check for updates
- `GET /api/updates/download/[version]` - Download update
- `GET /api/updates/latest.yml` - electron-updater manifest

## Integration with Nexus App

### Setup Wizard

```typescript
// Register new company
const response = await fetch('https://your-deployment.vercel.app/api/company/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    company_name: 'ACME Corp',
    admin_email: 'admin@acme.com'
  })
});
```

### Auto-updater

```typescript
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://your-deployment.vercel.app/api/updates',
  headers: {
    'X-Company-Code': companyCode
  }
});
```

## Security

- All database configs are AES-256 encrypted
- Rate limiting on all endpoints
- Company code validation
- Machine fingerprinting for installations

## Admin Dashboard

Access at `/admin` with `NEXUS_ADMIN_SECRET`.

Features:
- Company management
- Installation monitoring
- Update deployment
- Usage analytics
