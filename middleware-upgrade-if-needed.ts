// middleware.ts - Updated
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY!, // Ensure this is in Netlify Env Vars
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }),
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 60,
      interval: 3, 
      capacity: 100,
    }),
  ],
});

export async function middleware(request: NextRequest) {
    const { pathname } = new URL(request.url);

    // 1. Arcjet Protection (Run first)
    const arcjetDecision = await aj.protect(request, { requested: 5 });
    if (arcjetDecision.isDenied()) {
        const status = arcjetDecision.reason.isRateLimit() ? 429 : 403;
        const message = arcjetDecision.reason.isRateLimit() ? "Too Many Requests" : "Forbidden";
        return NextResponse.json({ error: message }, { status });
    }

    // 2. Authentication Logic
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    // Protected routes check
    const isProtectedRoute = pathname !== '/login' && pathname !== '/';
    if (isProtectedRoute && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 3. CSP Headers
    const response = NextResponse.next();
    
    // Cleaning up the CSP string (Removing newlines and extra spaces)
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.gstatic.com https://*.firebaseio.com https://*.tawk.to https://va.vercel-scripts.com https://*.googletagmanager.com https://cdn.jsdelivr.net https://apis.google.com https://www.google-analytics.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.tawk.to https://us.posthog.com;
        img-src 'self' data: https://*.googleusercontent.com https://*.googleapis.com https://*.tawk.to https://cdn.jsdelivr.net;
        font-src 'self' https://fonts.gstatic.com https://*.tawk.to;
        connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com wss://supabase.optionxi.com https://*.tawk.to wss://*.tawk.to https://www.google-analytics.com https://us.i.posthog.com https://us.posthog.com/api/;
        frame-src 'self' https://*.tawk.to https://www.tradingview-widget.com https://optionxi.firebaseapp.com https://vercel.live https://chat.optionxi.com;
        upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim();

    response.headers.set('Content-Security-Policy', cspHeader);

    if (pathname === '/') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return response;
}

export const config = {
    // Optimized Matcher: Exclude static files and images to save Arcjet credits/latency
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};