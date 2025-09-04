import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
  AuthError,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { auth, db } from './firebase';
import { GOOGLE_OAUTH_CLIENT_ID } from '@env';

WebBrowser.maybeCompleteAuthSession();

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  location?: {
    state: string;
    port: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  boatDetails?: {
    name: string;
    registrationNumber: string;
    type: string;
    length: number;
  };
  experience?: {
    yearsOfFishing: number;
    specialization: string[];
    preferredZones: string[];
  };
  createdAt: any;
  updatedAt: any;
}

class AuthService {
  // Register new user with email and password
  async registerWithEmail(
    email: string,
    password: string,
    displayName: string,
    additionalData?: Partial<UserProfile>
  ): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, { displayName });

      // Create user document in Firestore
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...additionalData,
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);

      return user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Sign in with Google
  async signInWithGoogle(): Promise<User> {
    try {
      // Configure Google OAuth request
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'seasure',
      });

      const request = new AuthSession.AuthRequest({
        clientId: GOOGLE_OAUTH_CLIENT_ID,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {},
      });

      // Start the authentication flow
      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success') {
        // Exchange authorization code for access token
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: GOOGLE_OAUTH_CLIENT_ID,
            code: result.params.code,
            extraParams: {
              code_verifier: request.codeVerifier || '',
            },
            redirectUri,
          },
          {
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
          }
        );

        if (tokenResult.accessToken) {
          // Create Firebase credential and sign in
          const credential = GoogleAuthProvider.credential(tokenResult.idToken, tokenResult.accessToken);
          const userCredential = await signInWithCredential(auth, credential);
          const user = userCredential.user;

          // Check if user profile exists, if not create one
          const existingProfile = await this.getUserProfile(user.uid);
          if (!existingProfile) {
            const userProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              location: {
                state: '',
                port: ''
              },
              experience: {
                yearsOfFishing: 0,
                specialization: [],
                preferredZones: []
              }
            };

            await setDoc(doc(db, 'users', user.uid), userProfile);
          }

          return user;
        } else {
          throw new Error('Failed to get access token');
        }
      } else {
        throw new Error('Google Sign-In was cancelled or failed');
      }
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  }

  // Sign in with email and password
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Get user profile from Firestore
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Update user profile in Firestore
  async updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Update profile picture
  async updateProfilePicture(uid: string, photoURL: string): Promise<void> {
    try {
      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL });
      }

      // Update Firestore document
      await this.updateUserProfile(uid, { photoURL });
    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }
  }

  // Check if email exists
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      // This is a workaround since Firebase doesn't have a direct method
      // We'll try to create a user and catch the error
      return false; // For now, implement based on your needs
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();
export default authService;
