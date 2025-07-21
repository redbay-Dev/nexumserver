import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { HeartbeatSchema } from '@/lib/validation/schemas';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request
    const validatedData = HeartbeatSchema.parse(body);
    
    // Find company by code
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, settings, subscription_status')
      .eq('company_code', validatedData.company_code)
      .single();
    
    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Invalid company code' },
        { status: 404 }
      );
    }
    
    // Update installation heartbeat
    const { error: updateError } = await supabaseAdmin
      .from('installations')
      .update({
        last_heartbeat: new Date().toISOString(),
        app_version: validatedData.app_version,
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      })
      .eq('company_id', company.id)
      .eq('machine_id', validatedData.machine_id);
    
    if (updateError) {
      console.error('Failed to update heartbeat:', updateError);
    }
    
    // Check for forced updates
    let forceUpdate = false;
    if (company.settings?.force_update_version) {
      const currentVersion = validatedData.app_version;
      const requiredVersion = company.settings.force_update_version;
      
      if (compareVersions(currentVersion, requiredVersion) < 0) {
        forceUpdate = true;
      }
    }
    
    // Check if settings have changed
    const settingsChanged = company.settings?.settings_version && 
                          company.settings.settings_version !== body.settings_version;
    
    return NextResponse.json({
      success: true,
      force_update: forceUpdate,
      settings_changed: settingsChanged || false,
      subscription_status: company.subscription_status
    });
    
  } catch (error) {
    console.error('Heartbeat error:', error);
    
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

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;
    
    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }
  
  return 0;
}