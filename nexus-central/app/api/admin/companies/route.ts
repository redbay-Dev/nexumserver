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
      return NextResponse.json({ companies: [] });
    }
    
    // Get companies with installation count
    const { data: companies, error } = await supabaseAdmin
      .from('companies')
      .select(`
        *,
        installations!inner(count)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching companies:', error);
      return NextResponse.json({ companies: [] });
    }
    
    // Transform data to include installation count
    const companiesWithCount = companies?.map(company => ({
      ...company,
      installation_count: company.installations?.length || 0
    })) || [];
    
    return NextResponse.json({ companies: companiesWithCount });
    
  } catch (error) {
    console.error('Companies error:', error);
    return NextResponse.json({ companies: [] });
  }
}