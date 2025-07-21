import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') || 'stable';
    const companyCode = searchParams.get('company_code');
    
    if (!companyCode) {
      return new NextResponse('Missing company code', { status: 400 });
    }
    
    // Get the latest version for the channel
    const { data: updateChannel, error } = await supabaseAdmin
      .from('update_channels')
      .select('*')
      .eq('channel_name', channel)
      .single();
    
    if (error || !updateChannel) {
      return new NextResponse('No update available', { status: 404 });
    }
    
    // Generate YAML manifest for electron-updater
    const yaml = `version: ${updateChannel.current_version}
files:
  - url: nexus-setup-${updateChannel.current_version}.exe
    sha512: ${updateChannel.sha256_checksum || 'PLACEHOLDER'}
    size: ${updateChannel.file_size || 0}
path: nexus-setup-${updateChannel.current_version}.exe
sha512: ${updateChannel.sha256_checksum || 'PLACEHOLDER'}
releaseDate: '${updateChannel.published_at}'
releaseName: Nexus ${updateChannel.current_version}
releaseNotes: |
${updateChannel.release_notes ? updateChannel.release_notes.split('\n').map((line: string) => '  ' + line).join('\n') : '  No release notes available'}`;
    
    return new NextResponse(yaml, {
      headers: {
        'Content-Type': 'text/yaml',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
    
  } catch (error) {
    console.error('Latest.yml error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}