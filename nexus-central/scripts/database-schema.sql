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

-- Create indexes
CREATE INDEX idx_companies_code ON companies(company_code);
CREATE INDEX idx_installations_company ON installations(company_id);
CREATE INDEX idx_installations_machine ON installations(machine_id);
CREATE INDEX idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();