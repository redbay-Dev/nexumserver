import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');
    const channel = searchParams.get('channel') || 'stable';
    const companyCode = searchParams.get('company_code');
    
    if (!version || !companyCode) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Verify company exists and is active
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id, subscription_status')
      .eq('company_code', companyCode)
      .single();
    
    if (companyError || !company || company.subscription_status === 'suspended') {
      return NextResponse.json(
        { error: 'Invalid or suspended company' },
        { status: 403 }
      );
    }
    
    // Get the latest version for the channel
    const { data: updateChannel, error: channelError } = await supabaseAdmin
      .from('update_channels')
      .select('*')
      .eq('channel_name', channel)
      .single();
    
    if (channelError || !updateChannel) {
      // No update available
      return new NextResponse(null, { status: 204 });
    }
    
    // Check if company has access to this channel
    const { data: hasAccess } = await supabaseAdmin
      .from('company_update_access')
      .select('company_id')
      .eq('company_id', company.id)
      .eq('channel_id', updateChannel.id)
      .single();
    
    // If no specific access, check if it's the stable channel (default access)
    if (!hasAccess && channel !== 'stable') {
      return new NextResponse(null, { status: 204 });
    }
    
    // Compare versions
    if (compareVersions(version, updateChannel.current_version) >= 0) {
      // Already on latest version
      return new NextResponse(null, { status: 204 });
    }
    
    // Check if update is mandatory
    let mandatory = updateChannel.is_mandatory;
    if (updateChannel.minimum_version && 
        compareVersions(version, updateChannel.minimum_version) < 0) {
      mandatory = true;
    }
    
    // Log update check
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        company_id: company.id,
        action: 'update_check',
        details: {
          current_version: version,
          available_version: updateChannel.current_version,
          channel: channel,
          update_available: true
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      });
    
    // Return update info in electron-updater format
    return NextResponse.json({
      version: updateChannel.current_version,
      releaseDate: updateChannel.published_at,
      releaseName: `Nexus ${updateChannel.current_version}`,
      releaseNotes: updateChannel.release_notes || '',
      mandatory: mandatory,
      url: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/updates/download/${updateChannel.current_version}?company_code=${companyCode}`
    });
    
  } catch (error) {
    console.error('Update check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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