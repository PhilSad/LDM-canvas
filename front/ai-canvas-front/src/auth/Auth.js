import { initializeApp } from "firebase/app";
import { useSignInWithGoogle, useAuthState } from 'react-firebase-hooks/auth';
import { getAuth, signOut } from "firebase/auth";


export const firebaseConfig = {
    apiKey: "AIzaSyApc_Q01mz-RNVtxwvtcxF5WhAOk8M6OEg",
    authDomain: "ai-canvas.firebaseapp.com",
    projectId: "ai-canvas",
    storageBucket: "ai-canvas.appspot.com",
    messagingSenderId: "732264051436",
    appId: "1:732264051436:web:95cb2c7c6bb56099502bc9"
  };

export const logout = () => {
    signOut(auth);
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);