# Nexus Central Server - Architecture Plan

## Overview
A centralized server system to manage company registrations, database provisioning, and application updates for the Nexus desktop application.

## Technology Stack
- **Hosting**: Vercel (Next.js 14+ with App Router)
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage (for update files)
- **Authentication**: Supabase Auth (for admin portal)
- **API**: REST API with Next.js API routes

## System Architecture

### 1. Database Schema (Supabase)

```sql
-- Companies table: Core company registration
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_code VARCHAR(10) UNIQUE NOT NULL, -- Generated code like "ACME-2024"
  company_name VARCHAR(255) NOT NULL,
  admin_email VARCHAR(255) NOT NULL,
  admin_phone VARCHAR(50),
  database_config JSONB NOT NULL, -- Encrypted connection details
  settings JSONB DEFAULT '{}', -- Company-specific settings
  subscription_status VARCHAR(50) DEFAULT 'trial', -- trial, active, suspended
  subscription_tier VARCHAR(50) DEFAULT 'standard', -- standard, professional, enterprise
  max_users INTEGER DEFAULT 10,
  max_installations INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- For trial/subscription expiry
  metadata JSONB DEFAULT '{}' -- Additional flexible data
);

-- Installations: Track each desktop app installation
CREATE TABLE installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  machine_id VARCHAR(255) NOT NULL, -- Hardware fingerprint (CPU + MAC)
  hostname VARCHAR(255),
  username VARCHAR(255), -- Windows username
  ip_address INET,
  app_version VARCHAR(20),
  os_version VARCHAR(100),
  last_heartbeat TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, machine_id)
);

-- Update channels: Different release tracks
CREATE TABLE update_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_name VARCHAR(50) UNIQUE NOT NULL, -- 'stable', 'beta', 'alpha'
  current_version VARCHAR(20) NOT NULL,
  minimum_version VARCHAR(20), -- Force update if below this
  release_notes TEXT,
  file_url VARCHAR(500), -- Supabase storage URL
  file_size BIGINT,
  sha256_checksum VARCHAR(64),
  published_at TIMESTAMP DEFAULT NOW(),
  is_mandatory BOOLEAN DEFAULT false
);

-- Company update permissions: Control which companies get which updates
CREATE TABLE company_update_access (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES update_channels(id) ON DELETE CASCADE,
  PRIMARY KEY (company_id, channel_id)
);

-- Audit log: Track all API activities
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  action VARCHAR(100) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Company databases: Track provisioned databases
CREATE TABLE company_databases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  database_provider VARCHAR(50) NOT NULL, -- 'supabase', 'custom'
  database_url TEXT NOT NULL, -- Encrypted
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. API Endpoints Structure

#### Company Management
```typescript
// POST /api/company/register
// Called when admin creates new company setup in Nexus app
{
  request: {
    company_name: string,
    admin_email: string,
    admin_phone?: string,
    subscription_tier?: string
  },
  response: {
    success: boolean,
    company_code: string, // Generated 8-10 char code
    database_config: {
      host: string,
      port: number,
      database: string,
      username: string,
      password: string // Encrypted in transit
    }
  }
}

// POST /api/company/validate
// Called when user enters company code during setup
{
  request: {
    company_code: string,
    machine_id: string,
    hostname: string
  },
  response: {
    success: boolean,
    company_name: string,
    database_config: object, // Encrypted
    settings: object,
    update_channel: string
  }
}

// POST /api/company/heartbeat
// Regular check-in from installations
{
  request: {
    company_code: string,
    machine_id: string,
    app_version: string
  },
  response: {
    success: boolean,
    force_update?: boolean,
    settings_changed?: boolean
  }
}
```

#### Update Management
```typescript
// GET /api/updates/check
// electron-updater compatible endpoint
// ?version=0.2.7&channel=stable&company_code=ACME-2024
{
  response: {
    version: string,
    releaseDate: string,
    releaseName: string,
    releaseNotes: string,
    mandatory: boolean,
    url: string // Download URL
  }
}

// GET /api/updates/download/:filename
// Serves actual update file from Supabase storage
// Validates company_code and tracks download

