// Firebase configuration - works without Firebase installed
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  const { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId } = firebaseConfig;

  return Boolean(
    apiKey &&
    authDomain &&
    projectId &&
    storageBucket &&
    messagingSenderId &&
    appId &&
    !`${apiKey}`.includes('your') &&
    !`${projectId}`.includes('your')
  );
};

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;
let initialized = false;

// Lazy initialization function - only called when Firebase is actually needed
export const initializeFirebase = async () => {
  if (initialized) {
    return;
  }

  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Please set the required environment variables.');
  }

  try {
    const firebaseApp = await import('firebase/app');
    const firebaseAuth = await import('firebase/auth');
    const firebaseFirestore = await import('firebase/firestore');
    const firebaseStorage = await import('firebase/storage');

    if (!firebaseApp.getApps().length) {
      app = firebaseApp.initializeApp(firebaseConfig);
    } else {
      app = firebaseApp.getApps()[0];
    }
    auth = firebaseAuth.getAuth(app);
    if (auth && typeof window !== 'undefined') {
      try {
        await firebaseAuth.setPersistence(auth, firebaseAuth.browserLocalPersistence);
      } catch (error) {
        console.error('Failed to set auth persistence:', error);
      }
    }
    db = firebaseFirestore.getFirestore(app);
    storage = firebaseStorage.getStorage(app);
    initialized = true;
  } catch (error) {
    initialized = false;
    throw error;
  }
};

// DO NOT initialize automatically - only when explicitly called
// This prevents Firebase from loading on module import

export { auth, db, storage };
export default app;
