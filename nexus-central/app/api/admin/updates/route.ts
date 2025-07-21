import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Skip auth check for now - in production use proper auth
    // TODO: Implement proper authentication
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ updates: [] });
    }
    
    const { data: updates, error } = await supabaseAdmin
      .from('update_channels')
      .select('*')
      .order('published_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching updates:', error);
      return NextResponse.json({ updates: [] });
    }
    
    return NextResponse.json({ updates: updates || [] });
    
  } catch (error) {
    console.error('Updates error:', error);
    return NextResponse.json({ updates: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip auth check for now - in production use proper auth
    // TODO: Implement proper authentication
    
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const { version, channel, releaseNotes, fileUrl, isMandatory } = body;
    
    // Insert new update
    const { data, error } = await supabaseAdmin
      .from('update_channels')
      .insert({
        current_version: version,
        channel_name: channel || 'stable',
        release_notes: releaseNotes,
        file_url: fileUrl,
        is_mandatory: isMandatory || false,
        published_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating update:', error);
      return NextResponse.json(
        { error: 'Failed to create update' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, update: data });
    
  } catch (error) {
    console.error('Create update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}