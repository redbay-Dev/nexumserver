import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { CompanyRegisterSchema } from '@/lib/validation/schemas';
import { generateCompanyCode, encryptDatabaseConfig } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedData = CompanyRegisterSchema.parse(body);
    
    // Generate unique company code
    let companyCode: string;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      companyCode = generateCompanyCode();
      
      const { data: existing } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('company_code', companyCode)
        .single();
      
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate unique company code' },
        { status: 500 }
      );
    }
    
    // Generate database configuration
    // In production, this would provision a real database
    const databaseConfig = {
      host: process.env.DEFAULT_DB_HOST || 'db.supabase.co',
      port: 5432,
      database: `nexus_${companyCode!.toLowerCase().replace('-', '_')}`,
      username: `nexus_${companyCode!.toLowerCase().replace('-', '_')}_user`,
      password: generateSecurePassword()
    };
    
    // Encrypt database config
    const encryptedConfig = encryptDatabaseConfig(databaseConfig);
    
    // Calculate trial expiry (30 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    // Create company record
    const { data: company, error } = await supabaseAdmin
      .from('companies')
      .insert({
        company_code: companyCode!,
        company_name: validatedData.company_name,
        admin_email: validatedData.admin_email,
        admin_phone: validatedData.admin_phone,
        database_config: encryptedConfig,
        subscription_tier: validatedData.subscription_tier,
        expires_at: expiresAt.toISOString(),
        settings: {
          allow_auto_updates: true,
          update_channel: 'stable'
        }
      })
      .select()
      .single();
    
    if (error) {
      console.error('Failed to create company:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create company' },
        { status: 500 }
      );
    }
    
    // Log the registration
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        company_id: company.id,
        action: 'company_registered',
        details: {
          company_name: validatedData.company_name,
          subscription_tier: validatedData.subscription_tier
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      });
    
    // Return success with company code and database config
    return NextResponse.json({
      success: true,
      company_code: companyCode!,
      database_config: databaseConfig
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 32; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}