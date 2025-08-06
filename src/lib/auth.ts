import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  User
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
    // Validate email domain - allow only student emails
    const isStudentEmail = email.endsWith('@vitstudent.ac.in');
    
    if (!isStudentEmail) {
      throw new Error('Please use your college email address (@vitstudent.ac.in)');
    }
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Send email verification
    await sendEmailVerification(user);
    
    // Store user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      ...userData,
      departments: [],
      status: 'pending',
      createdAt: serverTimestamp()
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

// Send password reset email
export const resetPassword = async (email: string) => {
  try {
    // Validate email domain
    const isStudentEmail = email.endsWith('@vitstudent.ac.in');
    
    if (!isStudentEmail) {
      throw new Error('Please use your college email address (@vitstudent.ac.in)');
    }
    
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error: any) {
    // Handle Firebase auth errors with user-friendly messages
    if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many requests. Please try again later');
    } else {
      throw new Error('Unable to send password reset email. Please try again');
    }
  }
};

// Sign out user
export const signOut = async () => {
  await firebaseSignOut(auth);
};

// Get current user data from Firestore
export const getCurrentUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

// Get the current authenticated user's document from Firestore
export const getUserDocument = async (): Promise<UserData | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }
    
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserData;
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching user document:", error);
    return null;
  }
};

// Check if user is admin
export const isAdmin = async (uid: string): Promise<boolean> => {
  try {
    const roleDoc = await getDoc(doc(db, "roles", uid));
    if (roleDoc.exists() && roleDoc.data()?.role === "admin") {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};

// Resend email verification
export const resendEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }
    
    if (user.emailVerified) {
      throw new Error('Email is already verified');
    }
    
    await sendEmailVerification(user);
  } catch (error: any) {
    if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many verification emails sent. Please try again later');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network connection issue. Please check your internet connection');
    } else {
      throw new Error(error.message || 'Unable to send verification email. Please try again');
    }
  }
};

// Check if current user's email is verified
export const checkEmailVerification = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) return false;
  
  // Reload user to get the latest email verification status
  await user.reload();
  return user.emailVerified;
}; 