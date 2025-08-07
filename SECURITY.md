# Firebase Security Configuration

## Overview
This document outlines the security measures implemented for the OSPC Recruitment Portal Firebase project.

## Architecture Overview

### User Authentication (Firebase Auth)
- Students register using Firebase Authentication
- Email verification required for all operations
- Only `@vitstudent.ac.in` email domains allowed
- Users can only access their own data

### Admin Authentication (Separate System)
- Admins use a **separate authentication system** with environment variables
- Admin credentials stored in environment variables (not Firebase)
- Admin access handled through localStorage sessions
- Admins use Firebase Admin SDK for database operations (bypasses security rules)

## Firestore Security Rules

### Key Security Features
1. **Email Verification Required**: All operations require verified email addresses
2. **Student Email Domain Restriction**: Only `@vitstudent.ac.in` emails are allowed
3. **User Data Isolation**: Users can only access their own documents
4. **Data Validation**: Strict validation on all user inputs
5. **Admin Separation**: Admin operations handled separately with elevated privileges

### Data Access Patterns

#### Users Collection
- **Read**: Own data only
- **Create**: Own data only, with validation
- **Update**: Limited fields only (cannot change status, email, regNo)
- **Delete**: Blocked (handled by admins separately)

#### Applications Collection
- **Read**: Own applications only
- **Create/Update**: Own applications only with validation
- **Delete**: Blocked (handled by admins separately)

#### Settings & Form Fields
- **Read**: All authenticated users
- **Modify**: Blocked for regular users (admins use separate system)

## Admin System Security

### Environment Variables
```bash
# Core team admins
NEXT_PUBLIC_ADMIN_CORE_PRANN_EMAIL=admin1@example.com
NEXT_PUBLIC_ADMIN_CORE_PRANN_PASSWORD=secure_password_1
NEXT_PUBLIC_ADMIN_CORE_PRANN_NAME=Admin Name

# Department lead admins
NEXT_PUBLIC_ADMIN_DEPT_USER1_EMAIL=dept1@example.com
NEXT_PUBLIC_ADMIN_DEPT_USER1_PASSWORD=secure_password_2
NEXT_PUBLIC_ADMIN_DEPT_USER1_DEPARTMENT=department_id
```

### Admin Security Measures
1. **Session Management**: 24-hour session timeout
2. **Role-based Access**: Core team vs Department leads
3. **Client-side Validation**: Credential verification
4. **Admin SDK Access**: Bypasses Firestore rules for admin operations

## Security Recommendations

### 1. Admin Credential Security
- Store all admin credentials in environment variables
- Use strong, unique passwords for each admin
- Rotate admin credentials regularly (quarterly)
- Never commit credentials to version control

### 2. Session Security
- Sessions expire after 24 hours of inactivity
- Clear sessions on logout
- Monitor admin session activity

### 3. Firebase Configuration
```javascript
// Enable email verification requirement
// Set password complexity requirements
// Configure authorized domains for your app
// Enable audit logging
```

### 4. Firestore Rules Testing
- Test rules with Firebase Emulator Suite
- Verify user data isolation
- Confirm admin operations work correctly
- Regular penetration testing

### 5. Monitoring and Alerting
Set up monitoring for:
- Failed authentication attempts
- Unusual data access patterns
- Large data operations
- Admin privilege usage

## Important Notes

### Admin vs User Authentication
- **Users**: Firebase Authentication with email verification
- **Admins**: Separate system with environment variables
- **Database Access**: 
  - Users: Through Firestore security rules
  - Admins: Through Firebase Admin SDK (elevated privileges)

### Security Separation
This dual-authentication approach provides:
- Complete isolation between user and admin systems
- No risk of privilege escalation for users
- Admin operations independent of user authentication
- Simplified user security model

## Security Checklist

### Development
- [ ] Environment variables properly configured
- [ ] No hardcoded admin credentials
- [ ] User authentication flow tested
- [ ] Admin authentication flow tested
- [ ] Firestore rules deployed and tested

### Production
- [ ] Admin credentials rotated for production
- [ ] Session timeouts configured
- [ ] Monitoring enabled
- [ ] Backup strategy implemented
- [ ] Security rules validated

### Ongoing Maintenance
- [ ] Regular admin credential rotation
- [ ] Monitor user authentication patterns
- [ ] Review admin access logs
- [ ] Update security rules as needed
- [ ] Test disaster recovery procedures

## Incident Response

### Security Incident Procedures
1. **User Account Compromise**
   - Reset user password through Firebase
   - Review user data access
   - Check for unauthorized changes

2. **Admin Credential Compromise**
   - Immediately update environment variables
   - Revoke admin sessions
   - Review admin activity logs
   - Update affected credentials

3. **System-wide Issues**
   - Enable Firestore rules to block all access temporarily
   - Investigate through Firebase Console
   - Restore from backups if necessary

## Contact Information
- Security Team: [security@ospc.ac.in]
- Admin Access: [admin@ospc.ac.in]
- Emergency Contact: [emergency@ospc.ac.in]
