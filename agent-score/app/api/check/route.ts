import { NextRequest, NextResponse } from 'next/server';
import { runChecks } from '@/lib/checker';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = body.url;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Basic URL validation
    const cleaned = url.trim();
    if (cleaned.length < 4 || cleaned.length > 2000) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const result = await runChecks(cleaned);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Check failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
