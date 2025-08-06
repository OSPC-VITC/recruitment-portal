import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get application status and navigation tracking from cookies
  const applicationSubmitted = request.cookies.get('applicationSubmitted')?.value === 'true'
  const userInDashboard = request.cookies.get('userInDashboard')?.value === 'true'
  const emailVerified = request.cookies.get('emailVerified')?.value === 'true'
  const isAuthenticated = request.cookies.get('authToken')?.value
  
  // Admin routes - allow full access
  if (pathname.startsWith('/dashboard') || pathname === '/admin-login') {
    return NextResponse.next()
  }
  
  // Email verification route - always allow access
  if (pathname === '/verify-email' || pathname === '/email-verified') {
    return NextResponse.next()
  }
  
  // Home page and public routes - always allow access
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    // If user is authenticated but email not verified, redirect to verification
    if (isAuthenticated && !emailVerified) {
      const response = NextResponse.redirect(new URL('/verify-email', request.url))
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      return response
    }
    
    // If user is in dashboard but tries to go back to public routes, redirect to dashboard
    if (userInDashboard && emailVerified && !applicationSubmitted) {
      const response = NextResponse.redirect(new URL('/user-dashboard', request.url))
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      return response
    }
    return NextResponse.next()
  }
  
  // Protected user routes - require email verification
  const protectedUserRoutes = ['/user-dashboard', '/departments', '/forms', '/review', '/status']
  const isProtectedUserRoute = protectedUserRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedUserRoute) {
    // If authenticated but email not verified, redirect to verification
    if (isAuthenticated && !emailVerified) {
      const response = NextResponse.redirect(new URL('/verify-email', request.url))
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      return response
    }
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      return response
    }
  }
  
  // If application is submitted, force redirect to status page from all other routes
  if (applicationSubmitted) {
    if (pathname !== '/status') {
      const response = NextResponse.redirect(new URL('/status', request.url))
      // Set headers to prevent caching
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      return response
    }
    
    // If on status page, set strict no-navigation headers
    if (pathname === '/status') {
      const response = NextResponse.next()
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      return response
    }
  }
  
  // For protected routes, let the AuthCheck component handle authentication
  // The middleware will focus on navigation flow control rather than authentication
  return NextResponse.next()
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