import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const authHeader = request.headers.get('x-admin-secret');
    if (authHeader !== process.env.NEXUS_ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        totalCompanies: 0,
        activeInstallations: 0,
        latestVersion: 'Database not configured'
      });
    }
    
    // Get total companies
    const { count: totalCompanies } = await supabaseAdmin
      .from('companies')
      .select('*', { count: 'exact', head: true });
    
    // Get active installations
    const { count: activeInstallations } = await supabaseAdmin
      .from('installations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    // Get latest version
    const { data: latestUpdate } = await supabaseAdmin
      .from('update_channels')
      .select('current_version')
      .eq('channel_name', 'stable')
      .single();
    
    return NextResponse.json({
      totalCompanies: totalCompanies || 0,
      activeInstallations: activeInstallations || 0,
      latestVersion: latestUpdate?.current_version || 'No version'
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({
      totalCompanies: 0,
      activeInstallations: 0,
      latestVersion: 'Error loading stats'
    });
  }
}