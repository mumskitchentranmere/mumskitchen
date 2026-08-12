import { NextResponse } from 'next/server';

const PLACE_ID = 'ChIJxX-fLjDJsGoR2Ss1GWbuWqcS';

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey.startsWith('your_')) {
    return NextResponse.json({ reviews: [], rating: null, user_ratings_total: 0 });
  }

  try {
    const fields = 'reviews,opening_hours,rating,user_ratings_total,name';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=${fields}&key=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    const data = await res.json();

    if (data.status !== 'OK') {
      console.error('[Places API]', data.status, data.error_message);
      return NextResponse.json({ error: data.status }, { status: 502 });
    }

    return NextResponse.json(data.result);
  } catch (err) {
    console.error('[Places GET]', err);
    return NextResponse.json({ error: 'Failed to fetch place details' }, { status: 500 });
  }
}
