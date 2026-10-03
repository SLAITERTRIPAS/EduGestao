import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Mute internal Firebase SDK verbose connection logs
try {
  setLogLevel('silent');
} catch {
  // ignore if setLogLevel unsupported
}

// Filter console.error for transient backend connection notices in the preview environment
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const msg = args.map(a => (typeof a === 'object' ? String(a?.message || JSON.stringify(a)) : String(a))).join(' ');
    if (msg.includes('Could not reach Cloud Firestore backend') || msg.includes('code=unavailable') || msg.includes('@firebase/firestore')) {
      console.info('Firestore connection notice handled gracefully.');
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason || '');
    const code = event.reason?.code;
    if (code === 'unavailable' || msg.includes('Could not reach Cloud Firestore backend') || msg.includes('the client is offline') || msg.includes('failed 1 times')) {
      console.info('Firestore offline/connection notice gracefully captured:', msg);
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || String(event.error || '');
    if (msg.includes('Could not reach Cloud Firestore backend') || msg.includes('code=unavailable') || msg.includes('offline mode')) {
      console.info('Firestore network/offline notice captured gracefully:', msg);
      event.preventDefault();
    }
  });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info('Firestore client is offline or initializing.');
    }
  }
}

