import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Skip auth check for now - in production use proper auth
    // TODO: Implement proper authentication
    
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