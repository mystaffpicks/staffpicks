import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/shelf(.*)',
  '/queue(.*)',
  '/profile(.*)',
  '/sync(.*)',
  '/settings(.*)',
  '/onboarding(.*)',
]);

// Routes accessible only when NOT authenticated
const isAuthRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // Redirect signed-in users away from auth pages
  if (isAuthRoute(req)) {
    const { userId } = await auth();
    if (userId) {
      const url = req.nextUrl.clone();
      url.pathname = '/dashboard';
      return Response.redirect(url);
    }
  }

  // Protect app routes
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
