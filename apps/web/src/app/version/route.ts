import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    service: 'secret-nairobi-web',
    release: process.env.RELEASE_ID || process.env.NEXT_PUBLIC_RELEASE_ID || 'development',
  });
}
