import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import {
  type NextFetchEvent,
  type NextRequest,
  NextResponse,
} from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { AllLocales, AppConfig } from './utils/AppConfig';

const intlMiddleware = createMiddleware({
  locales: AllLocales,
  localePrefix: AppConfig.localePrefix,
  defaultLocale: AppConfig.defaultLocale,
});

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/onboarding(.*)',
  '/:locale/onboarding(.*)',
  '/api(.*)',
  '/:locale/api(.*)',
]);

export default function middleware(
  request: NextRequest,
  event: NextFetchEvent,
) {
  try {
    // Basic env guard to prevent hard failures if Clerk keys are missing
    if (
      !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      || !process.env.CLERK_SECRET_KEY
    ) {
      console.error('[middleware] Missing Clerk environment variables');
      return intlMiddleware(request);
    }

    if (
      request.nextUrl.pathname.includes('/sign-in')
      || request.nextUrl.pathname.includes('/sign-up')
      || isProtectedRoute(request)
    ) {
      return clerkMiddleware(async (auth, req) => {
        if (isProtectedRoute(req)) {
          const locale
            = req.nextUrl.pathname.match(/(\/.*)\/dashboard/)?.at(1) ?? '';

          const signInUrl = new URL(`${locale}/sign-in`, req.url);

          await auth.protect({
            // `unauthenticatedUrl` is needed to avoid error: "Unable to find `next-intl` locale because the middleware didn't run on this request"
            unauthenticatedUrl: signInUrl.toString(),
          });
        }

        const authObj = await auth();

        if (
          authObj.userId
          && !authObj.orgId
          && req.nextUrl.pathname.includes('/dashboard')
          && !req.nextUrl.pathname.endsWith('/organization-selection')
        ) {
          const orgSelection = new URL(
            '/onboarding/organization-selection',
            req.url,
          );

          return NextResponse.redirect(orgSelection);
        }

        return intlMiddleware(req);
      })(request, event);
    }

    return intlMiddleware(request);
  } catch (err) {
    console.error('[middleware] Unhandled error', err);
    return intlMiddleware(request);
  }
}

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next|monitoring).*)', '/', '/(api|trpc)(.*)'], // Also exclude tunnelRoute used in Sentry from the matcher
};
