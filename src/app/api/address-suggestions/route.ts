import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
    }

    const osmResponse = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&addressdetails=1&limit=5`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'JobPortalApp/1.0 (https://job-portal-website-ten.vercel.app/)',
        },
      }
    );

    if (!osmResponse.ok) {
      return NextResponse.json(
        { error: `OSM API error: ${osmResponse.statusText}` },
        { status: osmResponse.status }
      );
    }

    const data = await osmResponse.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}
