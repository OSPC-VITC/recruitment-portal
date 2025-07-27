import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Get application status and navigation tracking from cookies
  const applicationSubmitted = request.cookies.get('applicationSubmitted')?.value === 'true'
  const userInDashboard = request.cookies.get('userInDashboard')?.value === 'true'
  
  // Admin routes - allow full access
  if (pathname.startsWith('/dashboard') || pathname === '/admin-login') {
    return NextResponse.next()
  }
  
  // Home page and public routes - always allow access
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    // If user is in dashboard but tries to go back to public routes, redirect to dashboard
    if (userInDashboard && !applicationSubmitted) {
      const response = NextResponse.redirect(new URL('/user-dashboard', request.url))
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      return response
    }
    return NextResponse.next()
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
    '/user-dashboard/:path*',
    '/departments/:path*',
    '/forms/:path*',
    '/review/:path*',
    '/status/:path*',
  ],
}