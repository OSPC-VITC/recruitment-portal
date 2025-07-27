# OSPC Recruitment Portal

A recruitment portal for the Open Source Programming Club (OSPC) built with Next.js, Firebase, and Tailwind CSS.

## Getting Started

First, clone the repository and install dependencies:

```bash
git clone https://github.com/yourusername/recruitment-portal.git
cd recruitment-portal
npm install
```

### Environment Variables Setup

For development, create a `.env.local` file in the root directory with the following variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Admin Credentials - Core Team Example (use NEXT_PUBLIC_ prefix for client-side access)
NEXT_PUBLIC_ADMIN_CORE_USER1_EMAIL=admin1@example.com
NEXT_PUBLIC_ADMIN_CORE_USER1_PASSWORD=secure_password_1
NEXT_PUBLIC_ADMIN_CORE_USER1_NAME=Admin User 1

# Department Leads Example
NEXT_PUBLIC_ADMIN_DEPT_USER1_EMAIL=deptlead1@example.com
NEXT_PUBLIC_ADMIN_DEPT_USER1_PASSWORD=secure_password_2
NEXT_PUBLIC_ADMIN_DEPT_USER1_NAME=Department Lead 1
NEXT_PUBLIC_ADMIN_DEPT_USER1_DEPARTMENT=department_id
```

Replace the placeholder values with your actual Firebase configuration and admin credentials.

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Features

- User authentication with Firebase
- Application submission for multiple departments
- Admin panel for application review
- Theme toggle (light/dark mode)
- Mobile-responsive design
- Automatic redirection to status page after application submission

## Production Deployment

For production deployment, ensure all environment variables are properly set in your hosting platform (Vercel, Netlify, etc.).

### Security Notes

1. Never commit your `.env.local` file to version control
2. Use environment secrets in your CI/CD pipeline
3. For production, consider using a more secure authentication method for admin users
4. All admin credentials should be stored as environment variables with the NEXT_PUBLIC_ prefix

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

[MIT](https://choosealicense.com/licenses/mit/)
