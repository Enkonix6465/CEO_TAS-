import { create } from 'zustand';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Network connectivity check
const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch {
    return navigator.onLine;
  }
};

// Retry mechanism for network failures
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;

      // Only retry on network-related errors
      if (error.code === 'auth/network-request-failed' ||
          error.code === 'auth/timeout' ||
          error.message?.includes('network')) {
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

interface UserData {
  uid: string;
  email: string | null;
  role: string;
  fullName: string;
  department?: string;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setUserData: (userData: UserData | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userData: null,
  loading: true,
  signIn: async (email: string, password: string) => {
    try {
      // Check network connectivity first
      const isOnline = await checkNetworkConnectivity();
      if (!isOnline) {
        const message = 'No internet connection. Please check your network and try again.';
        toast.error(message);
        throw new Error(message);
      }

      // Attempt sign in with retry mechanism
      const userCredential = await retryWithBackoff(async () => {
        return await signInWithEmailAndPassword(auth, email, password);
      });

      set({ user: userCredential.user });

      // Fetch additional user data from Firestore with retry
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('uid', '==', userCredential.user.uid));
      const querySnapshot = await retryWithBackoff(async () => {
        return await getDocs(q);
      });

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as UserData;
        set({ userData });
      }

      toast.success('Successfully signed in!');
    } catch (error: any) {
      console.error('Sign in error:', error);

      // Provide user-friendly error messages
      let userMessage = 'Failed to sign in';

      switch (error.code) {
        case 'auth/network-request-failed':
          userMessage = 'Network connection failed. Please check your internet connection and try again.';
          break;
        case 'auth/timeout':
          userMessage = 'Request timed out. Please try again.';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          userMessage = 'Invalid email or password. Please check your credentials.';
          break;
        case 'auth/user-disabled':
          userMessage = 'This account has been disabled. Please contact support.';
          break;
        case 'auth/too-many-requests':
          userMessage = 'Too many failed attempts. Please try again later.';
          break;
        default:
          userMessage = error.message || 'An unexpected error occurred. Please try again.';
      }

      toast.error(userMessage);
      throw error;
    }
  },
  signOut: async () => {
    try {
      await retryWithBackoff(async () => {
        return await firebaseSignOut(auth);
      });
      set({ user: null, userData: null });
      toast.success('Successfully signed out!');
    } catch (error: any) {
      console.error('Sign out error:', error);
      const userMessage = error.code === 'auth/network-request-failed'
        ? 'Network error during sign out. You have been signed out locally.'
        : error.message || 'Failed to sign out';

      // Sign out locally even if network request fails
      set({ user: null, userData: null });
      toast.error(userMessage);
      throw error;
    }
  },
  setUser: (user) => set({ user, loading: false }),
  setUserData: (userData) => set({ userData }),
}));

// Initialize auth state listener
onAuthStateChanged(auth, async (user) => {
  const state = useAuthStore.getState();
  if (user) {
    // Fetch user data when auth state changes
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data() as UserData;
      state.setUserData(userData);
    }
  } else {
    state.setUserData(null);
  }
  state.setUser(user);
});
