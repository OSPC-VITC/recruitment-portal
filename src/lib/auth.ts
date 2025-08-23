import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  User,
  ActionCodeSettings
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// Type for user data to be stored in Firestore
export interface UserData {
  name: string;
  email: string;
  regNo: string;
  phone: string;
  departments: string[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any; // Using any for timestamp
  applicationSubmitted?: boolean;
  applicationSubmittedAt?: any;
}

// Register new user
export const registerUser = async (
  email: string, 
  password: string, 
  userData: Omit<UserData, 'departments' | 'status' | 'createdAt'>
) => {
  try {
    // Validate email domain - allow any email in production
    const isValidEmail = process.env.NODE_ENV === 'production' ? true : (email.endsWith('@vitstudent.ac.in') || email.endsWith('@gmail.com'));
    
    if (!isValidEmail) {
      throw new Error('Please use your VIT student email (@vitstudent.ac.in) or your email (@gmail.com)');
    }
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Send email verification with custom redirect URL
    const actionCodeSettings: ActionCodeSettings = {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://recruitments.ospcvitc.club/email-verified'
        : `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/email-verified`,
      handleCodeInApp: false,
    };
    
    await sendEmailVerification(user, actionCodeSettings);
    
    // Store user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      departments: [],
      status: 'pending',
      createdAt: serverTimestamp(),
      applicationSubmitted: false
    });
    
    return user;
  } catch (error: any) {
    // Handle Firebase auth errors with user-friendly messages
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Your password is too weak. Please choose a stronger password');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network connection issue. Please check your internet connection');
    } else {
      throw new Error('Unable to create your account. Please try again');
    }
  }
};

// Sign in user
export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    // Handle Firebase auth errors with more user-friendly messages
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please try again later');
    } else if (error.code === 'auth/user-disabled') {
      throw new Error('This account has been disabled');
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid login credentials. Please try again');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network connection issue. Please check your internet connection');
    } else {
      throw new Error('Unable to sign in. Please try again');
    }
  }
};

// Reset password
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network connection issue. Please check your internet connection');
    } else {
      throw new Error('Unable to send password reset email. Please try again');
    }
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error('Unable to sign out. Please try again');
  }
};

// Get current user data from Firestore - with performance optimization
export const getCurrentUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const docRef = doc(db, "users", uid);
    const userDoc = await getDoc(docRef);
    
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Get the current user's document - optimized
export const getUserDocument = async (): Promise<UserData | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    return await getCurrentUserData(user.uid);
  } catch (error) {
    console.error('Error getting user document:', error);
    return null;
  }
};

// Check if user is an admin
export const isAdmin = async (uid: string): Promise<boolean> => {
  try {
    // Check for admin session
    const docRef = doc(db, "adminSessions", uid);
    const adminDoc = await getDoc(docRef);
    
    if (adminDoc.exists()) {
      const adminData = adminDoc.data();
      return adminData.isActive === true && adminData.expiresAt.toDate() > new Date();
    }
    
    return false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Resend email verification - only for registration
export const resendEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is signed in');
    }
    
    const actionCodeSettings: ActionCodeSettings = {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://recruitments.ospcvitc.club/email-verified'
        : `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/email-verified`,
      handleCodeInApp: false,
    };
    
    await sendEmailVerification(user, actionCodeSettings);
    return true;
  } catch (error: any) {
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many verification emails sent. Please try again later.');
    } else {
      console.error('Error sending verification email:', error);
      throw new Error('Unable to send verification email. Please try again later.');
    }
  }
};

// Cookie management - simplified and optimized
export const setEmailVerificationCookie = (verified: boolean) => {
  document.cookie = `emailVerified=${verified ? 'true' : 'false'}; path=/; max-age=86400`; // 1 day
};

export const setAuthTokenCookie = (hasToken: boolean) => {
  document.cookie = `hasAuthToken=${hasToken ? 'true' : 'false'}; path=/; max-age=86400`; // 1 day
};

export const clearAuthCookies = () => {
  document.cookie = 'emailVerified=false; path=/; max-age=0';
  document.cookie = 'hasAuthToken=false; path=/; max-age=0';
  document.cookie = 'applicationSubmitted=false; path=/; max-age=0';
}; 