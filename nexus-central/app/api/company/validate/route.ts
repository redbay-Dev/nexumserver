import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { CompanyValidateSchema } from '@/lib/validation/schemas';
import { decryptDatabaseConfig } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedData = CompanyValidateSchema.parse(body);
    
    // Find company by code
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('company_code', validatedData.company_code)
      .single();
    
    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Invalid company code' },
        { status: 404 }
      );
    }
    
    // Check if company is active
    if (company.subscription_status === 'suspended') {
      return NextResponse.json(
        { success: false, error: 'Company subscription is suspended' },
        { status: 403 }
      );
    }
    
    // Check if trial/subscription has expired
    if (company.expires_at && new Date(company.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Company subscription has expired' },
        { status: 403 }
      );
    }
    
    // Check installation limit
    const { count: installationCount } = await supabaseAdmin
      .from('installations')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .eq('is_active', true);
    
    if (installationCount && installationCount >= company.max_installations) {
      // Check if this machine is already registered
      const { data: existingInstallation } = await supabaseAdmin
        .from('installations')
        .select('id')
        .eq('company_id', company.id)
        .eq('machine_id', validatedData.machine_id)
        .single();
      
      if (!existingInstallation) {
        return NextResponse.json(
          { success: false, error: 'Installation limit reached' },
          { status: 403 }
        );
      }
    }
    
    // Register or update installation
    const { error: installError } = await supabaseAdmin
      .from('installations')
      .upsert({
        company_id: company.id,
        machine_id: validatedData.machine_id,
        hostname: validatedData.hostname,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        last_heartbeat: new Date().toISOString(),
        is_active: true
      }, {
        onConflict: 'company_id,machine_id'
      });
    
    if (installError) {
      console.error('Failed to register installation:', installError);
    }
    
    // Decrypt database config
    const databaseConfig = decryptDatabaseConfig(company.database_config);
    
    // Get update channel access
    const { data: updateAccess } = await supabaseAdmin
      .from('company_update_access')
      .select('channel_id, update_channels(channel_name)')
      .eq('company_id', company.id);
    
    let updateChannel = 'stable';
    if (updateAccess && updateAccess.length > 0) {
      const access = updateAccess[0] as { update_channels: { channel_name: string }[] };
      if (access.update_channels && Array.isArray(access.update_channels) && access.update_channels.length > 0) {
        updateChannel = access.update_channels[0].channel_name;
      }
    } else if (company.settings?.update_channel) {
      updateChannel = company.settings.update_channel as string;
    }
    
    // Log the validation
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        company_id: company.id,
        action: 'company_validated',
        details: {
          machine_id: validatedData.machine_id,
          hostname: validatedData.hostname
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      });
    
    // Return company info and database config
    return NextResponse.json({
      success: true,
      company_name: company.company_name,
      database_config: databaseConfig,
      settings: company.settings || {},
      update_channel: updateChannel
    });
    
  } catch (error) {
    console.error('Validation error:', error);
    
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