// GET /api/updates/latest.yml
// electron-updater manifest file
// Auto-generated based on channel and company
```

### 3. Security Architecture

#### Encryption
- Database credentials: AES-256 encrypted at rest
- API transport: HTTPS only with certificate pinning
- Company codes: Cryptographically secure random generation

#### Rate Limiting
```typescript
// Vercel Edge Middleware
- /api/company/validate: 10 requests per minute per IP
- /api/updates/check: 60 requests per hour per company
- /api/updates/download: 5 downloads per hour per company
```

#### Authentication Flow
1. **Company Registration**: 
   - Admin token generated during Nexus setup
   - Token validates company creation request
   
2. **Installation Validation**:
   - Company code + machine fingerprint
   - Prevents unauthorized installations

### 4. Implementation Phases

#### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Setup Vercel project with Next.js 14
- [ ] Configure Supabase database
- [ ] Create database schema
- [ ] Implement basic API endpoints
- [ ] Setup encryption for sensitive data

#### Phase 2: Company Management (Week 3)
- [ ] Company registration endpoint
- [ ] Company validation endpoint
- [ ] Installation tracking
- [ ] Basic admin dashboard

#### Phase 3: Update System (Week 4)
- [ ] Update file storage in Supabase
- [ ] electron-updater compatible endpoints
- [ ] Update manifest generation
- [ ] Channel management

#### Phase 4: Security & Monitoring (Week 5)
- [ ] Rate limiting implementation
- [ ] Audit logging
- [ ] Monitoring dashboard
- [ ] Alert system for issues

### 5. Integration with Nexus App

#### Setup Wizard Changes
```typescript
// New company setup
const response = await fetch('https://nexus-central.vercel.app/api/company/register', {
  method: 'POST',
  body: JSON.stringify({
    company_name: formData.companyName,
    admin_email: formData.adminEmail
  })
});

const { company_code, database_config } = await response.json();
// Display company code to admin
// Save encrypted database_config locally

// Join existing company
const response = await fetch('https://nexus-central.vercel.app/api/company/validate', {
  method: 'POST',
  body: JSON.stringify({
    company_code: formData.companyCode,
    machine_id: getMachineId(),
    hostname: os.hostname()
  })
});
```

#### Update Configuration
```typescript
// electron-builder.config.js
publish: {
  provider: "generic",
  url: "https://nexus-central.vercel.app/api/updates",
  channel: "stable"
}

// In app startup
autoUpdater.setFeedURL({
  provider: 'generic',
  url: `https://nexus-central.vercel.app/api/updates?company_code=${companyCode}`,
  headers: {
    'X-Company-Code': companyCode,
    'X-Machine-Id': machineId
  }
});
```

### 6. Admin Portal Features

#### Web Dashboard (nexus-central.vercel.app/admin)
- Company management
- Installation monitoring
- Update deployment
- Usage analytics
- Billing management

#### Key Metrics
- Active installations per company
- Update adoption rates
- Error tracking
- Performance metrics

### 7. Cost Estimation

#### Vercel (Monthly)
- Hobby: $0 (development)
- Pro: $20 (production with custom domain)
- Function executions: ~$0.40 per million requests

#### Supabase (Monthly)
- Free tier: 0-500MB database, 1GB storage
- Pro: $25 for 8GB database, 100GB storage
- Each company database: ~$25/month

#### Estimated Monthly Cost
- 10 companies: ~$45 (Vercel Pro + Supabase Pro)
- 50 companies: ~$200 (may need dedicated infrastructure)
- 100+ companies: Consider dedicated servers

### 8. Future Enhancements

1. **Multi-tenant Database Pool**: Share Supabase instances across companies
2. **Webhook System**: Notify companies of updates/changes
3. **Plugin System**: Allow companies to add custom features
4. **Mobile Companion App**: Monitor installations on the go
5. **AI-Powered Analytics**: Predict usage patterns and issues

### 9. Development Repository Structure

```
nexus-central/
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   └── (public)/          # Public pages
├── lib/                   # Shared utilities
│   ├── supabase/         # Database client
│   ├── encryption/       # Crypto utilities
│   └── validation/       # Schema validation
├── middleware.ts          # Edge middleware for auth/rate limiting
├── scripts/              # Database migrations, setup scripts
└── tests/                # API and integration tests
```

### 10. Environment Variables

```env
# .env.local
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
ENCRYPTION_KEY=xxx
NEXUS_ADMIN_SECRET=xxx
VERCEL_URL=https://nexus-central.vercel.app
```

## Next Steps

1. Create new GitHub repository: `nexus-central`
2. Initialize Vercel project
3. Setup Supabase project
4. Begin Phase 1 implementation

This architecture provides a scalable, secure solution for managing Nexus installations while keeping the systems completely separate.