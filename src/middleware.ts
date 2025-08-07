import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Performance optimization: Use boolean instead of checking equality multiple times
  const isAdminRoute = pathname.startsWith('/dashboard') || pathname === '/admin-login'
  const isEmailVerificationRoute = pathname === '/verify-email' || pathname === '/email-verified'
  const isPublicRoute = pathname === '/' || pathname === '/login' || pathname === '/register'
  
  // Get cookies with simplified boolean conversion
  const applicationSubmitted = request.cookies.get('applicationSubmitted')?.value === 'true'
  const userInDashboard = request.cookies.get('userInDashboard')?.value === 'true'
  const emailVerified = request.cookies.get('emailVerified')?.value === 'true'
  const isAuthenticated = !!request.cookies.get('hasAuthToken')?.value
  
  // Fast pass for admin and verification routes - no checks needed
  if (isAdminRoute || isEmailVerificationRoute) {
    return addPerformanceHeaders(NextResponse.next())
  }
  
  // Home page and public routes - quick access with minimal checks
  if (isPublicRoute) {
    if (isAuthenticated && !emailVerified) {
      return redirectWithHeaders('/verify-email', request.url)
    }
    
    // If user is in dashboard but tries to go back to public routes
    if (userInDashboard && emailVerified && !applicationSubmitted) {
      return redirectWithHeaders('/user-dashboard', request.url)
    }
    
    return addPerformanceHeaders(NextResponse.next())
  }
  
  // Protected user routes - check once using includes
  const protectedUserPaths = ['/user-dashboard', '/departments', '/forms', '/review', '/status']
  const isProtectedUserRoute = protectedUserPaths.some(route => pathname.startsWith(route))
  
  if (isProtectedUserRoute) {
    // Application submitted takes priority - always redirect to status
    if (applicationSubmitted && pathname !== '/status') {
      return redirectWithHeaders('/status', request.url)
    }
    
    // Email verification check
    if (isAuthenticated && !emailVerified) {
      return redirectWithHeaders('/verify-email', request.url)
    }
    
    // Authentication check
    if (!isAuthenticated) {
      return redirectWithHeaders('/login', request.url)
    }
    
    // Set strict no-navigation headers for status page
    if (pathname === '/status') {
      const response = addPerformanceHeaders(NextResponse.next())
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }
  }
  
  // For all other routes
  return addPerformanceHeaders(NextResponse.next())
}

// Update the redirectWithHeaders function to be more performance-focused
function redirectWithHeaders(destination: string, baseUrl: string) {
  const response = NextResponse.redirect(new URL(destination, baseUrl));
  // Only add minimal necessary headers
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

// Update the addPerformanceHeaders function
function addPerformanceHeaders(response: NextResponse) {
  // Only add minimal necessary headers to improve navigation speed
  response.headers.set('Cache-Control', 'no-store');
  // Add header to hint at performance optimizations
  response.headers.set('X-Navigation-Fast', '1');
  return response;
}

// Configure matcher to run middleware on all relevant paths
export const config = {
  matcher: [
    '/',
    '/login',
    '/register', 
    '/verify-email',
    '/email-verified',
    '/user-dashboard/:path*',
    '/departments/:path*',
    '/forms/:path*',
    '/review/:path*',
    '/status/:path*',
  ],
}