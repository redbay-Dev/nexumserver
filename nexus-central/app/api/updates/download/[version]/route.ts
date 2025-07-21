import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ version: string }> }
) {
  const { version } = await params;
  try {
    const { searchParams } = new URL(request.url);
    const companyCode = searchParams.get('company_code');
    
    if (!companyCode) {
      return NextResponse.json(
        { error: 'Missing company code' },
        { status: 400 }
      );
    }
    
    // Verify company
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('company_code', companyCode)
      .single();
    
    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Invalid company' },
        { status: 403 }
      );
    }
    
    // Get update file info
    const { data: update, error: updateError } = await supabaseAdmin
      .from('update_channels')
      .select('*')
      .eq('current_version', version)
      .single();
    
    if (updateError || !update || !update.file_url) {
      return NextResponse.json(
        { error: 'Update file not found' },
        { status: 404 }
      );
    }
    
    // Log download
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        company_id: company.id,
        action: 'update_download',
        details: {
          version: version,
          file_size: update.file_size
        },
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        user_agent: request.headers.get('user-agent')
      });
    
    // Redirect to the actual file URL in Supabase Storage
    // In production, this would be a signed URL with expiration
    return NextResponse.redirect(update.file_url);
    
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}