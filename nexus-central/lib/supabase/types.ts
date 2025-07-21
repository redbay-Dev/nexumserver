export interface Company {
  id: string;
  company_code: string;
  company_name: string;
  admin_email: string;
  admin_phone?: string;
  database_config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  };
  settings: Record<string, unknown>;
  subscription_status: 'trial' | 'active' | 'suspended';
  subscription_tier: 'standard' | 'professional' | 'enterprise';
  max_users: number;
  max_installations: number;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  metadata: Record<string, unknown>;
}

export interface Installation {
  id: string;
  company_id: string;
  machine_id: string;
  hostname?: string;
  username?: string;
  ip_address?: string;
  app_version?: string;
  os_version?: string;
  last_heartbeat: string;
  is_active: boolean;
  created_at: string;
}

export interface UpdateChannel {
  id: string;
  channel_name: 'stable' | 'beta' | 'alpha';
  current_version: string;
  minimum_version?: string;
  release_notes?: string;
  file_url?: string;
  file_size?: number;
  sha256_checksum?: string;
  published_at: string;
  is_mandatory: boolean;
}

export interface AuditLog {
  id: string;
  company_id?: string;
  action: string;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}