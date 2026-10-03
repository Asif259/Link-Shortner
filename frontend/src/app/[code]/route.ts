import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code } = await context.params;

  // Reserved paths that should never be handled as short codes
  if (
    !code ||
    ['dashboard', 'login', 'register', 'api', 'favicon.ico', 'robots.txt'].includes(code)
  ) {
    return NextResponse.next();
  }

  // Forward client details to backend for accurate click analytics
  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '';
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';
  const cfCountry = request.headers.get('cf-ipcountry') || '';

  try {
    const res = await fetch(`${API_BASE_URL}/${code}`, {
      method: 'GET',
      headers: {
        'x-forwarded-for': clientIp,
        'user-agent': userAgent,
        referer: referer,
        'cf-ipcountry': cfCountry,
      },
      redirect: 'manual', // Capture the 302 redirect location header
    });

    if (res.status === 302 || res.status === 301) {
      const location = res.headers.get('location');
      if (location) {
        return NextResponse.redirect(location, 302);
      }
    }

    if (res.status === 410) {
      return new NextResponse('This short link has been disabled or expired.', {
        status: 410,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    if (res.status === 404) {
      return new NextResponse('Short link not found.', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    return new NextResponse('Redirect failed.', { status: res.status });
  } catch {
    return new NextResponse('Service temporarily unavailable.', { status: 502 });
  }
}
